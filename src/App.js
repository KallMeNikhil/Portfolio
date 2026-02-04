import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useVelocity, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { PROJECTS_DATA } from "./data/projects";

import{
  Cpu,
  Zap,
  ChevronRight,
  Volume2, 
  VolumeX,
  ExternalLink,
  Database, 
  Layout, 
  Terminal, 
  Clock, 
  MapPin, 
  Flag, 
  Gauge, 
  Palette,
  Github,
  Linkedin
} from 'lucide-react';

const MOODS = {
  VOID: {
    name: 'VOID',
    bg: 'bg-zinc-950',
    intensity: 0.2,
    blur: 'backdrop-blur-xl',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.05)]',
    speedMult: 0.4,
    starDensity: 0.5,
    lineSpeed: 1,
    carSpeed: 1.5,
    flareBrightness: 0.2,
    smokeAlpha: 0.05,
    ignitionDelay: 1.2
  },
  AURA: {
    name: 'AURA',
    bg: 'bg-neutral-900',
    intensity: 0.5,
    blur: 'backdrop-blur-lg',
    glow: 'shadow-[0_0_40px_rgba(255,255,255,0.1)]',
    speedMult: 1.0,
    starDensity: 1.0,
    lineSpeed: 2.5,
    carSpeed: 3,
    flareBrightness: 0.5,
    smokeAlpha: 0.15,
    ignitionDelay: 1.0
  },
  PULSE: {
    name: 'PULSE',
    bg: 'bg-slate-950',
    intensity: 1.2,
    blur: 'backdrop-blur-md',
    glow: 'shadow-[0_0_60px_rgba(255,255,255,0.2)]',
    speedMult: 2.5,
    starDensity: 2.0,
    lineSpeed: 6,
    carSpeed: 8,
    flareBrightness: 1.0,
    smokeAlpha: 0.4,
    ignitionDelay: 0.8
  }
};

const ACCENTS = {
  RED: { name: 'Racing Red', color: '#ff1801', glow: 'shadow-red-500/50', border: 'border-red-500/30' },
  BLUE: { name: 'Electric Blue', color: '#00d2ff', glow: 'shadow-blue-500/50', border: 'border-blue-500/30' },
  PURPLE: { name: 'Bright Purple', color: '#8F1FE3', glow: 'shadow-purple-500/50', border: 'border-purple-500/50'}
};

const SkeletonBlock = ({ className, delay = 0 }) => (
  <div className={`relative overflow-hidden bg-white/5 ${className}`}>
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{
        repeat: Infinity,
        duration: 1.4,
        ease: "linear",
        delay
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
    />
  </div>
);

const GlassPanel = ({ children, className = "", mood, ...props }) => (

  <div {...props}
    className={`
      relative overflow-hidden
      border border-white/5 border-t-white/15
      bg-gradient-to-b from-white/[0.03] to-transparent
      bg-black/40 ${mood.blur} shadow-2xl shadow-black/40
      ${className}
    `}>
    <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.02)_50%,transparent_55%)] pointer-events-none" />
    {children}
  </div>
);

const useSoundEngine = (isMuted) => {
  const audioCtx = useRef(null);
  const masterGain = useRef(null);
  const masterFilter = useRef(null);
  const engineOsc = useRef(null);
  const engineGain = useRef(null);

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.current = ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(6000, ctx.currentTime);
    masterFilter.current = filter;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, ctx.currentTime);
    masterGain.current = gain;
    filter.connect(gain);
    gain.connect(ctx.destination);

    const eGain = ctx.createGain();
    eGain.gain.setValueAtTime(0.07, ctx.currentTime);

    const subOsc = ctx.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(28, ctx.currentTime);

    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = "triangle";
    bodyOsc.frequency.setValueAtTime(55, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.6, ctx.currentTime);

    const subGain = ctx.createGain();
    const bodyGain = ctx.createGain();
    const lfoGain = ctx.createGain();

    subGain.gain.value = 0.06;
    bodyGain.gain.value = 0.04;
    lfoGain.gain.value = 4;

    lfo.connect(lfoGain);
    lfoGain.connect(bodyOsc.frequency);

    subOsc.connect(subGain);
    bodyOsc.connect(bodyGain);

    subGain.connect(eGain);
    bodyGain.connect(eGain);

    eGain.connect(filter);

    subOsc.start();
    bodyOsc.start();
    lfo.start();

    engineOsc.current = bodyOsc;
    engineGain.current = eGain;

    return () => { ctx.close(); };
  }, []);

  useEffect(() => {
    if (masterGain.current && audioCtx.current) {
      masterGain.current.gain.setTargetAtTime(isMuted ? 0 : 0.6, audioCtx.current.currentTime, 0.1);
    }
  }, [isMuted]);

  const setEngineVelocity = useCallback((velocity) => {
    if (!engineOsc.current || isMuted) return;
    const rpm = 55 + velocity / 15;

    engineOsc.current.frequency.setTargetAtTime(
      rpm,
      audioCtx.current.currentTime,
      0.3
    );

    engineGain.current.gain.setTargetAtTime(
      0.07 + velocity / 5000,
      audioCtx.current.currentTime,
      0.3
    );

  }, [isMuted]);

  const playClick = useCallback((pan = 0) => {
    if (isMuted || !audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    panner.pan.setValueAtTime(pan, ctx.currentTime);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(masterFilter.current);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, [isMuted]);

  const playSwoosh = useCallback((pan = 0) => {
    if (isMuted || !audioCtx.current) return;
    const ctx = audioCtx.current;
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    panner.pan.setValueAtTime(pan, ctx.currentTime);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(masterFilter.current);
    noise.start();
  }, [isMuted]);

  const playIgnition = useCallback((phase) => {

    if (isMuted || !audioCtx.current) return;
    const ctx = audioCtx.current;
    const now = ctx.currentTime;
    engineGain.current.gain.setTargetAtTime(0.01, now, 0.2);

    if (phase === 1) {
      engineGain.current.gain.setTargetAtTime(0.05, now, 1.5);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(220, now + 1.5);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.8);
      g.gain.linearRampToValueAtTime(0, now + 2.0);
      osc.connect(g);
      g.connect(masterFilter.current);
      osc.start();
      osc.stop(now + 2.0);
    } 
    if (phase === 2) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.08, now + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(g);
      g.connect(masterFilter.current);
      osc.start();
      osc.stop(now + 0.6);
    }
    if (phase === 3) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.8);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(g);
      g.connect(masterFilter.current);
      osc.start();
      osc.stop(now + 0.8);
    }
    if (phase === 4) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(g);
      g.connect(masterFilter.current);
      osc.start();
      osc.stop(now + 0.1);

    }
  }, [isMuted]);

  return { playClick, playSwoosh, playIgnition, setEngineVelocity };
};

const LogoGraphic = ({ accentColor, className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} -skew-x-12`}>
    <path d="M20 80 L20 20 L40 20 L80 80 L80 20" fill="none" stroke="white" strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter" />
    <path d="M80 20 L80 35" fill="none" stroke={accentColor} strokeWidth="12" strokeLinecap="square" />
  </svg>
);

const IgnitionSequence = ({ accent, mood, onComplete, playIgnition }) => {
  useEffect(() => {
    const p1 = setTimeout(() => playIgnition(1), 0);
    const p2 = setTimeout(() => playIgnition(2), 600);
    const p3 = setTimeout(() => playIgnition(3), 1400);
    const p4 = setTimeout(() => playIgnition(4), 2200);
    const end = setTimeout(onComplete, 2800);
    return () => { clearTimeout(p1); clearTimeout(p2); clearTimeout(p3); clearTimeout(p4); clearTimeout(end); };
  }, [onComplete, playIgnition]);

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center ${mood.bg} overflow-hidden`}>
      <motion.div animate={{ background: [`radial-gradient(circle at 30% 30%, ${accent.color}11 0%, transparent 60%)`, `radial-gradient(circle at 70% 70%, ${accent.color}11 0%, transparent 60%)`, `radial-gradient(circle at 30% 30%, ${accent.color}11 0%, transparent 60%)`] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 pointer-events-none opacity-40" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-10" />
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.2, 1.5] }} transition={{ duration: 2.8, ease: "easeInOut" }} className="absolute w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: `radial-gradient(circle, ${accent.color}44 0%, transparent 70%)` }} />
      <motion.div initial={{ x: '-150%', opacity: 0 }} animate={{ x: '150%', opacity: [0, 0.3, 0] }} transition={{ delay: 0.8, duration: 1.2, ease: "circIn" }} className="absolute w-full h-[2px] blur-sm z-20" style={{ backgroundColor: accent.color }} />
      <motion.div initial={{ top: '-100%', left: '-100%' }} animate={{ top: '100%', left: '100%' }} transition={{ delay: 1.8, duration: 1.0, ease: "easeInOut" }} className="absolute w-[200%] h-40 bg-white/5 blur-3xl -rotate-45 z-50 pointer-events-none" />
      <div className="relative flex flex-col items-center z-40">
        <motion.div layoutId="main-logo" initial={{ opacity: 0, scale: 0.7, rotateY: 20 }} animate={{ opacity: 1, scale: [0.7, 1.05, 0.9], rotateY: 0 }} transition={{ duration: 2.4, times: [0, 0.4, 1], ease: "circOut" }}>
          <LogoGraphic accentColor={accent.color} className="w-28 h-28 sm:w-40 sm:h-40 md:w-56 md:h-56" />
          <svg className="absolute inset-[-60px] w-[calc(100%+120px)] h-[calc(100%+120px)] pointer-events-none">
            <motion.circle cx="50%" cy="50%" r="48%" fill="none" stroke={accent.color} strokeWidth="1" strokeDasharray="4 8" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 0.8, 0.8], opacity: [0, 0.4, 0] }} transition={{ delay: 0.6, duration: 1.6, times: [0, 0.7, 1] }} />
          </svg>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2.8 }} className="absolute inset-0 bg-black/40 pointer-events-none" />
    </div>
  );
};

const RacingBackground = ({ mood, scrollSpeed, accentColor, triggerHero }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rippleRef = useRef({ x: 0, y: 0, active: 0 });
  const heroCarRef = useRef({ active: false, x: -1200, y: 0, velocity: 0 });
  const smokeParticles = useRef([]);
  const energyPulses = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleClick = (e) => { 
        rippleRef.current = { x: e.clientX, y: e.clientY, active: 1 };
        energyPulses.current.push({ x: e.clientX, y: e.clientY, r: 0, a: 0.5 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mousedown', handleClick); };
  }, []);

  useEffect(() => {
    if (triggerHero) {
      heroCarRef.current = { active: true, x: -1200, y: (Math.random() * 0.5 + 0.25) * window.innerHeight, velocity: 60 + Math.random() * 30 };
      energyPulses.current.push({ x: 0, y: window.innerHeight / 2, r: 0, a: 1.0 });
    }
  }, [triggerHero]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;
    let stars = []; let clouds = []; let racingLines = []; let ambientCars = []; let midCars = []; let mechanicals = []; let trackCurb = [];
    
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 200 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, z: Math.random() * 1000, size: Math.random() * 2 }));
      clouds = Array.from({ length: 6 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * (canvas.height * 0.45), w: Math.random() * 600 + 300, h: Math.random() * 150 + 50, speed: Math.random() * 0.3 + 0.1 }));
      racingLines = Array.from({ length: 6 }, (_, i) => ({ id: i, flowOffset: Math.random() * 4000, curvature: (Math.random() - 0.5) * 800, width: 1.5 + i * 2, opacity: 0.08 + i * 0.04 }));
      trackCurb = Array.from({ length: 2 }, (_, i) => ({ side: i === 0 ? -1 : 1, flowOffset: 0 }));
      ambientCars = Array.from({ length: 8 }, (_, i) => ({ x: Math.random() * canvas.width, y: (canvas.height * 0.15) + (i * 100), z: Math.random() * 0.4 + 0.1, speed: (1.5 + Math.random() * 2.5), lane: i }));
      midCars = Array.from({ length: 3 }, (_, i) => ({ x: -500 - (i * 1000), y: canvas.height * 0.5 + (i * 150), speed: 15 + Math.random() * 10, scale: 1.5, opacity: 0.2 }));
      mechanicals = [{ x: 150, y: canvas.height - 150, type: 'RPM', val: 0, r: 80 }, { x: canvas.width - 150, y: 150, type: 'TELEMETRY', val: 0, r: 60 }, { x: 120, y: canvas.height - 120, type: 'ROTATING_CAR', rotation: 0, radius: 45 }, { x: canvas.width - 120, y: 120, type: 'ROTATING_CAR', rotation: 0, radius: 60 }];
    };

    const draw = (time) => {
      ctx.fillStyle = '#020202'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const intensity = mood.intensity; const velocityScale = (scrollSpeed / 400) + mood.speedMult; const mouseX = (mouseRef.current.x - canvas.width / 2) / 60; const mouseY = (mouseRef.current.y - canvas.height / 2) / 60; const steeringX = Math.sin(time / 800) * 5;
      stars.forEach(s => { s.z -= velocityScale * 3.5; if (s.z <= 0) s.z = 1000; const x = (s.x - canvas.width / 2) * (1000 / s.z) + canvas.width / 2 + mouseX * 0.3; const y = (s.y - canvas.height / 2) * (1000 / s.z) + canvas.height / 2 + mouseY * 0.3; ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, 1 - s.z / 1000) * intensity * 0.9})`; ctx.fillRect(x, y, s.size, s.size + velocityScale * 10); });
      clouds.forEach(c => { c.x += c.speed + (velocityScale * 0.15); if (c.x > canvas.width + c.w) c.x = -c.w; ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * intensity})`; ctx.beginPath(); ctx.ellipse(c.x + mouseX, c.y + mouseY, c.w, c.h, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.save(); const horizonY = canvas.height * 0.25; const drawCurvedPath = (offsetX, curve, scale = 1) => { ctx.beginPath(); ctx.moveTo(canvas.width / 2 + offsetX + steeringX + mouseX * 2, horizonY); ctx.bezierCurveTo(canvas.width / 2 + offsetX + curve + mouseX * 8, canvas.height * 0.55, canvas.width / 2 + offsetX - curve - mouseX * 8, canvas.height * 0.85, canvas.width / 2 + offsetX * 3.5 * scale + steeringX * 3 + mouseX * 15, canvas.height + 200); };
      trackCurb.forEach(c => { c.flowOffset -= velocityScale * 20; ctx.save(); ctx.setLineDash([60, 60]); ctx.lineDashOffset = c.flowOffset; ctx.lineWidth = 60; ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.07 * intensity; drawCurvedPath(c.side * 400, 300 * c.side, 1.2); ctx.stroke(); ctx.strokeStyle = '#ff1801'; ctx.lineDashOffset = c.flowOffset + 60; ctx.stroke(); ctx.restore(); });
      racingLines.forEach(l => { l.flowOffset -= velocityScale * 25; ctx.save(); ctx.globalAlpha = l.opacity * intensity; ctx.lineWidth = l.width + (velocityScale * 0.5); ctx.strokeStyle = l.id % 2 === 0 ? '#ffffff' : accentColor; ctx.setLineDash([200, 300]); ctx.lineDashOffset = l.flowOffset; drawCurvedPath((l.id - 2.5) * 110, l.curvature, 1.1); ctx.stroke(); if (l.id === 2 || l.id === 4) { ctx.setLineDash([]); ctx.fillStyle = accentColor; ctx.globalAlpha = 0.25 * intensity; ctx.beginPath(); ctx.arc(canvas.width/2 + l.curvature/2 + mouseX*5, canvas.height * 0.65, 12, 0, Math.PI*2); ctx.fill(); } ctx.restore(); }); ctx.restore();
      ambientCars.forEach(car => { car.x += (car.speed * velocityScale * mood.carSpeed * 0.35); if (car.x > canvas.width + 300) car.x = -300; const scale = car.z * (car.y / canvas.height + 0.6); ctx.save(); ctx.translate(car.x, car.y + Math.sin(time/500 + car.lane)*8 + mouseY); ctx.scale(scale, scale); ctx.fillStyle = `rgba(255,255,255,${0.12 * intensity})`; ctx.fillRect(0, 0, 120, 18); ctx.fillStyle = accentColor; ctx.globalAlpha = 0.5 * intensity; ctx.fillRect(-8, 3, 10, 12); ctx.restore(); });
      midCars.forEach(car => { car.x += car.speed * velocityScale; if (car.x > canvas.width + 600) car.x = -600; ctx.save(); ctx.translate(car.x, car.y + mouseY * 2); ctx.scale(car.scale, car.scale); ctx.fillStyle = `rgba(255,255,255,${car.opacity * intensity})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(100,0); ctx.lineTo(110,15); ctx.lineTo(-10,15); ctx.closePath(); ctx.fill(); ctx.restore(); });
      if (heroCarRef.current.active) { const car = heroCarRef.current; car.x += car.velocity; ctx.save(); ctx.translate(car.x, car.y); ctx.scale(4, 4); ctx.fillStyle = `rgba(255,255,255,${0.18 * intensity})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(180,0); ctx.lineTo(200,30); ctx.lineTo(-20,30); ctx.closePath(); ctx.fill(); const flare = ctx.createRadialGradient(200, 15, 0, 200, 15, 120); flare.addColorStop(0, accentColor); flare.addColorStop(1, 'transparent'); ctx.fillStyle = flare; ctx.globalAlpha = mood.flareBrightness * intensity; ctx.beginPath(); ctx.arc(200, 15, 120, 0, Math.PI*2); ctx.fill(); ctx.restore(); if (Math.random() > 0.35) smokeParticles.current.push({ x: car.x, y: car.y + 80, vx: -3, vy: -1.5, life: 1.2, size: 15 }); if (car.x > canvas.width + 1500) car.active = false; }
      smokeParticles.current.forEach((p, idx) => { p.x += p.vx; p.y += p.vy; p.life -= 0.012; p.size += 1.2; if (p.life <= 0) { smokeParticles.current.splice(idx, 1); return; } ctx.fillStyle = `rgba(180,180,180,${p.life * mood.smokeAlpha * intensity})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); });
      energyPulses.current.forEach((p, idx) => { p.r += 25; p.a -= 0.015; if (p.a <= 0) { energyPulses.current.splice(idx, 1); return; } ctx.strokeStyle = accentColor; ctx.lineWidth = 3; ctx.globalAlpha = p.a * intensity; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke(); });
      mechanicals.forEach(m => { ctx.save(); ctx.translate(m.x + mouseX, m.y + mouseY); ctx.strokeStyle = `rgba(255,255,255,${0.12 * intensity})`; ctx.lineWidth = 1.5; if (m.type === 'RPM') { ctx.beginPath(); ctx.arc(0, 0, m.r, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke(); const rpmAngle = Math.PI * 0.8 + (Math.PI * 1.4 * (velocityScale / 12)); ctx.strokeStyle = accentColor; ctx.beginPath(); ctx.arc(0, 0, m.r, Math.PI * 0.8, Math.min(rpmAngle, Math.PI * 2.2)); ctx.stroke(); } else if (m.type === 'TELEMETRY') { ctx.font = 'bold 9px monospace'; ctx.fillStyle = `rgba(255,255,255,${0.3 * intensity})`; ctx.fillText(`TELEMETRY: [${(mouseX*10).toFixed(2)}, ${(mouseY*10).toFixed(2)}]`, -50, 0); ctx.fillText(`MGU-H: ${(velocityScale * 18.5).toFixed(1)} MJ`, -50, 15); ctx.fillText(`TIRE_TEMP: ${(80 + velocityScale * 4).toFixed(0)}°C`, -50, 30); } else if (m.type === 'ROTATING_CAR') { m.rotation += 0.005 + (velocityScale * 0.002); const rotScale = Math.cos(m.rotation); ctx.scale(rotScale, 1); ctx.globalAlpha = 0.1 * intensity; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-m.radius, 0); ctx.lineTo(m.radius, 0); ctx.lineTo(m.radius * 1.1, m.radius * 0.3); ctx.lineTo(-m.radius * 1.1, m.radius * 0.3); ctx.closePath(); ctx.fill(); } ctx.restore(); });
      animationFrameId = requestAnimationFrame(draw);
    };
    init(); draw(0); window.addEventListener('resize', init); return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', init); };
  }, [mood, scrollSpeed, accentColor, triggerHero]);

  return ( <div className="fixed inset-0 pointer-events-none z-0"> <canvas ref={canvasRef} className="w-full h-full pointer-events-none" /> <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(0,0,0,0.5)_100%)]" /> </div> );
};

const StealthControls = ({ mood, accent, cycleMood, cycleAccent, isMuted, setIsMuted, scrollVelocity, playClick }) => {
  const opacityVal = useTransform(scrollVelocity, [0, 500], [0.6, 0.2]);
  const opacity = useSpring(opacityVal, { damping: 20 });
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
      {['mood', 'accent', 'sound'].map((ctrl, i) => (
        <motion.button 
          key={ctrl}
          onClick={() => {
            playClick(0.8);
            if(ctrl === 'mood') cycleMood();
            if(ctrl === 'accent') cycleAccent();
            if(ctrl === 'sound') setIsMuted(!isMuted);
          }}
          style={{ opacity }}
          whileHover={{ opacity: 1, scale: 1.1, rotate: ctrl === 'mood' ? 45 : 0 }}
          className="w-14 h-14 p-1.5 rounded-full flex items-center justify-center border border-white/5 border-t-white/15 bg-black/40 backdrop-blur-xl shadow-xl cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.02)_50%,transparent_55%)]" />
          <div className="relative z-10">
            {ctrl === 'mood' && <Gauge size={22} className="text-white/60 group-hover:text-white transition-colors" />}
            {ctrl === 'accent' && <Palette size={22} style={{ color: accent.color }} className="transition-colors" />}
            {ctrl === 'sound' && (isMuted ? <VolumeX size={22} className="text-white/20 group-hover:text-white/40" /> : <Volume2 size={22} className="text-white/60 group-hover:text-white" />)}
          </div>
        </motion.button>
      ))}
    </div>
  );
};


const Home = ({ accent, mood, isResolving }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-[100svh] flex flex-col justify-start sm:justify-center mt-20 sm:mt-0 px-4 sm:px-8 lg:px-24"
    >
    <AnimatePresence mode="wait">
      {isResolving ? (
        <div key="skeleton" className="max-w-4xl space-y-8">
          <SkeletonBlock className="h-6 w-48 rounded-full" />
          <div className="space-y-4">
            <SkeletonBlock className="h-24 w-full max-w-2xl rounded-2xl" />
            <SkeletonBlock className="h-24 w-3/4 rounded-2xl" />
          </div>
          <SkeletonBlock className="h-6 w-full max-w-xl rounded-full" />
          <div className="flex gap-12">
            <SkeletonBlock className="h-16 w-32 rounded-xl" />
            <SkeletonBlock className="h-16 w-32 rounded-xl" />
            <SkeletonBlock className="h-16 w-32 rounded-xl" />
          </div>
        </div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl relative z-10">
          <motion.span initial={{ letterSpacing: '0.5em', opacity: 0 }} animate={{ letterSpacing: '0.4em', opacity: 1 }} className="mt-4 sm:mt-10 text-xs uppercase font-black text-white/40 mb-4 sm:mb-6 block">CREATING DIGITAL EXPERIENCES</motion.span>
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black italic text-white leading-[0.85] tracking-tighter mb-8">
            Hi , I’m <br />
            <span style={{ color: accent.color }}>NIKHIL</span>
          </h1>

          <p className="text-sm uppercase tracking-[0.4em] text-white/40 mb-6">
          React • Node • JavaScript • UI/UX Design
          </p>

          <p className="text-base sm:text-lg lg:text-2xl text-white/50 max-w-xl font-medium leading-relaxed mb-12 border-l-4 pl-8" style={{ borderColor: accent.color }}>
          Full-stack developer focused on building performant web apps, immersive UI experiences, and real-world products using React, Node, and modern tooling.
          </p>
          <div className="flex flex-wrap gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-white/20 font-black tracking-widest mb-1">PROJECTS</span>
              <span className="text-4xl font-black italic" style={{ color: accent.color }}>7+</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-white/20 font-black tracking-widest mb-1">EXPERIENCE</span>
              <span className="text-4xl font-black italic text-white">2+ YEARS</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-white/20 font-black tracking-widest mb-1">ROLE</span>
              <span className="text-4xl font-black italic text-white">FULL STACK</span>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const About = ({ accent, mood, isResolving }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-32 pb-48 px-4 sm:px-4 sm:px-8 lg:px-24">
    <AnimatePresence mode="wait">
      {isResolving ? (
        <div key="skeleton" className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <SkeletonBlock className="h-12 w-64 rounded-xl" />
            <SkeletonBlock className="h-64 w-full rounded-[2rem]" />
          </div>
          <div className="space-y-6">
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
          <div>
            <h2 className="text-5xl font-black italic text-white mb-12 uppercase tracking-tighter">ABOUT ME</h2>
            <GlassPanel mood={mood} className="p-6 sm:p-10 rounded-[2rem]">
              <p className="text-xl text-white/70 leading-relaxed mb-8 relative z-10">
              I’m NiKHiL, a full-stack developer who enjoys turning complex problems into clean, performant web experiences. I focus on building practical products using modern JavaScript frameworks and backend systems.
              </p>

              <p className="text-lg text-white/40 leading-relaxed relative z-10">
              Currently exploring advanced frontend animations, scalable APIs, and real-world projects that combine design with engineering. I care deeply about UI polish, performance, and writing maintainable code.
              </p>
            </GlassPanel>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: <MapPin size={20} />, label: "LOCATION", value: "Noida, India" },
              { icon: <Clock size={20} />, label: "EXPERIENCE", value: "2+ YEARS" },
              { icon: <Flag size={20} />, label: "FOCUS", value: "FULL STACK DEVELOPMENT" },
            ].map((item, i) => (
              <GlassPanel key={i} mood={mood} className="flex items-center gap-8 p-8 rounded-2xl group transition-colors hover:border-white/10">
                <div className="p-5 rounded-xl bg-white/5 group-hover:scale-110 transition-transform" style={{ color: accent.color }}>{item.icon}</div>
                <div><p className="text-[10px] uppercase text-white/30 font-black mb-1">{item.label}</p><p className="text-2xl font-black text-white italic tracking-tighter uppercase">{item.value}</p></div>
              </GlassPanel>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const Skills = ({ accent, mood, isResolving }) => {

  const getSkillLabel = (level) => {
    if (level >= 80) return "MASTERED";
    if (level >= 60) return "PROFICIENT";
    return "LEARNING";
  };

  return (
  <div className="min-h-screen pt-32 pb-48 px-4 sm:px-4 sm:px-8 lg:px-24">
    <h2 className="text-5xl font-black italic text-white mb-16 uppercase tracking-tighter">TECHNICAL SKILLS</h2>
    <AnimatePresence mode="wait">
      {isResolving ? (
        <div key="skeleton" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => <SkeletonBlock key={i} className="h-[400px] w-full rounded-[2rem]" />)}
        </div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {[
            {
              title: "FRONTEND",
              icon: <Layout />,
              items: [
                { name: "React", level: 75 },
                { name: "Tailwind", level: 70 },
                { name: "Framer Motion", level: 50 },
                { name: "JavaScript", level: 90 },
                { name: "HTML/CSS", level: 95 }
              ]
            },
            {
              title: "BACKEND",
              icon: <Cpu />,
              items: [
                { name: "Node.js", level: 60 },
                { name: "Express", level: 40 },
                { name: "MongoDB", level: 45 },
                { name: "REST APIs", level: 30 },
                { name: "PostgreSQL", level: 25 }
              ]
            },
            {
              title: "DEVOPS",
              icon: <Database />,
              items: [
                { name: "Vercel", level: 90 },
                { name: "GitHub", level: 85 },
                { name: "Netlify", level: 80 },
                { name: "Basic CI/CD", level: 75 },
                { name: "Deployment", level: 90 }
              ]
            },
            {
              title: "TOOLS",
              icon: <Terminal />,
              items: [
                { name: "Git", level: 75 },
                { name: "GitHub", level: 85 },
                { name: "Vercel", level: 90 },
                { name: "VS Code", level: 95 },
                { name: "Figma", level: 65 }
              ]
            }
          ].map((group, idx) => (
            <GlassPanel key={idx} mood={mood} className="p-6 sm:p-10 rounded-[2rem] group transition-colors hover:border-white/10">
              <div className="mb-8 p-4 rounded-xl bg-white/5 inline-block group-hover:rotate-12 transition-transform" style={{ color: accent.color }}>{group.icon}</div>
              <h3 className="text-xl font-black italic text-white mb-8 uppercase tracking-widest">{group.title}</h3>
              <motion.div
                className="flex flex-col gap-6"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.12
                    }
                  }
                }}
              >
                {group.items.map((skill, sIdx) => (
                  <motion.div
                    key={sIdx}
                    className="flex flex-col gap-2"
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: "easeOut" }
                      }
                    }}
                  >

                    <div className="flex justify-between text-[10px] font-black uppercase text-white/30">
                      <span>{skill.name}</span>
                      <span style={{ color: accent.color }}>
                        {getSkillLabel(skill.level)}
                      </span>
                    </div>

                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">

                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="h-full"
                        style={{ backgroundColor: accent.color }}
                      />

                    </div>

                  </motion.div>
                ))}
              </motion.div>
            </GlassPanel>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
};

const Projects = ({ accent, mood, isResolving, playClick }) => {
  const [activeProject, setActiveProject] = useState(null);

  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-32 pb-48 px-4 sm:px-4 sm:px-8 lg:px-24">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
      <h2 className="text-5xl font-black italic text-white uppercase leading-none tracking-tighter">PROJECTS</h2>
      <div className="text-[10px] uppercase font-black text-white/30 tracking-[0.5em] flex items-center gap-3">SEASON_CURRENT <span className="w-16 h-[1px] bg-white/10" /> TECHNICAL_CIRCUIT</div>
    </div>
    <AnimatePresence mode="wait">
      {isResolving ? (
        <div key="skeleton" className="grid md:grid-cols-2 gap-10">
          {[1,2,3,4].map(i => <SkeletonBlock key={i} className="h-[300px] w-full rounded-[2rem]" />)}
        </div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-10 relative z-10">
          {PROJECTS_DATA.map((proj, idx) => (
            <GlassPanel
              key={proj.id}
              mood={mood}
              onClick={() => {
                playClick();
                setActiveProject(proj);
              }}
              className="p-6 sm:p-12 rounded-[2.5rem] cursor-pointer
                        group transition-all hover:border-white/10"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5 group-hover:bg-gradient-to-r transition-all" style={{ backgroundImage: `linear-gradient(to right, transparent, ${accent.color}, transparent)` }} />
              <div className="flex justify-between items-start mb-16">
                <div><span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3 block">{proj.type}</span><h3 className="text-4xl font-black italic text-white uppercase tracking-tighter group-hover:translate-x-3 transition-transform">{proj.name}</h3></div>
                <div className="p-4 rounded-2xl bg-white/5 text-white/30 group-hover:bg-white group-hover:text-black transition-all"><ExternalLink size={20} /></div>
              </div>
              <div className="flex flex-wrap gap-3 mb-12">{proj.stack.map(s => <span key={s} className="px-4 py-1.5 rounded-md border border-white/5 text-[10px] font-black text-white/30 bg-white/5">{s}</span>)}</div>
              <div className="flex items-center gap-5 py-5 border-t border-white/5"><Zap size={18} style={{ color: accent.color }} /><span className="text-md font-black text-white italic tracking-tighter uppercase">{proj.impact}</span></div>
            </GlassPanel>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
    {activeProject && (
      <ProjectModal
        project={activeProject}
        onClose={() => setActiveProject(null)}
        accent={accent}
        mood={mood}
      />
    )}
  </motion.div>
  );
};

const Experience = ({ accent, mood }) => (
  <div className="min-h-screen pt-32 pb-48 px-4 sm:px-4 sm:px-8 lg:px-24">
    <h2 className="text-5xl font-black italic text-white mb-16">EXPERIENCE</h2>

    <div className="space-y-10">
      <GlassPanel mood={mood} className="p-10 rounded-3xl">
        <h3 className="text-2xl font-black text-white mb-2">Full Stack Developer</h3>
        <p className="text-white/40 mb-4">Personal Projects • 2023 – Present</p>
        <p className="text-white/60 leading-relaxed">
          Built multiple MERN applications, dashboards, and APIs.
          Focused on clean UI, authentication systems, REST APIs and deployment.
        </p>
      </GlassPanel>
    </div>
  </div>
);

const Education = ({ accent, mood }) => (
  <div className="min-h-screen pt-32 pb-48 px-4 sm:px-4 sm:px-8 lg:px-24">
    <h2 className="text-5xl font-black italic text-white mb-16">EDUCATION</h2>

    <GlassPanel mood={mood} className="p-10 rounded-3xl max-w-2xl">
      <h3 className="text-2xl font-black text-white mb-2">
        Bachelor’s Degree
      </h3>
      <p className="text-white/40 mb-4">Computer Science</p>
      <p className="text-white/60">
        Currently pursuing undergraduate studies while building full-stack projects.
      </p>
    </GlassPanel>
  </div>
);

const Contact = ({ accent, mood }) => (
  <div className="min-h-[100svh] pt-32 pb-64 px-4 sm:px-8 lg:px-24">
    <h2 className="text-5xl font-black italic text-white mb-16">CONTACT</h2>

    <GlassPanel mood={mood} className="p-12 rounded-3xl max-w-xl">
      <p className="text-white/60 mb-8">
        Want to collaborate or discuss opportunities?
      </p>

      <form className="space-y-6">
        <input placeholder="Your Name" className="w-full bg-white/5 p-4 rounded-xl outline-none text-white" />
        <input placeholder="Email" className="w-full bg-white/5 p-4 rounded-xl outline-none text-white" />
        <textarea placeholder="Message" rows={4} className="w-full bg-white/5 p-4 rounded-xl outline-none text-white" />

        <button
          type="submit"
          style={{ backgroundColor: accent.color }}
          className="px-8 py-3 font-black text-black rounded-xl"
        >
          Send Message
        </button>
      </form>
    </GlassPanel>
  </div>
);

const ProjectModal = ({ project, onClose, accent }) => {
  const [repoData, setRepoData] = useState(null);
  const [contributors, setContributors] = useState([]);
  const isLoadingRepo = !repoData;
  const repoCacheKey = `repo-${project.repo}`;
  const contributorsCacheKey = `contributors-${project.repo}`;

  useEffect(() => {
    if (!project.repo) return;

    const cachedRepo = localStorage.getItem(repoCacheKey);
    if (cachedRepo) {
      setRepoData(JSON.parse(cachedRepo));
    } else {
      fetch(`https://api.github.com/repos/${project.repo}`)
        .then(res => res.json())
        .then(data => {
          setRepoData(data);
          localStorage.setItem(repoCacheKey, JSON.stringify(data));
        })
        .catch(() => {});
    }

    const cachedContributors = localStorage.getItem(contributorsCacheKey);
    if (cachedContributors) {
      setContributors(JSON.parse(cachedContributors));
    } else {
      fetch(`https://api.github.com/repos/${project.repo}/contributors`)
        .then(res => res.json())
        .then(data => {
          setContributors(data);
          localStorage.setItem(
            contributorsCacheKey,
            JSON.stringify(data)
          );
        })
        .catch(() => {});
    }

  }, [project.repo, repoCacheKey, contributorsCacheKey]);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black/80
                flex items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="max-w-xl w-full bg-neutral-900
           p-6 sm:p-10 rounded-3xl relative
           max-h-[85vh] overflow-y-auto"
      >

        <button
          onClick={onClose}
          className="sticky top-0 ml-auto mb-4
                    text-white/40 hover:text-white"
        >
          ✕
        </button>

        <h2
          className="text-3xl font-black italic mb-4"
          style={{ color: accent.color }}
        >
          {project.name}
        </h2>

        <p className="text-white/60 mb-6">
          {project.description || "Project details coming soon."}
        </p>

        {isLoadingRepo ? (
          <div className="flex gap-6 mb-6">
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex gap-6 text-sm text-white/50 mb-6">
            <span>⭐ {repoData.stargazers_count}</span>
            <span>🍴 {repoData.forks_count}</span>
            <span>👁 {repoData.watchers_count}</span>
          </div>
        )}

        {contributors.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {contributors.slice(0, 5).map(c => (
              <img
                key={c.id}
                src={c.avatar_url}
                alt={c.login}
                title={c.login}
                className="w-8 h-8 rounded-full border border-white/20"
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {project.stack.map(s => (
            <span
              key={s}
              className="px-3 py-1 text-xs border border-white/10 rounded"
            >
              {s}
            </span>
          ))}
        </div>

      <div className="flex flex-wrap gap-4 mt-8">
        <a
          href={`https://github.com/${project.repo}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-5 py-2
                    border border-white/20 rounded-lg
                    text-white hover:bg-white hover:text-black
                    transition-all"
        >
          <Github size={16} />
          GitHub
        </a>

        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2
                      rounded-lg font-black text-black"
            style={{ backgroundColor: accent.color }}
          >
            <ExternalLink size={16} />
            Live Demo
          </a>
        )}
      </div>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [activePage, setActivePage] = useState('HOME');
  const [mood, setMood] = useState(MOODS.AURA);
  const [accent, setAccent] = useState(ACCENTS.BLUE);
  const [isMuted, setIsMuted] = useState(false);
  const [triggerHero, setTriggerHero] = useState(0);
  const { playClick, playSwoosh, playIgnition, setEngineVelocity } = useSoundEngine(isMuted);
  const scrollY = useMotionValue(0);
  const scrollVelocity = useVelocity(scrollY);
  const [velocity, setVelocity] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false)

  const navRefs = useRef({});

  useEffect(() => {
    let hideTimeout;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress = docHeight > 0 ? scrollTop / docHeight : 0;

      scrollY.set(scrollTop);
      setScrollProgress(progress);

      if (scrollTop > 5) {
        setShowProgress(true);
        clearTimeout(hideTimeout);

        hideTimeout = setTimeout(() => {
          setShowProgress(false);
        }, 900); // fades after user stops scrolling
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(hideTimeout);
    };
  }, [scrollY]);

  useEffect(() => {
    const savedMood = localStorage.getItem("mood");
    const savedAccent = localStorage.getItem("accent");

    if (savedMood && MOODS[savedMood]) setMood(MOODS[savedMood]);
    if (savedAccent && ACCENTS[savedAccent]) setAccent(ACCENTS[savedAccent]);
  }, []);

  useEffect(() => {
    localStorage.setItem("mood", mood.name);
  }, [mood]);

  useEffect(() => {
    const accentKey = Object.keys(ACCENTS).find(
      key => ACCENTS[key] === accent
    );

    if (accentKey) localStorage.setItem("accent", accentKey);
  }, [accent]);

  useEffect(() => {
    return scrollVelocity.onChange((v) => { const absV = Math.abs(v); setVelocity(absV); setEngineVelocity(absV); });
  }, [scrollVelocity, setEngineVelocity]);

  const navigate = (page, idx) => {
    if (page === activePage || isResolving) return;
    const pan = (idx - 1.5) / 1.5;
    playSwoosh(pan);
    setIsResolving(true);
    setTimeout(() => {
      setActivePage(page);
      setTriggerHero(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setIsResolving(false), 400);
    }, 150);
  };

  const cameraShake = useSpring(0, { stiffness: 1000, damping: 50 });

  const connectRef = useRef(null);
  const magnetX = useSpring(0, { stiffness: 300, damping: 20 });
  const magnetY = useSpring(0, { stiffness: 300, damping: 20 });

  const handleMagnetMove = (e) => {
    const rect = connectRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    magnetX.set(x * 0.25);
    magnetY.set(y * 0.25);
  };

  const resetMagnet = () => {
    magnetX.set(0);
    magnetY.set(0);
  };

  useEffect(() => { 
    cameraShake.set(velocity / 100); 
  }, [velocity, cameraShake]);

  useEffect(() => {
    const el = navRefs.current[activePage];
    if (el && window.innerWidth < 768) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  }, [activePage]);


  return (
    <>
    <AnimatePresence>
      {showProgress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed top-0 left-0 h-[2px] z-[9999]"
          style={{
            width: `${scrollProgress * 100}%`,
            backgroundColor: accent.color,
            boxShadow: `0 0 8px ${accent.color}`
          }}
        />
      )}
    </AnimatePresence>

    <motion.div style={{ x: useTransform(cameraShake, s => s * (Math.random() - 0.5)), y: useTransform(cameraShake, s => s * (Math.random() - 0.5)) }} className={`min-h-screen ${mood.bg} text-white font-sans selection:bg-white selection:text-black transition-colors duration-1000 overflow-x-hidden`}>
      <AnimatePresence> {isLoading && <IgnitionSequence key="ignition" accent={accent} mood={mood} playIgnition={playIgnition} onComplete={() => setIsLoading(false)} />} </AnimatePresence>
      <RacingBackground mood={mood} scrollSpeed={velocity} accentColor={accent.color} triggerHero={triggerHero} />
      <motion.nav
        className={`fixed top-0 left-0 w-full z-50 px-4 sm:px-8 py-4 flex justify-between items-center`}
      >
        <div className="flex items-center gap-5 cursor-pointer group" onClick={() => navigate('HOME', 0)}>
          <motion.div layoutId="main-logo" className="w-12 h-12 flex items-center justify-center transition-all group-hover:scale-110">
            <LogoGraphic accentColor={accent.color} className="w-10 h-10" />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-md font-black italic uppercase leading-tight tracking-tighter">NiKHiL</h1>
            <p className="text-[10px] uppercase font-black text-white/20 tracking-widest">FULL STACK DEVELOPER</p>
          </div>
        </div>
        <div className="relative mx-4 md:mx-0 max-w-[60vw] md:max-w-full overflow-hidden">
          <div
            className="
              flex gap-8 lg:gap-14
              overflow-x-auto
              scrollbar-hide
              snap-x snap-mandatory
              whitespace-nowrap
              overscroll-x-contain
            "
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x"
            }}
          >

          {['HOME','ABOUT','SKILLS','PROJECTS','EXPERIENCE','EDUCATION','CONTACT'].map((item, idx) => (
            <button key={item} ref={(el) => (navRefs.current[item] = el)} onClick={() => navigate(item, idx)} className={`text-[11px] shrink-0 snap-start font-black tracking-[0.4em] uppercase transition-all relative py-3 ${activePage === item ? 'text-white' : 'text-white/20 hover:text-white'}`}>{item}
              {activePage === item && <motion.div layoutId="navUnderline" className="absolute bottom-0 left-0 w-full h-[3px]" style={{ backgroundColor: accent.color }} />}
            </button>
          ))}
          </div>
        </div>
          <motion.button
            ref={connectRef}
            style={{ x: magnetX, y: magnetY }}
            animate={{
              boxShadow: [
                `0 0 0px ${accent.color}`,
                `0 0 22px ${accent.color}`,
                `0 0 0px ${accent.color}`,
              ],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            onMouseMove={handleMagnetMove}
            onMouseLeave={resetMagnet}
            onHoverStart={() => playIgnition(4)}
            className="flex items-center gap-3 px-4 sm:px-8 py-2 sm:py-3 rounded-sm border border-white/10 text-[9px] sm:text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all group tracking-[0.2em]"
            onClick={() => {
              playClick();
              navigate('CONTACT', 6);
            }}
          >
            CONNECT
            <motion.span
              className="inline-flex"
              whileHover={{ x: 6 }}
            >
              <ChevronRight size={14} />
            </motion.span>
          </motion.button>

          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black to-transparent md:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black to-transparent md:hidden" />

      </motion.nav>

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: isLoading ? 0 : 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="relative z-10">
        <AnimatePresence mode="wait">
          {activePage === 'HOME' && <Home key="home" accent={accent} mood={mood} isResolving={isResolving} />}
          {activePage === 'ABOUT' && <About key="about" accent={accent} mood={mood} isResolving={isResolving} />}
          {activePage === 'SKILLS' && <Skills key="skills" accent={accent} mood={mood} isResolving={isResolving} />}
          {activePage === 'PROJECTS' && <Projects key="projects" accent={accent} mood={mood} isResolving={isResolving} playClick={playClick} />}
          {activePage === 'EXPERIENCE' && <Experience accent={accent} mood={mood} />}
          {activePage === 'EDUCATION' && <Education accent={accent} mood={mood} />}
          {activePage === 'CONTACT' && <Contact accent={accent} mood={mood} />}
        </AnimatePresence>
      </motion.main>

      {!isLoading && <StealthControls mood={mood} accent={accent} cycleMood={() => { if(mood.name==='VOID') setMood(MOODS.AURA); else if(mood.name==='AURA') setMood(MOODS.PULSE); else setMood(MOODS.VOID); }} cycleAccent={() => { if(accent.name==='Racing Red') setAccent(ACCENTS.BLUE); else if(accent.name==='Electric Blue') setAccent(ACCENTS.PURPLE); else setAccent(ACCENTS.RED); }} isMuted={isMuted} setIsMuted={setIsMuted} scrollVelocity={scrollVelocity} playClick={playClick} />}
      

      <footer className="relative z-10 py-12 flex flex-col items-center gap-6 text-white/40 text-xs">
        <div className="flex gap-4 sm:gap-6">

          <motion.a
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => !isMuted && playIgnition(2)}
            href="https://github.whynikhil.xyz"
            target="_blank"
            className="w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center hover:bg-white hover:text-black transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Github size={20} />
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => !isMuted && playIgnition(2)}
            href="https://linkedin.whynikhil.xyz"
            target="_blank"
            className="w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center hover:bg-white hover:text-black transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Linkedin size={20} />
          </motion.a>

        </div>

        <span className="tracking-widest opacity-40">
          © {new Date().getFullYear()} NiKHiL
        </span>

      </footer>
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </motion.div>
    </>
  );
}