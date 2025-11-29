import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { pool } from '../libs/database.js';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const deleteLabTest = async (req, res) => {
  const connection = await pool.connect();
  
  try {
    const { testId } = req.params;
    const user = req.user;

    // Permission check
    const allowedRoles = [1, 2, 3, 6, 7]; // Admin, Doctor, Nurse, Lab Tech
    if (!allowedRoles.includes(user.role_id)) {
      return res.status(403).json({
        status: "failed",
        message: "You do not have permission to delete lab tests"
      });
    }

    await connection.query('BEGIN');

    // Get lab test with visit status
    const result = await connection.query(
      `SELECT lt.*, v.visit_status 
       FROM lab_tests lt
       JOIN visits v ON lt.visit_id = v.visit_id
       WHERE lt.lab_test_id = $1`,
      [testId]
    );

    if (result.rows.length === 0) {
      await connection.query('ROLLBACK');
      return res.status(404).json({
        status: "failed",
        message: "Lab test not found"
      });
    }

    const labTest = result.rows[0];

    // Only admin can delete from closed visits
    if (labTest.visit_status === 'closed' && user.role_id !== 1) {
      await connection.query('ROLLBACK');
      return res.status(403).json({
        status: "failed",
        message: "Cannot delete from closed visit"
      });
    }

    // Delete PDF from S3
    if (labTest.pdf_key) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: labTest.pdf_key
      });
      await s3Client.send(deleteCommand);
    }

    // Delete from database
    await connection.query(
      `DELETE FROM lab_tests WHERE lab_test_id = $1`,
      [testId]
    );

    await connection.query('COMMIT');

    res.status(200).json({
      status: "success",
      message: "Lab test deleted successfully"
    });

  } catch (error) {
    await connection.query('ROLLBACK');
    console.error("Error deleting lab test:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to delete lab test",
      error: error.message
    });
  } finally {
    connection.release();
  }
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY
  }
});

const BUCKET_NAME = "documed-labs";

// Generate upload pre-signed URL
export const getUploadUrl = async (req, res) => {
  try {
    const { testId } = req.body;
    const user = req.user;

    console.log("User object:", user);
    console.log("Test ID:", testId);

    if (!testId) {
      return res.status(400).json({
        status: "failed",
        message: "Test ID is required"
      });
    }

    if (!user || !user.user_id) {
      console.error("User not authenticated - user object:", user);
      return res.status(401).json({
        status: "failed",
        message: "User not authenticated"
      });
    }

    const key = `users/${user.user_id}/lab-tests/${testId}.pdf`;
    console.log("Generated S3 key:", key);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: "application/pdf"
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log("Generated upload URL successfully");

    res.status(200).json({
      status: "success",
      uploadUrl,
      key
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to generate upload URL",
      error: error.message
    });
  }
};

// Generate download pre-signed URL
export const getDownloadUrl = async (req, res) => {
  try {
    const { testId } = req.body;
    const user = req.user;

    if (!testId) {
      return res.status(400).json({
        status: "failed",
        message: "Test ID is required"
      });
    }

    if (!user || !user.user_id) {
      return res.status(401).json({
        status: "failed",
        message: "User not authenticated"
      });
    }

    const key = `users/${user.user_id}/lab-tests/${testId}.pdf`;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.status(200).json({
      status: "success",
      downloadUrl
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    res.status(500).json({
      status: "failed",
      message: "Failed to generate download URL",
      error: error.message
    });
  }
};

// Record lab test
export const RecordLabTests = async (req, res) => {
  try {
    const { visit_id, priority, test_code, test_name, pdf_key, findings, recommendations, lab_notes } = req.body;
    const user = req.user;

    console.log("Recording lab test - User:", user?.user_id, "Visit:", visit_id);

    if (!user || !user.user_id) {
      console.error("User not authenticated in RecordLabTests");
      return res.status(401).json({
        status: "failed",
        message: "User not authenticated"
      });
    }

    if (!visit_id || !test_name) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    // Verify that the PDF key belongs to this user
    if (pdf_key && !pdf_key.startsWith(`users/${user.user_id}/`)) {
      console.error("Unauthorized file access attempt:", pdf_key);
      return res.status(403).json({
        status: "failed",
        message: "Unauthorized access to this file"
      });
    }

    const newLabTest = await pool.query(
      `INSERT INTO lab_tests
        (visit_id, priority, test_code, test_name, pdf_key, findings, recommendations, lab_notes, created_by)    
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING lab_test_id, created_at`,
      [
        visit_id,
        priority ?? "normal",
        test_code ?? null,
        test_name,
        pdf_key ?? null,
        findings ?? null,
        recommendations ?? null,
        lab_notes ?? null,
        user.user_id
      ]
    );

    console.log("Lab test recorded successfully:", newLabTest.rows[0]);

    res.status(201).json({
      status: "success",
      message: "Lab test recorded successfully",
      data: {
        lab_test_id: newLabTest.rows[0].lab_test_id,
        createdAt: newLabTest.rows[0].created_at
      }
    });
  } catch (error) {
    console.error("Error recording lab test:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message
    });
  }
};

// Get lab test with download URL
export const getLabTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const user = req.user;

    if (!user || !user.user_id) {
      return res.status(401).json({
        status: "failed",
        message: "User not authenticated"
      });
    }

    const result = await pool.query(
      `SELECT * FROM lab_tests WHERE lab_test_id = $1;`,
      [testId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Lab test not found"
      });
    }

    const labTest = result.rows[0];

    // Generate download URL if PDF exists
    let downloadUrl = null;
    if (labTest.pdf_key) {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: labTest.pdf_key
      });
      downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }

    res.status(200).json({
      status: "success",
      data: {
        ...labTest,
        downloadUrl
      }
    });
  } catch (error) {
    console.error("Error fetching lab test:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message
    });
  }
};