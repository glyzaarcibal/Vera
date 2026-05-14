import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Zap } from "lucide-react";
import ModalPortal from "./ModalPortal";
import "./TokenRewardModal.css";

const TokenRewardModal = ({ isOpen, onClose, amount, message, type = "success" }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          <div className="token-modal-overlay" onClick={onClose}>
            <motion.div
              className="token-modal-content"
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="token-modal-header">
                <motion.div 
                  className="reward-icon-container"
                  initial={{ rotate: -20 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="reward-glow"></div>
                  <span className="reward-emoji">🪙</span>
                </motion.div>
              </div>

              <div className="token-modal-body">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="reward-title">Tokens Earned!</h2>
                  <div className="reward-badge">
                    <Zap size={14} fill="currentColor" />
                    <span>+{amount} VERA TOKENS</span>
                  </div>
                  <p className="reward-message">{message}</p>
                </motion.div>
              </div>

              <div className="token-modal-footer">
                <button className="reward-confirm-btn" onClick={onClose}>
                  Awesome!
                </button>
              </div>

              {/* Decorative elements */}
              <div className="decor-sparkle s1"><Sparkles size={16} /></div>
              <div className="decor-sparkle s2"><Sparkles size={20} /></div>
              <div className="decor-sparkle s3"><Sparkles size={14} /></div>
            </motion.div>
          </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

export default TokenRewardModal;
