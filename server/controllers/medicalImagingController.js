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
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.dcm', '.dicom'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isDicomMime = file.mimetype === 'application/dicom' || 
                        file.mimetype === 'application/octet-stream';
    
    // Allow files without extensions (common for DICOM)
    if (allowedTypes.includes(ext) || isDicomMime || !ext) {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files (.dcm, .dicom, or no extension) are allowed'));
    }
  }
}).any(); 
// Upload DICOM study (multiple files treated as one study)
export const uploadDicomStudy = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { visit_id, findings, recommendations, body_part_override } = req.body;
    
    // ✅ Handle files from any field name
    const dicomFiles = req.files || [];
    const user_id = req.user.user_id;

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

    await client.query("BEGIN");

    // Upload all DICOM files to Orthanc first
    const uploadResults = [];
    const uploadErrors = [];

    console.log(`Starting upload of ${dicomFiles.length} DICOM files...`);

    for (const file of dicomFiles) {
      try {
        const orthancResponse = await orthancService.uploadDicom(file.buffer);
        uploadResults.push({
          file: file.originalname,
          instanceId: orthancResponse.ID,
          studyId: orthancResponse.ParentStudy,
          seriesId: orthancResponse.ParentSeries,
          size: file.size
        });
      } catch (uploadError) {
        console.error(`Error uploading ${file.originalname}:`, uploadError);
        uploadErrors.push({
          file: file.originalname,
          error: uploadError.message
        });
      }
    }

    if (uploadResults.length === 0) {
      await client.query("ROLLBACK");
      return res.status(500).json({
        status: "failed",
        message: "Failed to upload any DICOM files to Orthanc",
        errors: uploadErrors
      });
    }

    console.log(`Successfully uploaded ${uploadResults.length} files to Orthanc`);

    // Group instances by study
    const studiesByStudyId = {};
    uploadResults.forEach(result => {
      if (!studiesByStudyId[result.studyId]) {
        studiesByStudyId[result.studyId] = [];
      }
      studiesByStudyId[result.studyId].push(result);
    });

    console.log(`Files grouped into ${Object.keys(studiesByStudyId).length} study/studies`);

    // Wait a bit for Orthanc to process and index the studies
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Process each study
    const createdStudies = [];

    for (const [orthancStudyId, instances] of Object.entries(studiesByStudyId)) {
      try {
        console.log(`Processing study ${orthancStudyId} with ${instances.length} instances`);

        // Get study information from Orthanc - use simpler approach
        const studyInfo = await orthancService.getStudy(orthancStudyId);
        
        // Get tags from first instance for metadata
        const firstInstanceTags = await orthancService.getInstanceTags(instances[0].instanceId);
        const studyMetadata = firstInstanceTags;

        // Extract study-level information
        const studyInstanceUID = studyMetadata.StudyInstanceUID;
        const studyDate = studyMetadata.StudyDate 
          ? new Date(studyMetadata.StudyDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
          : new Date();

        // Get all unique series IDs from instances
        const uniqueSeriesIds = [...new Set(instances.map(i => i.seriesId))];
        
        // Determine primary modality from metadata
        const primaryModality = studyMetadata.Modality || 'Unknown';

        console.log(`Study details - UID: ${studyInstanceUID}, Modality: ${primaryModality}, Series: ${uniqueSeriesIds.length}`);

        // Check if study already exists
        const existingStudy = await client.query(
          'SELECT imaging_study_id FROM imaging_studies WHERE orthanc_study_id = $1',
          [orthancStudyId]
        );

        let studyId;

        if (existingStudy.rows.length > 0) {
          // Update existing study
          studyId = existingStudy.rows[0].imaging_study_id;
          
          console.log(`Updating existing study ${studyId}`);
          
          await client.query(
            `UPDATE imaging_studies 
             SET findings = COALESCE($1, findings),
                 recommendations = COALESCE($2, recommendations),
                 updated_at = CURRENT_TIMESTAMP
             WHERE imaging_study_id = $3`,
            [findings, recommendations, studyId]
          );
        } else {
          // Create new study record
          console.log(`Creating new study record`);
          
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
          
          console.log(`Created study with ID ${studyId}`);
        }

        // Process each series in the study
        const seriesBySeriesId = {};
        instances.forEach(inst => {
          if (!seriesBySeriesId[inst.seriesId]) {
            seriesBySeriesId[inst.seriesId] = [];
          }
          seriesBySeriesId[inst.seriesId].push(inst);
        });

        console.log(`Processing ${Object.keys(seriesBySeriesId).length} series...`);

        for (const [seriesId, seriesInstances] of Object.entries(seriesBySeriesId)) {
          // Get series info from Orthanc
          const seriesInfo = await orthancService.getSeries(seriesId);
          const firstInstanceTags = await orthancService.getInstanceTags(seriesInstances[0].instanceId);

          // Check if series exists
          const existingSeries = await client.query(
            'SELECT imaging_series_id FROM imaging_series WHERE orthanc_series_id = $1',
            [seriesId]
          );

          let dbSeriesId;

          if (existingSeries.rows.length > 0) {
            dbSeriesId = existingSeries.rows[0].imaging_series_id;
            console.log(`Series ${seriesId} already exists`);
          } else {
            // Create new series record
            const seriesResult = await client.query(
              `INSERT INTO imaging_series
                (imaging_study_id, orthanc_series_id, series_instance_uid,
                 series_number, series_description, modality, body_part, dicom_metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING imaging_series_id`,
              [
                studyId,
                seriesId,
                firstInstanceTags.SeriesInstanceUID,
                firstInstanceTags.SeriesNumber || null,
                firstInstanceTags.SeriesDescription || null,
                firstInstanceTags.Modality || null,
                body_part_override || firstInstanceTags.BodyPartExamined || null,
                JSON.stringify(firstInstanceTags)
              ]
            );
            dbSeriesId = seriesResult.rows[0].imaging_series_id;
            console.log(`Created series ${dbSeriesId}`);
          }

          // Insert instances
          for (const instance of seriesInstances) {
            const instanceTags = await orthancService.getInstanceTags(instance.instanceId);

            // Check if instance exists
            const existingInstance = await client.query(
              'SELECT imaging_instance_id FROM imaging_instances WHERE orthanc_instance_id = $1',
              [instance.instanceId]
            );

            if (existingInstance.rows.length === 0) {
              await client.query(
                `INSERT INTO imaging_instances
                  (imaging_series_id, orthanc_instance_id, sop_instance_uid,
                   instance_number, file_name, file_size, dicom_metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  dbSeriesId,
                  instance.instanceId,
                  instanceTags.SOPInstanceUID,
                  instanceTags.InstanceNumber || null,
                  instance.file,
                  instance.size,
                  JSON.stringify(instanceTags)
                ]
              );
            }
          }
        }

        createdStudies.push({
          imaging_study_id: studyId,
          orthanc_study_id: orthancStudyId,
          study_instance_uid: studyInstanceUID,
          modality: primaryModality,
          series_count: Object.keys(seriesBySeriesId).length,
          instance_count: instances.length
        });

        console.log(`Successfully processed study ${orthancStudyId}`);

      } catch (studyError) {
        console.error(`Error processing study ${orthancStudyId}:`, studyError);
        uploadErrors.push({
          studyId: orthancStudyId,
          error: studyError.message
        });
      }
    }

    if (createdStudies.length === 0) {
      await client.query("ROLLBACK");
      return res.status(500).json({
        status: "failed",
        message: "Failed to process any studies",
        errors: uploadErrors
      });
    }

    // Get viewer URL for the first study
    const firstStudy = createdStudies[0];
    const viewerUrl = await orthancService.getBestViewerUrl(firstStudy.orthanc_study_id);
    const allViewers = await orthancService.getAllViewerUrls(firstStudy.orthanc_study_id);

    // Calculate totals
    const totalFiles = uploadResults.length;
    const totalSize = uploadResults.reduce((sum, r) => sum + r.size, 0);

    // Log audit
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

    await client.query("COMMIT");

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
    await client.query("ROLLBACK");
    console.error("Error uploading DICOM study:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      status: "failed",
      message: "Server error during DICOM upload",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
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