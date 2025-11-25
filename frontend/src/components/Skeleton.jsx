import React from "react";

const Skeleton = ({ variant = "text", width, height, count = 1, className = "" }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const getStyle = () => {
    const style = {};
    if (width) style.width = width;
    if (height) style.height = height;
    return style;
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "h-4 mb-2";
      case "title":
        return "h-6 mb-3";
      case "avatar":
        return "rounded-full";
      case "card":
        return "h-[200px] rounded-xl";
      case "table-row":
        return "h-[60px] mb-px";
      default:
        return "h-4 mb-2";
    }
  };

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[skeleton_1.5s_ease-in-out_infinite] rounded ${getVariantClasses()} ${className}`}
          style={getStyle()}
        />
      ))}
    </>
  );
};

export default Skeleton;
