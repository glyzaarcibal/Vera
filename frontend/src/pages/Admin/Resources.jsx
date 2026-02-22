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
import "../../styles/GlobalDesign.css";

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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Resource <span className="gradient-text">Management</span>
        </h1>
        <p className="page-subtitle">Curate and organize educational and support resources</p>
      </div>

      <div className="design-section">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full md:w-96">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search resources by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:bg-white transition-all shadow-sm"
            />
          </div>
          <button
            onClick={handleCreate}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95"
          >
            <MdAdd className="text-xl" />
            <span>Add Resource</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Links</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resources.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                    No resources found
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {resource.image_url ? (
                          <img
                            src={resource.image_url}
                            alt={resource.title}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                            <MdImage className="text-gray-300 text-2xl" />
                          </div>
                        )}
                        <div className="font-bold text-gray-800 leading-tight">
                          {resource.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {resource.description || "No description provided."}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {resource.category || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg w-fit border border-gray-100">
                        <span className="text-xs font-bold text-gray-600">
                          {resource.links?.length || 0}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Links</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                          title="Edit resource"
                        >
                          <MdEdit className="text-xl" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
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
