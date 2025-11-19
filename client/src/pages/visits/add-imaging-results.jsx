import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import api from "../../libs/apiCall.js";

const RecordImagingStudy = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [visitId, setVisitId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [studyInfo, setStudyInfo] = useState(null);
  
  const fileInputRef = useRef(null);
  
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
      return ext === 'dcm' || ext === 'dicom' || !file.name.includes('.');
    });

    if (validFiles.length !== fileArray.length) {
      toast.error('Some files were skipped (only DICOM files allowed)');
    }

    if (validFiles.length === 0) {
      toast.error('No valid DICOM files found in the selected folder');
      return;
    }

    // Replace existing files (since we're selecting a folder)
    setFiles(validFiles);

    // Create preview placeholders
    const newPreviews = validFiles.map((file, index) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      path: file.webkitRelativePath || file.name,
      index: index
    }));
    
    setPreviewUrls(newPreviews);

    // Analyze study info
    const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
    
    setStudyInfo({
      fileCount: validFiles.length,
      totalSize: (totalSize / (1024 * 1024)).toFixed(2),
      estimatedSeries: Math.ceil(validFiles.length / 10)
    });

    toast.success(`Loaded ${validFiles.length} DICOM file${validFiles.length > 1 ? 's' : ''} from folder`);
  };

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const handleFolderClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
    
    const items = e.dataTransfer.items;
    if (items) {
      const files = [];
      
      // Convert items to files array
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      
      if (files.length > 0) {
        processFiles(files);
      }
    } else if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(previewUrls.filter((_, index) => index !== indexToRemove));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setPreviewUrls([]);
    setStudyInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!visitId) {
      toast.error('Visit ID is required');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select a folder containing DICOM files');
      return;
    }

    const formData = new FormData();
    formData.append('visit_id', visitId);
    formData.append('findings', findings);
    formData.append('recommendations', recommendations);
    if (bodyPart) {
      formData.append('body_part_override', bodyPart);
    }

    // Append all files - multer.any() will accept them
    files.forEach(file => {
      formData.append('dicomFiles', file);
    });

    try {
      setLoading(true);
      
      const response = await api.post('/medical-imaging/upload-study', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;

      if (data.status === "success") {
        toast.success(data.message || 'DICOM study uploaded successfully!');
        
        if (data.data?.viewer_url) {
          const openViewer = window.confirm(
            `Study uploaded successfully!\n\n` +
            `Studies: ${data.data.studies?.length || 0}\n` +
            `Total files: ${data.data.total_files}\n` +
            `Size: ${data.data.total_size_mb} MB\n\n` +
            `Would you like to view the study now?`
          );
          
          if (openViewer) {
            window.open(data.data.viewer_url, '_blank');
          }
        }

        setTimeout(() => {
          if (visit_id_from_state) {
            navigate(`/visits/${visit_id_from_state}`);
          } else {
            clearAllFiles();
            setFindings('');
            setRecommendations('');
            setBodyPart('');
            setVisitId('');
          }
        }, 2000);
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
            Upload Medical Imaging Study
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Select a folder containing all DICOM files for a study
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

        {/* DICOM Study Upload Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                DICOM Study Folder
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                All files in the folder will be grouped as one study
              </p>
            </div>
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

          {/* Hidden file input with directory attribute */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            style={{ display: 'none' }}
            webkitdirectory=""
            directory=""
            multiple
          />

          <div 
            style={{
              border: isDragging ? '2px solid #3b82f6' : '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: isDragging ? '#eff6ff' : '#f9fafb',
              marginBottom: '16px',
              transition: 'all 0.2s',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFolderClick}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {isDragging ? '📥' : '📁'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              {isDragging ? 'Drop folder here' : 'Click to select study folder or drag and drop'}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Select a folder containing all DICOM files from the same study
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              💡 Tip: All files in the folder and subfolders will be included
            </div>
          </div>

          {/* Study Summary */}
          {files.length > 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                    📊 Study Summary
                  </div>
                  <div style={{ fontSize: '13px', color: '#0c4a6e' }}>
                    Total Files: {files.length} | Total Size: {(files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File List */}
          {previewUrls.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                Files in Study ({files.length})
              </h4>
              <div style={{ 
                display: 'grid', 
                gap: '8px', 
                maxHeight: '400px', 
                overflowY: 'auto',
                padding: '4px'
              }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ fontSize: '20px' }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {preview.path || preview.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {preview.size}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        flexShrink: 0
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
            Will be extracted from DICOM metadata if not specified
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
            placeholder="Enter radiologist's findings and interpretation for this study..."
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
                About Folder Upload
              </div>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px', color: '#1e40af' }}>
                <li>Select a folder containing DICOM files for a complete study</li>
                <li>All files in the folder and subfolders will be included</li>
                <li>Multiple series within a study are automatically organized</li>
                <li>DICOM metadata is extracted from each file</li>
                <li>Studies are stored securely in Orthanc PACS server</li>
                <li>View complete studies in the integrated DICOM viewer</li>
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
          {loading 
            ? '⏳ Uploading Study...' 
            : `📤 Upload Study (${files.length} file${files.length !== 1 ? 's' : ''})`
          }
        </button>
      </form>
    </div>
  );
};

export default RecordImagingStudy;