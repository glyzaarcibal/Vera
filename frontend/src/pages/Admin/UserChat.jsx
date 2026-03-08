import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdPerson,
  MdSmartToy,
  MdCalendarToday,
  MdSentimentSatisfiedAlt,
  MdAdd,
  MdClose,
} from "react-icons/md";
import axiosInstance from "../../utils/axios.instance";
import RiskBadge from "../../components/RiskBadge";
import Skeleton from "../../components/Skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const UserChat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [problemCategory, setProblemCategory] = useState("");
  const [severityRating, setSeverityRating] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [medHistoryLoading, setMedHistoryLoading] = useState(false);

  const emotionColors = {
    sad: "#3B82F6",
    angry: "#EF4444",
    happy: "#FBBF24",
    disgust: "#10B981",
    fearful: "#8B5CF6",
    neutral: "#9CA3AF",
    surprised: "#F97316",
    calm: "#06B6D4",
    doubt: "#A855F7",
    confusion: "#F59E0B",
  };

  useEffect(() => {
    getChatInfo();
  }, []);

  const getDominantEmotion = (emotionData) => {
    if (!emotionData || emotionData.length === 0) return null;
    const emotions = emotionData[0];
    const emotionList = [
      { name: "sad", value: emotions.sad },
      { name: "angry", value: emotions.angry },
      { name: "happy", value: emotions.happy },
      { name: "disgust", value: emotions.disgust },
      { name: "fearful", value: emotions.fearful },
      { name: "neutral", value: emotions.neutral },
      { name: "surprised", value: emotions.surprised },
      { name: "doubt", value: emotions.doubt },
      { name: "confusion", value: emotions.confusion },
    ];
    return emotionList.reduce((max, emotion) =>
      emotion.value > max.value ? emotion : max
    );
  };

  const getEmotionArray = (msg) => {
    const em = msg.message_emotion;
    if (!em) return [];
    return Array.isArray(em) ? em : [em];
  };

  const calculateOverallEmotions = () => {
    const messagesWithEmotions = chat.filter(
      (msg) => getEmotionArray(msg).length > 0
    );
    if (messagesWithEmotions.length === 0) return null;

    const totals = {
      sad: 0,
      angry: 0,
      happy: 0,
      disgust: 0,
      fearful: 0,
      neutral: 0,
      surprised: 0,
      calm: 0,
      doubt: 0,
      confusion: 0,
    };

    messagesWithEmotions.forEach((msg) => {
      const emotion = getEmotionArray(msg)[0];
      Object.keys(totals).forEach((key) => {
        totals[key] += emotion[key] || 0;
      });
    });

    const count = messagesWithEmotions.length;
    return Object.keys(totals).map((key) => ({
      emotion: key.charAt(0).toUpperCase() + key.slice(1),
      value: (totals[key] / count) * 100,
      fill: emotionColors[key],
    }));
  };

  /** Build a short Hume AI speech emotion detection summary for this session */
  const getHumeEmotionSummary = () => {
    const emotionsData = calculateOverallEmotions();
    if (!emotionsData || emotionsData.length === 0) return null;

    const sorted = [...emotionsData].sort((a, b) => b.value - a.value);
    const messagesWithEmotions = chat.filter(
      (msg) => getEmotionArray(msg).length > 0
    );
    const dominant = sorted[0];
    const secondary = sorted[1];
    const tertiary = sorted[2];

    let summary = `Speech emotion detection (Hume AI Prosody) analyzed ${messagesWithEmotions.length} user utterance(s). `;
    summary += `Dominant emotion: **${dominant.emotion}** (${dominant.value.toFixed(1)}%). `;
    if (secondary && secondary.value > 5) {
      summary += `Also present: ${secondary.emotion} (${secondary.value.toFixed(1)}%)`;
      if (tertiary && tertiary.value > 5) {
        summary += `, ${tertiary.emotion} (${tertiary.value.toFixed(1)}%)`;
      }
      summary += ". ";
    }
    if (dominant.emotion === "Sad" || dominant.emotion === "Fearful" || dominant.emotion === "Angry") {
      summary += "Emotional tone may warrant follow-up.";
    } else if (dominant.emotion === "Calm" || dominant.emotion === "Neutral" || dominant.emotion === "Happy") {
      summary += "Overall tone suggests stable or positive state.";
    } else if (dominant.emotion === "Doubt" || dominant.emotion === "Confusion") {
      summary += "Uncertainty or confusion detected; clarification may be helpful.";
    } else {
      summary += "Mixed emotional signals detected.";
    }

    return { summary, dominant, secondary, messagesCount: messagesWithEmotions.length };
  };

  const getChatInfo = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/sessions/fetch-chat/${sessionId}`);
      const { chat, sessionInfo } = res.data;
      console.log(sessionInfo);
      setChat(chat);
      setSessionInfo(sessionInfo);
      if (sessionInfo?.user_id) {
        getMedicationHistory(sessionInfo.user_id);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  const getMedicationHistory = async (userId) => {
    try {
      setMedHistoryLoading(true);
      const res = await axiosInstance.get(`/admin/users/get-user-activities/${userId}`);
      const activities = res.data?.activities || [];
      const medHistory = activities
        .filter((act) => act.activity_type === "medication")
        .map((act) => ({
          id: act.id,
          ...act.data,
          timestamp: act.created_at || act.data.timestamp
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setMedicationHistory(medHistory);
    } catch (e) {
      console.error("Error fetching medication history:", e);
    } finally {
      setMedHistoryLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const saveDoctorNotes = async () => {
    if (!problemCategory) {
      alert("Please select a problem category");
      return;
    }
    if (!severityRating) {
      alert("Please select a severity rating");
      return;
    }
    if (!doctorNotes.trim()) {
      alert("Please enter clinical observations");
      return;
    }
    if (!treatmentPlan.trim()) {
      alert("Please enter a treatment plan");
      return;
    }

    try {
      setSavingNotes(true);
      const payload = {
        session_id: sessionId,
        doctor_id: null,
        problem_category: problemCategory,
        severity_rating: severityRating,
        clinical_observations: doctorNotes,
        treatment_plan: treatmentPlan,
        next_appointment: nextAppointment || null,
      };

      await axiosInstance.post("/doctor/save-note", payload);
      alert("Doctor's notes saved successfully");
      setProblemCategory("");
      setSeverityRating(null);
      setDoctorNotes("");
      setTreatmentPlan("");
      setNextAppointment("");
      setShowCreateForm(false);
      await getChatInfo();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save doctor's notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-80px)]">
      <div className="mb-5">
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg text-indigo-500 text-[15px] font-medium shadow-sm hover:bg-indigo-50 hover:-translate-x-0.5 transition-all"
          onClick={() => navigate(-1)}
        >
          <MdArrowBack className="text-xl" />
          <span>Back to Sessions</span>
        </button>
      </div>

      {loading ? (
        <div className="flex gap-5 h-full">
          <div className="flex-1">
            <Skeleton variant="card" height="100%" />
          </div>
          <div className="w-[400px]">
            <Skeleton variant="card" height="100%" />
          </div>
        </div>
      ) : (
        <div className="flex gap-5 h-[calc(100%-60px)]">
          {/* Main Chat Panel */}
          <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">Chat Session</h2>
              <p className="text-sm text-gray-500 mt-1">
                Session ID: {sessionId}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chat.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No messages in this session</p>
                </div>
              ) : (
                chat.map((message) => {
                  const emotionArr = getEmotionArray(message);
                  const hasEmotion = emotionArr.length > 0;
                  const dominantEmotion = hasEmotion
                    ? getDominantEmotion(emotionArr)
                    : null;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sent_by === "user" ? "flex-row-reverse" : ""
                        }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${message.sent_by === "user"
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {message.sent_by === "user" ? (
                          <MdPerson className="text-xl" />
                        ) : (
                          <MdSmartToy className="text-xl" />
                        )}
                      </div>
                      <div
                        className={`flex-1 max-w-[70%] ${message.sent_by === "user" ? "text-right" : ""
                          }`}
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 ${message.sent_by === "user"
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <span
                            className={`text-xs font-semibold uppercase ${message.sent_by === "user"
                              ? "text-indigo-600"
                              : "text-gray-600"
                              }`}
                          >
                            {message.sent_by === "user" ? "User" : "Sentinel"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(message.created_at)}
                          </span>
                          {hasEmotion && (
                            <button
                              onClick={() =>
                                setSelectedEmotion(
                                  selectedEmotion === message.id
                                    ? null
                                    : message.id
                                )
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
                              style={{
                                backgroundColor: `${emotionColors[dominantEmotion.name]
                                  }20`,
                                color: emotionColors[dominantEmotion.name],
                              }}
                            >
                              <MdSentimentSatisfiedAlt className="text-sm" />
                              <span className="capitalize">
                                {dominantEmotion.name}
                              </span>
                            </button>
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-lg ${message.sent_by === "user"
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {message.content || "(No content)"}
                          </p>
                        </div>
                        {hasEmotion && selectedEmotion === message.id && (
                          <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
                            <h4 className="text-xs font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                              Emotion Analysis
                            </h4>
                            <div className="mb-4">
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart
                                  data={[
                                    {
                                      emotion: "Sad",
                                      value:
                                        emotionArr[0].sad * 100,
                                      fill: emotionColors.sad,
                                    },
                                    {
                                      emotion: "Angry",
                                      value:
                                        emotionArr[0].angry * 100,
                                      fill: emotionColors.angry,
                                    },
                                    {
                                      emotion: "Happy",
                                      value:
                                        emotionArr[0].happy * 100,
                                      fill: emotionColors.happy,
                                    },
                                    {
                                      emotion: "Disgust",
                                      value:
                                        emotionArr[0].disgust *
                                        100,
                                      fill: emotionColors.disgust,
                                    },
                                    {
                                      emotion: "Fearful",
                                      value:
                                        emotionArr[0].fearful *
                                        100,
                                      fill: emotionColors.fearful,
                                    },
                                    {
                                      emotion: "Neutral",
                                      value:
                                        emotionArr[0].neutral *
                                        100,
                                      fill: emotionColors.neutral,
                                    },
                                    {
                                      emotion: "Surprised",
                                      value:
                                        emotionArr[0].surprised *
                                        100,
                                      fill: emotionColors.surprised,
                                    },
                                    {
                                      emotion: "Doubt",
                                      value: (emotionArr[0].doubt ?? 0) * 100,
                                      fill: emotionColors.doubt,
                                    },
                                    {
                                      emotion: "Confusion",
                                      value: (emotionArr[0].confusion ?? 0) * 100,
                                      fill: emotionColors.confusion,
                                    },
                                  ]}
                                  layout="vertical"
                                  margin={{ left: 60 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    type="number"
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10 }}
                                  />
                                  <YAxis
                                    type="category"
                                    dataKey="emotion"
                                    tick={{ fontSize: 11 }}
                                  />
                                  <Tooltip
                                    formatter={(value) =>
                                      `${value.toFixed(2)}%`
                                    }
                                  />
                                  <Bar dataKey="value" radius={[0, 8, 8, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(emotionArr[0])
                                .filter(
                                  ([key]) =>
                                    ![
                                      "id",
                                      "model",
                                      "created_at",
                                      "message_id",
                                    ].includes(key)
                                )
                                .sort((a, b) => b[1] - a[1])
                                .map(([emotion, value]) => (
                                  <div
                                    key={emotion}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor:
                                            emotionColors[emotion],
                                        }}
                                      ></div>
                                      <span className="text-xs font-medium text-gray-700 capitalize">
                                        {emotion}
                                      </span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-800">
                                      {(value * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                Model: {emotionArr[0].model}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Session Info & Notes */}
          <div className="w-[420px] bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-4 px-5 text-sm font-semibold transition-all ${activeTab === "info"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Session Info
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex-1 py-4 px-5 text-sm font-semibold transition-all ${activeTab === "notes"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Doctor's Notes
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "info" && sessionInfo ? (
                <div className="space-y-5">
                  {/* Risk Assessment */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                      Risk Assessment
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">
                          Risk Level
                        </span>
                        <RiskBadge level={sessionInfo.risk_level} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">
                          Risk Score
                        </span>
                        <div className="text-2xl font-bold text-gray-800">
                          {sessionInfo.risk_score}
                          <span className="text-sm text-gray-400">/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                      Session Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-600 font-medium min-w-[80px]">
                          Type:
                        </span>
                        <span className="text-xs text-gray-800 bg-indigo-50 px-2 py-1 rounded uppercase font-semibold">
                          {sessionInfo.type}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-600 font-medium min-w-[80px]">
                          Created:
                        </span>
                        <span className="text-xs text-gray-800 flex items-center gap-1">
                          <MdCalendarToday />
                          {formatDate(sessionInfo.created_at)}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-600 font-medium min-w-[80px]">
                          Messages:
                        </span>
                        <span className="text-xs text-gray-800 font-semibold">
                          {chat.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hume AI – Speech Emotion Detection Chart */}
                  {(() => {
                    const emotionsData = calculateOverallEmotions();
                    const humeSummary = getHumeEmotionSummary();
                    const isVoiceOrAvatar = ["voice", "avatar"].includes((sessionInfo?.type || "").toLowerCase());
                    if (!emotionsData || emotionsData.length === 0) {
                      return (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                            Hume AI – Speech Emotion Detection
                          </h3>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                            <p className="text-sm text-gray-500 mb-1">No emotion data available</p>
                            <p className="text-xs text-gray-400 mb-2">
                              Emotions are detected from voice/avatar sessions using Hume AI Prosody model.
                            </p>
                            {isVoiceOrAvatar && (
                              <p className="text-xs text-amber-600 mt-2">
                                This session used voice but no emotion data was captured. Record new messages using the voice interface to enable emotion detection.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                          Hume AI – Speech Emotion Detection
                        </h3>

                        {/* Chart */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
                          <div className="mb-2">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              Emotion Distribution (Hume AI Prosody Model)
                            </p>
                            <p className="text-xs text-slate-500">
                              {humeSummary?.messagesCount || 0} utterance(s) analyzed
                            </p>
                          </div>
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                              data={emotionsData.sort((a, b) => b.value - a.value)}
                              margin={{ top: 10, right: 10, left: 5, bottom: 50 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                              <XAxis
                                dataKey="emotion"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                angle={-45}
                                textAnchor="end"
                                height={70}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                label={{
                                  value: 'Percentage (%)',
                                  angle: -90,
                                  position: 'insideLeft',
                                  style: { fontSize: 11, fill: '#64748b' }
                                }}
                                domain={[0, 100]}
                              />
                              <Tooltip
                                formatter={(value) => [`${value.toFixed(2)}%`, 'Emotion Score']}
                                contentStyle={{
                                  fontSize: 12,
                                  backgroundColor: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  padding: '8px'
                                }}
                                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Emotion Score">
                                {emotionsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Summary Text */}
                        {humeSummary && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {humeSummary.summary.split("**").map((part, i) =>
                                i % 2 === 1 ? (
                                  <strong key={i} className="text-indigo-700 font-semibold">{part}</strong>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                              <span className="text-xs text-slate-500">
                                Source: Hume AI Prosody model · {humeSummary.messagesCount} utterance(s) analyzed
                              </span>
                              {humeSummary.dominant && (
                                <span
                                  className="text-xs font-semibold px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: (emotionColors[humeSummary.dominant.emotion.toLowerCase()] || "#94a3b8") + "20",
                                    color: emotionColors[humeSummary.dominant.emotion.toLowerCase()] || "#64748b",
                                  }}
                                >
                                  Dominant: {humeSummary.dominant.emotion}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                      AI Summary
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {sessionInfo.summary || "No summary available"}
                      </p>
                    </div>
                  </div>

                  {/* Emotion Analytics */}
                  {calculateOverallEmotions() && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                        Emotion Analytics
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                        <div className="mb-3">
                          <p className="text-xs text-purple-800 font-medium">
                            Overall emotion distribution across{" "}
                            {
                              chat.filter(
                                (msg) => getEmotionArray(msg).length > 0
                              ).length
                            }{" "}
                            analyzed messages
                          </p>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={calculateOverallEmotions()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="emotion"
                              tick={{ fontSize: 10 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip
                              formatter={(value) => `${value.toFixed(2)}%`}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                          {calculateOverallEmotions()
                            .sort((a, b) => b.value - a.value)
                            .map((item) => (
                              <div
                                key={item.emotion}
                                className="flex items-center justify-between bg-white bg-opacity-60 rounded px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                  ></div>
                                  <span className="text-xs font-medium text-gray-700">
                                    {item.emotion}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-gray-800">
                                  {item.value.toFixed(2)}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clinical Analysis */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                      Clinical Analysis
                    </h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-amber-800 mb-2">
                            Key Indicators
                          </h4>
                          <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                            {sessionInfo.risk_level === "high" ||
                              sessionInfo.risk_level === "critical" ? (
                              <>
                                <li>Elevated distress signals detected</li>
                                <li>Potential emotional overwhelm</li>
                                <li>Communication pattern anomalies</li>
                              </>
                            ) : (
                              <>
                                <li>Normal communication patterns</li>
                                <li>Stable emotional indicators</li>
                              </>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-amber-800 mb-2">
                            Recommended Action
                          </h4>
                          <p className="text-xs text-amber-900">
                            {sessionInfo.risk_score >= 70
                              ? "Immediate follow-up recommended. Consider direct intervention."
                              : sessionInfo.risk_score >= 50
                                ? "Schedule follow-up within 48 hours. Monitor closely."
                                : "Continue routine monitoring. No immediate action required."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === "notes" ? (
                <div className="space-y-6">
                  {/* Medication History Section */}
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                        <span>💊 Patient Medication History</span>
                      </h3>
                      <span className="text-[10px] font-bold bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                        {medicationHistory.length} ENTRIES
                      </span>
                    </div>
                    <div className="p-4">
                      {medHistoryLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                        </div>
                      ) : medicationHistory.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No medication history recorded.</p>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {medicationHistory.map((item) => (
                            <div key={item.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-400">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                                <span className="text-[10px] text-gray-500 font-medium">
                                  {formatDate(item.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {item.dosage} {item.time && `• Taken at ${item.time}`}
                              </p>
                              {item.date && item.date !== formatDate(item.timestamp) && (
                                <p className="text-[10px] text-gray-400 mt-1">Logged for: {item.date}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {showCreateForm ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                          New Doctor's Note
                        </h3>
                        <button
                          onClick={() => setShowCreateForm(false)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <MdClose className="text-xl text-gray-600" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Problem Categorization
                        </label>
                        <select
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          value={problemCategory}
                          onChange={(e) => setProblemCategory(e.target.value)}
                        >
                          <option value="" disabled>
                            Select category...
                          </option>
                          <option value="anxiety">Anxiety Disorder</option>
                          <option value="depression">Depression</option>
                          <option value="trauma">Trauma/PTSD</option>
                          <option value="substance">Substance Use</option>
                          <option value="relationship">Relationship Issues</option>
                          <option value="adjustment">Adjustment Disorder</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Severity Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setSeverityRating(rating)}
                              className={`flex-1 py-2 px-3 border-2 rounded-lg text-sm font-semibold transition-all ${severityRating === rating
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
                                }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          1 = Minimal, 5 = Severe
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Clinical Observations
                        </label>
                        <textarea
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          rows="6"
                          placeholder="Document your observations, behavioral patterns, and clinical impressions..."
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Treatment Plan
                        </label>
                        <textarea
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          rows="4"
                          placeholder="Outline recommended interventions, therapy approach, and follow-up actions..."
                          value={treatmentPlan}
                          onChange={(e) => setTreatmentPlan(e.target.value)}
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Next Appointment
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          value={nextAppointment}
                          onChange={(e) => setNextAppointment(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={saveDoctorNotes}
                        disabled={savingNotes}
                        className="w-full py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-all shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {savingNotes ? "Saving..." : "Save Notes"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                          Doctor's Notes
                        </h3>
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all"
                        >
                          <MdAdd className="text-xl" />
                        </button>
                      </div>

                      {sessionInfo?.doctor_notes?.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-400 mb-4">No doctor's notes yet</p>
                          <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all text-sm font-semibold"
                          >
                            Add First Note
                          </button>
                        </div>
                      ) : (
                        <>
                          {sessionInfo?.doctor_notes?.map((note) => (
                            <div
                              key={note.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    Dr. {note.profiles?.first_name || ""}{" "}
                                    {note.profiles?.last_name || "Unknown"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(note.created_at)}
                                  </p>
                                </div>
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase">
                                  {note.problem_category}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 font-medium">
                                  Severity:
                                </span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                      key={level}
                                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${level <= note.severity_rating
                                        ? level <= 2
                                          ? "bg-green-500 text-white"
                                          : level <= 3
                                            ? "bg-yellow-500 text-white"
                                            : "bg-red-500 text-white"
                                        : "bg-gray-200 text-gray-400"
                                        }`}
                                    >
                                      {level}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                  Clinical Observations
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {note.clinical_observations}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                  Treatment Plan
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {note.treatment_plan}
                                </p>
                              </div>

                              {note.next_appointment && (
                                <div className="pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <MdCalendarToday className="text-indigo-500" />
                                    <span className="font-medium">
                                      Next Appointment:
                                    </span>
                                    <span className="font-semibold text-gray-800">
                                      {formatDate(note.next_appointment)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300"
                          >
                            + Add New Note
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserChat;
