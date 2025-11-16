import React, { useState, useEffect } from "react";
import "./user-list.css";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useStore from "../../store";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_users: 0,
    limit: 50,
    has_next: false,
    has_prev: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    role_id: "",
    hospital_id: "",
    branch_id: "",
    employment_status: "",
    account_status: "",
    page: 1,
    limit: 50,
    sort_by: "created_at",
    sort_order: "DESC"
  });

  const navigate = useNavigate();
  const { user } = useStore(state => state); // Get user from store

  // Check authentication on mount
  useEffect(() => {
    if (!user || !user.token) {
      toast.error("You must be logged in to view users");
      navigate("/sign-in");
      return;
    }
  }, [user, navigate]);

  // Fetch users
  const fetchUsers = async () => {
    // Don't fetch if no user/token
    if (!user || !user.token) {
      return;
    }

    try {
      setLoading(true);

      // Build query string
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const { data: res } = await api.get(`/users/list?${queryParams.toString()}`);

      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error(error);
      
      // Handle 401 specifically
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/sign-in");
      } else {
        toast.error(error?.response?.data?.message || "Failed to fetch users");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount and when filters change (only if authenticated)
  useEffect(() => {
    if (user && user.token) {
      fetchUsers();
    }
  }, [filters.page, filters.sort_by, filters.sort_order, user]);

  // Handle search with debounce
  useEffect(() => {
    if (!user || !user.token) return;

    const delayDebounce = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [filters.search, user]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    handleFilterChange("search", e.target.value);
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    fetchUsers();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      role_id: "",
      hospital_id: "",
      branch_id: "",
      employment_status: "",
      account_status: "",
      page: 1,
      limit: 50,
      sort_by: "created_at",
      sort_order: "DESC"
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle sort
  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === "ASC" ? "DESC" : "ASC"
    }));
  };

  // Navigate to user details
  const handleViewUser = (userId) => {
    navigate(`/users/${userId}`);
  };

  // Navigate to edit user
  const handleEditUser = (userId) => {
    navigate(`/users/${userId}/edit`);
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

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "status-badge status-active";
      case "locked":
        return "status-badge status-locked";
      case "suspended":
        return "status-badge status-suspended";
      case "archived":
        return "status-badge status-archived";  
      default:
        return "status-badge";
    }
  };

  // Show loading if checking auth
  if (!user) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h1>User Management</h1>
        
        {/* Only show buttons for Local Admin (role_id === 2) */}
        {user?.role_id === 2 && (
          <div>
            <button 
              className="btn-add-doctor" 
              onClick={() => navigate("/users/register-existing-doctor")}
            >
              + Register Existing Doctor
            </button>
            <button 
              className="btn-primary" 
              onClick={() => navigate("/users/register")}
            >
              + Register New User
            </button>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, username, email, or employee ID..."
            value={filters.search}
            onChange={handleSearch}
            className="search-input"
          />
          {/* <span className="search-icon">🔍</span> */}
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Role</label>
            <select
              value={filters.role_id}
              onChange={(e) => handleFilterChange("role_id", e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="1">Global Admin</option>
              <option value="2">Local Admin</option>
              <option value="3">Doctor</option>
              <option value="4">Nurse</option>
              <option value="5">Receptionist</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Hospital ID</label>
            <input
              type="number"
              placeholder="Hospital ID"
              value={filters.hospital_id}
              onChange={(e) => handleFilterChange("hospital_id", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Branch ID</label>
            <input
              type="number"
              placeholder="Branch ID"
              value={filters.branch_id}
              onChange={(e) => handleFilterChange("branch_id", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Employment Status</label>
            <select
              value={filters.employment_status}
              onChange={(e) => handleFilterChange("employment_status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="fired"> Fired</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Account Status</label>
            <select
              value={filters.account_status}
              onChange={(e) => handleFilterChange("account_status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="locked">Locked</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={handleApplyFilters} className="btn-apply">
              Apply
            </button>
            <button onClick={handleResetFilters} className="btn-reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <p>
          Showing {users.length} of {pagination.total_users} users
          {filters.search && ` matching "${filters.search}"`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && users.length > 0 && (
        <div className="user-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort("first_name")} className="sortable">
                  Name {filters.sort_by === "first_name" && (filters.sort_order === "ASC" ? "↑" : "↓")}
                </th>
                {/* <th onClick={() => handleSort("username")} className="sortable">
                  Username {filters.sort_by === "username" && (filters.sort_order === "ASC" ? "↑" : "↓")}
                </th> */}
                <th onClick={() => handleSort("email")} className="sortable">
                  Email {filters.sort_by === "email" && (filters.sort_order === "ASC" ? "↑" : "↓")}
                </th>
                <th>Role</th>
                <th>Hospital</th>
                {/* <th>Department</th> */}
                {/* <th onClick={() => handleSort("employment_status")} className="sortable">
                  Employment {filters.sort_by === "employment_status" && (filters.sort_order === "ASC" ? "↑" : "↓")}
                </th> */}
                <th onClick={() => handleSort("account_status")} className="sortable">
                  Account {filters.sort_by === "account_status" && (filters.sort_order === "ASC" ? "↑" : "↓")}
                </th>
                {/* <th onClick={() => handleSort("created_at")} className="sortable">
                  Created {filters.sort_by === "created_at" && (filters.sort_order === "ASC" ? "↑" : "↓")}
                </th> */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.user_id}>
                  <td>{(pagination.current_page - 1) * pagination.limit + index + 1}</td>
                  <td>
                    <div className="user-name">
                      {user.first_name} {user.middle_name} {user.last_name}
                      {user.is_provider && <span className="provider-badge">Provider</span>}
                    </div>
                  </td>
                  {/* <td>{user.username}</td> */}
                  <td className="email-cell">{user.email}</td>
                  <td>
                    <span className="role-badge">{user.role_name}</span>
                  </td>
                  <td>{user.hospital_name || "N/A"}</td>
                  {/* <td>{user.department || "N/A"}</td> */}
                  {/* <td>
                    <span className={getStatusClass(user.employment_status)}>
                      {user.employment_status}
                    </span>
                  </td> */}
                  <td>
                    <span className={getStatusClass(user.account_status)}>
                      {user.account_status}
                    </span>
                  </td>
                  {/* <td>{formatDate(user.created_at)}</td> */}
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewUser(user.user_id)}
                        className="btn-view"
                        title="View Details"
                      >
                        view
                      </button>
                      {/* <button
                        onClick={() => handleEditUser(user.user_id)}
                        className="btn-edit"
                        title="Edit User"
                      >
                        ✏️
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="empty-state">
          <p>No users found</p>
          {filters.search && (
            <p>Try adjusting your search or filters</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={!pagination.has_prev}
            className="btn-page"
          >
            « Previous
          </button>

          <div className="page-info">
            Page {pagination.current_page} of {pagination.total_pages}
          </div>

          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={!pagination.has_next}
            className="btn-page"
          >
            Next »
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;