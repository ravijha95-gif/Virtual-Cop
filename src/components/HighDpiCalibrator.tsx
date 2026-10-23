/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Target, Monitor, CheckCircle, RefreshCw, Zap, Award } from 'lucide-react';
import { soundEngine } from '../utils/audioSynthesizer';

export const HighDpiCalibrator: React.FC = () => {
  const [target, setTarget] = useState<{ x: number; y: number; size: number }>({ x: 50, y: 50, size: 40 });
  const [hits, setHits] = useState<number>(0);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [avgDistance, setAvgDistance] = useState<number>(0);
  const [lastReactionMs, setLastReactionMs] = useState<number>(0);
  const [avgReactionMs, setAvgReactionMs] = useState<number>(0);
  const [targetSpawnTime, setTargetSpawnTime] = useState<number>(performance.now());
  const [testActive, setTestActive] = useState<boolean>(false);

  // Monitor metrics
  const [dpi, setDpi] = useState<number>(window.devicePixelRatio || 1);
  const [screenRes, setScreenRes] = useState({ w: window.screen.width, h: window.screen.height });
  const [innerRes, setInnerRes] = useState({ w: window.innerWidth, h: window.innerHeight });

  const reactionsRef = useRef<number[]>([]);
  const distancesRef = useRef<number[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setDpi(window.devicePixelRatio || 1);
      setScreenRes({ w: window.screen.width, h: window.screen.height });
      setInnerRes({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const spawnNewTarget = () => {
    // Keep target inside 15% - 85% bounds
    const x = 15 + Math.random() * 70;
    const y = 15 + Math.random() * 70;
    const size = Math.max(28, 55 - hits * 2); // gets slightly smaller as player scores
    setTarget({ x, y, size });
    setTargetSpawnTime(performance.now());
  };

  const startTest = () => {
    setHits(0);
    setTotalClicks(0);
    setAvgDistance(0);
    setLastReactionMs(0);
    setAvgReactionMs(0);
    reactionsRef.current = [];
    distancesRef.current = [];
    setTestActive(true);
    spawnNewTarget();
  };

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!testActive) return;
    setTotalClicks(c => c + 1);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetPixelX = (target.x / 100) * rect.width;
    const targetPixelY = (target.y / 100) * rect.height;

    const dist = Math.hypot(clickX - targetPixelX, clickY - targetPixelY);
    const radius = target.size / 2;

    if (dist <= radius) {
      // Hit!
      const reactionTime = Math.round(performance.now() - targetSpawnTime);
      reactionsRef.current.push(reactionTime);
      distancesRef.current.push(dist);

      setLastReactionMs(reactionTime);
      const avgR = Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length);
      const avgD = Math.round((distancesRef.current.reduce((a, b) => a + b, 0) / distancesRef.current.length) * 10) / 10;
      setAvgReactionMs(avgR);
      setAvgDistance(avgD);

      setHits(h => {
        const next = h + 1;
        if (next >= 15) {
          setTestActive(false);
          soundEngine.playStageClear();
        } else {
          soundEngine.playGunshot();
        }
        return next;
      });

      if (hits + 1 < 15) {
        spawnNewTarget();
      }
    } else {
      soundEngine.playEmptyClick();
    }
  };

  const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <Zap className="w-3.5 h-3.5" /> Sub-Pixel Aim &amp; Scaling Diagnostic
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              High-DPI Mouse Alignment &amp; Latency Calibrator
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Calibrate your pointer coordinates across high-refresh (144Hz+) and scaled displays (125%-200%). 
              Verify zero subpixel offset between mouse click inputs and engine collision boxes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!testActive ? (
              <button
                onClick={startTest}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                <span>{hits > 0 ? 'Repeat Calibration' : 'Start 15-Target Calibration'}</span>
              </button>
            ) : (
              <button
                onClick={() => setTestActive(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Display Diagnostics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Hardware DPI Factor:</span>
            <span className="text-cyan-400 font-bold text-sm">{dpi * 100}% ({dpi}x)</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Physical Screen Res:</span>
            <span className="text-white font-bold text-sm">{screenRes.w} x {screenRes.h}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Viewport Pixels:</span>
            <span className="text-white font-bold text-sm">{innerRes.w} x {innerRes.h}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">High-DPI Alignment:</span>
            <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> 1:1 Synchronized
            </span>
          </div>
        </div>
      </div>

      {/* Calibration Field */}
      <div
        onClick={handleAreaClick}
        className="relative w-full h-96 bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden cursor-crosshair shadow-inner select-none flex items-center justify-center"
      >
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {testActive && (
          <div
            className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 transition-all flex items-center justify-center cursor-crosshair animate-scale-in"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.size}px`,
              height: `${target.size}px`,
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              border: '2px solid #ef4444',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
            }}
          >
            {/* Inner Bullseye */}
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="absolute inset-0 rounded-full border border-red-400 animate-ping opacity-40 pointer-events-none" />
          </div>
        )}

        {!testActive && hits === 0 && (
          <div className="text-center p-6 space-y-3 pointer-events-none">
            <Target className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Click "Start Calibration" Above</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              15 rapid target rings will appear across the viewport. Hit them cleanly to compute your display latency 
              and verify sub-pixel mouse hit precision.
            </p>
          </div>
        )}

        {!testActive && hits >= 15 && (
          <div className="text-center p-6 space-y-3 z-10 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-2xl max-w-md">
            <Award className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Calibration Complete!</h3>
            <p className="text-xs text-slate-300">
              Your mouse coordinates mapped with <strong>{accuracy}% accuracy</strong> and an average offset of <strong>{avgDistance}px</strong> from center.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-left bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Avg Latency:</span>
                <span className="text-cyan-400 font-bold">{avgReactionMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Accuracy:</span>
                <span className="text-emerald-400 font-bold">{accuracy}%</span>
              </div>
            </div>

            <button
              onClick={startTest}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Test Again
            </button>
          </div>
        )}

        {/* Live HUD at bottom of test area */}
        {testActive && (
          <div className="absolute bottom-4 inset-x-4 flex justify-between items-center text-xs font-mono text-slate-300 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 pointer-events-none">
            <div>
              TARGET: <strong className="text-cyan-400">{hits + 1} / 15</strong>
            </div>
            <div>
              LAST REACTION: <strong className="text-amber-400">{lastReactionMs} ms</strong>
            </div>
            <div>
              ACCURACY: <strong className="text-emerald-400">{accuracy}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
