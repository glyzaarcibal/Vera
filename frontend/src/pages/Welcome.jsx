import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors";
import axiosInstance from "../utils/axios.instance";
import "./Welcome.css";

const Welcome = () => {
  const user = useSelector(selectUser);
  const [resources, setResources] = useState([]);
  const [assignedResources, setAssignedResources] = useState([]);
  const [assignedResourceDetails, setAssignedResourceDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    await fetchResources();
    if (user?.id) {
      await fetchAssignedResources();
    }
    setLoading(false);
  };

  const fetchResources = async () => {
    try {
      const res = await axiosInstance.get("/resources");
      setResources(res.data.resources || res.data || []);
    } catch (e) {
      console.error("Error fetching resources:", e);
    }
  };

  const fetchAssignedResources = async () => {
    try {
      const res = await axiosInstance.get(`/resources/get-assignments/${user.id}`);
      const assignments = res.data.assignments || [];
      setAssignedResources(assignments);

      // Map assignments to full resource details
      const resourcesRes = await axiosInstance.get("/resources");
      const allResources = resourcesRes.data.resources || [];
      const details = assignments
        .map(assignment => allResources.find(r => r.id === assignment.resource_id))
        .filter(Boolean);
      setAssignedResourceDetails(details);
    } catch (e) {
      console.error("Error fetching assigned resources:", e);
    }
  };

  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const featuredResource = resources[0];
  const otherResources = resources.slice(1, 7); // Show up to 6 more resources

  return (
    <div className="welcome-container">
      <div className="welcome-hero">
        <div className="hero-badge">Mental Health Support</div>
        <h1 className="hero-title">
          Welcome to <span className="gradient-text">V.E.R.A.</span>
        </h1>
        <p className="hero-subtitle">
          Voice Emotion Recognition Application
        </p>
        <p className="hero-description">
          Your AI-powered companion for mental well-being, offering support through
          voice recognition, predictive analytics, and emotional tracking.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </div>
          <h3 className="feature-title">Voice Emotion Recognition</h3>
          <p className="feature-description">
            Express yourself naturally and let our AI understand your emotional state through voice analysis.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 className="feature-title">AI Chatbot Support</h3>
          <p className="feature-description">
            Get immediate emotional support and mental health first aid when you need it most.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <h3 className="feature-title">Mood Tracking</h3>
          <p className="feature-description">
            Monitor your emotional patterns and gain valuable insights into your mental wellness journey.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h3 className="feature-title">Predictive Analytics</h3>
          <p className="feature-description">
            Early detection of emotional distress patterns to provide timely assistance and intervention.
          </p>
        </div>
      </div>

      {/* Suggested Resources For You Section */}
      {!loading && user?.id && assignedResourceDetails.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-sm font-semibold text-indigo-700">Personalized for You</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Suggested Resources
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Resources recommended by your advisor to support your mental wellness journey
            </p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6">
              {assignedResourceDetails.map((resource) => (
                <div
                  key={resource.id}
                  className="flex-shrink-0 w-[280px] bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {resource.image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={resource.image_url}
                        alt={resource.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      {resource.category && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
                          {resource.category}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {resource.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                      {resource.description}
                    </p>
                    {resource.links && resource.links.length > 0 && (
                      <div className="space-y-2 mt-auto">
                        <p className="text-xs font-medium text-gray-600">Links:</p>
                        <div className="flex flex-wrap gap-2">
                          {resource.links.slice(0, 2).map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-medium transition-colors"
                              title={link}
                            >
                              <svg
                                className="mr-1 w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              <span className="truncate max-w-[150px]">{extractDomain(link)}</span>
                            </a>
                          ))}
                          {resource.links.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 text-gray-500 text-xs">
                              +{resource.links.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resources Section */}
      {!loading && resources.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Helpful Resources
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore curated content and tools to support your mental wellness journey
            </p>
          </div>

          {/* Featured Resource */}
          {featuredResource && (
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  {featuredResource.image_url ? (
                    <div className="h-64 md:h-auto">
                      <img
                        src={featuredResource.image_url}
                        alt={featuredResource.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-64 md:h-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <svg
                        className="w-24 h-24 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-8 flex flex-col justify-center">
                    {featuredResource.category && (
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-4 w-fit">
                        {featuredResource.category}
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {featuredResource.title}
                    </h3>
                    <p className="text-gray-600 mb-6 line-clamp-3">
                      {featuredResource.description}
                    </p>
                    {featuredResource.links && featuredResource.links.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 mb-3">Resources:</p>
                        <div className="flex flex-wrap gap-2">
                          {featuredResource.links.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors text-sm font-medium"
                              title={link}
                            >
                              <svg
                                className="mr-2 w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              {extractDomain(link)}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Resources Grid */}
          {otherResources.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
                >
                  {resource.image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={resource.image_url}
                        alt={resource.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    {resource.category && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-3 w-fit">
                        {resource.category}
                      </span>
                    )}
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {resource.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-2">
                      {resource.description}
                    </p>
                    {resource.links && resource.links.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600">Links:</p>
                        <div className="flex flex-wrap gap-2">
                          {resource.links.slice(0, 2).map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-medium transition-colors"
                              title={link}
                            >
                              <svg
                                className="mr-1 w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              <span className="truncate max-w-[150px]">{extractDomain(link)}</span>
                            </a>
                          ))}
                          {resource.links.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 text-gray-500 text-xs">
                              +{resource.links.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="welcome-footer">
        <p className="footer-text">
          A safe, accessible, and stigma-free platform for mental health support.
        </p>
        <Link to="/about" className="footer-link">
          Learn more about our mission →
        </Link>
      </div>
    </div>
  );
};

export default Welcome;
