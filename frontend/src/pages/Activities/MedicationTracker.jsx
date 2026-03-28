import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.instance";
import { useSelector, useDispatch } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";

const MedicationTracker = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const userId = user?.id;
    const dispatch = useDispatch();

    const [medicationName, setMedicationName] = useState("");
    const [dosage, setDosage] = useState("");
    const [time, setTime] = useState("");
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            loadHistory();
        }
    }, [userId]);

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get("/activities");
            const activities = response.data.activities || [];
            const medHistory = activities
                .filter((act) => act.activity_type === "medication")
                .map((act) => ({
                    id: act.id,
                    ...act.data,
                    timestamp: act.created_at || act.data.timestamp
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistory(medHistory);
        } catch (error) {
            console.error("Failed to load medication history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!medicationName.trim()) return;

        const newEntry = {
            name: medicationName,
            dosage,
            time,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
        };

        try {
            setIsLoading(true);
            const res = await axiosInstance.post("/activities/save", {
                activityType: "medication",
                data: newEntry,
            });

            if (res.data?.updatedTokens !== null) {
                dispatch(updateTokens(res.data.updatedTokens));
            }

            setMedicationName("");
            setDosage("");
            setTime("");
            loadHistory();
        } catch (error) {
            console.error("Failed to save medication", error);
            alert("Failed to save medication entry.");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteEntry = async (id) => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            // Logic for deleting activity would go here if backend supports it
            // For now we just filter locally to provide feedback
            setHistory(history.filter(item => item.id !== id));
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 35%, #fff0f9 65%, #f0f9ff 100%)",
                padding: "20px",
                fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: "white",
                            border: "none",
                            width: "45px",
                            height: "45px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontSize: "24px",
                            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                        }}
                    >
                        ←
                    </button>
                    <h1 style={{
                        fontSize: "32px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        margin: 0,
                        fontWeight: "bold",
                    }}>
                        Medication History 💊
                    </h1>
                </div>

                {/* Input Form */}
                <div style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "20px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                    marginBottom: "30px",
                }}>
                    <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "#333" }}>Log Medication</h2>
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>Medication Name</label>
                                <input
                                    type="text"
                                    value={medicationName}
                                    onChange={(e) => setMedicationName(e.target.value)}
                                    placeholder="e.g. Paracetamol"
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "10px",
                                        border: "1px solid #ddd",
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: "150px" }}>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>Dosage</label>
                                <input
                                    type="text"
                                    value={dosage}
                                    onChange={(e) => setDosage(e.target.value)}
                                    placeholder="e.g. 500mg"
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "10px",
                                        border: "1px solid #ddd",
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: "150px" }}>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>Time Taken</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "10px",
                                        border: "1px solid #ddd",
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !medicationName}
                            style={{
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                border: "none",
                                padding: "15px",
                                borderRadius: "10px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                marginTop: "10px",
                                boxShadow: "0 5px 15px rgba(102, 126, 234, 0.3)",
                            }}
                        >
                            {isLoading ? "Saving..." : "Add to History"}
                        </button>
                    </form>
                </div>

                {/* History List */}
                <div style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "20px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                }}>
                    <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "#333" }}>Past Entries</h2>
                    {history.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#999", fontStyle: "italic" }}>No medication history found.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {history.map((item) => (
                                <div key={item.id} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "15px",
                                    background: "#f8f9fa",
                                    borderRadius: "12px",
                                    borderLeft: "4px solid #667eea",
                                }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 5px 0", fontSize: "16px", color: "#333" }}>{item.name}</h3>
                                        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                                            {item.dosage} {item.time && `at ${item.time}`}
                                        </p>
                                        <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>
                                            {item.date || new Date(item.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteEntry(item.id)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#ff6b6b",
                                            cursor: "pointer",
                                            fontSize: "18px",
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicationTracker;
