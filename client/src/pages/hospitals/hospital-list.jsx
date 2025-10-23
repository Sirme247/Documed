import React, { useState, useEffect } from "react";
import "./hospitals.css";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Phone, Mail, FileText, ChevronRight } from "lucide-react";

const HospitalList = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    total_pages: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    hospital_type: "",
    city: "",
    state: "",
    country: "",
    accredition_status: "",
    is_active: "true",
    sort_by: "hospital_name",
    sort_order: "ASC"
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch hospitals
  const fetchHospitals = async (page = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", pagination.limit);

      Object.keys(filters).forEach(key => {
        if (filters[key] !== "" && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });

      const { data } = await api.get(`/hospitals/hospitals/list?${params.toString()}`);

      if (data.status === "success") {
        setHospitals(data.data.hospitals);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch hospitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals(1);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchHospitals(1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      hospital_type: "",
      city: "",
      state: "",
      country: "",
      accredition_status: "",
      is_active: "true",
      sort_by: "hospital_name",
      sort_order: "ASC"
    });
    setTimeout(() => fetchHospitals(1), 100);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchHospitals(newPage);
    }
  };

  const viewHospitalDetails = (hospitalId) => {
    navigate(`/hospitals/${hospitalId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="hospital-list-container">
      <div className="page-header">
        <h2>Hospital Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => navigate("/hospitals/register")}
        >
          + Register New Hospital
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name, license number, email, phone, or city..."
            className="search-input"
          />
          <button onClick={applyFilters} className="btn-search">
            Search
          </button>
        </div>

        <div className="filter-controls">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn-filter"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button onClick={resetFilters} className="btn-reset">
            Reset Filters
          </button>
        </div>

        {showFilters && (
          <div className="filters-grid">
            <div className="form-group">
              <label>Hospital Type</label>
              <select name="hospital_type" value={filters.hospital_type} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="General">General</option>
                <option value="Specialized">Specialized</option>
                <option value="Teaching">Teaching</option>
                <option value="Research">Research</option>
                <option value="Clinic">Clinic</option>
                <option value="Rehabilitation">Rehabilitation</option>
              </select>
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Enter city"
              />
            </div>

            <div className="form-group">
              <label>State/Province</label>
              <input
                type="text"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                placeholder="Enter state"
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={filters.country}
                onChange={handleFilterChange}
                placeholder="Enter country"
              />
            </div>

            <div className="form-group">
              <label>Accreditation Status</label>
              <select name="accredition_status" value={filters.accredition_status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="Accredited">Accredited</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Not Accredited">Not Accredited</option>
              </select>
            </div>

            <div className="form-group">
              <label>Active Status</label>
              <select name="is_active" value={filters.is_active} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sort By</label>
              <select name="sort_by" value={filters.sort_by} onChange={handleFilterChange}>
                <option value="hospital_name">Hospital Name</option>
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Updated</option>
                <option value="city">City</option>
                <option value="hospital_type">Type</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sort Order</label>
              <select name="sort_order" value={filters.sort_order} onChange={handleFilterChange}>
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {hospitals.length} of {pagination.total} hospitals 
          (Page {pagination.page} of {pagination.total_pages})
        </p>
      </div>

      {/* Hospitals List */}
      {loading ? (
        <div className="loading-container">
          <p>Loading hospitals...</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="no-results">
          <p>No hospitals found matching your criteria.</p>
        </div>
      ) : (
        <div className="hospitals-list">
          {hospitals.map((hospital) => (
            <div 
              key={hospital.hospital_id} 
              className="hospital-list-item"
              onClick={() => viewHospitalDetails(hospital.hospital_id)}
            >
              {/* Left Side - Hospital Icon & Info */}
              <div className="hospital-main-info">
                <div className="hospital-icon-wrapper">
                  <Building2 size={28} />
                </div>
                <div className="hospital-details">
                  <div className="hospital-name-row">
                    <h3>{hospital.hospital_name}</h3>
                    <div className="hospital-badges">
                      <span className={`status-badge-small ${hospital.is_active ? 'active' : 'inactive'}`}>
                        {hospital.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`accreditation-badge-small ${hospital.accredition_status?.toLowerCase().replace(' ', '-')}`}>
                        {hospital.accredition_status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="hospital-meta-row">
                    <span className="meta-item">
                      <Building2 size={14} />
                      {hospital.hospital_type}
                    </span>
                    <span className="meta-item">
                      <MapPin size={14} />
                      {hospital.city}, {hospital.country}
                    </span>
                    <span className="meta-item">
                      <Phone size={14} />
                      {hospital.contact_number}
                    </span>
                  </div>
                  
                  <div className="hospital-secondary-info">
                    <span className="info-text">
                      <Mail size={13} />
                      {hospital.email}
                    </span>
                    <span className="info-text">
                      <FileText size={13} />
                      License: {hospital.hospital_license_number}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Stats & Actions */}
              <div className="hospital-actions">
                <div className="hospital-stats-compact">
                  <div className="stat-compact">
                    <span className="stat-value-compact">{hospital.branch_count || 0}</span>
                    <span className="stat-label-compact">Branches</span>
                  </div>
                </div>
                
                <div className="action-buttons">
                  {/* <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/hospitals/${hospital.hospital_id}/edit`);
                    }}
                    className="btn-action-edit"
                  >
                    Edit
                  </button> */}
                  <button className="btn-action-view">
                    {/* <ChevronRight size={20} /> */}
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-pagination"
          >
            Previous
          </button>

          <div className="page-numbers">
            {[...Array(Math.min(5, pagination.total_pages))].map((_, index) => {
              let pageNumber;
              if (pagination.total_pages <= 5) {
                pageNumber = index + 1;
              } else if (pagination.page <= 3) {
                pageNumber = index + 1;
              } else if (pagination.page >= pagination.total_pages - 2) {
                pageNumber = pagination.total_pages - 4 + index;
              } else {
                pageNumber = pagination.page - 2 + index;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`btn-page ${pagination.page === pageNumber ? 'active' : ''}`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.total_pages}
            className="btn-pagination"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HospitalList;