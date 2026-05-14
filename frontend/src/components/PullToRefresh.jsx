import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import "./PullToRefresh.css";

const PullToRefresh = ({ onRefresh, children }) => {
  const [y, setY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const threshold = 100;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
      setIsPulling(true);
    } else {
      setIsPulling(false);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Add resistance to the pull
      const pull = Math.pow(diff, 0.8); 
      setY(Math.min(pull, threshold + 30));
      
      // If we've pulled enough, prevent default to avoid native refresh
      if (diff > 20 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    
    if (y >= threshold) {
      setIsRefreshing(true);
      setY(80); // Hold at indicator height
      try {
        await onRefresh();
      } catch (err) {
        console.error("Refresh failed:", err);
      } finally {
        setIsRefreshing(false);
        setY(0);
      }
    } else {
      setY(0);
    }
    setIsPulling(false);
  };

  return (
    <div 
      className="ptr-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="ptr-indicator"
        style={{ 
          height: isRefreshing ? 80 : y,
          opacity: isRefreshing ? 1 : Math.min(y / threshold, 1),
          visibility: (y > 0 || isRefreshing) ? "visible" : "hidden"
        }}
      >
        <div className="ptr-icon-box">
          <motion.div
            animate={{ 
              rotate: isRefreshing ? 360 : (y * 2),
              scale: isRefreshing ? 1 : Math.min(y / threshold, 1.1)
            }}
            transition={isRefreshing ? { 
              repeat: Infinity, 
              duration: 1, 
              ease: "linear" 
            } : { 
              type: "spring", 
              damping: 20 
            }}
          >
            <Loader2 size={24} color="#7C3AED" />
          </motion.div>
        </div>
      </div>
      
      <motion.div
        className="ptr-content"
        animate={{ y: isRefreshing ? 80 : y }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 0.8
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
