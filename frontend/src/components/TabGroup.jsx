import React from "react";
import TabButton from "./TabButton";

const TabGroup = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex bg-white from-gray-50 to-gray-100 border-b-2 border-gray-200 px-10 gap-2 overflow-x-auto custom-scrollbar">
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
