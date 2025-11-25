import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdArrowBack, MdSort, MdChevronLeft, MdChevronRight, MdDelete, MdImage, MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import axiosInstance from "../../utils/axios.instance";
import Skeleton from "../../components/Skeleton";
import RiskBadge from "../../components/RiskBadge";
import SessionCard from "../../components/SessionCard";
import SessionTable from "../../components/SessionTable";
import ViewToggle from "../../components/ViewToggle";
import FilterChips from "../../components/FilterChips";

const UserSessions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState("card");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = highest risk first

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    limit: 9,
    hasNext: false,
    hasPrev: false,
  });

  // Filter state
  const [typeFilter, setTypeFilter] = useState(["voice", "text"]);
  const [riskFilters, setRiskFilters] = useState([]);

  // Resource assignment state
  const [availableResources, setAvailableResources] = useState([]);
  const [assignedResources, setAssignedResources] = useState([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [pagination.currentPage, typeFilter, riskFilters]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSessions(),
      fetchUserInfo(),
      fetchAvailableResources(),
      fetchAssignedResources(),
    ]);
    setLoading(false);
  };

  const fetchUserInfo = async () => {
    try {
      const res = await axiosInstance.get(
        `/admin/users/get-user-info/${userId}`
      );
      const { profile } = res.data;
      console.log(profile);
      setUserInfo(profile);
    } catch (e) {
      console.error("Error fetching user info:", e);
      alert("Failed to load user information");
    }
  };

  const fetchSessions = async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("page", pagination.currentPage);
      params.append("limit", pagination.limit);

      // Type filter: if both are selected or none, use "all"
      if (typeFilter.length === 1) {
        params.append("type", typeFilter[0]);
      } else {
        params.append("type", "all");
      }

      // Risk filter
      if (riskFilters.length > 0) {
        params.append("riskLevels", riskFilters.join(","));
      }

      const res = await axiosInstance.get(
        `/admin/users/get-sessions-by-user/${userId}?${params.toString()}`
      );
      const { sessions: fetchedSessions, pagination: paginationData } = res.data;
      console.log(fetchedSessions, paginationData);
      setSessions(sortSessionsByRisk(fetchedSessions, sortOrder));
      setPagination(paginationData);
    } catch (e) {
      console.error("Error fetching sessions:", e);
      alert("Failed to load sessions");
    }
  };

  const sortSessionsByRisk = (sessionList, order) => {
    return [...sessionList].sort((a, b) => {
      const scoreA = a.risk_score ?? -1;
      const scoreB = b.risk_score ?? -1;
      return order === "desc" ? scoreB - scoreA : scoreA - scoreB;
    });
  };

  const handleSortToggle = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newOrder);
    setSessions(sortSessionsByRisk(sessions, newOrder));
  };

  const handleTypeFilterToggle = (value) => {
    setTypeFilter((prev) => {
      if (prev.includes(value)) {
        const newFilters = prev.filter((f) => f !== value);
        // Keep at least one or reset to both
        return newFilters.length === 0 ? ["voice", "text"] : newFilters;
      } else {
        return [...prev, value];
      }
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1
  };

  const handleRiskFilterToggle = (value) => {
    setRiskFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((f) => f !== value);
      } else {
        return [...prev, value];
      }
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  // Resource assignment functions
  const fetchAvailableResources = async () => {
    try {
      const res = await axiosInstance.get("/resources");
      setAvailableResources(res.data.resources || []);
    } catch (e) {
      console.error("Error fetching available resources:", e);
    }
  };

  const fetchAssignedResources = async () => {
    try {
      const res = await axiosInstance.get(`/resources/get-assignments/${userId}`);
      setAssignedResources(res.data.assignments || []);
    } catch (e) {
      console.error("Error fetching assigned resources:", e);
    }
  };

  const handleResourceSelect = (resourceId) => {
    setSelectedResourceIds((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleAssignResources = async () => {
    if (selectedResourceIds.length === 0) return;

    setAssigning(true);
    try {
      // Assign each selected resource
      for (const resourceId of selectedResourceIds) {
        await axiosInstance.post("/resources/assign-resource", {
          user_id: userId,
          resource_id: resourceId,
        });
      }

      alert(`Successfully assigned ${selectedResourceIds.length} resource(s)`);
      setSelectedResourceIds([]);
      await fetchAssignedResources();
    } catch (e) {
      console.error("Error assigning resources:", e);
      alert(e.response?.data?.message || "Failed to assign resources");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to remove this resource assignment?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/resources/delete-assignment/${assignmentId}`);
      alert("Resource assignment removed successfully");
      await fetchAssignedResources();
    } catch (e) {
      console.error("Error removing assignment:", e);
      alert(e.response?.data?.message || "Failed to remove assignment");
    }
  };

  const getRiskStats = () => {
    const stats = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      notAssessed: 0,
    };

    sessions.forEach((session) => {
      if (!session.risk_level) {
        stats.notAssessed++;
      } else {
        stats[session.risk_level.toLowerCase()]++;
      }
    });

    return stats;
  };

  const getOverallRisk = () => {
    if (sessions.length === 0) return { level: null, score: 0 };

    const assessedSessions = sessions.filter((s) => s.risk_score != null);
    if (assessedSessions.length === 0) return { level: null, score: 0 };

    // Calculate average risk score
    const avgScore =
      assessedSessions.reduce((sum, s) => sum + s.risk_score, 0) /
      assessedSessions.length;

    // Determine overall level based on average score (0-100 scale)
    let level = "low";
    if (avgScore >= 70) level = "critical";
    else if (avgScore >= 50) level = "high";
    else if (avgScore >= 30) level = "moderate";

    return { level, score: avgScore };
  };

  const riskStats = getRiskStats();
  const overallRisk = getOverallRisk();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg text-indigo-500 text-[15px] font-medium shadow-sm hover:bg-indigo-50 hover:-translate-x-0.5 transition-all mb-5"
          onClick={() => navigate(-1)}
        >
          <MdArrowBack className="text-xl" />
          <span>Back</span>
        </button>

        {loading ? (
          <div className="flex items-center gap-5 bg-white p-6 rounded-xl shadow-sm">
            <Skeleton variant="avatar" width="80px" height="80px" />
            <div className="flex-1">
              <Skeleton variant="title" width="200px" />
              <Skeleton variant="text" width="300px" />
            </div>
          </div>
        ) : userInfo ? (
          <div className="flex items-center gap-5 bg-white p-6 rounded-xl shadow-sm">
            <img
              src={userInfo.avatar_url || "https://via.placeholder.com/80"}
              alt={userInfo.username}
              className="w-20 h-20 rounded-full object-cover border-[3px] border-indigo-50"
            />
            <div className="flex-1">
              <h1 className="text-[28px] font-bold text-gray-800 mb-2">
                {userInfo.username || userInfo.email}
              </h1>
              <p className="text-base text-gray-600 mb-3">{userInfo.email}</p>
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                <span>ID: {userInfo.id}</span>
                <span>•</span>
                <span>Role: {userInfo.role}</span>
                <span>•</span>
                <span>
                  Joined: {new Date(userInfo.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Store Conversations:</span>
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-md ${
                      userInfo.permit_store
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {userInfo.permit_store ? "Allowed" : "Denied"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">AI Analysis:</span>
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-md ${
                      userInfo.permit_analyze
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {userInfo.permit_analyze ? "Allowed" : "Denied"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-white p-5 md:px-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              Overall Risk Assessment
            </h3>
            <p className="text-sm text-gray-500">
              Based on {sessions.filter((s) => s.risk_score != null).length}{" "}
              assessed sessions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Risk Score</div>
              <div className="text-3xl font-bold text-gray-800">
                {overallRisk.score.toFixed(0)}
                <span className="text-lg text-gray-400">/100</span>
              </div>
            </div>
            <div className="h-16 w-px bg-gray-200"></div>
            <div>
              <div className="text-sm text-gray-500 mb-2">Risk Level</div>
              <RiskBadge level={overallRisk.level} size="lg" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Risk Distribution
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <RiskBadge level="low" />
              <span className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {riskStats.low}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level="moderate" />
              <span className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {riskStats.moderate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level="high" />
              <span className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {riskStats.high}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level="critical" />
              <span className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {riskStats.critical}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level={null} />
              <span className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {riskStats.notAssessed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Resources Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Assign Resources</h3>
          <button
            onClick={handleAssignResources}
            disabled={selectedResourceIds.length === 0 || assigning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedResourceIds.length > 0 && !assigning
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {assigning ? "Assigning..." : `Assign Selected (${selectedResourceIds.length})`}
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {availableResources.length === 0 ? (
              <p className="text-sm text-gray-500">No resources available</p>
            ) : (
              availableResources.map((resource) => (
                <div
                  key={resource.id}
                  className={`flex-shrink-0 w-[180px] bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    selectedResourceIds.includes(resource.id)
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200"
                  }`}
                  onClick={() => handleResourceSelect(resource.id)}
                >
                  <div className="relative">
                    {resource.image_url ? (
                      <img
                        src={resource.image_url}
                        alt={resource.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <MdImage className="w-12 h-12 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      {selectedResourceIds.includes(resource.id) ? (
                        <MdCheckBox className="w-6 h-6 text-blue-600 bg-white rounded" />
                      ) : (
                        <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400 bg-white rounded" />
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    {resource.category && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-2">
                        {resource.category}
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                      {resource.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {resource.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assigned Resources Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Assigned Resources ({assignedResources.length})
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {assignedResources.length === 0 ? (
              <p className="text-sm text-gray-500">No resources assigned yet</p>
            ) : (
              assignedResources.map((assignment) => {
                const resource = availableResources.find((r) => r.id === assignment.resource_id);
                if (!resource) return null;

                return (
                  <div
                    key={assignment.id}
                    className="flex-shrink-0 w-[180px] bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-lg relative"
                  >
                    <div className="relative">
                      {resource.image_url ? (
                        <img
                          src={resource.image_url}
                          alt={resource.title}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <MdImage className="w-12 h-12 text-white opacity-50" />
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-md"
                        title="Remove assignment"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-3">
                      {resource.category && (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-2">
                          {resource.category}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                        {resource.title}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Sessions ({pagination.totalSessions})
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white rounded-lg text-gray-600 text-sm font-medium border border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all"
              onClick={handleSortToggle}
            >
              <MdSort className="text-lg" />
              <span>
                {sortOrder === "desc"
                  ? "Highest Risk First"
                  : "Lowest Risk First"}
              </span>
            </button>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FilterChips
            label="Session Type"
            filters={[
              { label: "Voice", value: "voice" },
              { label: "Text", value: "text" },
            ]}
            activeFilters={typeFilter}
            onFilterToggle={handleTypeFilterToggle}
          />
          <FilterChips
            label="Risk Level"
            filters={[
              { label: "Low", value: "low" },
              { label: "Moderate", value: "moderate" },
              { label: "High", value: "high" },
              { label: "Critical", value: "critical" },
            ]}
            activeFilters={riskFilters}
            onFilterToggle={handleRiskFilterToggle}
          />
        </div>
      </div>

      {loading ? (
        <div
          className={
            view === "card"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              : ""
          }
        >
          {view === "card" ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))
          ) : (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <Skeleton variant="table-row" count={6} />
            </div>
          )}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white py-[60px] px-10 rounded-xl shadow-sm text-center">
          <p className="text-base text-gray-400">
            No sessions found for this user.
          </p>
        </div>
      ) : view === "card" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-xl shadow-sm">
              <div className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} • Total:{" "}
                {pagination.totalSessions} sessions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pagination.hasPrev
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <MdChevronLeft className="text-lg" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pagination.hasNext
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span>Next</span>
                  <MdChevronRight className="text-lg" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <SessionTable sessions={sessions} />
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-xl shadow-sm">
              <div className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} • Total:{" "}
                {pagination.totalSessions} sessions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pagination.hasPrev
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <MdChevronLeft className="text-lg" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pagination.hasNext
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span>Next</span>
                  <MdChevronRight className="text-lg" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserSessions;
