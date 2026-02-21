import React, { useEffect, useState } from "react";
import {
  MdAdd,
  MdSearch,
  MdEdit,
  MdDelete,
  MdClose,
  MdImage,
} from "react-icons/md";
import axiosInstance from "../../utils/axios.instance";

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [resources, setResources] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedResource, setSelectedResource] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    links: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchResources();
  }, [debouncedSearch]);

  const fetchResources = async () => {
    try {
      const params = debouncedSearch
        ? `?search=${encodeURIComponent(debouncedSearch)}`
        : "";
      const res = await axiosInstance.get(`/resources${params}`);
      setResources(res.data.resources || res.data || []);
    } catch (e) {
      console.error("Error fetching resources:", e);
      alert(e.response?.data?.message || "Failed to fetch resources");
    }
  };

  const handleCreate = () => {
    setModalMode("create");
    setFormData({ title: "", description: "", category: "", links: [] });
    setSelectedResource(null);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleEdit = (resource) => {
    setModalMode("edit");
    setFormData({
      title: resource.title || "",
      description: resource.description || "",
      category: resource.category || "",
      links: resource.links || [],
    });
    setSelectedResource(resource);
    setImageFile(null);
    setImagePreview(resource.image_url || null);
    setShowModal(true);
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/resources/${resourceId}`);
      alert("Resource deleted successfully");
      fetchResources();
    } catch (e) {
      console.error("Error deleting resource:", e);
      alert(e.response?.data?.message || "Failed to delete resource");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let resourceId = selectedResource?.id;

      if (modalMode === "create") {
        const res = await axiosInstance.post("/resources", formData);
        resourceId = res.data.resource?.id || res.data.id;
        alert("Resource created successfully");
      } else {
        await axiosInstance.put(`/resources/${resourceId}`, formData);
        alert("Resource updated successfully");
      }

      // Upload image if selected
      if (imageFile && resourceId) {
        await handleImageUpload(resourceId);
      }

      setShowModal(false);
      fetchResources();
    } catch (e) {
      console.error("Error saving resource:", e);
      alert(e.response?.data?.message || "Failed to save resource");
    }
  };

  const handleImageUpload = async (resourceId) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      await axiosInstance.post(
        `/resources/${resourceId}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("Image uploaded successfully");
    } catch (e) {
      console.error("Error uploading image:", e);
      alert(e.response?.data?.message || "Failed to upload image");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLinksChange = (e) => {
    const value = e.target.value;
    const linksArray = value
      .split(",")
      .map((link) => link.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      links: linksArray,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Resource Management</h1>
          <p className="text-lg text-gray-500 mt-2">Manage and organize all resources in the system.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow transition-all text-lg font-semibold"
        >
          <MdAdd className="text-2xl" />
          <span>Add Resource</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-2xl" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Links</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resources.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-lg font-medium">
                  No resources found
                </td>
              </tr>
            ) : (
              resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-4 py-3 align-middle">
                    {resource.image_url ? (
                      <img
                        src={resource.image_url}
                        alt={resource.title}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                        <MdImage className="text-gray-400 text-2xl" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="font-bold text-gray-900 text-base">
                      {resource.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle max-w-xs">
                    <span className="text-gray-700 truncate block text-sm">
                      {resource.description || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 border border-blue-200">
                      {resource.category || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {resource.links && resource.links.length > 0 ? (
                      <span className="text-blue-600 underline text-xs font-medium">
                        {resource.links.length} link(s)
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                        title="Edit resource"
                      >
                        <MdEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                        title="Delete resource"
                      >
                        <MdDelete className="text-xl" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 my-8 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-extrabold text-gray-900">
                {modalMode === "create" ? "Create Resource" : "Edit Resource"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="text-3xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Image</label>
                  <div className="flex items-center gap-5">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-200 shadow"
                      />
                    )}
                    <label className="cursor-pointer flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium border border-gray-300">
                      <MdImage className="text-2xl" />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Resource title"
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Resource description"
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="e.g., Mental Health, Therapy, Articles"
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Links (comma-separated)</label>
                  <input
                    type="text"
                    name="links"
                    value={formData.links.join(", ")}
                    onChange={handleLinksChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="https://example.com, https://example2.com"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all text-lg font-semibold"
                >
                  {modalMode === "create" ? "Create" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
