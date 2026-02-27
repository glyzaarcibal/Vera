import React from "react";

const TabButton = ({ label, isActive, onClick }) => {
  return (
    <button
      className={`px-5 md:px-7 py-3 text-[15px] leading-none bg-transparent border-none font-semibold cursor-pointer relative transition-all duration-300 rounded-t-xl whitespace-nowrap ${
        isActive
          ? "text-indigo-500 bg-white"
          : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-500/5"
      }`}
      onClick={onClick}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-md"></span>
      )}
    </button>
  );
};

export default TabButton;
