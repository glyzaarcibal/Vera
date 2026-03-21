import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatAI.css";
import axiosInstance from "../utils/axios.instance";

const ChatAI = () => {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem("chatSessionId") || null);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      } catch (e) { }
    }
    return [
      {
        id: 1,
        type: "bot",
        text: "Hello! I'm here to listen and support you. How are you feeling today?",
        timestamp: new Date(),
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    if (sessionId) {
      localStorage.setItem("chatSessionId", sessionId);
    } else {
      localStorage.removeItem("chatSessionId");
    }
  }, [messages, sessionId]);

  const handleNewConversation = () => {
    setSessionId(null);
    setMessages([
      {
        id: 1,
        type: "bot",
        text: "Hello! I'm here to listen and support you. How are you feeling today?",
        timestamp: new Date(),
      },
    ]);
  };

  const initializeSession = async () => {
    try {
      const res = await axiosInstance.post(`/sessions/start-session/${"text"}`);
      const { session } = res.data;
      setSessionId(session.id);
      return session;
    } catch (e) {
      alert(e.response.data.message || "Internal Server Error");
    }
  };

  const fetchBotResponse = async (tempId, message) => {
    try {
      const res = await axiosInstance.post(
        `/messages/process-message/${tempId}`,
        { message, messages }
      );
      const { response } = res.data;
      return response;
    } catch (e) {
      alert("Internal Server Error");
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
    setIsTyping(true);

    if (sessionId === null) {
      const sessionData = await initializeSession();
      const botResponse = await fetchBotResponse(sessionData.id, newMessage);
      const botMessage = {
        id: messages.length + 1,
        type: "bot-message",
        text: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    } else {
      const botResponse = await fetchBotResponse(sessionId, newMessage);
      const botMessage = {
        id: messages.length + 1,
        type: "bot-message",
        text: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const detectActivity = (text) => {
    if (!text) return [];
    const textLower = text.toLowerCase();
    
    const activities = [
      { 
        name: 'Take a Breath', 
        path: '/activities/take-a-breath', 
        icon: '🌬️', 
        desc: 'Guided breathing exercise for quick relaxation',
        keywords: ['take a breath', 'breathing exercise', 'breathe deeply', 'inhale slowly', 'deep breath', 'exhale'] 
      },
      { 
        name: 'Diary', 
        path: '/activities/diary', 
        icon: '📓', 
        desc: 'Write and track your daily thoughts',
        keywords: ['diary', 'journal', 'write your thoughts', 'writing down', 'write down your feelings']
      },
      { 
        name: 'Mood Tracker', 
        path: '/activities/mood-tracker', 
        icon: '😊', 
        desc: 'Track and monitor your mood',
        keywords: ['mood tracker', 'track your mood', 'monitor your mood', 'log your mood']
      },
      { 
        name: 'Sleep Tracker', 
        path: '/activities/sleep-tracker', 
        icon: '😴', 
        desc: 'Monitor your sleep patterns',
        keywords: ['sleep tracker', 'track your sleep', 'monitor your sleep', 'sleep log']
      },
      { 
        name: 'Clipcard Game', 
        path: '/activities/clipcard', 
        icon: '🎮', 
        desc: 'Test your memory with matching cards',
        keywords: ['clipcard game', 'memory game', 'matching cards', 'play a game', 'distract yourself']
      },
      { 
        name: 'Weekly Wellness Report', 
        path: '/activities/weekly-wellness-report', 
        icon: '📊', 
        desc: 'View your weekly insights',
        keywords: ['weekly wellness report', 'wellness report', 'weekly progress']
      },
      { 
        name: 'Medication History', 
        path: '/activities/medication-history', 
        icon: '💊', 
        desc: 'Log and track medication',
        keywords: ['medication history', 'track medication', 'log medication', 'medication reminder']
      },
    ];

    return activities.filter(act => act.keywords.some(kw => textLower.includes(kw)));
  };

  return (
    <div className="chat-ai-container">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="avatar-icon">
            <img src="/icon.png" alt="Vera" className="avatar-circle" style={{ objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div className="chat-info" style={{ gap: '0px', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h2>Vera Assistant</h2>
            <div className="header-status">
              <span className="status-indicator">● Online</span>
              {sessionId && (
                <span className="session-id">Session: {sessionId}</span>
              )}
            </div>
          </div>
        </div>
        <button className="new-chat-btn" onClick={handleNewConversation}>
          + New Chat
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => {
          const isBot = message.type === "bot" || message.type === "bot-message";
          const matchedActivities = isBot ? detectActivity(message.text) : [];
          
          return (
            <div
              key={message.id}
              className={`message ${
                message.type === "user" ? "user-message" : "bot-message"
              }`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                
                {/* ── Suggested Activity Cards ── */}
                {matchedActivities.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-indigo-100/30">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Suggested Activity</p>
                    {matchedActivities.map((act, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => navigate(act.path)}
                        className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm border border-indigo-100 rounded-xl cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-200 group"
                      >
                        <div className="text-2xl group-hover:scale-110 transition-transform">{act.icon}</div>
                        <div className="flex flex-col flex-1">
                          <span className="font-bold text-indigo-900 text-sm">{act.name}</span>
                          <span className="text-slate-500 text-xs">{act.desc}</span>
                        </div>
                        <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors group-hover:translate-x-1 duration-200">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="message bot-message">
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Share what's on your mind..."
          rows="1"
        />
        <button onClick={handleSend} disabled={inputValue.trim() === ""}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatAI;
