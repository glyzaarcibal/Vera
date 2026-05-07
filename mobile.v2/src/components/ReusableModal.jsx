import React from "react";
import { createPortal } from "react-dom";
import { MdClose, MdErrorOutline, MdCheckBox } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const ReusableModal = ({ isOpen, onClose, title, message, type = "error", children, position = "fixed" }) => {
  const containerClasses = position === "fixed" 
    ? "fixed inset-0 z-[9999]" 
    : "absolute inset-0 z-[50]";

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={`${containerClasses} flex items-center justify-center p-6 lg:p-12 overflow-y-auto w-full h-full`}>
          {/* Backdrop with sophisticated blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`${position === "fixed" ? "fixed" : "absolute"} inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-300`}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(30,27,75,0.4)] max-w-md w-full overflow-hidden m-auto"
          >
            {/* Top Gloss Effect */}
            <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-b from-white/80 to-transparent pointer-events-none" />

            <div className="p-10 relative z-10">
              {/* Header with Icon and Close */}
              <div className="flex justify-between items-start mb-8">
                <div className={`p-5 rounded-[2rem] shadow-sm ${
                  type === 'confirm' ? 'bg-amber-50 text-amber-500 border border-amber-100/50' :
                  type === 'success' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100/50' :
                  'bg-rose-50 text-rose-500 border border-rose-100/50'
                }`}>
                  {type === 'confirm' ? <MdErrorOutline size={36} className="rotate-180" /> : 
                   type === 'success' ? <MdCheckBox size={36} /> : 
                   <MdErrorOutline size={36} />}
                </div>
                <button 
                  onClick={onClose} 
                  className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
                >
                  <MdClose size={24} />
                </button>
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{title}</h3>
              
              {children ? (
                <div className="modal-children-content">
                  {children}
                </div>
              ) : (
                <>
                  <p className="text-slate-500 text-[16px] leading-relaxed font-medium mb-10">{message}</p>
                  
                  <button
                    onClick={onClose}
                    className={`group relative w-full py-5 rounded-[1.5rem] font-black text-[14px] tracking-widest uppercase transition-all shadow-xl active:scale-[0.97] overflow-hidden ${
                      type === 'error' 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    }`}
                  >
                    <span className="relative z-10">Got it</span>
                    <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Mount at top level if fixed, otherwise stay in context
  return position === "fixed" ? createPortal(modalContent, document.body) : modalContent;
};

export default ReusableModal;
