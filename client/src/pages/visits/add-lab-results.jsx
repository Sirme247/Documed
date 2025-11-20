import React, { useState, useEffect } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const LabTestSchema = z.object({
  visit_id: z.string().min(1, "Visit ID is required"),
  test_name: z.string().min(1, "Test name is required"),
  priority: z.string().optional(),
  test_code: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  lab_notes: z.string().optional(),
});

const RecordLabTest = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { visit_id, patient_id } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(LabTestSchema),
    mode: "onBlur",
    defaultValues: {
      priority: "normal",
      visit_id: visit_id?.toString() || ""
    }
  });

  useEffect(() => {
    if (visit_id) {
      setValue("visit_id", visit_id.toString());
    }
  }, [visit_id, setValue]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      console.log("File selected:", file.name, "Size:", file.size);
    } else if (file) {
      toast.error("Please select a PDF file");
      e.target.value = "";
    }
  };

  const uploadPdfToS3 = async (file, testId) => {
    try {
      setUploading(true);
      console.log("Starting PDF upload for test ID:", testId);

      // Get pre-signed upload URL from backend
      const { data: urlData } = await api.post("/lab-tests/upload-url", {
        testId
      });

      console.log("Received upload URL, uploading to S3...");

      // Upload file directly to S3
      const uploadResponse = await fetch(urlData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf"
        },
        body: file
      });

      console.log("S3 upload response status:", uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("S3 upload failed:", errorText);
        throw new Error(`Failed to upload PDF to S3: ${uploadResponse.status}`);
      }

      console.log("PDF uploaded successfully, key:", urlData.key);
      return urlData.key;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        // Don't throw - let the form submission handle it
      } else {
        toast.error(error.response?.data?.message || "Failed to upload PDF");
      }
      
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log("Form submitted with data:", data);

      let pdfKey = null;

      // Upload PDF if provided
      if (selectedFile) {
        try {
          const testId = `test-${Date.now()}`;
          console.log("Uploading PDF...");
          pdfKey = await uploadPdfToS3(selectedFile, testId);
          console.log("PDF uploaded with key:", pdfKey);
        } catch (uploadError) {
          console.error("PDF upload failed:", uploadError);
          
          // If it's an auth error, stop here
          if (uploadError.response?.status === 401) {
            setLoading(false);
            return;
          }
          
          // For other errors, ask user if they want to continue without PDF
          const continueWithout = window.confirm(
            "PDF upload failed. Do you want to continue recording the lab test without the PDF?"
          );
          
          if (!continueWithout) {
            setLoading(false);
            return;
          }
        }
      }

      // Prepare data for backend
      const formattedData = {
        visit_id: parseInt(data.visit_id),
        test_name: data.test_name,
        priority: data.priority || "normal",
        test_code: data.test_code || null,
        pdf_key: pdfKey,
        findings: data.findings || null,
        recommendations: data.recommendations || null,
        lab_notes: data.lab_notes || null
      };

      console.log("Sending data to backend:", formattedData);

      // Record lab test in database
      const { data: res } = await api.post("/lab-tests/record", formattedData);

      console.log("Lab test recorded successfully:", res);
      toast.success(res.message || "Lab test recorded successfully!");
      
      if (visit_id) {
        navigate(`/visits/${visit_id}`);
      } else {
        reset();
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Error recording lab test:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(error?.response?.data?.message || error.message || "Failed to record lab test");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-record-form">
      <h2>Record Lab Test</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-section">
          <h3>Visit Information</h3>
          
          <div className="form-group">
            <label>Visit ID *</label>
            <input
              type="number"
              {...register("visit_id")}
              readOnly={!!visit_id}
              disabled={!!visit_id}
              style={visit_id ? { background: '#f3f4f6', cursor: 'not-allowed', opacity: 0.7 } : {}}
            />
            {errors.visit_id && (
              <div className="error-message">{errors.visit_id.message}</div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Test Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Test Name *</label>
              <input {...register("test_name")} placeholder="e.g., Complete Blood Count" />
              {errors.test_name && (
                <div className="error-message">{errors.test_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Test Code</label>
              <input {...register("test_code")} placeholder="e.g., CBC-001" />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select {...register("priority")}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
                <option value="routine">Routine</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Lab Test PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              Upload the lab report PDF (optional)
            </small>
            {selectedFile && (
              <p style={{ color: '#059669', fontSize: '12px', marginTop: '4px' }}>
                ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Findings</label>
            <textarea {...register("findings")} rows="4" placeholder="Lab test findings and results" />
          </div>

          <div className="form-group">
            <label>Recommendations</label>
            <textarea {...register("recommendations")} rows="3" placeholder="Follow-up recommendations based on results" />
          </div>

          <div className="form-group">
            <label>Lab Notes</label>
            <textarea {...register("lab_notes")} rows="2" placeholder="Additional notes" />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading || uploading}>
          {uploading ? "Uploading PDF..." : loading ? "Recording..." : "Record Lab Test"}
        </button>
      </form>
    </div>
  );
};

export default RecordLabTest;