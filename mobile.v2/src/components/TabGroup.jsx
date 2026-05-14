import React from "react";
import TabButton from "./TabButton";

const TabGroup = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex items-end bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-200 px-8 md:px-10 pt-3 gap-3 overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => (
        <TabButton
          key={tab.value}
          label={tab.label}
          isActive={activeTab === tab.value}
          onClick={() => onTabChange(tab.value)}
        />
      ))}
    </div>
  );
};

export default TabGroup;
