import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { fetchAdminUsers, createAdminUser, updateAdminUser, resetAdminUserPassword } from "../api.js";
export function UserManagement() {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filters
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "REQUESTER",
        isActive: true,
        initialPassword: "",
        newPassword: ""
    });
    const [formError, setFormError] = useState(null);
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
        }
        catch (err) {
            setError(err.message || "Unable to load users. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadUsers();
    }, [search, roleFilter]);
    // Form handling
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? e.target.checked : value
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
    const openEditModal = (user) => {
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
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setFormBusy(true);
        try {
            const payload = {
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
        }
        catch (err) {
            if (err.status === 409) {
                setFormError("A user with this email already exists.");
            }
            else {
                setFormError(err.message || "Unable to create user. Please try again.");
            }
        }
        finally {
            setFormBusy(false);
        }
    };
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser)
            return;
        setFormError(null);
        setFormBusy(true);
        try {
            // 1. Update user details if changed
            const payload = {};
            if (formData.name !== selectedUser.name)
                payload.name = formData.name;
            if (formData.email !== selectedUser.email)
                payload.email = formData.email;
            if (formData.role !== selectedUser.role)
                payload.role = formData.role;
            if (formData.isActive !== selectedUser.isActive)
                payload.isActive = formData.isActive;
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
        }
        catch (err) {
            if (err.status === 409) {
                setFormError(err.message || "This email is already in use by another user or invalid operation.");
            }
            else if (err.status === 403) {
                setFormError("You cannot deactivate your own account.");
            }
            else {
                setFormError(err.message || "Unable to update user. Please try again.");
            }
        }
        finally {
            setFormBusy(false);
        }
    };
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "REQUESTER": return "#3B82F6";
            case "IT_STAFF": return "#006B3C";
            case "ADMINISTRATOR": return "#8B5CF6";
            default: return "#6B7280";
        }
    };
    return (_jsxs("div", { className: "container", style: { maxWidth: "1200px", margin: "0 auto" }, children: [_jsxs("div", { className: "d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3", children: [_jsx("h2", { className: "mb-0", style: { color: "#2C3E37", fontWeight: 600 }, children: "User Management" }), _jsx("button", { className: "btn text-white", style: { backgroundColor: "#006B3C" }, onClick: openCreateModal, children: "+ Create User" })] }), _jsxs("div", { className: "row g-3 mb-4", children: [_jsx("div", { className: "col-12 col-md-6", children: _jsx("input", { type: "text", className: "form-control", placeholder: "Search by name or email...", value: search, onChange: (e) => setSearch(e.target.value) }) }), _jsx("div", { className: "col-12 col-md-4", children: _jsxs("select", { className: "form-select", value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), children: [_jsx("option", { value: "ALL", children: "All Roles" }), _jsx("option", { value: "REQUESTER", children: "Requester" }), _jsx("option", { value: "IT_STAFF", children: "IT Staff" }), _jsx("option", { value: "ADMINISTRATOR", children: "Administrator" })] }) })] }), error && (_jsxs("div", { className: "alert alert-danger", role: "alert", style: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", color: "#991B1B" }, children: [_jsxs("div", { className: "d-flex align-items-center", children: [_jsx("span", { className: "me-2", children: "\u26A0\uFE0F" }), error] }), _jsx("button", { className: "btn btn-sm btn-outline-danger mt-2", onClick: loadUsers, children: "Try Again" })] })), loading && !error && (_jsxs("div", { className: "text-center py-5", children: [_jsx("div", { className: "spinner-border", style: { color: "#006B3C" }, role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading..." }) }), _jsx("p", { className: "mt-3 text-muted", children: "Loading users..." })] })), !loading && !error && users.length === 0 && (_jsx("div", { className: "card text-center p-5 shadow-sm border-0", style: { backgroundColor: "#FFFFFF" }, children: _jsx("p", { className: "mb-0 text-muted", style: { fontSize: "16px" }, children: "No users match your search and filters." }) })), !loading && !error && users.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "d-none d-md-block card shadow-sm border-0", children: _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover mb-0", children: [_jsx("thead", { style: { backgroundColor: "#E0E6E3" }, children: _jsxs("tr", { children: [_jsx("th", { className: "py-3 px-4 border-0", style: { color: "#2C3E37" }, children: "Name" }), _jsx("th", { className: "py-3 px-4 border-0", style: { color: "#2C3E37" }, children: "Email" }), _jsx("th", { className: "py-3 px-4 border-0", style: { color: "#2C3E37" }, children: "Role" }), _jsx("th", { className: "py-3 px-4 border-0", style: { color: "#2C3E37" }, children: "Status" }), _jsx("th", { className: "py-3 px-4 border-0", style: { color: "#2C3E37" }, children: "Action" })] }) }), _jsx("tbody", { children: users.map(user => (_jsxs("tr", { children: [_jsx("td", { className: "py-3 px-4 fw-semibold align-middle", children: user.name }), _jsx("td", { className: "py-3 px-4 text-muted align-middle", children: user.email }), _jsx("td", { className: "py-3 px-4 align-middle", children: _jsx("span", { className: "badge rounded-pill fw-semibold py-2 px-3", style: { backgroundColor: getRoleBadgeColor(user.role) }, children: user.role.replace("_", " ") }) }), _jsx("td", { className: "py-3 px-4 align-middle", children: _jsx("span", { className: "badge rounded-pill fw-semibold py-2 px-3", style: { backgroundColor: user.isActive ? "#14B8A6" : "#6B7280" }, children: user.isActive ? "Active" : "Inactive" }) }), _jsx("td", { className: "py-3 px-4 align-middle", children: _jsx("button", { className: "btn btn-sm", style: { color: "#0B7A46", border: "2px solid #0B7A46", backgroundColor: "white", fontWeight: 500 }, onClick: () => openEditModal(user), children: "Edit" }) })] }, user.id))) })] }) }) }), _jsx("div", { className: "d-md-none d-flex flex-column gap-3", children: users.map(user => (_jsxs("div", { className: "card shadow-sm border-0 p-3", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start mb-2", children: [_jsx("h5", { className: "mb-0 fw-bold", style: { color: "#2C3E37" }, children: user.name }), _jsx("span", { className: "badge rounded-pill", style: { backgroundColor: user.isActive ? "#14B8A6" : "#6B7280" }, children: user.isActive ? "Active" : "Inactive" })] }), _jsx("div", { className: "text-muted mb-2", children: user.email }), _jsx("div", { className: "mb-3", children: _jsx("span", { className: "badge rounded-pill", style: { backgroundColor: getRoleBadgeColor(user.role) }, children: user.role.replace("_", " ") }) }), _jsx("button", { className: "btn btn-sm w-100", style: { color: "#0B7A46", border: "2px solid #0B7A46", backgroundColor: "white", fontWeight: 500 }, onClick: () => openEditModal(user), children: "Edit" })] }, user.id))) })] })), (isCreateModalOpen || isEditModalOpen) && (_jsx("div", { className: "modal d-block", style: { backgroundColor: "rgba(0,0,0,0.5)" }, tabIndex: -1, children: _jsx("div", { className: "modal-dialog modal-dialog-centered", children: _jsxs("div", { className: "modal-content border-0 shadow", children: [_jsxs("div", { className: "modal-header border-bottom-0 pb-0", children: [_jsx("h5", { className: "modal-title fw-bold", style: { color: "#2C3E37" }, children: isCreateModalOpen ? "Create New User" : `Edit User: ${selectedUser?.name}` }), _jsx("button", { type: "button", className: "btn-close", onClick: () => { setIsCreateModalOpen(false); setIsEditModalOpen(false); } })] }), _jsxs("div", { className: "modal-body", children: [formError && (_jsx("div", { className: "alert p-2", style: { backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: "14px" }, children: formError })), _jsxs("form", { onSubmit: isCreateModalOpen ? handleCreateSubmit : handleEditSubmit, children: [_jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "nameInput", className: "form-label fw-medium", style: { color: "#2C3E37", fontSize: "14px" }, children: "Full Name" }), _jsx("input", { id: "nameInput", type: "text", className: "form-control", name: "name", value: formData.name, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "emailInput", className: "form-label fw-medium", style: { color: "#2C3E37", fontSize: "14px" }, children: "Email Address" }), _jsx("input", { id: "emailInput", type: "email", className: "form-control", name: "email", value: formData.email, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "roleSelect", className: "form-label fw-medium", style: { color: "#2C3E37", fontSize: "14px" }, children: "Role" }), _jsxs("select", { id: "roleSelect", className: "form-select", name: "role", value: formData.role, onChange: handleInputChange, children: [_jsx("option", { value: "REQUESTER", children: "Requester" }), _jsx("option", { value: "IT_STAFF", children: "IT Staff" }), _jsx("option", { value: "ADMINISTRATOR", children: "Administrator" })] })] }), _jsxs("div", { className: "mb-4 form-check form-switch", children: [_jsx("input", { className: "form-check-input", type: "checkbox", role: "switch", id: "activeSwitch", name: "isActive", checked: formData.isActive, onChange: handleInputChange, disabled: isEditModalOpen && selectedUser?.id === authUser?.id }), _jsx("label", { className: "form-check-label ms-2", htmlFor: "activeSwitch", children: "Active" }), isEditModalOpen && selectedUser?.id === authUser?.id && (_jsx("div", { className: "form-text mt-1 text-muted", style: { fontSize: "12px" }, children: "You cannot deactivate your own account." }))] }), isCreateModalOpen && (_jsxs("div", { className: "mb-4 p-3 rounded", style: { backgroundColor: "#F5F7F6" }, children: [_jsx("label", { htmlFor: "initialPasswordInput", className: "form-label fw-medium", style: { color: "#2C3E37", fontSize: "14px" }, children: "Initial Password" }), _jsx("input", { id: "initialPasswordInput", type: "text", className: "form-control", name: "initialPassword", value: formData.initialPassword, onChange: handleInputChange, required: true, placeholder: "e.g. TempPass123!" }), _jsx("div", { className: "form-text mt-2", style: { fontSize: "12px" }, children: "User will be required to change this password on first login. Must contain 8+ chars, upper/lower, number, and special char." })] })), isEditModalOpen && (_jsx("div", { className: "mb-4", children: !showResetPassword ? (_jsx("button", { type: "button", className: "btn btn-sm w-100", style: { color: "#0B7A46", border: "2px dashed #0B7A46", backgroundColor: "white" }, onClick: () => setShowResetPassword(true), children: "Set New Initial Password" })) : (_jsxs("div", { className: "p-3 rounded border", style: { backgroundColor: "#F5F7F6", borderColor: "#E0E6E3" }, children: [_jsx("label", { htmlFor: "newPasswordInput", className: "form-label fw-medium", style: { color: "#2C3E37", fontSize: "14px" }, children: "New Initial Password" }), _jsx("input", { id: "newPasswordInput", type: "text", className: "form-control", name: "newPassword", value: formData.newPassword, onChange: handleInputChange, required: true, placeholder: "Enter new password" }), _jsx("div", { className: "form-text mt-2 mb-2", style: { fontSize: "12px" }, children: "User will be required to change this password on next login." }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary", onClick: () => {
                                                                setShowResetPassword(false);
                                                                setFormData(prev => ({ ...prev, newPassword: "" }));
                                                            }, children: "Cancel Password Reset" })] })) })), _jsxs("div", { className: "d-flex justify-content-end gap-2 mt-4", children: [_jsx("button", { type: "button", className: "btn", style: { color: "#0B7A46", backgroundColor: "white", border: "2px solid #0B7A46" }, onClick: () => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }, disabled: formBusy, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn text-white", style: { backgroundColor: "#006B3C" }, disabled: formBusy, children: formBusy ? "Saving..." : isCreateModalOpen ? "Save User" : "Save Changes" })] })] })] })] }) }) }))] }));
}
export default UserManagement;
