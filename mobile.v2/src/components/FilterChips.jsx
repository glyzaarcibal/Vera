import React from "react";
import { MdClose } from "react-icons/md";

const FilterChips = ({ filters, activeFilters, onFilterToggle, label }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = activeFilters.includes(filter.value);
          return (
            <button
              key={filter.value}
              onClick={() => onFilterToggle(filter.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-sm hover:bg-indigo-600"
                    : "bg-white text-gray-600 border border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                }
              `}
            >
              <span>{filter.label}</span>
              {isActive && <MdClose className="text-base" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterChips;
