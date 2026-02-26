import React, { useEffect, useState } from "react";
import { MdAdd, MdSearch, MdEdit, MdDelete, MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./UserManagement.css";
import axiosInstance from "../../utils/axios.instance";

const UserManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    role: "user",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAllUsers();
  }, [currentPage, debouncedSearch, roleFilter, statusFilter]);

  const fetchAllUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });

      const res = await axiosInstance.get(
        `/admin/users/get-all-users?${params}`
      );
      const usersData = res.data.users;
      console.log(usersData);
      if (!Array.isArray(usersData)) {
        console.error("Users data is not an array:", res.data);
        return;
      }

      const formattedUsers = usersData.map((user) => ({
        id: user.id,
        username: user.profile?.username || "Unknown",
        email: user.email,
        role: user.profile?.role || "user",
        status: user.is_anonymous ? "Inactive" : "Active",
        joined: new Date(user.created_at).toISOString().split("T")[0],
        avatar_url: user.profile?.avatar_url || null,
      }));

      setUsers(formattedUsers);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error("Error fetching users:", e);
      alert(e.response?.data?.message || "Internal Server Error");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axiosInstance.post("/admin/users/create-user", formData);
      alert("User created successfully!");
      setShowAddModal(false);
      setFormData({ email: "", password: "", username: "", role: "user" });
      fetchAllUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axiosInstance.put(
        `/admin/users/update-user/${selectedUser.id}`,
        formData
      );
      alert("User updated successfully!");
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ email: "", password: "", username: "", role: "user" });
      fetchAllUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert(error.response?.data?.message || "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);

    try {
      await axiosInstance.delete(
        `/admin/users/delete-user/${selectedUser.id}`
      );
      alert("User deleted successfully!");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchAllUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.message || "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      username: user.username,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };


  return (
    <div className="user-management-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ fontSize: 36, fontWeight: 800, color: '#22223b', marginBottom: 8 }}>
          User <span className="gradient-text" style={{ background: 'linear-gradient(90deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Management</span>
        </h1>
        <p className="page-subtitle" style={{ color: '#6b7280', fontSize: 18, fontWeight: 500 }}>Manage system users, roles, and account status</p>
      </div>

      <div className="design-section" style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(102,126,234,0.08)', padding: 32, marginBottom: 32 }}>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10 relative">
          <div className="relative w-full md:w-96 mb-4 md:mb-0">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:bg-white transition-all shadow-sm"
              style={{ marginBottom: 0, fontSize: 16 }}
            />
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#667eea] shadow-sm cursor-pointer"
              style={{ minWidth: 120, fontSize: 15 }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#667eea] shadow-sm cursor-pointer"
              style={{ minWidth: 120, fontSize: 15 }}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95"
              type="button"
              style={{ fontSize: 15 }}
            >
              <MdAdd className="text-xl" />
              <span>Add User</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm" style={{ background: '#fff' }}>
        <table className="w-full text-left border-collapse" style={{ fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#f8fafc', textTransform: 'uppercase', letterSpacing: 1.2, color: '#a0aec0', fontWeight: 700, fontSize: 12 }}>
              <th style={{ padding: '18px 24px' }}>User</th>
              <th style={{ padding: '18px 24px' }}>Role</th>
              <th style={{ padding: '18px 24px' }}>Status</th>
              <th style={{ padding: '18px 24px' }}>Joined</th>
              <th style={{ padding: '18px 24px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ transition: 'background 0.15s' }} className="hover:bg-gray-50 group">
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f0eeff,#fef5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667eea', fontWeight: 700, border: '1px solid #fff', boxShadow: '0 2px 8px rgba(102,126,234,0.08)', overflow: 'hidden' }}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#22223b', fontSize: 16 }}>{user.username}</div>
                      <div style={{ fontSize: 13, color: '#a0aec0', fontWeight: 500 }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{
                    background: user.role === 'admin' ? '#ede9fe' : user.role === 'moderator' ? '#dbeafe' : '#f3f4f6',
                    color: user.role === 'admin' ? '#7c3aed' : user.role === 'moderator' ? '#2563eb' : '#6b7280',
                    border: '1px solid ' + (user.role === 'admin' ? '#ddd6fe' : user.role === 'moderator' ? '#bfdbfe' : '#e5e7eb'),
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 14px',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>{user.role}</span>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: user.status === 'Active' ? '#4ade80' : '#d1d5db', boxShadow: user.status === 'Active' ? '0 0 8px #4ade8080' : 'none' }}></div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>{user.status}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', fontSize: 14, color: '#64748b', fontWeight: 500 }}>{user.joined}</td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <button
                      onClick={() => navigate(`/admin/sessions/${user.id}`)}
                      style={{ padding: 10, color: '#6366f1', background: '#f5f3ff', borderRadius: 12, border: 'none', transition: 'background 0.15s' }}
                      title="View sessions"
                    >
                      <MdSearch style={{ fontSize: 20 }} />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      style={{ padding: 10, color: '#f59e42', background: '#fff7ed', borderRadius: 12, border: 'none', transition: 'background 0.15s' }}
                      title="Edit user"
                    >
                      <MdEdit style={{ fontSize: 20 }} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      style={{ padding: 10, color: '#ef4444', background: '#fef2f2', borderRadius: 12, border: 'none', transition: 'background 0.15s' }}
                      title="Delete user"
                    >
                      <MdDelete style={{ fontSize: 20 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '24px 0' }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={pagination.currentPage === 1}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              background: pagination.currentPage === 1 ? '#e5e7eb' : 'linear-gradient(90deg,#667eea,#764ba2)',
              color: pagination.currentPage === 1 ? '#a0aec0' : '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              minWidth: 100,
            }}
          >
            Previous
          </button>
          <span style={{ fontWeight: 600, color: '#6b7280', fontSize: 15 }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            disabled={pagination.currentPage === pagination.totalPages}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              background: pagination.currentPage === pagination.totalPages ? '#e5e7eb' : 'linear-gradient(90deg,#667eea,#764ba2)',
              color: pagination.currentPage === pagination.totalPages ? '#a0aec0' : '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              minWidth: 100,
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    email: "",
                    password: "",
                    username: "",
                    role: "user",
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      email: "",
                      password: "",
                      username: "",
                      role: "user",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setFormData({
                    email: "",
                    password: "",
                    username: "",
                    role: "user",
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setFormData({
                      email: "",
                      password: "",
                      username: "",
                      role: "user",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Delete User</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete user{" "}
              <span className="font-semibold">{selectedUser?.username}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
