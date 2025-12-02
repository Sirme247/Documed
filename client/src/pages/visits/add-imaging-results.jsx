import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import axios from 'axios';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const progressIntervalRef = useRef(null); // Track progress interval
  const location = useLocation();
  const navigate = useNavigate();

  const visit_id_from_state = location.state?.visit_id;

  useEffect(() => {
    if (visit_id_from_state) {
      setVisitId(visit_id_from_state.toString());
    }
  }, [visit_id_from_state]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (loading) {
        e.preventDefault();
        e.returnValue = 'Upload in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const processFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
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

    setFiles(validFiles);

    const newPreviews = validFiles.map((file, index) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      path: file.webkitRelativePath || file.name,
      index: index
    }));
    
    setPreviewUrls(newPreviews);

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
    if (fileInputRef.current && !loading) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setIsDragging(true);
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
    if (loading) return;
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(previewUrls.filter((_, index) => index !== indexToRemove));
  };

  const clearAllFiles = () => {
    if (loading) return;
    setFiles([]);
    setPreviewUrls([]);
    setStudyInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelUpload = () => {
    console.log('🛑 Cancelling upload...');
    
    // 1. Clear the progress interval FIRST
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
      console.log('✅ Progress interval cleared');
    }
    
    // 2. Abort the axios request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
        console.log('✅ Abort signal sent');
      } catch (err) {
        console.error('Error aborting:', err);
      }
    }
    
    // 3. Reset ALL UI state immediately
    setLoading(false);
    setUploadProgress(0);
    setUploadStatus('');
    setShowCancelConfirm(false);
    
    // 4. Clear abort controller reference
    abortControllerRef.current = null;
    
    // 5. Show feedback to user
    toast.error('Upload cancelled - no changes were saved', {
      duration: 3000,
      icon: '🛑'
    });
    
    console.log('✅ Upload cancelled and UI reset - navigation enabled');
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

    files.forEach(file => {
      formData.append('dicomFiles', file);
    });

    try {
      setLoading(true);
      setUploadProgress(10);
      setUploadStatus('Preparing files for upload...');

      // Create NEW abort controller for this upload
      abortControllerRef.current = new AbortController();

      // Store interval ref so we can clear it on cancel
      progressIntervalRef.current = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 1000);

      setUploadStatus(`Uploading ${files.length} DICOM files...`);

      const response = await api.post('/medical-imaging/upload-study', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        signal: abortControllerRef.current.signal,
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(percentCompleted, 90));
          }
        }
      });

      // Clear interval on success
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setUploadProgress(95);
      setUploadStatus('Processing study metadata...');

      const data = response.data;

      if (data.status === "success") {
        setUploadProgress(100);
        setUploadStatus('Upload complete!');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setLoading(false);
        
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
        }, 1000);
      } else {
        setLoading(false);
        toast.error(data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      // Clear interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Check for cancellation FIRST
      if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
        console.log('✅ Upload was cancelled by user');
        return;
      }
      
      // Reset UI for other errors
      setLoading(false);
      setUploadProgress(0);
      setUploadStatus('');
      
      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Upload timeout - please try again with a smaller batch');
        return;
      }
      
      // Handle other errors
      const errorMessage = error?.response?.data?.message || error.message || 'Server error during upload';
      toast.error(errorMessage);
      
    } finally {
      // Clean up interval and abort controller
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      if (!abortControllerRef.current?.signal.aborted) {
        setUploadProgress(0);
        setUploadStatus('');
      }
      abortControllerRef.current = null;
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          {/* Cancel Confirmation Dialog */}
          {showCancelConfirm && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>
                  ⚠️
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#111827',
                  textAlign: 'center'
                }}>
                  Cancel Upload?
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '24px',
                  textAlign: 'center',
                  lineHeight: '1.5'
                }}>
                  Are you sure you want to cancel this upload? All progress will be lost and you'll need to start over.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Continue Upload
                  </button>
                  <button
                    onClick={confirmCancelUpload}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              border: '6px solid #e5e7eb',
              borderTop: '6px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
            `}</style>

            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#111827'
            }}>
              Uploading Study...
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              {uploadStatus}
            </p>

            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>

            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '20px'
            }}>
              {uploadProgress}%
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              <div style={{ marginBottom: '8px' }}>
                📁 <strong>{files.length}</strong> files
              </div>
              <div>
                💾 <strong>{studyInfo?.totalSize} MB</strong> total
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400e',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              ⚠️ Please do not close this window or navigate away
            </div>

            <button
              onClick={handleCancelUpload}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fecaca';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }}
            >
              Cancel Upload
            </button>
          </div>
        </div>
      )}

      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: loading ? 0.5 : 1,
        pointerEvents: loading ? 'none' : 'auto'
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
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.5 : 1
          }}
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px',
        opacity: loading ? 0.5 : 1,
        pointerEvents: loading ? 'none' : 'auto'
      }}>
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
              disabled={!!visit_id_from_state || loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: visit_id_from_state ? '#f3f4f6' : 'white',
                cursor: visit_id_from_state || loading ? 'not-allowed' : 'text',
                opacity: visit_id_from_state ? 0.7 : 1
              }}
            />
          </div>
        </div>

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
            {files.length > 0 && !loading && (
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
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        flexShrink: 0,
                        opacity: loading ? 0.5 : 1
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

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Body Part (Optional)
          </label>
          <select
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
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

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Findings
          </label>
          <textarea
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            disabled={loading}
            rows="5"
            placeholder="Enter radiologist's findings and interpretation for this study..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              cursor: loading ? 'not-allowed' : 'text',
              opacity: loading ? 0.5 : 1
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Recommendations
          </label>
          <textarea
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            disabled={loading}
            rows="3"
            placeholder="Enter follow-up recommendations..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              cursor: loading ? 'not-allowed' : 'text',
              opacity: loading ? 0.5 : 1
            }}
          />
        </div>

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