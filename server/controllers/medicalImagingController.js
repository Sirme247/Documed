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
    
    if (allowedTypes.includes(ext) || isDicomMime) {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files (.dcm, .dicom) are allowed'));
    }
  }
}).array('dicomFiles', 50); // Allow up to 50 files

// Upload DICOM and record imaging result
export const uploadDicomImages = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { visit_id, findings, recommendations, body_part_override } = req.body;
    const dicomFiles = req.files;
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

    const uploadedImages = [];
    let firstStudyId = null;
    let totalFileSize = 0;

    // Upload each DICOM file to Orthanc
    for (const file of dicomFiles) {
      try {
        // Upload to Orthanc
        const orthancResponse = await orthancService.uploadDicom(file.buffer);
        
        // Extract IDs
        const instanceId = orthancResponse.ID;
        const studyId = orthancResponse.ParentStudy;
        const seriesId = orthancResponse.ParentSeries;

        if (!firstStudyId) firstStudyId = studyId;

        // Get DICOM metadata
        const dicomTags = await orthancService.getInstanceTags(instanceId);
        const keyMetadata = orthancService.extractKeyMetadata(dicomTags);

        totalFileSize += file.size;

        // Store in database
        const insertResult = await client.query(
          `INSERT INTO imaging_results
            (visit_id, orthanc_study_id, orthanc_series_id, orthanc_instance_id, 
             modality, study_description, series_description, body_part, 
             study_date, findings, recommendations, dicom_metadata, 
             file_size, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING *`,
          [
            visit_id,
            studyId,
            seriesId,
            instanceId,
            keyMetadata.modality,
            keyMetadata.studyDescription,
            keyMetadata.seriesDescription,
            body_part_override || keyMetadata.bodyPartExamined,
            keyMetadata.studyDate || new Date(),
            findings || null,
            recommendations || null,
            JSON.stringify(keyMetadata),
            file.size,
            user_id
          ]
        );

        uploadedImages.push({
          imaging_result_id: insertResult.rows[0].imaging_result_id,
          filename: file.originalname,
          orthanc_instance_id: instanceId,
          modality: keyMetadata.modality,
          body_part: body_part_override || keyMetadata.bodyPartExamined
        });

      } catch (uploadError) {
        console.error(`Error uploading ${file.originalname}:`, uploadError);
        // Continue with other files
      }
    }

    if (uploadedImages.length === 0) {
      await client.query("ROLLBACK");
      return res.status(500).json({
        status: "failed",
        message: "Failed to upload any DICOM files"
      });
    }

    // Get best available viewer URL
    const viewerUrl = firstStudyId 
      ? await orthancService.getBestViewerUrl(firstStudyId)
      : null;

    const allViewers = firstStudyId
      ? await orthancService.getAllViewerUrls(firstStudyId)
      : null;

    // Log audit
    await logAudit({
      user_id,
      table_name: "imaging_results",
      action_type: "upload_dicom_images",
      new_values: { 
        visit_id, 
        files_uploaded: uploadedImages.length,
        total_size: totalFileSize 
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
      message: `Successfully uploaded ${uploadedImages.length} DICOM image(s)`,
      data: {
        uploaded_images: uploadedImages,
        total_files: uploadedImages.length,
        total_size_mb: (totalFileSize / (1024 * 1024)).toFixed(2),
        viewer_url: viewerUrl,
        all_viewers: allViewers
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error uploading DICOM images:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error during DICOM upload",
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get imaging result details
export const getImagingResult = async (req, res) => {
  try {
    const { imaging_result_id } = req.params;

    const result = await pool.query(
      `SELECT ir.*, 
              v.visit_number,
              v.visit_type,
              p.first_name, 
              p.last_name,
              p.patient_id,
              u.first_name as uploaded_by_first_name,
              u.last_name as uploaded_by_last_name
       FROM imaging_results ir
       LEFT JOIN visits v ON ir.visit_id = v.visit_id
       LEFT JOIN patients p ON v.patient_id = p.patient_id
       LEFT JOIN users u ON ir.uploaded_by = u.user_id
       WHERE ir.imaging_result_id = $1`,
      [imaging_result_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Imaging result not found"
      });
    }

    const imagingResult = result.rows[0];

    // Add all available viewer URLs
    if (imagingResult.orthanc_study_id) {
      imagingResult.primary_viewer_url = await orthancService.getBestViewerUrl(
        imagingResult.orthanc_study_id
      );
      imagingResult.all_viewer_urls = await orthancService.getAllViewerUrls(
        imagingResult.orthanc_study_id
      );
      imagingResult.preview_url = `/api/medical-imaging/${imaging_result_id}/preview`;
      imagingResult.download_url = `/api/medical-imaging/${imaging_result_id}/download`;
    }

    res.status(200).json({
      status: "success",
      data: imagingResult
    });

  } catch (error) {
    console.error("Error fetching imaging result:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

// Get all imaging results for a visit
export const getVisitImagingResults = async (req, res) => {
  try {
    const { visit_id } = req.params;

    const results = await pool.query(
      `SELECT ir.*,
              u.first_name as uploaded_by_first_name,
              u.last_name as uploaded_by_last_name
       FROM imaging_results ir
       LEFT JOIN users u ON ir.uploaded_by = u.user_id
       WHERE ir.visit_id = $1 
       ORDER BY ir.study_date DESC, ir.created_at DESC`,
      [visit_id]
    );

    // Add viewer URLs and thumbnails - with async getAllViewerUrls
    const resultsWithUrls = await Promise.all(
      results.rows.map(async (result) => ({
        ...result,
        viewer_url: result.orthanc_study_id 
          ? await orthancService.getBestViewerUrl(result.orthanc_study_id)
          : null,
        all_viewers: result.orthanc_study_id
          ? await orthancService.getAllViewerUrls(result.orthanc_study_id)
          : null,
        preview_url: `/api/medical-imaging/${result.imaging_result_id}/preview`,
        thumbnail_url: `/api/medical-imaging/${result.imaging_result_id}/thumbnail`,
        download_url: `/api/medical-imaging/${result.imaging_result_id}/download`
      }))
    );

    res.status(200).json({
      status: "success",
      count: resultsWithUrls.length,
      data: resultsWithUrls
    });

  } catch (error) {
    console.error("Error fetching visit imaging results:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

// Get preview image (PNG)
export const getImagingPreview = async (req, res) => {
  try {
    const { imaging_result_id } = req.params;

    const result = await pool.query(
      'SELECT orthanc_instance_id FROM imaging_results WHERE imaging_result_id = $1',
      [imaging_result_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Imaging result not found"
      });
    }

    const instanceId = result.rows[0].orthanc_instance_id;
    const previewImage = await orthancService.getPreviewImage(instanceId);

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(previewImage);

  } catch (error) {
    console.error("Error fetching preview:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to generate preview"
    });
  }
};

// Get thumbnail
export const getImagingThumbnail = async (req, res) => {
  try {
    const { imaging_result_id } = req.params;

    const result = await pool.query(
      'SELECT orthanc_instance_id FROM imaging_results WHERE imaging_result_id = $1',
      [imaging_result_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Imaging result not found"
      });
    }

    const instanceId = result.rows[0].orthanc_instance_id;
    const thumbnail = await orthancService.getThumbnail(instanceId);

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(thumbnail);

  } catch (error) {
    console.error("Error fetching thumbnail:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to generate thumbnail"
    });
  }
};

// Download DICOM file
export const downloadDicom = async (req, res) => {
  try {
    const { imaging_result_id } = req.params;

    const result = await pool.query(
      `SELECT orthanc_instance_id, modality, body_part, study_date 
       FROM imaging_results 
       WHERE imaging_result_id = $1`,
      [imaging_result_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Imaging result not found"
      });
    }

    const { orthanc_instance_id, modality, body_part, study_date } = result.rows[0];
    const dicomFile = await orthancService.downloadDicom(orthanc_instance_id);

    // Create descriptive filename
    const date = study_date ? new Date(study_date).toISOString().split('T')[0] : 'unknown';
    const filename = `${modality || 'DICOM'}_${body_part || 'UNKNOWN'}_${date}_${orthanc_instance_id}.dcm`;

    res.set('Content-Type', 'application/dicom');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(dicomFile);

    // Log download
    await logAudit({
      user_id: req.user.user_id,
      table_name: "imaging_results",
      action_type: "download_dicom",
      old_values: { imaging_result_id },
      event_type: "READ",
      ip_address: req.ip,
      branch_id: req.user.branch_id,
      hospital_id: req.user.hospital_id,
      request_method: req.method,
      endpoint: req.originalUrl
    });

  } catch (error) {
    console.error("Error downloading DICOM:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to download DICOM file"
    });
  }
};

// Update imaging result (findings/recommendations)
export const updateImagingResult = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { imaging_result_id } = req.params;
    const { findings, recommendations } = req.body;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE imaging_results 
       SET findings = COALESCE($1, findings),
           recommendations = COALESCE($2, recommendations),
           updated_at = CURRENT_TIMESTAMP
       WHERE imaging_result_id = $3
       RETURNING *`,
      [findings, recommendations, imaging_result_id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Imaging result not found"
      });
    }

    await logAudit({
      user_id: req.user.user_id,
      table_name: "imaging_results",
      action_type: "update_findings",
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
      message: "Imaging result updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating imaging result:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  } finally {
    client.release();
  }
};

// Delete imaging result
export const deleteImagingResult = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { imaging_result_id } = req.params;

    await client.query("BEGIN");

    // Get imaging result
    const result = await client.query(
      'SELECT * FROM imaging_results WHERE imaging_result_id = $1',
      [imaging_result_id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Imaging result not found"
      });
    }

    const imagingResult = result.rows[0];

    // Delete from Orthanc
    try {
      if (imagingResult.orthanc_instance_id) {
        await orthancService.deleteInstance(imagingResult.orthanc_instance_id);
      }
    } catch (orthancError) {
      console.error("Error deleting from Orthanc:", orthancError);
      // Continue with database deletion even if Orthanc deletion fails
    }

    // Delete from database
    await client.query(
      'DELETE FROM imaging_results WHERE imaging_result_id = $1',
      [imaging_result_id]
    );

    await logAudit({
      user_id: req.user.user_id,
      table_name: "imaging_results",
      action_type: "delete_imaging",
      old_values: imagingResult,
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
      message: "Imaging result deleted successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting imaging result:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  } finally {
    client.release();
  }
};

// Get patient's imaging history
export const getPatientImagingHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const results = await pool.query(
      `SELECT ir.*,
              v.visit_number,
              v.visit_date,
              v.visit_type
       FROM imaging_results ir
       JOIN visits v ON ir.visit_id = v.visit_id
       WHERE v.patient_id = $1
       ORDER BY ir.study_date DESC, ir.created_at DESC`,
      [patient_id]
    );

    const resultsWithUrls = await Promise.all(
      results.rows.map(async (result) => ({
        ...result,
        viewer_url: result.orthanc_study_id 
          ? await orthancService.getBestViewerUrl(result.orthanc_study_id)
          : null,
        thumbnail_url: `/api/medical-imaging/${result.imaging_result_id}/thumbnail`
      }))
    );

    res.status(200).json({
      status: "success",
      count: resultsWithUrls.length,
      data: resultsWithUrls
    });

  } catch (error) {
    console.error("Error fetching patient imaging history:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
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