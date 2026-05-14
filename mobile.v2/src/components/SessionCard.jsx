import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdChat, MdCalendarToday, MdMessage } from "react-icons/md";
import RiskBadge from "./RiskBadge";

const SessionCard = ({ session }) => {
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleClick = () => {
    const basePath = location.pathname.startsWith('/psychology') ? '/psychology' : '/admin';
    navigate(`${basePath}/chat/${session.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 flex flex-col gap-5 cursor-pointer w-full"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-2.5 bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-600 font-bold text-xs uppercase tracking-wider">
          <MdChat className="text-base" />
          <span>{session.type}</span>
        </div>
        <RiskBadge level={session.risk_level} score={session.risk_score} size="sm" />
      </div>

      <div className="flex-1">
        {session.summary ? (
          <p className="text-[15px] text-gray-700 leading-relaxed font-medium line-clamp-4 group-hover:text-gray-900 transition-colors">
            {session.summary}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No summary available for this session</p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-1.5">
            <MdCalendarToday className="text-sm text-indigo-400" />
            <span>{formatDate(session.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
            <MdMessage className="text-sm text-indigo-400" />
            <span>{session.messageCount || 0} msgs</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-gray-300 text-right">
          ID: {String(session.id || "").substring(0, 8)}...
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
