import React from "react";
import { MdViewModule, MdViewList } from "react-icons/md";

const ViewToggle = ({ view, onViewChange }) => {
  return (
    <div className="flex bg-white rounded-lg p-1 shadow-sm gap-1">
      <button
        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all text-xl ${
          view === "card"
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
            : "bg-transparent text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
        }`}
        onClick={() => onViewChange("card")}
        aria-label="Card view"
      >
        <MdViewModule />
      </button>
      <button
        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all text-xl ${
          view === "table"
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
            : "bg-transparent text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
        }`}
        onClick={() => onViewChange("table")}
        aria-label="Table view"
      >
        <MdViewList />
      </button>
    </div>
  );
};

export default ViewToggle;
