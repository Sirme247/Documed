import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import api from "../../libs/apiCall.js";

const RecordImagingResult = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [visitId, setVisitId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  const visit_id_from_state = location.state?.visit_id;

  useEffect(() => {
    if (visit_id_from_state) {
      setVisitId(visit_id_from_state.toString());
    }
  }, [visit_id_from_state]);

  const processFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Allow DICOM files with or without extensions
    const validFiles = fileArray.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      // Allow .dcm, .dicom extensions, or files without extensions
      return ext === 'dcm' || ext === 'dicom' || !file.name.includes('.');
    });

    if (validFiles.length !== fileArray.length) {
      toast.error('Only DICOM files (.dcm, .dicom, or no extension) are allowed');
    }

    if (validFiles.length === 0) {
      return;
    }

    // Append new files to existing ones (for multiple selections)
    setFiles(prevFiles => [...prevFiles, ...validFiles]);

    // Create preview placeholders
    const newPreviews = validFiles.map((file, index) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      index: files.length + index
    }));
    
    setPreviewUrls(prevPreviews => [...prevPreviews, ...newPreviews]);

    toast.success(`Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}`);
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (loading) return;
    
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(previewUrls.filter((_, index) => index !== indexToRemove));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setPreviewUrls([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!visitId) {
      toast.error('Visit ID is required');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select at least one DICOM file');
      return;
    }

    const formData = new FormData();
    formData.append('visit_id', visitId);
    formData.append('findings', findings);
    formData.append('recommendations', recommendations);
    if (bodyPart) {
      formData.append('body_part_override', bodyPart);
    }

    files.forEach(file => {
      formData.append('dicomFiles', file);
    });

    try {
      setLoading(true);
      
      // Using the centralized api instance (automatically includes auth token)
      const response = await api.post('/medical-imaging/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;

      if (data.status === "success") {
        toast.success(data.message || 'DICOM images uploaded successfully!');
        
        if (data.data?.viewer_url) {
          const openViewer = window.confirm('Would you like to view the images now?');
          if (openViewer) {
            window.open(data.data.viewer_url, '_blank');
          }
        }

        if (visit_id_from_state) {
          navigate(`/visits/${visit_id_from_state}`);
        } else {
          setFiles([]);
          setPreviewUrls([]);
          setFindings('');
          setRecommendations('');
          setBodyPart('');
          setVisitId('');
        }
      } else {
        toast.error(data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.message || 'Server error during upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600' }}>
            Upload Medical Images
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Upload DICOM images (CT, MRI, X-Ray, etc.) - Single or Multiple
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        {/* Visit ID Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Visit Information
          </h3>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Visit ID *
            </label>
            <input
              type="number"
              value={visitId}
              onChange={(e) => setVisitId(e.target.value)}
              required
              readOnly={!!visit_id_from_state}
              disabled={!!visit_id_from_state}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: visit_id_from_state ? '#f3f4f6' : 'white',
                cursor: visit_id_from_state ? 'not-allowed' : 'text',
                opacity: visit_id_from_state ? 0.7 : 1
              }}
            />
          </div>
        </div>

        {/* DICOM Upload Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              DICOM Files
            </h3>
            {files.length > 0 && (
              <button
                type="button"
                onClick={clearAllFiles}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div 
            style={{
              border: isDragging ? '2px solid #3b82f6' : '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: isDragging ? '#eff6ff' : '#f9fafb',
              marginBottom: '16px',
              transition: 'all 0.2s'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=""
              onChange={handleFileChange}
              disabled={loading}
              id="dicom-upload"
              style={{ display: 'none' }}
            />
            <label
              htmlFor="dicom-upload"
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-block'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {isDragging ? '📥' : '📁'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                {isDragging ? 'Drop files here' : 'Click to select files or drag and drop'}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Upload single or multiple DICOM files
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Supported: .dcm, .dicom, or files without extensions (up to 50 files)
              </div>
            </label>
          </div>

          {/* File Previews */}
          {previewUrls.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                Selected Files ({files.length})
              </h4>
              <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {previewUrls.map((preview, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '24px' }}>🏥</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>
                          {preview.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {preview.size}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body Part */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Body Part (Optional)
          </label>
          <select
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">Select body part</option>
            <option value="Head">Head</option>
            <option value="Chest">Chest</option>
            <option value="Abdomen">Abdomen</option>
            <option value="Pelvis">Pelvis</option>
            <option value="Spine">Spine</option>
            <option value="Upper Extremity">Upper Extremity</option>
            <option value="Lower Extremity">Lower Extremity</option>
            <option value="Heart">Heart</option>
            <option value="Other">Other</option>
          </select>
          <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            Will be extracted from DICOM if not specified
          </small>
        </div>

        {/* Findings */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Findings
          </label>
          <textarea
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            rows="5"
            placeholder="Enter radiologist's findings and interpretation..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Recommendations */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Recommendations
          </label>
          <textarea
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            rows="3"
            placeholder="Enter follow-up recommendations..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Info Box */}
        <div style={{
          padding: '16px',
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>ℹ️</div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#1e40af' }}>
                About DICOM Upload
              </div>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px', color: '#1e40af' }}>
                <li>Upload one or multiple DICOM files at once</li>
                <li>You can add more files before submitting</li>
                <li>DICOM metadata will be automatically extracted</li>
                <li>Images will be stored securely in Orthanc server</li>
                <li>You can view images in the integrated DICOM viewer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || files.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading || files.length === 0 ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || files.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? '⏳ Uploading DICOM Files...' : `📤 Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  );
};

export default RecordImagingResult;