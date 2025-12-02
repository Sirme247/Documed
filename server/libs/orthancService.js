import axios from 'axios';

class OrthancService {
 constructor() {
    // Internal URL for API calls (server → orthanc)
    this.baseUrl = process.env.ORTHANC_URL || 'http://localhost:8042';
    
    // Public URL for browser-accessible viewer links
    this.publicUrl = process.env.ORTHANC_PUBLIC_URL || process.env.ORTHANC_URL || 'http://localhost:8042';
    
    this.username = process.env.ORTHANC_USERNAME || 'orthanc';
    this.password = process.env.ORTHANC_PASSWORD || 'password';
    
    // Create auth header
    const authString = `${this.username}:${this.password}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    
    this.client = axios.create({
      baseURL: this.baseUrl, // Still use internal URL for API calls
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }


  // Upload DICOM file(s)
  async uploadDicom(dicomBuffer) {
    try {
      const response = await this.client.post('/instances', dicomBuffer, {
        headers: {
          'Content-Type': 'application/dicom',
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading DICOM:', error.message);
      if (error.response) {
        console.error('Orthanc response:', error.response.status, error.response.data);
      }
      throw new Error(`Failed to upload DICOM: ${error.message}`);
    }
  }

  // Get study information
  async getStudy(studyId) {
    try {
      const response = await this.client.get(`/studies/${studyId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch study: ${error.message}`);
    }
  }

  // Get study with full details
  async getStudyDetails(studyId) {
    try {
      const [study, series, metadata] = await Promise.all([
        this.client.get(`/studies/${studyId}`),
        this.client.get(`/studies/${studyId}/series`),
        this.client.get(`/studies/${studyId}/tags?simplify`)
      ]);
      
      return {
        study: study.data,
        series: series.data,
        metadata: metadata.data
      };
    } catch (error) {
      throw new Error(`Failed to fetch study details: ${error.message}`);
    }
  }

  // Get series information
  async getSeries(seriesId) {
    try {
      const response = await this.client.get(`/series/${seriesId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch series: ${error.message}`);
    }
  }

  // Get instance (image)
  async getInstance(instanceId) {
    try {
      const response = await this.client.get(`/instances/${instanceId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch instance: ${error.message}`);
    }
  }

  // Get DICOM tags for an instance
  async getInstanceTags(instanceId, simplify = true) {
    try {
      const url = simplify 
        ? `/instances/${instanceId}/tags?simplify`
        : `/instances/${instanceId}/tags`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch instance tags: ${error.message}`);
    }
  }

  // Get preview image (PNG)
  async getPreviewImage(instanceId, quality = 90) {
    try {
      const response = await this.client.get(`/instances/${instanceId}/preview`, {
        params: { quality },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch preview image: ${error.message}`);
    }
  }

  // Get thumbnail
  async getThumbnail(instanceId) {
    try {
      const response = await this.client.get(`/instances/${instanceId}/preview`, {
        params: { quality: 50 },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch thumbnail: ${error.message}`);
    }
  }

  // Download DICOM file
  async downloadDicom(instanceId) {
    try {
      const response = await this.client.get(`/instances/${instanceId}/file`, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download DICOM: ${error.message}`);
    }
  }

  // Search for studies by patient ID
  async searchStudiesByPatient(patientId) {
    try {
      const response = await this.client.post('/tools/find', {
        Level: 'Study',
        Query: {
          PatientID: patientId
        },
        Expand: true
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search studies: ${error.message}`);
    }
  }

  // Search with advanced criteria
  async advancedSearch(criteria) {
    try {
      const response = await this.client.post('/tools/find', {
        Level: criteria.level || 'Study',
        Query: criteria.query || {},
        Expand: criteria.expand !== false,
        Limit: criteria.limit || 100
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to perform advanced search: ${error.message}`);
    }
  }

  // Delete study
  async deleteStudy(studyId) {
    try {
      await this.client.delete(`/studies/${studyId}`);
      return { success: true, studyId };
    } catch (error) {
      throw new Error(`Failed to delete study: ${error.message}`);
    }
  }

  // Delete instance
  async deleteInstance(instanceId) {
    try {
      await this.client.delete(`/instances/${instanceId}`);
      return { success: true, instanceId };
    } catch (error) {
      throw new Error(`Failed to delete instance: ${error.message}`);
    }
  }

  // Get system statistics
  async getStatistics() {
    try {
      const response = await this.client.get('/statistics');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }

  // Check Orthanc server health
  async healthCheck() {
    try {
      const response = await this.client.get('/system');
      return { healthy: true, ...response.data };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  // Get DICOM Web viewer URL (for API access, not direct viewing)
  getDicomWebViewerUrl(studyId) {
    return `${this.baseUrl}/dicom-web/studies/${studyId}`;
  }

  // Get Orthanc viewer URL (Stone Viewer) - PRIMARY VIEWER
  async getOrthancViewerUrl(studyId) {
    try {
      // Get the study details to extract StudyInstanceUID
      const study = await this.getStudy(studyId);
      
      const studyInstanceUID = study.MainDicomTags?.StudyInstanceUID;
      
      if (studyInstanceUID) {
        // Use publicUrl instead of baseUrl
        return `${this.publicUrl}/stone-webviewer/index.html?study=${studyInstanceUID}`;
      }
      
      return `${this.publicUrl}/stone-webviewer/index.html?study=${studyId}`;
    } catch (error) {
      console.error('Error getting StudyInstanceUID:', error.message);
      return `${this.publicUrl}/stone-webviewer/index.html?study=${studyId}`;
    }
  }


  // Get Osimis Web Viewer URL (alternative advanced viewer)
 async getOsimisViewerUrl(studyId) {
    try {
      const study = await this.getStudy(studyId);
      const studyInstanceUID = study.MainDicomTags?.StudyInstanceUID;
      
      if (studyInstanceUID) {
        return `${this.publicUrl}/osimis-viewer/app/index.html?study=${studyInstanceUID}`;
      }
      
      return `${this.publicUrl}/osimis-viewer/app/index.html?study=${studyId}`;
    } catch (error) {
      console.error('Error getting StudyInstanceUID:', error.message);
      return `${this.publicUrl}/osimis-viewer/app/index.html?study=${studyId}`;
    }
  }


    // Get direct Orthanc Explorer URL (basic viewer)
  getOrthancExplorerUrl(studyId) {
    // Use publicUrl instead of baseUrl
    return `${this.publicUrl}/app/explorer.html#study?uuid=${studyId}`;
  }

 // Get OHIF Viewer URL (if installed)
  getOHIFViewerUrl(studyId) {
    return `${this.publicUrl}/ohif/viewer?StudyInstanceUIDs=${studyId}`;
  }
  // Get DICOM Web viewer URL
  getDicomWebViewerUrl(studyId) {
    return `${this.publicUrl}/dicom-web/studies/${studyId}`;
  }

  // Check which viewers are available
  
  async checkAvailableViewers() {
    const viewers = {
      stoneViewer: false,
      osimisViewer: false,
      orthancExplorer: true,
      ohifViewer: false,
      dicomWeb: false
    };

    try {
      // Use publicUrl for checking viewers (browser-accessible)
      const stoneResponse = await axios.get(`${this.publicUrl}/stone-webviewer/index.html`, {
        timeout: 2000,
        validateStatus: (status) => status < 500,
        auth: {
          username: this.username,
          password: this.password
        }
      });
      viewers.stoneViewer = stoneResponse.status === 200;
      console.log('Stone Web Viewer check:', stoneResponse.status);
    } catch (error) {
      console.log('Stone Web Viewer not available:', error.message);
      viewers.stoneViewer = false;
    }

    try {
      const osimisResponse = await axios.get(`${this.publicUrl}/osimis-viewer/app/index.html`, {
        timeout: 2000,
        validateStatus: (status) => status < 500,
        auth: {
          username: this.username,
          password: this.password
        }
      });
      viewers.osimisViewer = osimisResponse.status === 200;
      console.log('Osimis Web Viewer check:', osimisResponse.status);
    } catch (error) {
      console.log('Osimis Web Viewer not available:', error.message);
      viewers.osimisViewer = false;
    }

    try {
      const ohifResponse = await axios.get(`${this.publicUrl}/ohif/`, {
        timeout: 2000,
        validateStatus: (status) => status < 500,
        auth: {
          username: this.username,
          password: this.password
        }
      });
      viewers.ohifViewer = ohifResponse.status === 200;
      console.log('OHIF Viewer check:', ohifResponse.status);
    } catch (error) {
      console.log('OHIF Viewer not available:', error.message);
      viewers.ohifViewer = false;
    }

    try {
      const dicomWebResponse = await this.client.get('/dicom-web/studies', {
        timeout: 2000,
        validateStatus: (status) => status < 500
      });
      viewers.dicomWeb = dicomWebResponse.status === 200 || dicomWebResponse.status === 404;
    } catch (error) {
      viewers.dicomWeb = false;
    }

    return viewers;
  }

  // Get best available viewer URL
  async getBestViewerUrl(studyId) {
    try {
      console.log('Getting viewer URL for study:', studyId); // DEBUG
      
      const availableViewers = await this.checkAvailableViewers();
      
      console.log('Available viewers:', availableViewers); // DEBUG
      
      // Priority: Stone Viewer > Osimis Viewer > OHIF > Orthanc Explorer (basic)
      if (availableViewers.stoneViewer) {
        const url = this.getOrthancViewerUrl(studyId);
        console.log('Using Stone Viewer:', url); // DEBUG
        return url;
      } else if (availableViewers.osimisViewer) {
        const url = this.getOsimisViewerUrl(studyId);
        console.log('Using Osimis Viewer:', url); // DEBUG
        return url;
      } else if (availableViewers.ohifViewer) {
        const url = this.getOHIFViewerUrl(studyId);
        console.log('Using OHIF Viewer:', url); // DEBUG
        return url;
      } else {
        // Fallback to basic Orthanc Explorer (always available)
        const url = this.getOrthancExplorerUrl(studyId);
        console.log('Using Orthanc Explorer:', url); // DEBUG
        return url;
      }
    } catch (error) {
      console.error('Error checking viewers:', error.message);
      // Return Orthanc Explorer as default fallback (always available)
      return this.getOrthancExplorerUrl(studyId);
    }
  }

  // Get all available viewer URLs
  async getAllViewerUrls(studyId) {
    try {
      const availableViewers = await this.checkAvailableViewers();
      
      const viewers = [];
      
      if (availableViewers.stoneViewer) {
        viewers.push({
          name: 'Stone Web Viewer',
          type: 'stone',
          url: this.getOrthancViewerUrl(studyId),
          primary: true,
          description: 'Advanced medical imaging viewer with MPR and 3D capabilities'
        });
      }

      if (availableViewers.osimisViewer) {
        viewers.push({
          name: 'Osimis Web Viewer',
          type: 'osimis',
          url: this.getOsimisViewerUrl(studyId),
          primary: !availableViewers.stoneViewer,
          description: 'Advanced web-based DICOM viewer'
        });
      }
      
      if (availableViewers.ohifViewer) {
        viewers.push({
          name: 'OHIF Viewer',
          type: 'ohif',
          url: this.getOHIFViewerUrl(studyId),
          primary: !availableViewers.stoneViewer && !availableViewers.osimisViewer,
          description: 'Open-source imaging platform for viewing medical images'
        });
      }
      
      // Always include Orthanc Explorer as it's always available
      viewers.push({
        name: 'Orthanc Explorer',
        type: 'explorer',
        url: this.getOrthancExplorerUrl(studyId),
        primary: !availableViewers.stoneViewer && !availableViewers.osimisViewer && !availableViewers.ohifViewer,
        description: 'Basic DICOM viewer and explorer'
      });

      return viewers;
    } catch (error) {
      console.error('Error getting all viewer URLs:', error.message);
      // Return Orthanc Explorer as default fallback
      return [{
        name: 'Orthanc Explorer',
        type: 'explorer',
        url: this.getOrthancExplorerUrl(studyId),
        primary: true,
        description: 'Basic DICOM viewer and explorer'
      }];
    }
  }
  // Add this method to your OrthancService class

// Get series with all instances metadata efficiently
async getSeriesWithInstances(seriesId) {
  try {
    const [seriesInfo, instances] = await Promise.all([
      this.client.get(`/series/${seriesId}`),
      this.client.get(`/series/${seriesId}/instances`)
    ]);
    
    return {
      series: seriesInfo.data,
      instances: instances.data
    };
  } catch (error) {
    throw new Error(`Failed to fetch series with instances: ${error.message}`);
  }
}

// Get bulk metadata for multiple instances
async getBulkInstanceTags(instanceIds) {
  try {
    const promises = instanceIds.map(id => 
      this.client.get(`/instances/${id}/tags?simplify`)
    );
    const results = await Promise.all(promises);
    return results.map(r => r.data);
  } catch (error) {
    throw new Error(`Failed to fetch bulk instance tags: ${error.message}`);
  }
}
// In orthancService.js, add this method:

// Delete multiple instances in bulk
async deleteInstances(instanceIds) {
  try {
    const deletePromises = instanceIds.map(id => 
      this.client.delete(`/instances/${id}`).catch(err => ({
        error: true,
        instanceId: id,
        message: err.message
      }))
    );
    
    const results = await Promise.all(deletePromises);
    const errors = results.filter(r => r.error);
    
    return {
      success: errors.length === 0,
      deleted: instanceIds.length - errors.length,
      total: instanceIds.length,
      errors
    };
  } catch (error) {
    throw new Error(`Failed to delete instances: ${error.message}`);
  }
}

  // Extract key metadata from DICOM tags
  extractKeyMetadata(tags) {
    return {
      patientName: tags.PatientName || 'Unknown',
      patientId: tags.PatientID || 'Unknown',
      patientBirthDate: tags.PatientBirthDate || null,
      patientSex: tags.PatientSex || null,
      studyDate: tags.StudyDate || null,
      studyTime: tags.StudyTime || null,
      studyDescription: tags.StudyDescription || null,
      seriesDescription: tags.SeriesDescription || null,
      modality: tags.Modality || 'Unknown',
      bodyPartExamined: tags.BodyPartExamined || null,
      manufacturer: tags.Manufacturer || null,
      institutionName: tags.InstitutionName || null,
      studyInstanceUID: tags.StudyInstanceUID || null,
      seriesInstanceUID: tags.SeriesInstanceUID || null,
      sopInstanceUID: tags.SOPInstanceUID || null
    };
  }
}

export default new OrthancService();