import React from "react";
import "./Switch.css";

const Switch = ({ id, checked, onChange, disabled = false }) => {
  return (
    <label className="switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="switch-slider"></span>
    </label>
  );
};

export default Switch;
