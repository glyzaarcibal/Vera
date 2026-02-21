import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors";
import axiosInstance from "../utils/axios.instance";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  :root {
    --bg:       #f8f7fc;
    --bg2:      #ffffff;
    --bg3:      #f0eeff;
    --ink:      #1a1625;
    --ink2:     #4a4568;
    --muted:    #9490a8;
    --border:   rgba(0,0,0,0.07);
    --acc-a:    #6c63ff;
    --acc-b:    #a78bfa;
    --acc-c:    #06d6c7;
    --acc-d:    #f472b6;
    --acc-e:    #34d399;
    --gold:     #f59e0b;
    --sh-sm:    0 2px 12px rgba(108,99,255,0.07);
    --sh-md:    0 8px 32px rgba(108,99,255,0.11);
    --sh-lg:    0 20px 64px rgba(108,99,255,0.15);
  }

  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 400;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Progress bar ── */
  .v-progress {
    position: fixed; top:0; left:0; height:3px;
    background: linear-gradient(90deg, var(--acc-a), var(--acc-b), var(--acc-c));
    background-size: 200% 100%;
    animation: pShimmer 2s linear infinite;
    z-index:1000; transition: width .1s linear;
    box-shadow: 0 0 10px rgba(108,99,255,.4);
  }
  @keyframes pShimmer { 0%{background-position:0% 0} 100%{background-position:200% 0} }

  /* ── Back-to-top ── */
  .v-top-btn {
    position:fixed; bottom:1.8rem; right:1.8rem;
    width:44px; height:44px;
    background: white; border:1px solid var(--border);
    border-radius:50%; color:var(--acc-a); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transform:translateY(14px) scale(.8);
    transition:opacity .35s cubic-bezier(.34,1.56,.64,1),transform .35s cubic-bezier(.34,1.56,.64,1);
    z-index:999; box-shadow:var(--sh-md);
  }
  .v-top-btn.show { opacity:1; transform:translateY(0) scale(1); }
  .v-top-btn:hover { background:var(--acc-a); color:white; border-color:var(--acc-a); transform:translateY(-3px) scale(1.1) !important; }

  /* ── Orbs ── */
  .v-orb {
    position:fixed; border-radius:50%; filter:blur(70px); opacity:.55;
    pointer-events:none; z-index:0;
    animation:orbDrift 18s ease-in-out infinite alternate;
  }
  .v-orb-1 { width:520px;height:520px; background:radial-gradient(circle,rgba(167,139,250,.35) 0%,transparent 70%); top:-180px;left:-140px; animation-duration:22s; }
  .v-orb-2 { width:400px;height:400px; background:radial-gradient(circle,rgba(6,214,199,.22) 0%,transparent 70%); top:35%;right:-100px; animation-duration:16s;animation-delay:-5s; }
  .v-orb-3 { width:350px;height:350px; background:radial-gradient(circle,rgba(244,114,182,.2) 0%,transparent 70%); bottom:5%;left:10%; animation-duration:20s;animation-delay:-10s; }
  @keyframes orbDrift { from{transform:translate(0,0) scale(1)} to{transform:translate(35px,50px) scale(1.1)} }

  /* ── SA Base ── */
  .sa {
    opacity:0;
    transition-timing-function: cubic-bezier(.16,1,.3,1);
    transition-property: opacity, transform, filter;
    will-change: opacity, transform;
  }
  .sa.visible { opacity:1!important; transform:none!important; filter:none!important; }
  .sa-up    { transform:translateY(44px); }
  .sa-left  { transform:translateX(-52px); }
  .sa-right { transform:translateX(52px); }
  .sa-scale { transform:scale(.87); }
  .sa-blr   { filter:blur(10px); transform:translateY(18px); }
  .sa-drop  { transform:translateY(-55px) scaleY(.88); }
  .sa-d0 { transition-duration:.70s; transition-delay:0s; }
  .sa-d1 { transition-duration:.75s; transition-delay:.08s; }
  .sa-d2 { transition-duration:.80s; transition-delay:.16s; }
  .sa-d3 { transition-duration:.85s; transition-delay:.26s; }
  .sa-d4 { transition-duration:.85s; transition-delay:.36s; }
  .sa-d5 { transition-duration:.90s; transition-delay:.46s; }
  .sa-d6 { transition-duration:.90s; transition-delay:.56s; }

  /* shimmer on cards */
  .sa-shimmer { position:relative; overflow:hidden; }
  .sa-shimmer::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.72) 50%,transparent 70%);
    transform:translateX(-100%); pointer-events:none; border-radius:inherit;
  }
  .sa-shimmer.sa-shimmer-run::after { animation:shimSweep .65s cubic-bezier(.4,0,.2,1) forwards; }
  @keyframes shimSweep { from{transform:translateX(-100%)} to{transform:translateX(200%)} }

  /* ═══════════════ HERO ═══════════════ */
  .v-hero {
    position:relative; min-height:100vh;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    text-align:center; padding:8rem 1.5rem 6rem; overflow:hidden;
    background: linear-gradient(155deg, #fdfcff 0%, #ede9ff 45%, #e2f9f7 100%);
  }
  .v-hero::after {
    content:''; position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(108,99,255,.025) 1px,transparent 1px),
      linear-gradient(90deg,rgba(108,99,255,.025) 1px,transparent 1px);
    background-size:60px 60px;
    pointer-events:none;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent);
  }

  .v-eyebrow {
    font-family:'DM Mono',monospace; font-size:.68rem; letter-spacing:.2em; text-transform:uppercase;
    color:var(--acc-a);
    padding:.45rem 1.2rem; border:1px solid rgba(108,99,255,.22); border-radius:100px;
    background:rgba(108,99,255,.07); margin-bottom:2rem;
    display:inline-flex; align-items:center; gap:.5rem; position:relative; z-index:1;
  }
  .v-eyebrow-dot {
    width:6px;height:6px; background:var(--acc-c); border-radius:50%;
    animation:dotPulse 2s ease-in-out infinite;
  }
  @keyframes dotPulse { 0%,100%{opacity:.5;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }

  .v-hero-title {
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:800;
    font-size:clamp(3rem,8.5vw,6.5rem); line-height:1.04; color:var(--ink);
    letter-spacing:-.03em; margin-bottom:1.2rem; max-width:780px; position:relative; z-index:1;
  }
  .v-hero-title-accent {
    font-family:'Instrument Serif',serif; font-style:italic; font-weight:400;
    background:linear-gradient(135deg,var(--acc-a) 0%,var(--acc-b) 50%,var(--acc-c) 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    background-size:200% 100%; animation:gradShift 5s ease-in-out infinite alternate;
  }
  @keyframes gradShift { 0%{background-position:0% 0} 100%{background-position:100% 0} }

  .v-hero-mono {
    font-family:'DM Mono',monospace; font-size:.72rem; letter-spacing:.2em; text-transform:uppercase;
    color:var(--muted); margin-bottom:1.6rem; position:relative; z-index:1;
  }
  .v-hero-desc {
    max-width:490px; font-size:1.05rem; line-height:1.82; color:var(--ink2);
    margin-bottom:2.5rem; position:relative; z-index:1;
  }

  .v-btn-primary {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.9rem 2.1rem; border-radius:100px;
    background:var(--ink); color:white;
    font-size:.9rem; font-weight:700; letter-spacing:.01em;
    text-decoration:none; position:relative; z-index:1;
    transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s,background .2s;
    box-shadow:0 8px 28px rgba(26,22,37,.2);
  }
  .v-btn-primary:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 16px 40px rgba(26,22,37,.28); background:var(--acc-a); }

  /* floating cards */
  .v-hero-floats { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .v-float {
    position:absolute; background:white; border-radius:16px;
    padding:1rem 1.3rem; box-shadow:var(--sh-md); border:1px solid var(--border);
    display:flex; align-items:center; gap:.7rem;
    animation:floatBob 6s ease-in-out infinite alternate;
  }
  .v-float-1 { top:22%;left:6%; animation-delay:0s; }
  .v-float-2 { top:22%;right:6%; animation-delay:-2s; }
  .v-float-3 { bottom:22%;left:8%; animation-delay:-4s; }
  .v-float-icon { width:32px;height:32px; border-radius:10px; display:flex;align-items:center;justify-content:center; font-size:.95rem; flex-shrink:0; }
  .v-float-title { font-size:.72rem; font-weight:700; color:var(--ink); }
  .v-float-sub   { font-size:.64rem; color:var(--muted); }
  @keyframes floatBob { from{transform:translateY(0)} to{transform:translateY(-12px)} }
  @media(max-width:768px){.v-hero-floats{display:none}}

  /* scroll hint */
  .v-scroll-hint {
    position:absolute; bottom:2rem; left:50%; transform:translateX(-50%);
    display:flex; flex-direction:column; align-items:center; gap:.4rem;
    color:var(--muted); font-size:.62rem; letter-spacing:.16em; text-transform:uppercase;
    font-family:'DM Mono',monospace; opacity:0;
    animation:hintFade 1s ease forwards; animation-delay:2s;
  }
  .v-scroll-line { width:1px;height:38px; background:linear-gradient(to bottom,var(--acc-a),transparent); animation:sPulse 2s ease-in-out infinite; }
  @keyframes sPulse { 0%,100%{opacity:.3;transform:scaleY(.7)} 50%{opacity:1;transform:scaleY(1)} }
  @keyframes hintFade { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  /* ═══════════════ STATS ═══════════════ */
  .v-stats { background:white; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
  .v-stats-inner {
    max-width:1100px; margin:0 auto; padding:0 1.5rem;
    display:flex; align-items:center; justify-content:center;
  }
  .v-stat { flex:1; padding:2rem 1.5rem; text-align:center; border-right:1px solid var(--border); }
  .v-stat:last-child { border-right:none; }
  .v-stat-num {
    font-family:'Instrument Serif',serif; font-size:2.4rem; font-weight:400; font-style:italic;
    color:var(--acc-a); line-height:1; margin-bottom:.25rem;
  }
  .v-stat-label { font-family:'DM Mono',monospace; font-size:.6rem; letter-spacing:.15em; text-transform:uppercase; color:var(--muted); }

  /* ═══════════════ SECTION ═══════════════ */
  .v-section { max-width:1100px; margin:0 auto; padding:6rem 1.5rem; }
  .v-section-head { margin-bottom:3.5rem; }
  .v-label { font-family:'DM Mono',monospace; font-size:.62rem; letter-spacing:.22em; text-transform:uppercase; color:var(--acc-a); margin-bottom:.7rem; display:block; }
  .v-heading { font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:clamp(1.7rem,4vw,2.7rem); color:var(--ink); line-height:1.15; letter-spacing:-.025em; margin-bottom:.75rem; }
  .v-heading em { font-family:'Instrument Serif',serif; font-style:italic; font-weight:400; color:var(--acc-a); }
  .v-sub { color:var(--ink2); font-size:.95rem; line-height:1.75; max-width:480px; }

  /* ═══════════════ FEATURES ═══════════════ */
  .v-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.2rem; }
  .v-feat-card {
    background:white; border:1px solid var(--border); border-radius:20px;
    padding:2.2rem 1.8rem; position:relative; overflow:hidden;
    transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s,border-color .3s;
    cursor:default;
  }
  .v-feat-card:hover { transform:translateY(-6px); box-shadow:var(--sh-lg); border-color:rgba(108,99,255,.2); }
  .v-feat-card::before {
    content:''; position:absolute; top:0;left:0;right:0; height:3px;
    border-radius:20px 20px 0 0;
    transform:scaleX(0); transform-origin:left;
    transition:transform .45s cubic-bezier(.16,1,.3,1);
  }
  .v-feat-card:hover::before { transform:scaleX(1); }
  .v-feat-card:nth-child(1)::before { background:linear-gradient(90deg,var(--acc-a),var(--acc-b)); }
  .v-feat-card:nth-child(2)::before { background:linear-gradient(90deg,var(--acc-c),var(--acc-b)); }
  .v-feat-card:nth-child(3)::before { background:linear-gradient(90deg,var(--acc-d),var(--acc-b)); }
  .v-feat-card:nth-child(4)::before { background:linear-gradient(90deg,var(--acc-e),var(--acc-c)); }

  .v-feat-num { font-family:'Instrument Serif',serif; font-size:3rem; font-weight:400; font-style:italic; color:rgba(108,99,255,.1); line-height:1; margin-bottom:1.2rem; transition:color .3s; }
  .v-feat-card:hover .v-feat-num { color:rgba(108,99,255,.18); }
  .v-feat-icon {
    width:44px;height:44px; border-radius:12px;
    background:linear-gradient(135deg,#f0eeff,#e8f9f7); border:1px solid rgba(108,99,255,.1);
    display:flex;align-items:center;justify-content:center; margin-bottom:1.2rem; color:var(--acc-a);
    transition:background .3s,transform .4s cubic-bezier(.34,1.7,.64,1),color .3s;
  }
  .v-feat-card:hover .v-feat-icon { background:linear-gradient(135deg,var(--acc-a),var(--acc-b)); color:white; transform:scale(1.15) rotate(-5deg); }
  .v-feat-title { font-size:1rem; font-weight:700; color:var(--ink); margin-bottom:.6rem; letter-spacing:-.01em; }
  .v-feat-desc  { font-size:.875rem; line-height:1.7; color:var(--ink2); }

  /* ═══════════════ RESOURCE CARDS ═══════════════ */
  .v-res-card {
    background:white; border:1px solid var(--border); border-radius:18px; overflow:hidden;
    display:flex; flex-direction:column;
    transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s,border-color .3s;
  }
  .v-res-card:hover { transform:translateY(-5px); box-shadow:var(--sh-lg); border-color:rgba(108,99,255,.2); }
  .v-res-img-wrap { overflow:hidden; height:190px; }
  .v-res-img { width:100%;height:100%;object-fit:cover;display:block; transition:transform .5s; }
  .v-res-card:hover .v-res-img { transform:scale(1.04); }
  .v-res-placeholder { height:190px; background:linear-gradient(135deg,#f0eeff,#e5fbf9); display:flex;align-items:center;justify-content:center; }
  .v-res-body { padding:1.5rem; flex:1; display:flex; flex-direction:column; }
  .v-tag {
    font-family:'DM Mono',monospace; font-size:.6rem; letter-spacing:.14em; text-transform:uppercase;
    color:var(--acc-a); background:rgba(108,99,255,.08); border:1px solid rgba(108,99,255,.15);
    padding:.25rem .65rem; border-radius:100px; display:inline-block; margin-bottom:.8rem;
  }
  .v-res-title { font-size:1.05rem; font-weight:700; color:var(--ink); margin-bottom:.55rem; line-height:1.3; letter-spacing:-.01em; }
  .v-res-desc  { font-size:.85rem; color:var(--ink2); line-height:1.7; flex:1; margin-bottom:1.1rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .v-link-chip {
    display:inline-flex;align-items:center;gap:.3rem; font-size:.7rem; font-family:'DM Mono',monospace;
    color:var(--acc-a); background:rgba(108,99,255,.07); border:1px solid rgba(108,99,255,.15);
    padding:.3rem .65rem; border-radius:6px; text-decoration:none;
    transition:background .2s,color .2s,border-color .2s;
    max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  }
  .v-link-chip:hover { background:var(--acc-a); color:white; border-color:var(--acc-a); }
  .v-links-row { display:flex;flex-wrap:wrap;gap:.45rem;margin-top:auto; }

  /* ═══════════════ FEATURED ═══════════════ */
  .v-featured {
    display:grid; grid-template-columns:1fr 1fr;
    border:1px solid var(--border); border-radius:24px; overflow:hidden;
    background:white; margin-bottom:2.5rem;
    transition:box-shadow .35s,border-color .35s;
  }
  .v-featured:hover { box-shadow:var(--sh-lg); border-color:rgba(108,99,255,.2); }
  @media(max-width:700px){.v-featured{grid-template-columns:1fr}}
  .v-feat-media { position:relative;overflow:hidden;min-height:300px; }
  .v-feat-media img { width:100%;height:100%;object-fit:cover; transition:transform .6s; }
  .v-featured:hover .v-feat-media img { transform:scale(1.05); }
  .v-feat-ph { width:100%;height:100%;min-height:300px; background:linear-gradient(135deg,#f0eeff,#d9f7f5); display:flex;align-items:center;justify-content:center; }
  .v-feat-badge {
    position:absolute;top:1.2rem;left:1.2rem;
    font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;
    color:var(--gold); border:1px solid rgba(245,158,11,.3); background:rgba(245,158,11,.1);
    padding:.3rem .8rem;border-radius:100px;backdrop-filter:blur(8px);
  }
  .v-feat-body { padding:3rem; display:flex;flex-direction:column;justify-content:center; }
  .v-feat-big-title { font-size:clamp(1.5rem,3vw,2rem); font-weight:800; color:var(--ink); line-height:1.2; letter-spacing:-.02em; margin-bottom:.9rem; }
  .v-feat-big-desc  { font-size:.92rem; color:var(--ink2); line-height:1.75; margin-bottom:2rem; }

  /* ═══════════════ SUGGESTED ═══════════════ */
  .v-sug-wrap { background:linear-gradient(155deg,#f8f7fc,#eeeeff); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
  .v-sug-badge {
    display:inline-flex;align-items:center;gap:.5rem;
    font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;
    color:var(--gold); border:1px solid rgba(245,158,11,.25);background:rgba(245,158,11,.08);
    padding:.35rem .9rem;border-radius:100px;margin-bottom:1.1rem;
  }
  .v-scroll-row {
    display:flex;gap:1.25rem;overflow-x:auto;padding-bottom:1.2rem;
    scrollbar-width:thin;scrollbar-color:rgba(108,99,255,.15) transparent;
  }
  .v-scroll-row::-webkit-scrollbar{height:4px}
  .v-scroll-row::-webkit-scrollbar-track{background:transparent}
  .v-scroll-row::-webkit-scrollbar-thumb{background:rgba(108,99,255,.15);border-radius:2px}
  .v-scroll-row .v-res-card{flex:0 0 270px}

  /* ═══════════════ RESOURCES GRID ═══════════════ */
  .v-res-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.2rem; }

  /* ═══════════════ DIVIDER ═══════════════ */
  .v-divider { width:100%;height:1px; background:linear-gradient(90deg,transparent,var(--border) 30%,var(--border) 70%,transparent); }

  /* ═══════════════ FOOTER ═══════════════ */
  .v-footer {
    background:white; border-top:1px solid var(--border);
    text-align:center; padding:5rem 1.5rem; position:relative;overflow:hidden;
  }
  .v-footer::before {
    content:'V.E.R.A.'; position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    font-family:'Plus Jakarta Sans',sans-serif; font-size:clamp(5rem,14vw,12rem); font-weight:800;
    color:rgba(108,99,255,.04); pointer-events:none;white-space:nowrap;letter-spacing:.08em;
  }
  .v-footer-text { font-size:.95rem;color:var(--ink2);line-height:1.7;max-width:400px;margin:0 auto 1.5rem; }
  .v-footer-link {
    display:inline-flex;align-items:center;gap:.45rem;
    font-weight:700;font-size:.88rem;color:var(--acc-a);text-decoration:none;
    padding:.7rem 1.6rem;border-radius:100px;background:rgba(108,99,255,.07);border:1px solid rgba(108,99,255,.15);
    transition:background .2s,color .2s,border-color .2s,transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .25s;
  }
  .v-footer-link:hover { background:var(--acc-a);color:white;border-color:var(--acc-a);transform:translateY(-2px);box-shadow:0 8px 24px rgba(108,99,255,.3); }

  /* ═══════════════ LOADING ═══════════════ */
  .v-loading { min-height:100vh;background:var(--bg); display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2rem; }
  .v-spinner { width:36px;height:36px; border:2px solid rgba(108,99,255,.12); border-top-color:var(--acc-a); border-radius:50%; animation:spin .9s linear infinite; }
  @keyframes spin{to{transform:rotate(360deg)}}
  .v-loading-text { font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted); }

  /* ═══════════════ RESPONSIVE ═══════════════ */
  @media(max-width:600px){
    .v-feat-grid{grid-template-columns:1fr}
    .v-stats-inner{flex-direction:column}
    .v-stat{border-right:none;border-bottom:1px solid var(--border);padding:1.5rem}
    .v-stat:last-child{border-bottom:none}
    .v-feat-body{padding:1.8rem 1.5rem}
  }

  @media(prefers-reduced-motion:reduce){
    .sa,.v-feat-card,.v-res-card,.v-float,.v-spinner,.v-btn-primary,.v-footer-link{animation:none!important;transition:none!important;transform:none!important;opacity:1!important;filter:none!important}
    .v-orb{animation:none!important}
  }
`;

/* ─── Icons ─────────────────────────────────────────────────────── */
const Mic = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const Chat = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const ChartBar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const BookIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{color:"rgba(108,99,255,.3)"}}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>;
const LinkIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>;
const StarIcon = () => <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const Arrow = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

/* ─── ResourceCard ───────────────────────────────────────────────── */
const ResourceCard = ({ resource, className = "" }) => {
  const domain = (url) => { try { return new URL(url).hostname.replace("www.",""); } catch { return url; } };
  return (
    <div className={`v-res-card ${className}`}>
      {resource.image_url
        ? <div className="v-res-img-wrap"><img src={resource.image_url} alt={resource.title} className="v-res-img" /></div>
        : <div className="v-res-placeholder"><BookIcon /></div>
      }
      <div className="v-res-body">
        {resource.category && <span className="v-tag">{resource.category}</span>}
        <h4 className="v-res-title">{resource.title}</h4>
        <p className="v-res-desc">{resource.description}</p>
        {resource.links?.length > 0 && (
          <div className="v-links-row">
            {resource.links.slice(0,2).map((link,i)=>(
              <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="v-link-chip" title={link}>
                <LinkIcon />{domain(link)}
              </a>
            ))}
            {resource.links.length>2 && <span style={{fontSize:".7rem",color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>+{resource.links.length-2}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Welcome ────────────────────────────────────────────────────── */
const Welcome = () => {
  const user = useSelector(selectUser);
  const [resources, setResources] = useState([]);
  const [assignedResourceDetails, setAssignedResourceDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  /* inject CSS */
  useEffect(() => {
    const id = "vera-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id=id; el.textContent=GLOBAL_CSS;
      document.head.appendChild(el);
    }
    return () => { const el=document.getElementById(id); if(el) el.remove(); };
  }, []);

  /* DOM effects */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const orbs = [1,2,3].map(n=>{
      const o=document.createElement("div"); o.className=`v-orb v-orb-${n}`;
      document.body.appendChild(o); return o;
    });

    const bar=document.createElement("div"); bar.className="v-progress"; document.body.appendChild(bar);

    const btn=document.createElement("button"); btn.className="v-top-btn"; btn.setAttribute("aria-label","Back to top");
    btn.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
    btn.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
    document.body.appendChild(btn);

    const onScroll=()=>{
      const d=document.documentElement;
      bar.style.width=`${Math.min((d.scrollTop/(d.scrollHeight-d.clientHeight))*100,100)}%`;
      btn.classList.toggle("show",d.scrollTop>380);
      if(!reduced){const h=document.querySelector(".v-hero"); if(h) h.style.transform=`translateY(${d.scrollTop*.12}px)`;}
    };
    window.addEventListener("scroll",onScroll,{passive:true});

    const els=document.querySelectorAll(".sa");
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add("visible");
          if(e.target.classList.contains("sa-shimmer")&&!e.target.dataset.shimmered){
            e.target.dataset.shimmered="1";
            const delay=parseFloat(getComputedStyle(e.target).transitionDelay)*1000||0;
            setTimeout(()=>e.target.classList.add("sa-shimmer-run"),delay+280);
          }
        } else {
          e.target.classList.remove("visible","sa-shimmer-run");
          delete e.target.dataset.shimmered;
        }
      });
    },{threshold:.08,rootMargin:"0px 0px -40px 0px"});
    els.forEach(el=>obs.observe(el));

    return ()=>{
      window.removeEventListener("scroll",onScroll);
      obs.disconnect();
      orbs.forEach(o=>o.remove());
      bar.remove(); btn.remove();
    };
  },[loading]);

  useEffect(()=>{fetchData();},[user?.id]);

  const fetchData=async()=>{ setLoading(true); await fetchResources(); if(user?.id) await fetchAssignedResources(); setLoading(false); };
  const fetchResources=async()=>{ try{const r=await axiosInstance.get("/resources");setResources(r.data.resources||r.data||[]);}catch(e){console.error(e);} };
  const fetchAssignedResources=async()=>{
    try{
      const r=await axiosInstance.get(`/resources/get-assignments/${user.id}`);
      const assignments=r.data.assignments||[];
      const all=(await axiosInstance.get("/resources")).data.resources||[];
      setAssignedResourceDetails(assignments.map(a=>all.find(x=>x.id===a.resource_id)).filter(Boolean));
    }catch(e){console.error(e);}
  };
  const domain=url=>{ try{return new URL(url).hostname.replace("www.","");}catch{return url;} };

  const featuredResource=resources[0];
  const otherResources=resources.slice(1,7);

  if(loading) return (
    <div className="v-loading">
      <div className="v-spinner"/>
      <p className="v-loading-text">Loading your experience</p>
    </div>
  );

  return (
    <div>
      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="v-hero">
        <div className="v-hero-floats">
          <div className="v-float v-float-1">
            <div className="v-float-icon" style={{background:"linear-gradient(135deg,#ede9fe,#ddd6fe)"}}>🎙️</div>
            <div><div className="v-float-title">Voice Analysis</div><div className="v-float-sub">AI-powered</div></div>
          </div>
          <div className="v-float v-float-2">
            <div className="v-float-icon" style={{background:"linear-gradient(135deg,#d1fae5,#a7f3d0)"}}>✅</div>
            <div><div className="v-float-title">100% Private</div><div className="v-float-sub">End-to-end secure</div></div>
          </div>
          <div className="v-float v-float-3">
            <div className="v-float-icon" style={{background:"linear-gradient(135deg,#fce7f3,#fbcfe8)"}}>💙</div>
            <div><div className="v-float-title">24 / 7 Support</div><div className="v-float-sub">Always here for you</div></div>
          </div>
        </div>

        <span className="sa sa-drop sa-d0 v-eyebrow">
          <span className="v-eyebrow-dot"/>
          Mental Health Support
        </span>

        <h1 className="sa sa-up sa-d1 v-hero-title">
          Welcome to <span className="v-hero-title-accent">V.E.R.A.</span>
        </h1>

        <p className="sa sa-up sa-d2 v-hero-mono">Voice Emotion Recognition Application</p>

        <p className="sa sa-blr sa-d3 v-hero-desc">
          Your AI-powered companion for mental well-being, offering support through
          voice recognition, predictive analytics, and emotional tracking.
        </p>

        <Link to="/about" className="sa sa-scale sa-d4 v-btn-primary">
          Discover more <Arrow />
        </Link>

        <div className="v-scroll-hint">
          <span>Scroll</span>
          <div className="v-scroll-line"/>
        </div>
      </section>


      {/* ══ FEATURES ═══════════════════════════════════════ */}
      <div className="v-section">
        <div className="v-section-head">
          <span className="sa sa-up sa-d0 v-label">What we offer</span>
          <h2 className="sa sa-up sa-d1 v-heading">Designed for your <em>well-being</em></h2>
          <p className="sa sa-up sa-d2 v-sub">Intelligent tools that understand, adapt, and grow with your emotional journey.</p>
        </div>
        <div className="v-feat-grid">
          {[
            {num:"01",icon:<Mic/>,     title:"Voice Emotion Recognition",desc:"Express yourself naturally and let our AI understand your emotional state through advanced voice analysis."},
            {num:"02",icon:<Chat/>,    title:"AI Chatbot Support",       desc:"Get immediate emotional support and mental health first aid whenever you need it, day or night."},
            {num:"03",icon:<ChartBar/>,title:"Mood Tracking",            desc:"Monitor your emotional patterns and gain valuable insights into your mental wellness journey over time."},
            {num:"04",icon:<ClockIcon/>,title:"Predictive Analytics",    desc:"Early detection of emotional distress patterns to provide timely, compassionate assistance."},
          ].map((f,i)=>(
            <div key={f.num} className={`sa sa-up sa-d${i} v-feat-card sa-shimmer`}>
              <div className="v-feat-num">{f.num}</div>
              <div className="v-feat-icon">{f.icon}</div>
              <div className="v-feat-title">{f.title}</div>
              <p className="v-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="v-divider"/>

      {/* ══ SUGGESTED RESOURCES ════════════════════════════ */}
      {user?.id && assignedResourceDetails.length > 0 && (
        <>
          <div className="v-sug-wrap">
            <div className="v-section">
              <div className="v-section-head">
                <div className="sa sa-up sa-d0 v-sug-badge"><StarIcon/> Personalized for you</div>
                <h2 className="sa sa-up sa-d1 v-heading">Suggested <em>Resources</em></h2>
                <p className="sa sa-up sa-d2 v-sub">Curated by your advisor to support your unique mental wellness path.</p>
              </div>
              <div className="v-scroll-row">
                {assignedResourceDetails.map((r,i)=>(
                  <ResourceCard key={r.id} resource={r} className={`sa sa-scale sa-d${Math.min(i,6)} sa-shimmer`}/>
                ))}
              </div>
            </div>
          </div>
          <div className="v-divider"/>
        </>
      )}

      {/* ══ ALL RESOURCES ══════════════════════════════════ */}
      {resources.length > 0 && (
        <div className="v-section">
          <div className="v-section-head">
            <span className="sa sa-up sa-d0 v-label">Library</span>
            <h2 className="sa sa-up sa-d1 v-heading">Helpful <em>Resources</em></h2>
            <p className="sa sa-up sa-d2 v-sub">Explore curated content and tools to support your mental wellness journey.</p>
          </div>

          {featuredResource && (
            <div className="sa sa-scale sa-d0 v-featured">
              <div className="v-feat-media">
                {featuredResource.image_url
                  ? <img src={featuredResource.image_url} alt={featuredResource.title}/>
                  : <div className="v-feat-ph"><BookIcon/></div>
                }
                <span className="v-feat-badge">Featured</span>
              </div>
              <div className="v-feat-body">
                {featuredResource.category && <span className="v-tag">{featuredResource.category}</span>}
                <h3 className="v-feat-big-title">{featuredResource.title}</h3>
                <p className="v-feat-big-desc">{featuredResource.description}</p>
                {featuredResource.links?.length > 0 && (
                  <div className="v-links-row">
                    {featuredResource.links.map((link,i)=>(
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="v-link-chip" title={link}>
                        <LinkIcon/>{domain(link)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {otherResources.length > 0 && (
            <div className="v-res-grid">
              {otherResources.map((r,i)=>(
                <ResourceCard key={r.id} resource={r} className={`sa sa-up sa-d${i%5} sa-shimmer`}/>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="v-divider"/>

      {/* ══ FOOTER ═════════════════════════════════════════ */}
      <footer className="v-footer">
        <p className="sa sa-up sa-d0 v-footer-text">A safe, accessible, and stigma-free platform for mental health support.</p>
        <Link to="/about" className="sa sa-up sa-d1 v-footer-link">Learn more about our mission <Arrow/></Link>
      </footer>
    </div>
  );
};

export default Welcome;