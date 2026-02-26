import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios.instance";
import "./About.css";

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
        <div className="max-w-4xl mx-auto px-5 py-10">
            <div className="bg-white rounded-3xl shadow-xl p-10 animate-[fadeIn_0.6s_ease-in]">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-gray-100">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        Notifications & Updates
                    </h1>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        No new notifications
                    </div>
                ) : (
                    <div className="space-y-6">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`group p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/15 ${n.type === "appointment" ? "border-l-4 border-l-indigo-500" : ""
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="w-6 h-6 text-indigo-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            {n.icon}
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                {n.title}
                                            </h3>
                                            <span className="text-xs font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                {n.time}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed mb-3">
                                            {n.message}
                                        </p>
                                        {n.type === "appointment" && (
                                            <div className="bg-white/80 rounded-xl p-3 border border-indigo-100 mb-3">
                                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                                                    Appointment Date
                                                </p>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {formatDate(n.date)}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <span
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${n.type === "appointment"
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }`}
                                            >
                                                {n.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
