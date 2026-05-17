import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdDownload, MdArrowBack } from "react-icons/md";

const DownloadApk = () => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const triggerDownload = () => {
    setDownloadStarted(true);
    const downloadUrl = "/VERA.apk";
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "VERA.apk");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Automatically trigger the download on page load
    const timer = setTimeout(() => {
      triggerDownload();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background decorative glow elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-[0_24px_64px_-16px_rgba(99,102,241,0.15)] text-center">
        
        {/* App Logo Indicator */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl shadow-lg shadow-indigo-500/30 mb-6 animate-pulse">
          <MdDownload className="text-white text-4xl" />
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
          V.E.R.A. Mobile Sanctuary
        </h1>
        <p className="text-slate-400 text-[15px] font-medium mb-8">
          Voice Emotion Recognition Application for Android
        </p>

        {/* Action Button */}
        <button
          onClick={triggerDownload}
          className="w-full py-4.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4 group cursor-pointer"
        >
          <MdDownload className="text-xl group-hover:translate-y-0.5 transition-transform" />
          <span>{downloadStarted ? "Downloading Started..." : "Download APK File"}</span>
        </button>

        <p className="text-xs text-slate-500 mb-8">
          File Size: ~74 MB • Version: Stable Build
        </p>

        {/* Installation Steps Guide */}
        <div className="text-left bg-white/[0.02] border border-white/5 p-5 rounded-2xl mb-8 space-y-4">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
            Easy Installation Steps
          </h3>
          
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
              1
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Tap Download</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click the button above if it didn't start automatically.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
              2
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Allow Unknown Sources</p>
              <p className="text-[11px] text-slate-400 mt-0.5">If prompted, enable "Install from Unknown Sources" in your browser/settings.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
              3
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Open & Install</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Open the downloaded VERA.apk file and follow the install prompt.</p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <MdArrowBack />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default DownloadApk;
