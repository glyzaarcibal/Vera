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
import ModalPortal from "../../components/ModalPortal";
import ReusableModal from "../../components/ReusableModal";
import "./Resources.css";

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
  const [errorModal, setErrorModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "error" 
  });

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
      setErrorModal({
        isOpen: true,
        title: "Communication Failure",
        message: e.response?.data?.message || "Failed to fetch resources from the database.",
        type: "error"
      });
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
      setErrorModal({
        isOpen: true,
        title: "Success",
        message: "Resource deleted successfully",
        type: "confirm"
      });
      fetchResources();
    } catch (e) {
      console.error("Error deleting resource:", e);
      setErrorModal({
        isOpen: true,
        title: "Deletion Failure",
        message: e.response?.data?.message || "Internal Server Error occurred while trying to delete this resource.",
        type: "error"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let resourceId = selectedResource?.id;

      if (modalMode === "create") {
        const res = await axiosInstance.post("/resources", formData);
        resourceId = res.data.resource?.id || res.data.id;
        setErrorModal({
          isOpen: true,
          title: "Resource Created",
          message: "The resource has been successfully created.",
          type: "confirm"
        });
      } else {
        await axiosInstance.put(`/resources/${resourceId}`, formData);
        setErrorModal({
          isOpen: true,
          title: "Resource Updated",
          message: "The resource data has been successfully synchronized with the server.",
          type: "confirm"
        });
      }

      // Upload image if selected
      if (imageFile && resourceId) {
        await handleImageUpload(resourceId);
      }

      setShowModal(false);
      fetchResources();
    } catch (e) {
      console.error("Error saving resource:", e);
      setErrorModal({
        isOpen: true,
        title: "Save Failure",
        message: e.response?.data?.message || "Failed to save resource",
        type: "error"
      });
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
      setErrorModal({
        isOpen: true,
        title: "Success",
        message: "Image uploaded successfully",
        type: "confirm"
      });
    } catch (e) {
      console.error("Error uploading image:", e);
      setErrorModal({
        isOpen: true,
        title: "Upload Failure",
        message: e.response?.data?.message || "Failed to upload image",
        type: "error"
      });
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
    <div className="resources-container">
      <div className="resources-header">
        <div className="resources-title-group">
          <h1 className="resources-title">Resources</h1>
          <p className="resources-subtitle">
            Curate and organize educational and support resources
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="resources-add-btn"
        >
          <MdAdd className="text-xl" />
          <span>Add Resource</span>
        </button>
      </div>

      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="resources-listing">
        <div className="listing-header desktop-only-flex">
          <div className="header-cell avatar-cell"></div>
          <div className="header-cell title-cell">Title</div>
          <div className="header-cell desc-cell">Description</div>
          <div className="header-cell cat-cell">Category</div>
          <div className="header-cell link-cell">Links</div>
          <div className="header-cell action-cell">Actions</div>
        </div>
        <div style={{ borderTop: '1px solid #e3e8f0' }} />
        {resources.length === 0 ? (
          <div className="listing-empty">
            No resources found
          </div>
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className="listing-row group">
              {/* Avatar/Image */}
              <div className="row-cell avatar-cell">
                {resource.image_url ? (
                  <img
                    src={resource.image_url}
                    alt={resource.title}
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <MdImage className="text-gray-300 text-xl" />
                  </div>
                )}
              </div>
              {/* Title */}
              <div className="row-cell title-cell">{resource.title}</div>
              {/* Description */}
              <div className="row-cell desc-cell">{resource.description || 'No description provided.'}</div>
              {/* Category */}
              <div className="row-cell cat-cell">
                <span className="cat-badge">
                  {resource.category || 'N/A'}
                </span>
              </div>
              {/* Links */}
              <div className="row-cell link-cell">
                {resource.links && resource.links.length > 0 ? (
                  resource.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      className="resource-card-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link}
                    </a>
                  ))
                ) : (
                  <span className="no-links">No links</span>
                )}
              </div>
              {/* Actions */}
              <div className="row-cell action-cell">
                <button
                  onClick={() => handleEdit(resource)}
                  className="action-btn edit"
                  title="Edit resource"
                >
                  <MdEdit className="text-xl" />
                </button>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="action-btn delete"
                  title="Delete resource"
                >
                  <MdDelete className="text-xl" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-0 max-w-lg w-full mx-4 my-8 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900">
                {modalMode === "create" ? "Add Resource" : "Edit Resource"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="text-3xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8">
              <div className="grid grid-cols-1 gap-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Image</label>
                  <div className="flex items-center gap-5">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover border border-gray-200 shadow"
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
                  <label className="block text-base font-semibold text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
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
                    rows="2"
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
                  <label className="block text-base font-semibold text-gray-700 mb-2">Links <span className="text-xs text-gray-400">(comma-separated)</span></label>
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
        </ModalPortal>
      )}

      <ReusableModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </div>
  );
};

export default Resources;
