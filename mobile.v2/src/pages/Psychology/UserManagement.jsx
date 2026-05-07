import React, { useEffect, useState } from "react";
import { MdAdd, MdSearch, MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../Admin/UserManagement.css"; // Reuse styling
import axiosInstance from "../../utils/axios.instance";
import ReusableModal from "../../components/ReusableModal";

const PsychologyUserManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState({ isOpen: false, title: "", message: "", type: "info" });
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
        exclude_roles: "admin",
      });

      const res = await axiosInstance.get(
        `/admin/users/get-all-users?${params}`
      );
      const usersData = res.data.users;
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
      setNotification({ 
        isOpen: true, 
        title: "Fetch Failed", 
        message: e.response?.data?.message || "Internal Server Error",
        type: "error"
      });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axiosInstance.post("/admin/users/create-user", formData);
      setNotification({ 
        isOpen: true, 
        title: "Success", 
        message: "User account has been created successfully.",
        type: "success"
      });
      setShowAddModal(false);
      setFormData({ email: "", password: "", username: "", role: "user" });
      fetchAllUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      setNotification({ 
        isOpen: true, 
        title: "Creation Failed", 
        message: error.response?.data?.message || "Failed to create user",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="user-management-container relative" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0', minHeight: '100vh' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ fontSize: 36, fontWeight: 800, color: '#22223b', marginBottom: 8 }}>
          User <span className="gradient-text" style={{ background: 'linear-gradient(90deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Management</span>
        </h1>
        <p className="page-subtitle" style={{ color: '#6b7280', fontSize: 18, fontWeight: 500 }}>View system users, and manage sessions</p>
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
              <option value="psychology">Psychology</option>
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
                    background: user.role === 'admin' ? '#ede9fe' : (user.role === 'psychology' ? '#fce7f3' : (user.role === 'moderator' ? '#dbeafe' : '#f3f4f6')),
                    color: user.role === 'admin' ? '#7c3aed' : (user.role === 'psychology' ? '#db2777' : (user.role === 'moderator' ? '#2563eb' : '#6b7280')),
                    border: '1px solid ' + (user.role === 'admin' ? '#ddd6fe' : (user.role === 'psychology' ? '#fbcfe8' : (user.role === 'moderator' ? '#bfdbfe' : '#e5e7eb'))),
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
                      onClick={() => navigate(`/psychology/sessions/${user.id}`)}
                      style={{ padding: 10, color: '#6366f1', background: '#f5f3ff', borderRadius: 12, border: 'none', transition: 'background 0.15s' }}
                      title="View sessions"
                    >
                      <MdSearch style={{ fontSize: 20 }} />
                    </button>
                    {/* Excluded edit and delete buttons for psychology user */}
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

      <ReusableModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({ email: "", password: "", username: "", role: "user" });
        }}
        title="Create New User"
        type="confirm"
        position="absolute"
      >
        <div className="py-2">
          <p className="text-slate-500 mb-8 text-[15px] font-medium leading-relaxed">Please provide the credentials for the new system user.</p>
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="space-y-5">
              <div className="group">
                <label className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2 ml-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter full name or username"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>
              <div className="group">
                <label className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>
              <div className="group">
                <label className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2 ml-1">Security Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>
              <div className="group">
                <label className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2 ml-1">Assigned Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700 cursor-pointer appearance-none"
                >
                  <option value="user">Standard User</option>
                  <option value="moderator">System Moderator</option>
                  <option value="psychology">Licensed Psychologist</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ email: "", password: "", username: "", role: "user" });
                }}
                className="flex-1 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-[12px] tracking-widest transition-all"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-[1.5] group relative overflow-hidden px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[12px] tracking-widest transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
              >
                <span className="relative z-10">{isLoading ? "PROCESSING..." : "CREATE ACCOUNT"}</span>
                <div className="absolute inset-x-0 h-full w-full bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          </form>
        </div>
      </ReusableModal>

      <ReusableModal 
        isOpen={notification.isOpen} 
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        position="absolute"
      />
    </div>
  );
};

export default PsychologyUserManagement;
