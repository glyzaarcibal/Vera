import React from 'react';
import './Loader.css';

const Loader = ({ text = "loading" }) => {
  return (
    <div className="v-loader-wrapper">
      <div className="v-loader">
        <span className="v-loader-text">{text}</span>
        <span className="v-load" />
      </div>
    </div>
  );
}

export default Loader;
