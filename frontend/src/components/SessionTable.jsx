import React from "react";
import { MdChat, MdMessage } from "react-icons/md";
import RiskBadge from "./RiskBadge";

const SessionTable = ({ sessions }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Summary</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Messages</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Risk Level</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Risk Score</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-sm font-mono text-gray-400 font-semibold">{session.id}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-indigo-500 font-semibold uppercase text-xs">
                    <MdChat className="text-base" />
                    <span>{session.type}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-800 leading-relaxed max-w-md">
                  {session.summary || <span className="text-gray-400 italic">No summary available</span>}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MdMessage className="text-base" />
                    <span className="text-sm font-semibold">{session.messageCount || 0}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <RiskBadge level={session.risk_level} score={null} />
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-indigo-500">
                  {session.risk_score !== null ? session.risk_score : "—"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(session.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionTable;
