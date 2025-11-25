import React, { useState, useRef, useEffect } from "react";
import "./ChatAI.css";
import axiosInstance from "../utils/axios.instance";

const ChatAI = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hello! I'm here to listen and support you. How are you feeling today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <div className="chat-ai-container">
      <div className="chat-header">
        <div className="avatar-icon">
          <div className="avatar-circle">V</div>
        </div>
        <div className="chat-info">
          <h2>Vera Assistant</h2>
          <div className="header-status">
            <span className="status-indicator">● Online</span>
            {sessionId && (
              <span className="session-id">Session: {sessionId}</span>
            )}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.type === "user" ? "user-message" : "bot-message"
            }`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
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
