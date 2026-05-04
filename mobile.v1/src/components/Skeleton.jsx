import React from "react";

const Skeleton = ({ variant = "text", width, height, count = 1, className = "" }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const getStyle = () => {
    const style = {
      borderRadius: variant === "avatar" ? "50% 50% 0 0" : "12px", // half-rounded for avatar
      margin: "0 auto",
      boxSizing: "border-box",
      padding: variant === "card" ? "18px" : variant === "table-row" ? "8px 0" : "0",
      maxWidth: variant === "card" ? "420px" : undefined,
    };
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
        return ""; // borderRadius handled in style
      case "card":
        return "h-[200px] rounded-lg border border-gray-200";
      case "table-row":
        return "h-[60px] mb-px rounded-lg border border-gray-100";
      default:
        return "h-4 mb-2";
    }
  };

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 bg-size-[200%_100%] animate-[skeleton_1.5s_ease-in-out_infinite] ${getVariantClasses()} ${className}`}
          style={getStyle()}
        />
      ))}
    </>
  );
};

export default Skeleton;