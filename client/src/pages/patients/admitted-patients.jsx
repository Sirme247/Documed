import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./patients.css";
import api from "../../libs/apiCall.js";
import useStore from "../../store/index.js";
import { toast } from "react-hot-toast";
import { Search, Users, Clock, User, Phone, Mail, Activity, ChevronDown, ChevronUp, Download, RefreshCw, LogOut } from "lucide-react";

const FrequentPatients = () => {
  const navigate = useNavigate();
  const { user } = useStore((state) => state);
  const [patients, setPatients] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [dischargingVisit, setDischargingVisit] = useState(null);

  // Check if user can discharge (role_id <= 5)
  const canDischarge = user?.role_id && user.role_id === 5;

  const fetchAdmittedPatients = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        priority: priorityFilter,
        search: searchTerm,
        sortBy: sortBy,
      });

      const { data } = await api.get(`/patients/admitted-patients?${params}`);

      if (data.status === "success") {
        setPatients(data.data || []);
        setStatistics(data.statistics || null);
      }
    } catch (error) {
      console.error("Error fetching admitted patients:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch admitted patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmittedPatients();
  }, [priorityFilter, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmittedPatients();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const toggleRow = (visitId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDischargePatient = async (visitId, patientName) => {
    if (!canDischarge) {
      toast.error("You don't have permission to discharge patients");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to discharge ${patientName}? This action will mark their visit as completed.`
    );
    console.log("Discharging visit:", visitId);

    if (!confirmed) return;

    try {
      setDischargingVisit(visitId);
      const { data } = await api.put(`/patients/discharge-patient/${visitId}`);

      if (data.status === "success") {
        toast.success(`${patientName} has been successfully discharged`);
        // Refresh the list
        fetchAdmittedPatients();
      }
    } catch (error) {
      console.error("Error discharging patient:", error);
      toast.error(error?.response?.data?.message || "Failed to discharge patient");
    } finally {
      setDischargingVisit(null);
    }
  };

  const getPriorityClass = (priority) => {
    const styles = {
      critical: "priority-critical",
      high: "priority-high",
      normal: "priority-normal",
      low: "priority-low",
    };
    return styles[priority?.toLowerCase()] || styles.normal;
  };

  const formatDuration = (days) => {
    if (!days && days !== 0) return "N/A";
    const totalDays = Math.floor(days);
    const hours = Math.floor((days - totalDays) * 24);
    
    if (totalDays > 0) {
      return `${totalDays}d ${hours}h`;
    }
    return `${hours}h`;
  };

  const exportToCSV = () => {
    if (!patients.length) {
      toast.error("No data to export");
      return;
    }

    const headers = ["#", "Visit Number", "Patient Name", "Age", "Gender", "Priority", "Admission Date", "Days Admitted", "Branch"];
    const csvData = patients.map((p, index) => [
      index + 1,
      p.visit_number,
      `${p.first_name} ${p.last_name}`,
      p.age || "N/A",
      p.gender,
      p.priority_level,
      new Date(p.visit_date).toLocaleDateString(),
      Math.floor(p.days_since_admission),
      p.branch_name || "Main",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admitted_patients_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("CSV exported successfully");
  };

  if (loading && !patients.length) {
    return (
      <div className="patient-record-form">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <RefreshCw className="loading-spinner" style={{ width: "48px", height: "48px", margin: "0 auto 16px", color: "#3b82f6" }} />
          <p style={{ color: "#6b7280" }}>Loading admitted patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-record-form">
      <div className="form-header">
        <h2>Admitted Patients</h2>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>Monitor and manage currently admitted patients</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-content">
              <div>
                <p className="stat-label">Total Admitted</p>
                <p className="stat-value">{statistics.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-content">
              <div>
                <p className="stat-label">Critical</p>
                <p className="stat-value">{statistics.critical_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-content">
              <div>
                <p className="stat-label">High Priority</p>
                <p className="stat-value">{statistics.high_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-content">
              <div>
                <p className="stat-label">Normal</p>
                <p className="stat-value">{statistics.normal_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="form-section">
        <h3>Filters & Search</h3>

        <div className="form-row">
          <div className="form-group" style={{ flex: "2" }}>
            <label>Search Patients</label>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", width: "20px", height: "20px" }} />
              <input
                type="text"
                placeholder="Search by name or visit number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "40px" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Priority Level</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="priority">Priority</option>
              <option value="date">Admission Date</option>
              <option value="name">Patient Name</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
          <button type="button" className="secondary-btn" onClick={fetchAdmittedPatients} disabled={loading}>
            <RefreshCw style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            Refresh
          </button>
          <button type="button" className="secondary-btn" onClick={exportToCSV} disabled={!patients.length}>
            <Download style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            Export CSV
          </button>
          <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: "14px" }}>Showing {patients.length} patients</span>
        </div>
      </div>

      {/* Patients Table */}
      <div className="form-section">
        {patients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Users style={{ width: "64px", height: "64px", margin: "0 auto 16px", color: "#d1d5db" }} />
            <p style={{ color: "#6b7280", fontSize: "18px", marginBottom: "8px" }}>No admitted patients found</p>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>{searchTerm ? "Try adjusting your search criteria" : "There are currently no patients admitted"}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  
                  <th>Patient</th>
                  
                  <th>Priority</th>
                  <th>Admitted</th>
                  <th>Duration</th>
              
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, index) => (
                  <React.Fragment key={patient.visit_id}>
                    <tr className="table-row">
                      <td style={{ 
                        fontWeight: "600", 
                        color: "#6b7280",
                        fontSize: "14px",
                        textAlign: "center"
                      }}>
                        {index + 1}
                      </td>
                    
                      <td>
                        <div className="patient-info">
                          <div className="patient-avatar">
                            <User size={24} />
                          </div>
                          <div>
                            <div className="patient-name">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="patient-meta">
                              {patient.age ? `${patient.age}y` : "N/A"} • {patient.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                     
                      <td>
                        <span className={`priority-badge ${getPriorityClass(patient.priority_level)}`}>
                          {patient.priority_level?.toUpperCase() || 'NORMAL'}
                        </span>
                      </td>
                      <td className="text-secondary">
                        {new Date(patient.visit_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Clock size={16} style={{ marginRight: "6px", color: "#9ca3af" }} />
                          {formatDuration(patient.days_since_admission)}
                        </div>
                      </td>
                     
                       
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button 
                            className="link-btn" 
                            onClick={() => navigate(`/visits/details/${patient.visit_id}`)}
                          >
                            View Details
                          </button>
                          {canDischarge && (
                            <button
                              className="link-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDischargePatient(patient.visit_id, `${patient.first_name} ${patient.last_name}`);
                              }}
                              disabled={dischargingVisit === patient.visit_id}
                              style={{
                               color: dischargingVisit === patient.visit_id ? "#f87171" : "#ef4444",
                              }}
                            >
                              {dischargingVisit === patient.visit_id ? (
                                <>
                                  <RefreshCw size={14} className="loading-spinner" />
                                  Discharging...
                                </>
                              ) : (
                                <>
                                  <LogOut size={14} />
                                  Discharge
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                   
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrequentPatients;