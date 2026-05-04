import React from "react";

const RiskBadge = ({ level, score }) => {
  const getRiskConfig = () => {
    if (!level) {
      return {
        label: "Not Assessed",
        bgColor: "bg-gray-200",
        textColor: "text-gray-600"
      };
    }

    const levels = {
      low: {
        label: "Low Risk",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700"
      },
      moderate: {
        label: "Moderate Risk",
        bgColor: "bg-amber-100",
        textColor: "text-amber-700"
      },
      high: {
        label: "High Risk",
        bgColor: "bg-orange-200",
        textColor: "text-orange-700"
      },
      critical: {
        label: "Critical Risk",
        bgColor: "bg-red-200",
        textColor: "text-red-700"
      }
    };

    return levels[level.toLowerCase()] || {
      label: level,
      bgColor: "bg-gray-200",
      textColor: "text-gray-600"
    };
  };

  const config = getRiskConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}>
      <span className="flex-1">{config.label}</span>
      {score !== null && score !== undefined && (
        <span className="bg-white/30 px-1.5 py-0.5 rounded text-[11px]">
          {score}
        </span>
      )}
    </div>
  );
};

export default RiskBadge;
