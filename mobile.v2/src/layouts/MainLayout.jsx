import React from "react";
import { useLocation, useOutlet } from "react-router-dom";
import Header from "../components/Header";
import { AnimatePresence, motion } from "framer-motion";
import "./MainLayout.css";

const MainLayout = () => {
  const location = useLocation();
  const outlet = useOutlet();

  const pageVariants = {
    initial: { opacity: 0, filter: "blur(6px)", scale: 0.98, y: 10 },
    in: { opacity: 1, filter: "blur(0px)", scale: 1, y: 0 },
    out: { opacity: 0, filter: "blur(6px)", scale: 1.02, y: -10 },
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.35,
  };

  return (
    <div className="main-layout">
      <Header />
      <main className="main-content" style={{ position: "relative" }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            style={{ width: "100%", height: "100%" }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainLayout;
