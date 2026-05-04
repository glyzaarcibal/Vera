import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios.instance";
import "./Admin/UserManagement.css";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get("/profile/fetch-sessions");
            const { chat_sessions } = res.data;

            const appointmentNotifications = chat_sessions
                .flatMap((session) =>
                    (session.doctor_notes || [])
                        .filter((note) => note.next_appointment)
                        .map((note) => ({
                            id: `apt-${note.id}`,
                            title: "New Appointment Scheduled",
                            message: `Dr. ${note.profiles?.first_name || ""} ${note.profiles?.last_name || "Unknown"
                                } has scheduled a new appointment for you.`,
                            time: new Date(note.created_at).toLocaleDateString(),
                            date: note.next_appointment,
                            type: "appointment",
                            icon: (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            ),
                        }))
                );

            const staticNotifications = [
                {
                    id: 1,
                    title: "New Feature: Emotion Recognition",
                    message: "You can now track your emotions through voice analysis!",
                    time: "2 hours ago",
                    type: "update",
                    icon: (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    ),
                },
            ];

            setNotifications([...appointmentNotifications, ...staticNotifications]);
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div
            className="user-management-container"
            style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 0" }}
        >
            <div className="page-header" style={{ marginBottom: 32 }}>
                <h1
                    className="page-title"
                    style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: "#22223b",
                        marginBottom: 8,
                    }}
                >
                    Notifications {" "}
                    <span
                        className="gradient-text"
                        style={{
                            background: "linear-gradient(90deg,#667eea,#764ba2)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        & Updates
                    </span>
                </h1>
                <p
                    className="page-subtitle"
                    style={{ color: "#6b7280", fontSize: 18, fontWeight: 500 }}
                >
                    Track your appointment alerts and product updates
                </p>
            </div>

            <div
                className="design-section"
                style={{
                    background: "#fff",
                    borderRadius: 24,
                    boxShadow: "0 8px 32px rgba(102,126,234,0.08)",
                    padding: 32,
                    marginBottom: 32,
                }}
            >
                {loading ? (
                    <div className="text-center py-20" style={{ color: "#6b7280", fontSize: 16 }}>
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20" style={{ color: "#9ca3af", fontSize: 16 }}>
                        No new notifications
                    </div>
                ) : (
                    <div
                        className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm"
                        style={{ background: "#fff" }}
                    >
                        <table className="w-full text-left border-collapse" style={{ fontSize: 15 }}>
                            <thead>
                                <tr
                                    style={{
                                        background: "#f8fafc",
                                        textTransform: "uppercase",
                                        letterSpacing: 1.2,
                                        color: "#a0aec0",
                                        fontWeight: 700,
                                        fontSize: 12,
                                    }}
                                >
                                    <th style={{ padding: "18px 24px" }}>Notification</th>
                                    <th style={{ padding: "18px 24px" }}>Type</th>
                                    <th style={{ padding: "18px 24px" }}>Created</th>
                                    <th style={{ padding: "18px 24px" }}>Appointment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((n) => (
                                    <tr key={n.id} style={{ transition: "background 0.15s" }} className="hover:bg-gray-50 group">
                                        <td style={{ padding: "18px 24px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: "50%",
                                                        background: "linear-gradient(135deg,#f0eeff,#fef5ff)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: "#667eea",
                                                        border: "1px solid #fff",
                                                        boxShadow: "0 2px 8px rgba(102,126,234,0.08)",
                                                    }}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {n.icon}
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#22223b", fontSize: 16 }}>{n.title}</div>
                                                    <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{n.message}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "18px 24px" }}>
                                            <span
                                                style={{
                                                    background: n.type === "appointment" ? "#ede9fe" : "#dbeafe",
                                                    color: n.type === "appointment" ? "#7c3aed" : "#2563eb",
                                                    border: "1px solid " + (n.type === "appointment" ? "#ddd6fe" : "#bfdbfe"),
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    padding: "4px 14px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                {n.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: "18px 24px", fontSize: 14, color: "#64748b", fontWeight: 500 }}>
                                            {n.time}
                                        </td>
                                        <td style={{ padding: "18px 24px", fontSize: 14, color: "#64748b", fontWeight: 500 }}>
                                            {n.type === "appointment" ? formatDate(n.date) : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
