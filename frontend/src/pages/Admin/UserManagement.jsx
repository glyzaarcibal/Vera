import React, { useEffect, useState } from "react";
import { MdAdd, MdSearch, MdEdit, MdDelete, MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../../styles/GlobalDesign.css";
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          User <span className="gradient-text">Management</span>
        </h1>
        <p className="page-subtitle">Manage system users, roles, and account status</p>
      </div>

      <div className="design-section">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:w-96">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:bg-white transition-all shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#667eea] shadow-sm cursor-pointer"
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
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95"
            >
              <MdAdd className="text-xl" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f0eeff] to-[#fef5ff] flex items-center justify-center text-[#667eea] font-bold border border-white shadow-sm overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{user.username}</div>
                        <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        user.role === 'moderator' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-gray-50 text-gray-600 border border-gray-100'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-300'}`}></div>
                      <span className="text-sm font-medium text-gray-600">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                    {user.joined}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/admin/sessions/${user.id}`)}
                        className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                        title="View sessions"
                      >
                        <MdSearch className="text-xl" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                        title="Edit user"
                      >
                        <MdEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete user"
                      >
                        <MdDelete className="text-xl" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4 px-2">
          <div className="text-sm text-gray-400 font-medium">
            Showing <span className="text-gray-900 font-bold">{users.length}</span> of <span className="text-gray-900 font-bold">{pagination.totalUsers}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev}
              className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
            >
              Previous
            </button>
            <div className="px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-600">
              {pagination.currentPage} / {pagination.totalPages}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
              }
              disabled={!pagination.hasNext}
              className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
            >
              Next
            </button>
          </div>
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
