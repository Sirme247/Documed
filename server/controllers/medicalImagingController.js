import { pool } from '../libs/database.js';
import { logAudit } from '../libs/auditLogger.js';
import orthancService from '../libs/orthancService.js';
import multer from 'multer';
import path from 'path';

// Configure multer for DICOM file uploads
const storage = multer.memoryStorage();

export const uploadDicomMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.dcm', '.dicom'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isDicomMime = file.mimetype === 'application/dicom' || 
                        file.mimetype === 'application/octet-stream';
    
    if (allowedTypes.includes(ext) || isDicomMime || !ext) {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files (.dcm, .dicom, or no extension) are allowed'));
    }
  }
}).any();

// Helper function to clean up Orthanc uploads
async function cleanupOrthancUploads(instanceIds) {
  if (!instanceIds || instanceIds.length === 0) return;
  
  console.log(`🧹 Cleaning up ${instanceIds.length} instances from Orthanc...`);
  
  const CLEANUP_BATCH_SIZE = 5;
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < instanceIds.length; i += CLEANUP_BATCH_SIZE) {
    const batch = instanceIds.slice(i, i + CLEANUP_BATCH_SIZE);
    const deletePromises = batch.map(async (instanceId) => {
      try {
        await orthancService.deleteInstance(instanceId);
        successCount++;
        return { success: true, instanceId };
      } catch (error) {
        failCount++;
        console.error(`Failed to delete instance ${instanceId}:`, error.message);
        return { success: false, instanceId, error: error.message };
      }
    });
    
    await Promise.all(deletePromises);
  }
  
  console.log(`✅ Cleanup complete: ${successCount} deleted, ${failCount} failed`);
}

// Helper function to handle abort and cleanup
async function handleAbort(uploadedToOrthanc, client, res) {
  console.log('🛑 Upload aborted - performing cleanup...');
  
  // Clean up Orthanc uploads
  if (uploadedToOrthanc && uploadedToOrthanc.length > 0) {
    await cleanupOrthancUploads(uploadedToOrthanc);
  }
  
  // Rollback database transaction
  try {
    await client.query("ROLLBACK");
  } catch (err) {
    console.error('Error rolling back:', err.message);
  }
  
  // Release database client
  try {
    client.release();
  } catch (err) {
    console.error('Error releasing client:', err.message);
  }
  
  // Send response if headers not sent
  if (!res.headersSent) {
    res.status(499).json({
      status: "cancelled",
      message: "Upload cancelled by client"
    });
  }
}

// Main upload function
export const uploadDicomStudy = async (req, res) => {
  const client = await pool.connect();
  let uploadedToOrthanc = [];
  let requestAborted = false;
  
  try {
    // Set up abort detection
    req.on('close', () => {
      if (!res.headersSent) {
        console.log('⚠️ Client disconnected');
        requestAborted = true;
      }
    });

    req.on('aborted', () => {
      console.log('⚠️ Request aborted');
      requestAborted = true;
    });

    req.on('error', (err) => {
      console.log('⚠️ Request error:', err.message);
      requestAborted = true;
    });

    // Extract request data
    const { visit_id, findings, recommendations, body_part_override } = req.body;
    const dicomFiles = req.files || [];
    const user_id = req.user.user_id;

    // Validate input
    if (!visit_id) {
      return res.status(400).json({
        status: "failed",
        message: "Visit ID is required"
      });
    }

    if (!dicomFiles || dicomFiles.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "At least one DICOM file is required"
      });
    }

    // Verify visit exists
    const visitCheck = await client.query(
      'SELECT visit_id FROM visits WHERE visit_id = $1',
      [visit_id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Visit not found"
      });
    }

    // Start database transaction
    await client.query("BEGIN");

    console.log(`[1/6] Starting upload of ${dicomFiles.length} DICOM files...`);

    // ==================== STEP 1: Upload files to Orthanc ====================
    const uploadResults = [];
    const uploadErrors = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < dicomFiles.length; i += BATCH_SIZE) {
      // Check for abort
      if (requestAborted) {
        await handleAbort(uploadedToOrthanc, client, res);
        return;
      }

      const batch = dicomFiles.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(file => 
        orthancService.uploadDicom(file.buffer)
          .then(response => {
            if (requestAborted) {
              throw new Error('Upload cancelled by user');
            }
            
            uploadedToOrthanc.push(response.ID);
            
            return {
              success: true,
              file: file.originalname,
              instanceId: response.ID,
              studyId: response.ParentStudy,
              seriesId: response.ParentSeries,
              size: file.size
            };
          })
          .catch(error => ({
            success: false,
            file: file.originalname,
            error: error.message
          }))
      );

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          uploadResults.push(result);
        } else {
          uploadErrors.push(result);
        }
      });

      console.log(`Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dicomFiles.length / BATCH_SIZE)}`);
    }

    // Check for abort after uploads
    if (requestAborted) {
      await handleAbort(uploadedToOrthanc, client, res);
      return;
    }

    if (uploadResults.length === 0) {
      await cleanupOrthancUploads(uploadedToOrthanc);
      await client.query("ROLLBACK");
      return res.status(500).json({
        status: "failed",
        message: "Failed to upload any DICOM files to Orthanc",
        errors: uploadErrors
      });
    }

    console.log(`[2/6] Successfully uploaded ${uploadResults.length}/${dicomFiles.length} files`);

    // ==================== STEP 2: Group by study ====================
    const studiesByStudyId = {};
    uploadResults.forEach(result => {
      if (!studiesByStudyId[result.studyId]) {
        studiesByStudyId[result.studyId] = [];
      }
      studiesByStudyId[result.studyId].push(result);
    });

    console.log(`[3/6] Grouped into ${Object.keys(studiesByStudyId).length} study/studies`);

    // Check for abort
    if (requestAborted) {
      await handleAbort(uploadedToOrthanc, client, res);
      return;
    }

    // Wait for Orthanc to index
    await new Promise(resolve => setTimeout(resolve, 1000));

    const createdStudies = [];

    // ==================== STEP 3: Process each study ====================
    for (const [orthancStudyId, instances] of Object.entries(studiesByStudyId)) {
      if (requestAborted) {
        await handleAbort(uploadedToOrthanc, client, res);
        return;
      }

      try {
        console.log(`[4/6] Processing study ${orthancStudyId} with ${instances.length} instances`);

        // Get study metadata
        const [studyInfo, firstInstanceTags] = await Promise.all([
          orthancService.getStudy(orthancStudyId),
          orthancService.getInstanceTags(instances[0].instanceId)
        ]);

        if (requestAborted) {
          await handleAbort(uploadedToOrthanc, client, res);
          return;
        }

        const studyMetadata = firstInstanceTags;
        const studyInstanceUID = studyMetadata.StudyInstanceUID;
        const studyDate = studyMetadata.StudyDate 
          ? new Date(studyMetadata.StudyDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
          : new Date();
        const primaryModality = studyMetadata.Modality || 'Unknown';

        // Check if study already exists
        const existingStudy = await client.query(
          'SELECT imaging_study_id FROM imaging_studies WHERE orthanc_study_id = $1',
          [orthancStudyId]
        );

        if (requestAborted) {
          await handleAbort(uploadedToOrthanc, client, res);
          return;
        }

        let studyId;

        if (existingStudy.rows.length > 0) {
          // Update existing study
          studyId = existingStudy.rows[0].imaging_study_id;
          await client.query(
            `UPDATE imaging_studies 
             SET findings = COALESCE($1, findings),
                 recommendations = COALESCE($2, recommendations),
                 updated_at = CURRENT_TIMESTAMP
             WHERE imaging_study_id = $3`,
            [findings, recommendations, studyId]
          );
        } else {
          // Create new study
          const studyResult = await client.query(
            `INSERT INTO imaging_studies
              (visit_id, orthanc_study_id, study_instance_uid, modality, 
               study_description, body_part, study_date, dicom_metadata,
               findings, recommendations, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING imaging_study_id`,
            [
              visit_id,
              orthancStudyId,
              studyInstanceUID,
              primaryModality,
              studyMetadata.StudyDescription || null,
              body_part_override || studyMetadata.BodyPartExamined || null,
              studyDate,
              JSON.stringify(studyMetadata),
              findings || null,
              recommendations || null,
              user_id
            ]
          );
          studyId = studyResult.rows[0].imaging_study_id;
        }

        if (requestAborted) {
          await handleAbort(uploadedToOrthanc, client, res);
          return;
        }

        // ==================== STEP 4: Group instances by series ====================
        const seriesBySeriesId = {};
        instances.forEach(inst => {
          if (!seriesBySeriesId[inst.seriesId]) {
            seriesBySeriesId[inst.seriesId] = [];
          }
          seriesBySeriesId[inst.seriesId].push(inst);
        });

        const uniqueSeriesIds = Object.keys(seriesBySeriesId);
        console.log(`[5/6] Processing ${uniqueSeriesIds.length} series...`);

        // Fetch series metadata in parallel
        const seriesInfoPromises = uniqueSeriesIds.map(seriesId =>
          Promise.all([
            orthancService.getSeries(seriesId),
            orthancService.getInstanceTags(seriesBySeriesId[seriesId][0].instanceId)
          ]).then(([seriesInfo, tags]) => ({
            seriesId,
            seriesInfo,
            tags,
            instances: seriesBySeriesId[seriesId]
          }))
        );

        const allSeriesData = await Promise.all(seriesInfoPromises);

        if (requestAborted) {
          await handleAbort(uploadedToOrthanc, client, res);
          return;
        }

        // ==================== STEP 5: Insert series ====================
        const seriesToInsert = [];
        const seriesToUpdate = [];

        for (const seriesData of allSeriesData) {
          const existing = await client.query(
            'SELECT imaging_series_id FROM imaging_series WHERE orthanc_series_id = $1',
            [seriesData.seriesId]
          );

          if (existing.rows.length === 0) {
            seriesToInsert.push(seriesData);
          } else {
            seriesToUpdate.push({
              ...seriesData,
              dbSeriesId: existing.rows[0].imaging_series_id
            });
          }
        }

        const seriesIdMap = {};
        
        if (seriesToInsert.length > 0) {
          const seriesValues = seriesToInsert.map((sd, idx) => 
            `($1, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7}, $${idx * 7 + 8})`
          ).join(',');

          const seriesParams = [studyId];
          seriesToInsert.forEach(sd => {
            seriesParams.push(
              sd.seriesId,
              sd.tags.SeriesInstanceUID,
              sd.tags.SeriesNumber || null,
              sd.tags.SeriesDescription || null,
              sd.tags.Modality || null,
              body_part_override || sd.tags.BodyPartExamined || null,
              JSON.stringify(sd.tags)
            );
          });

          const seriesResult = await client.query(
            `INSERT INTO imaging_series
              (imaging_study_id, orthanc_series_id, series_instance_uid,
               series_number, series_description, modality, body_part, dicom_metadata)
             VALUES ${seriesValues}
             RETURNING imaging_series_id, orthanc_series_id`,
            seriesParams
          );

          seriesResult.rows.forEach(row => {
            seriesIdMap[row.orthanc_series_id] = row.imaging_series_id;
          });
        }

        if (requestAborted) {
          await handleAbort(uploadedToOrthanc, client, res);
          return;
        }

        seriesToUpdate.forEach(sd => {
          seriesIdMap[sd.seriesId] = sd.dbSeriesId;
        });

        // ==================== STEP 6: Insert instances ====================
        console.log(`[6/6] Inserting ${instances.length} instances...`);

        const instancesData = [];
        
        for (const seriesData of allSeriesData) {
          const dbSeriesId = seriesIdMap[seriesData.seriesId];
          
          for (const instance of seriesData.instances) {
            instancesData.push({
              dbSeriesId,
              instanceId: instance.instanceId,
              fileName: instance.file,
              fileSize: instance.size
            });
          }
        }

        // Check which instances already exist
        const existingInstanceIds = await client.query(
          `SELECT orthanc_instance_id FROM imaging_instances 
           WHERE orthanc_instance_id = ANY($1)`,
          [instancesData.map(i => i.instanceId)]
        );

        const existingSet = new Set(existingInstanceIds.rows.map(r => r.orthanc_instance_id));
        const newInstances = instancesData.filter(i => !existingSet.has(i.instanceId));

        if (newInstances.length > 0) {
          const TAG_BATCH_SIZE = 20;
          const allInstanceTags = [];

          // Fetch instance tags in batches
          for (let i = 0; i < newInstances.length; i += TAG_BATCH_SIZE) {
            if (requestAborted) {
              await handleAbort(uploadedToOrthanc, client, res);
              return;
            }

            const batch = newInstances.slice(i, i + TAG_BATCH_SIZE);
            const tagPromises = batch.map(inst => 
              orthancService.getInstanceTags(inst.instanceId)
            );
            const batchTags = await Promise.all(tagPromises);
            allInstanceTags.push(...batchTags);
          }

          // Bulk insert instances
          const instanceValues = newInstances.map((inst, idx) => 
            `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`
          ).join(',');

          const instanceParams = [];
          newInstances.forEach((inst, idx) => {
            const tags = allInstanceTags[idx];
            instanceParams.push(
              inst.dbSeriesId,
              inst.instanceId,
              tags.SOPInstanceUID,
              tags.InstanceNumber || null,
              inst.fileName,
              inst.fileSize,
              JSON.stringify(tags)
            );
          });

          await client.query(
            `INSERT INTO imaging_instances
              (imaging_series_id, orthanc_instance_id, sop_instance_uid,
               instance_number, file_name, file_size, dicom_metadata)
             VALUES ${instanceValues}`,
            instanceParams
          );

          if (requestAborted) {
            await handleAbort(uploadedToOrthanc, client, res);
            return;
          }

          console.log(`Inserted ${newInstances.length} new instances`);
        }

        createdStudies.push({
          imaging_study_id: studyId,
          orthanc_study_id: orthancStudyId,
          study_instance_uid: studyInstanceUID,
          modality: primaryModality,
          series_count: uniqueSeriesIds.length,
          instance_count: instances.length
        });

      } catch (studyError) {
        console.error(`Error processing study ${orthancStudyId}:`, studyError);
        uploadErrors.push({
          studyId: orthancStudyId,
          error: studyError.message
        });
      }
    }

    // Final abort check before commit
    if (requestAborted) {
      await handleAbort(uploadedToOrthanc, client, res);
      return;
    }

    if (createdStudies.length === 0) {
      await cleanupOrthancUploads(uploadedToOrthanc);
      await client.query("ROLLBACK");
      return res.status(500).json({
        status: "failed",
        message: "Failed to process any studies",
        errors: uploadErrors
      });
    }

    // ==================== STEP 7: Get viewer URLs and complete ====================
    const firstStudy = createdStudies[0];
    const [viewerUrl, allViewers] = await Promise.all([
      orthancService.getBestViewerUrl(firstStudy.orthanc_study_id),
      orthancService.getAllViewerUrls(firstStudy.orthanc_study_id)
    ]);

    const totalFiles = uploadResults.length;
    const totalSize = uploadResults.reduce((sum, r) => sum + r.size, 0);

    // Log audit trail
    await logAudit({
      user_id,
      table_name: "imaging_studies",
      action_type: "upload_dicom_study",
      new_values: { 
        visit_id,
        studies_created: createdStudies.length,
        files_uploaded: totalFiles,
        total_size: totalSize
      },
      event_type: "CREATE",
      ip_address: req.ip,
      branch_id: req.user.branch_id,
      hospital_id: req.user.hospital_id,
      request_method: req.method,
      endpoint: req.originalUrl
    });

    // Clear tracking since we're committing
    uploadedToOrthanc = [];

    // Commit transaction
    await client.query("COMMIT");

    console.log(`✅ Upload complete: ${createdStudies.length} studies, ${totalFiles} files`);

    // Send success response
    res.status(201).json({
      status: "success",
      message: `Successfully uploaded ${createdStudies.length} study/studies with ${totalFiles} files`,
      data: {
        studies: createdStudies,
        total_files: totalFiles,
        total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
        viewer_url: viewerUrl,
        all_viewers: allViewers,
        upload_errors: uploadErrors.length > 0 ? uploadErrors : undefined
      }
    });

  } catch (error) {
    console.error("Error uploading DICOM study:", error);
    
    // Rollback database changes
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }
    
    // Clean up Orthanc uploads
    if (uploadedToOrthanc.length > 0) {
      console.log(`Cleaning up ${uploadedToOrthanc.length} uploaded instances...`);
      await cleanupOrthancUploads(uploadedToOrthanc);
    }
    
    // Send error response if headers not sent
    if (!res.headersSent) {
      if (requestAborted) {
        return res.status(499).json({
          status: "cancelled",
          message: "Upload cancelled by client"
        });
      }
      
      res.status(500).json({
        status: "failed",
        message: "Server error during DICOM upload",
        error: error.message
      });
    }
  } finally {
    // Always release the client
    try {
      client.release();
    } catch (releaseError) {
      console.error("Error releasing client:", releaseError);
    }
  }
};

// Get imaging study details
export const getImagingStudy = async (req, res) => {
  try {
    const { imaging_study_id } = req.params;

    const result = await pool.query(
      `SELECT s.*, 
              v.visit_number,
              v.visit_type,
              v.visit_date,
              p.first_name, 
              p.last_name,
              p.patient_id,
              u.first_name as uploaded_by_first_name,
              u.last_name as uploaded_by_last_name
       FROM imaging_studies s
       LEFT JOIN visits v ON s.visit_id = v.visit_id
       LEFT JOIN patients p ON v.patient_id = p.patient_id
       LEFT JOIN users u ON s.uploaded_by = u.user_id
       WHERE s.imaging_study_id = $1`,
      [imaging_study_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Imaging study not found"
      });
    }

    const study = result.rows[0];

    // Get series for this study
    const seriesResult = await pool.query(
      `SELECT * FROM imaging_series WHERE imaging_study_id = $1 ORDER BY series_number`,
      [imaging_study_id]
    );

    study.series = seriesResult.rows;

    // Add viewer URLs
    if (study.orthanc_study_id) {
      study.primary_viewer_url = await orthancService.getBestViewerUrl(study.orthanc_study_id);
      study.all_viewer_urls = await orthancService.getAllViewerUrls(study.orthanc_study_id);
    }

    res.status(200).json({
      status: "success",
      data: study
    });

  } catch (error) {
    console.error("Error fetching imaging study:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

// Get all imaging studies for a visit
export const getVisitImagingStudies = async (req, res) => {
  try {
    const { visit_id } = req.params;

    const results = await pool.query(
      `SELECT s.*,
              u.first_name as uploaded_by_first_name,
              u.last_name as uploaded_by_last_name
       FROM imaging_studies s
       LEFT JOIN users u ON s.uploaded_by = u.user_id
       WHERE s.visit_id = $1 
       ORDER BY s.study_date DESC, s.created_at DESC`,
      [visit_id]
    );

    // Add viewer URLs
    const studiesWithUrls = await Promise.all(
      results.rows.map(async (study) => ({
        ...study,
        viewer_url: study.orthanc_study_id 
          ? await orthancService.getBestViewerUrl(study.orthanc_study_id)
          : null,
        all_viewers: study.orthanc_study_id
          ? await orthancService.getAllViewerUrls(study.orthanc_study_id)
          : null
      }))
    );

    res.status(200).json({
      status: "success",
      count: studiesWithUrls.length,
      data: studiesWithUrls
    });

  } catch (error) {
    console.error("Error fetching visit imaging studies:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

// Get patient's imaging history
export const getPatientImagingHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const results = await pool.query(
      `SELECT s.*,
              v.visit_number,
              v.visit_date,
              v.visit_type
       FROM imaging_studies s
       JOIN visits v ON s.visit_id = v.visit_id
       WHERE v.patient_id = $1
       ORDER BY s.study_date DESC, s.created_at DESC`,
      [patient_id]
    );

    const studiesWithUrls = await Promise.all(
      results.rows.map(async (study) => ({
        ...study,
        viewer_url: study.orthanc_study_id 
          ? await orthancService.getBestViewerUrl(study.orthanc_study_id)
          : null
      }))
    );

    res.status(200).json({
      status: "success",
      count: studiesWithUrls.length,
      data: studiesWithUrls
    });

  } catch (error) {
    console.error("Error fetching patient imaging history:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

// Update imaging study (findings/recommendations)
export const updateImagingStudy = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { imaging_study_id } = req.params;
    const { findings, recommendations } = req.body;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE imaging_studies 
       SET findings = COALESCE($1, findings),
           recommendations = COALESCE($2, recommendations),
           updated_at = CURRENT_TIMESTAMP
       WHERE imaging_study_id = $3
       RETURNING *`,
      [findings, recommendations, imaging_study_id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Imaging study not found"
      });
    }

    await logAudit({
      user_id: req.user.user_id,
      table_name: "imaging_studies",
      action_type: "update_study_findings",
      new_values: result.rows[0],
      event_type: "UPDATE",
      ip_address: req.ip,
      branch_id: req.user.branch_id,
      hospital_id: req.user.hospital_id,
      request_method: req.method,
      endpoint: req.originalUrl
    });

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Imaging study updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating imaging study:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  } finally {
    client.release();
  }
};

// Delete imaging study (cascades to series and instances)
export const deleteImagingStudy = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { imaging_study_id } = req.params;

    await client.query("BEGIN");

    // Get study details
    const result = await client.query(
      'SELECT * FROM imaging_studies WHERE imaging_study_id = $1',
      [imaging_study_id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Imaging study not found"
      });
    }

    const study = result.rows[0];

    // Delete from Orthanc
    try {
      if (study.orthanc_study_id) {
        await orthancService.deleteStudy(study.orthanc_study_id);
      }
    } catch (orthancError) {
      console.error("Error deleting from Orthanc:", orthancError);
      // Continue with database deletion
    }

    // Delete from database (cascades to series and instances)
    await client.query(
      'DELETE FROM imaging_studies WHERE imaging_study_id = $1',
      [imaging_study_id]
    );

    await logAudit({
      user_id: req.user.user_id,
      table_name: "imaging_studies",
      action_type: "delete_study",
      old_values: study,
      event_type: "DELETE",
      ip_address: req.ip,
      branch_id: req.user.branch_id,
      hospital_id: req.user.hospital_id,
      request_method: req.method,
      endpoint: req.originalUrl
    });

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Imaging study deleted successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting imaging study:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  } finally {
    client.release();
  }
};

// Get preview for a study (first instance)
export const getStudyPreview = async (req, res) => {
  try {
    const { imaging_study_id } = req.params;

    // Get first instance of first series
    const result = await pool.query(
      `SELECT i.orthanc_instance_id
       FROM imaging_instances i
       JOIN imaging_series s ON i.imaging_series_id = s.imaging_series_id
       WHERE s.imaging_study_id = $1
       ORDER BY s.series_number, i.instance_number
       LIMIT 1`,
      [imaging_study_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "No instances found for this study"
      });
    }

    const instanceId = result.rows[0].orthanc_instance_id;
    const previewImage = await orthancService.getPreviewImage(instanceId);

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(previewImage);

  } catch (error) {
    console.error("Error fetching study preview:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to generate preview"
    });
  }
};

// Get Orthanc server statistics
export const getOrthancStats = async (req, res) => {
  try {
    const stats = await orthancService.getStatistics();
    const health = await orthancService.healthCheck();

    res.status(200).json({
      status: "success",
      data: {
        statistics: stats,
        health: health,
        server_url: process.env.ORTHANC_URL
      }
    });

  } catch (error) {
    console.error("Error fetching Orthanc stats:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to fetch Orthanc statistics"
    });
  }
};