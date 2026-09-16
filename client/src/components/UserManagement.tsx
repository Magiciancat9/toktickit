import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  AdminUser,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  CreateAdminUserPayload,
  UpdateAdminUserPayload
} from "../api.js";

export function UserManagement() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "REQUESTER",
    isActive: true,
    initialPassword: "",
    newPassword: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter === "ALL" ? undefined : roleFilter
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  // Form handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const openCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      role: "REQUESTER",
      isActive: true,
      initialPassword: "",
      newPassword: ""
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      initialPassword: "",
      newPassword: ""
    });
    setFormError(null);
    setShowResetPassword(false);
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormBusy(true);

    try {
      const payload: CreateAdminUserPayload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        initialPassword: formData.initialPassword
      };

      await createAdminUser(payload);
      setIsCreateModalOpen(false);
      loadUsers();
      // Optional: show success toast
    } catch (err: any) {
      if (err.status === 409) {
        setFormError("A user with this email already exists.");
      } else {
        setFormError(err.message || "Unable to create user. Please try again.");
      }
    } finally {
      setFormBusy(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setFormError(null);
    setFormBusy(true);

    try {
      // 1. Update user details if changed
      const payload: UpdateAdminUserPayload = {};
      if (formData.name !== selectedUser.name) payload.name = formData.name;
      if (formData.email !== selectedUser.email) payload.email = formData.email;
      if (formData.role !== selectedUser.role) payload.role = formData.role;
      if (formData.isActive !== selectedUser.isActive) payload.isActive = formData.isActive;

      if (Object.keys(payload).length > 0) {
        await updateAdminUser(selectedUser.id, payload);
      }

      // 2. Reset password if provided
      if (showResetPassword && formData.newPassword) {
        await resetAdminUserPassword(selectedUser.id, formData.newPassword);
      }

      setIsEditModalOpen(false);
      loadUsers();
      // Optional: show success toast
    } catch (err: any) {
      if (err.status === 409) {
        setFormError(err.message || "This email is already in use by another user or invalid operation.");
      } else if (err.status === 403) {
        setFormError("You cannot deactivate your own account.");
      } else {
        setFormError(err.message || "Unable to update user. Please try again.");
      }
    } finally {
      setFormBusy(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "REQUESTER": return "#3B82F6";
      case "IT_STAFF": return "#006B3C";
      case "ADMINISTRATOR": return "#8B5CF6";
      default: return "#6B7280";
    }
  };

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h2 className="mb-0" style={{ color: "#2C3E37", fontWeight: 600 }}>User Management</h2>
        <button
          className="btn text-white"
          style={{ backgroundColor: "#006B3C" }}
          onClick={openCreateModal}
        >
          + Create User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-4">
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="REQUESTER">Requester</option>
            <option value="IT_STAFF">IT Staff</option>
            <option value="ADMINISTRATOR">Administrator</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger" role="alert" style={{ backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", color: "#991B1B" }}>
          <div className="d-flex align-items-center">
            <span className="me-2">⚠️</span>
            {error}
          </div>
          <button className="btn btn-sm btn-outline-danger mt-2" onClick={loadUsers}>Try Again</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#006B3C" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading users...</p>
        </div>
      )}

      {/* User List */}
      {!loading && !error && users.length === 0 && (
        <div className="card text-center p-5 shadow-sm border-0" style={{ backgroundColor: "#FFFFFF" }}>
          <p className="mb-0 text-muted" style={{ fontSize: "16px" }}>No users match your search and filters.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="d-none d-md-block card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#E0E6E3" }}>
                  <tr>
                    <th className="py-3 px-4 border-0" style={{ color: "#2C3E37" }}>Name</th>
                    <th className="py-3 px-4 border-0" style={{ color: "#2C3E37" }}>Email</th>
                    <th className="py-3 px-4 border-0" style={{ color: "#2C3E37" }}>Role</th>
                    <th className="py-3 px-4 border-0" style={{ color: "#2C3E37" }}>Status</th>
                    <th className="py-3 px-4 border-0" style={{ color: "#2C3E37" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="py-3 px-4 fw-semibold align-middle">{user.name}</td>
                      <td className="py-3 px-4 text-muted align-middle">{user.email}</td>
                      <td className="py-3 px-4 align-middle">
                        <span className="badge rounded-pill fw-semibold py-2 px-3" style={{ backgroundColor: getRoleBadgeColor(user.role) }}>
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <span className="badge rounded-pill fw-semibold py-2 px-3" style={{ backgroundColor: user.isActive ? "#14B8A6" : "#6B7280" }}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <button
                          className="btn btn-sm"
                          style={{ color: "#0B7A46", border: "2px solid #0B7A46", backgroundColor: "white", fontWeight: 500 }}
                          onClick={() => openEditModal(user)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="d-md-none d-flex flex-column gap-3">
            {users.map(user => (
              <div key={user.id} className="card shadow-sm border-0 p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0 fw-bold" style={{ color: "#2C3E37" }}>{user.name}</h5>
                  <span className="badge rounded-pill" style={{ backgroundColor: user.isActive ? "#14B8A6" : "#6B7280" }}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-muted mb-2">{user.email}</div>
                <div className="mb-3">
                  <span className="badge rounded-pill" style={{ backgroundColor: getRoleBadgeColor(user.role) }}>
                    {user.role.replace("_", " ")}
                  </span>
                </div>
                <button
                  className="btn btn-sm w-100"
                  style={{ color: "#0B7A46", border: "2px solid #0B7A46", backgroundColor: "white", fontWeight: 500 }}
                  onClick={() => openEditModal(user)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: "#2C3E37" }}>
                  {isCreateModalOpen ? "Create New User" : `Edit User: ${selectedUser?.name}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                ></button>
              </div>
              <div className="modal-body">
                {formError && (
                  <div className="alert p-2" style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: "14px" }}>
                    {formError}
                  </div>
                )}
                <form onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit}>
                  <div className="mb-3">
                    <label htmlFor="nameInput" className="form-label fw-medium" style={{ color: "#2C3E37", fontSize: "14px" }}>Full Name</label>
                    <input
                      id="nameInput"
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="emailInput" className="form-label fw-medium" style={{ color: "#2C3E37", fontSize: "14px" }}>Email Address</label>
                    <input
                      id="emailInput"
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="roleSelect" className="form-label fw-medium" style={{ color: "#2C3E37", fontSize: "14px" }}>Role</label>
                    <select
                      id="roleSelect"
                      className="form-select"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>
                  
                  <div className="mb-4 form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="activeSwitch"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={isEditModalOpen && selectedUser?.id === authUser?.id}
                    />
                    <label className="form-check-label ms-2" htmlFor="activeSwitch">
                      Active
                    </label>
                    {isEditModalOpen && selectedUser?.id === authUser?.id && (
                      <div className="form-text mt-1 text-muted" style={{ fontSize: "12px" }}>
                        You cannot deactivate your own account.
                      </div>
                    )}
                  </div>

                  {isCreateModalOpen && (
                    <div className="mb-4 p-3 rounded" style={{ backgroundColor: "#F5F7F6" }}>
                      <label htmlFor="initialPasswordInput" className="form-label fw-medium" style={{ color: "#2C3E37", fontSize: "14px" }}>Initial Password</label>
                      <input
                        id="initialPasswordInput"
                        type="text"
                        className="form-control"
                        name="initialPassword"
                        value={formData.initialPassword}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. TempPass123!"
                      />
                      <div className="form-text mt-2" style={{ fontSize: "12px" }}>
                        User will be required to change this password on first login. Must contain 8+ chars, upper/lower, number, and special char.
                      </div>
                    </div>
                  )}

                  {isEditModalOpen && (
                    <div className="mb-4">
                      {!showResetPassword ? (
                        <button
                          type="button"
                          className="btn btn-sm w-100"
                          style={{ color: "#0B7A46", border: "2px dashed #0B7A46", backgroundColor: "white" }}
                          onClick={() => setShowResetPassword(true)}
                        >
                          Set New Initial Password
                        </button>
                      ) : (
                        <div className="p-3 rounded border" style={{ backgroundColor: "#F5F7F6", borderColor: "#E0E6E3" }}>
                          <label htmlFor="newPasswordInput" className="form-label fw-medium" style={{ color: "#2C3E37", fontSize: "14px" }}>New Initial Password</label>
                          <input
                            id="newPasswordInput"
                            type="text"
                            className="form-control"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter new password"
                          />
                          <div className="form-text mt-2 mb-2" style={{ fontSize: "12px" }}>
                            User will be required to change this password on next login.
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setShowResetPassword(false);
                              setFormData(prev => ({ ...prev, newPassword: "" }));
                            }}
                          >
                            Cancel Password Reset
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn"
                      style={{ color: "#0B7A46", backgroundColor: "white", border: "2px solid #0B7A46" }}
                      onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                      disabled={formBusy}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn text-white"
                      style={{ backgroundColor: "#006B3C" }}
                      disabled={formBusy}
                    >
                      {formBusy ? "Saving..." : isCreateModalOpen ? "Save User" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
