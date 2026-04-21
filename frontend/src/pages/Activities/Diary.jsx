import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";
import axiosInstance from "../../utils/axios.instance";
import ModalPortal from "../../components/ModalPortal";
import jarImage from "../../assets/jar.png";

const Diary = () => {
  const user = useSelector(selectUser);
  const userId = user?.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadEntries();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadEntries = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get("/activities");
      const activities = response.data.activities || [];
      
      const diaryEntries = activities
        .filter(act => act.activity_type === "diary")
        .map(act => ({
          id: act.id,
          ...act.data
        }))
        .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

      setEntries(diaryEntries);
    } catch (error) {
      console.error("Failed to load entries", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntryToDB = async (newEntry) => {
    if (!userId) return;
    try {
      const res = await axiosInstance.post("/activities/save", {
        activityType: "diary",
        data: newEntry
      });
      
      if (res.data?.updatedTokens !== null) {
        dispatch(updateTokens(res.data.updatedTokens));
      }
      
      // Refresh list
      loadEntries();
    } catch (error) {
      console.error("Failed to save entry", error);
      alert("Failed to save your memory to the cloud.");
    }
  };

  const handleSave = () => {
    if (entry.trim() !== "" && userId) {
      const newEntry = {
        text: entry,
        date: new Date().toLocaleString(),
        type: getRandomEntryType(),
        timestamp: new Date().toISOString()
      };
      
      saveEntryToDB(newEntry);
      setEntry("");
    }
  };

  const getRandomEntryType = () => {
    const types = ["heart", "leaf", "fish"];
    return types[Math.floor(Math.random() * types.length)];
  };

  const handleEntryPress = (entry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const getEntryIcon = (type) => {
    return type === "heart" ? "❤️" : type === "leaf" ? "🍃" : "🐟";
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const deleteEntry = async (id) => {
    if (window.confirm("Backend deletion not yet fully implemented for general activities. Hide it for now?")) {
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
      setModalVisible(false);
    }
  };

  const clearAllEntries = () => {
    if (window.confirm("Are you sure you want to clear all diary entries?")) {
      setEntries([]);
    }
  };

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 35%, #fff0f9 65%, #f0f9ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "30px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
          maxWidth: "400px"
        }}>
          <span style={{ fontSize: "60px", display: "block", marginBottom: "20px" }}>🔒</span>
          <h2 style={{ color: "#764ba2", marginBottom: "15px" }}>Identification Needed</h2>
          <p style={{ color: "#666", marginBottom: "25px" }}>Your jar of memories is a private place. Please log in to view or add new memories.</p>
          <button 
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 30px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "15px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Log In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 35%, #fff0f9 65%, #f0f9ff 100%)",
        padding: "20px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
      }}
    >
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "5%",
        left: "5%",
        width: "200px",
        height: "200px",
        background: "radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        bottom: "5%",
        right: "5%",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 12s ease-in-out infinite reverse",
      }} />

      {/* CSS Animations */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "30px",
          maxWidth: "800px",
          margin: "0 auto 30px auto",
        }}
      >
        <button
          onClick={handleGoBack}
          style={{
            background: "white",
            border: "none",
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
            e.target.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
          }}
        >
          ←
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "32px" }}>🫙</span>
          <h1
            style={{
              fontSize: "32px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              fontWeight: "bold",
            }}
          >
            Diary Jar
          </h1>
        </div>
        
        {entries.length > 0 && (
          <button
            onClick={clearAllEntries}
            style={{
              background: "#ff6b6b",
              border: "none",
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "white",
              boxShadow: "0 5px 15px rgba(255, 107, 107, 0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.boxShadow = "0 10px 25px rgba(255, 107, 107, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 5px 15px rgba(255, 107, 107, 0.3)";
            }}
            title="Clear all entries"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "18px",
          textAlign: "center",
          marginBottom: "30px",
          color: "#666",
          fontStyle: "italic",
          maxWidth: "800px",
          margin: "0 auto 30px auto",
        }}
      >
        "Take a moment to reflect on every day."
      </p>

      {/* Jar Container */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto 30px auto",
          minHeight: "300px",
          background: "linear-gradient(135deg, rgba(245, 247, 250, 0.9) 0%, rgba(233, 236, 239, 0.9) 100%)",
          borderRadius: "20px",
          padding: "20px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <img
          src={jarImage}
          alt="Diary Jar"
          style={{
            width: "100%",
            maxWidth: "400px",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.2))",
          }}
        />
        
        {/* Floating Icons */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "10px",
            padding: "20px",
            pointerEvents: "none",
          }}
        >
          {loading ? (
             <p style={{ color: '#667eea', fontWeight: 'bold' }}>Looking inside the jar...</p>
          ) : entries.map((entry, index) => (
            <button
              key={entry.id || index}
              onClick={() => handleEntryPress(entry)}
              style={{
                background: "white",
                border: "none",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
                animation: `float ${2 + index * 0.5}s ease-in-out infinite`,
                transform: `rotate(${Math.random() * 20 - 10}deg)`,
                pointerEvents: "auto",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.2)";
                e.target.style.boxShadow = "0 10px 25px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = `scale(1) rotate(${Math.random() * 20 - 10}deg)`;
                e.target.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";
              }}
            >
              {getEntryIcon(entry.type)}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Counter */}
      {entries.length > 0 && (
        <div style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#667eea",
          fontWeight: "bold",
          maxWidth: "800px",
          margin: "0 auto 20px auto",
        }}>
          {entries.length} {entries.length === 1 ? "memory" : "memories"} in your jar
        </div>
      )}

      {/* Input Section */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(245, 247, 250, 0.9) 0%, rgba(233, 236, 239, 0.9) 100%)",
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "20px",
          maxWidth: "800px",
          margin: "0 auto 20px auto",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <textarea
          placeholder="What's on your mind today? ✍️"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "15px",
            border: "2px solid transparent",
            borderRadius: "15px",
            fontSize: "16px",
            fontFamily: "inherit",
            resize: "vertical",
            marginBottom: "15px",
            boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#667eea";
            e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "transparent";
            e.target.style.boxShadow = "inset 0 2px 5px rgba(0,0,0,0.1)";
          }}
        />

        <button
          onClick={handleSave}
          disabled={!entry.trim()}
          style={{
            background: !entry.trim() 
              ? "#ccc" 
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            padding: "15px 30px",
            borderRadius: "50px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: !entry.trim() ? "not-allowed" : "pointer",
            width: "100%",
            boxShadow: !entry.trim() 
              ? "none" 
              : "0 10px 20px rgba(102, 126, 234, 0.3)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (entry.trim()) {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 15px 30px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (entry.trim()) {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 10px 20px rgba(102, 126, 234, 0.3)";
            }
          }}
        >
          Drop into Jar ✨
        </button>
      </div>

      {/* Recent Entries Preview */}
      {entries.length > 0 && (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <h3 style={{
            fontSize: "18px",
            color: "#333",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}>
            📝 Recent Memories
          </h3>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {entries.slice(0, 3).map((entry, index) => (
              <button
                key={entry.id || index}
                onClick={() => handleEntryPress(entry)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                  background: "rgba(248, 249, 250, 0.8)",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(233, 236, 239, 0.9)";
                  e.currentTarget.style.transform = "translateX(5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(248, 249, 250, 0.8)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <span style={{ fontSize: "24px" }}>
                  {getEntryIcon(entry.type)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: "2px",
                  }}>
                    {entry.text.substring(0, 30)}
                    {entry.text.length > 30 ? "..." : ""}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "#999",
                  }}>
                    {entry.date}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalVisible && selectedEntry && (
        <ModalPortal>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(5px)",
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={() => setModalVisible(false)}
        >
          <div
            style={{
              width: "90%",
              maxWidth: "500px",
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "20px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              position: "relative",
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalVisible(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#999",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.color = "#333"}
              onMouseLeave={(e) => e.target.style.color = "#999"}
            >
              ✕
            </button>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "48px" }}>
                {getEntryIcon(selectedEntry.type)}
              </span>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  color: "#333",
                }}
              >
                Memory from your Jar
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#667eea",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                {selectedEntry.date}
              </p>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
                padding: "20px",
                borderRadius: "15px",
                marginBottom: "20px",
                minHeight: "100px",
              }}
            >
              <p
                style={{
                  fontSize: "18px",
                  lineHeight: "1.6",
                  color: "#333",
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                "{selectedEntry.text}"
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#5a67d8";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#667eea";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Close
              </button>
              <button
                onClick={() => deleteEntry(selectedEntry.id)}
                style={{
                  backgroundColor: "#ff6b6b",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#ff5252";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#ff6b6b";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default Diary;
