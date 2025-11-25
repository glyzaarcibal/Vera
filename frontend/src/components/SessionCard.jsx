import React from "react";
import { useNavigate } from "react-router-dom";
import { MdChat, MdCalendarToday, MdMessage } from "react-icons/md";
import RiskBadge from "./RiskBadge";

const SessionCard = ({ session }) => {
  const navigate = useNavigate();

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
    navigate(`/admin/chat/${session.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-4 h-full cursor-pointer"
    >
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-indigo-500 font-semibold text-sm uppercase">
          <MdChat className="text-lg" />
          <span>{session.type}</span>
        </div>
        <RiskBadge level={session.risk_level} score={session.risk_score} />
      </div>

      <div className="flex-1">
        {session.summary ? (
          <p className="text-sm text-gray-800 leading-relaxed">
            {session.summary}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No summary available</p>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday className="text-sm" />
          <span>{formatDate(session.created_at)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <MdMessage className="text-sm" />
            <span>{session.messageCount || 0}</span>
          </div>
          <div className="font-mono">ID: {session.id}</div>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
