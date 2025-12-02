import React, { useState, useEffect } from "react";
import "./patients.css";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/index.js";

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const user = useStore((state) => state.user);
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
    hospital_id: "",
    gender: "",
    blood_type: "",
    min_age: "",
    max_age: "",
    marital_status: "",
    is_active: "true",
    is_deceased: "",
    has_allergies: "",
    has_chronic_conditions: "",
    insurance_provider: "",
    sort_by: "created_at",
    sort_order: "DESC"
  });

  const [showFilters, setShowFilters] = useState(false);

   const isAdmin = user?.role_id === 1;

  // Fetch patients
  const fetchPatients = async (page = 1) => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", pagination.limit);

      // Add filters only if they have values
      Object.keys(filters).forEach(key => {
        if (filters[key] !== "" && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });

      const { data } = await api.get(`/patients/get-patients?${params.toString()}`);

      if (data.status === "success") {
        setPatients(data.data.patients);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(1);
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchPatients(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      hospital_id: "",
      gender: "",
      blood_type: "",
      min_age: "",
      max_age: "",
      marital_status: "",
      is_active: "true",
      is_deceased: "",
      has_allergies: "",
      has_chronic_conditions: "",
      insurance_provider: "",
      sort_by: "created_at",
      sort_order: "DESC"
    });
    setTimeout(() => fetchPatients(1), 100);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchPatients(newPage);
    }
  };

  // View patient details
  const viewPatientDetails = (patientId) => {
    navigate(`/patients/${patientId}`);
  };

  // Calculate age
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="patient-list-container">
      <div className="page-header">
        <h2>Patient List</h2>

        {!isAdmin && (
    <button 
            className="btn-primary" 
            onClick={() => navigate("/patients/register")}
          >
            + Register New Patient
          </button>
        )}
       
      </div>

      {/* Search and Filter Section */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name, email, phone number or national ID"
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
              <label>Gender</label>
              <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Blood Type</label>
              <select name="blood_type" value={filters.blood_type} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label>Marital Status</label>
              <select name="marital_status" value={filters.marital_status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Min Age</label>
              <input
                type="number"
                name="min_age"
                value={filters.min_age}
                onChange={handleFilterChange}
                placeholder="e.g., 18"
              />
            </div>

            <div className="form-group">
              <label>Max Age</label>
              <input
                type="number"
                name="max_age"
                value={filters.max_age}
                onChange={handleFilterChange}
                placeholder="e.g., 65"
              />
            </div>

            <div className="form-group">
              <label>Insurance Provider</label>
              <input
                type="text"
                name="insurance_provider"
                value={filters.insurance_provider}
                onChange={handleFilterChange}
                placeholder="Search insurance..."
              />
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
              <label>Deceased Status</label>
              <select name="is_deceased" value={filters.is_deceased} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="false">Living</option>
                <option value="true">Deceased</option>
              </select>
            </div>

            <div className="form-group">
              <label>Has Allergies</label>
              <select name="has_allergies" value={filters.has_allergies} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Has Chronic Conditions</label>
              <select name="has_chronic_conditions" value={filters.has_chronic_conditions} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sort By</label>
              <select name="sort_by" value={filters.sort_by} onChange={handleFilterChange}>
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Updated</option>
                <option value="first_name">First Name</option>
                <option value="last_name">Last Name</option>
                <option value="date_of_birth">Date of Birth</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sort Order</label>
              <select name="sort_order" value={filters.sort_order} onChange={handleFilterChange}>
                <option value="DESC">Descending</option>
                <option value="ASC">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {patients.length} of {pagination.total} patients 
          (Page {pagination.page} of {pagination.total_pages})
        </p>
      </div>

      {/* Patients Table */}
      {loading ? (
        <div className="loading-container">
          <p>Loading patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="no-results">
          <p>No patients found matching your criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="patients-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Blood Type</th>
                <th>Contact</th>
                <th>Medical Flags</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={patient.patient_id}>
                  <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td>
                    <div className="patient-name">
                      <strong>
                        {patient.first_name} {patient.middle_name || ""} {patient.last_name}
                      </strong>
                    </div>
                  </td>
                  <td>{patient.age || calculateAge(patient.date_of_birth)}</td>
                  <td>{patient.gender || "N/A"}</td>
                  <td>{patient.blood_type || "N/A"}</td>
                  <td>
                    <div className="contact-info">
                      <div>{patient.primary_number}</div>
                      <div className="email">{patient.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="medical-flags">
                      {patient.allergy_count > 0 && (
                        <span className="badge badge-warning" title="Has allergies">
                          🚨 {patient.allergy_count} Allergy
                        </span>
                      )}
                      {patient.chronic_condition_count > 0 && (
                        <span className="badge badge-info" title="Has chronic conditions">
                          💊 {patient.chronic_condition_count} Condition
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${patient.is_deceased ? 'deceased' : patient.is_active ? 'active' : 'inactive'}`}>
                      {patient.is_deceased ? "Deceased" : patient.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => viewPatientDetails(patient.patient_id)}
                      className="btn-view"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default PatientList;