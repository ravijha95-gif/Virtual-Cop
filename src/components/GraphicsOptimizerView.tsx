/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Monitor, Sliders, Download, Check, Sparkles, Crosshair, RefreshCw, Copy, Layers, Shield } from 'lucide-react';
import { ModernGraphicsConfig } from '../types/game';
import { generateVcop2Ini, generateDgVoodooConf, generateModernLauncherBat, generateRegistryFix, createPatchBundleZip } from '../utils/patchGenerator';

interface Props {
  config: ModernGraphicsConfig;
  onChangeConfig: (newConfig: ModernGraphicsConfig) => void;
  onLaunchArcade: () => void;
}

const RESOLUTION_PRESETS = [
  { width: 1920, height: 1080, label: '1080p Full HD (1920x1080)' },
  { width: 2560, height: 1440, label: '1440p QHD (2560x1440)' },
  { width: 3840, height: 2160, label: '4K Ultra HD (3840x2160)' },
  { width: 2560, height: 1080, label: '21:9 Ultrawide (2560x1080)' },
  { width: 3440, height: 1440, label: '21:9 Ultrawide QHD (3440x1440)' },
  { width: 1600, height: 1200, label: '4:3 Retro Sharp (1600x1200)' },
  { width: 640, height: 480, label: '640x480 (Original 1997)' }
];

export const GraphicsOptimizerView: React.FC<Props> = ({ config, onChangeConfig, onLaunchArcade }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'preview_ini' | 'preview_dgvoodoo' | 'preview_launcher'>('config');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [comparisonSlider, setComparisonSlider] = useState<number>(50);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      const blob = await createPatchBundleZip(config);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VirtuaCop2_Modern_Remaster_Patch_${config.targetResolution.width}x${config.targetResolution.height}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadIni = () => {
    const iniContent = generateVcop2Ini(config);
    const blob = new Blob([iniContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VCOP2.INI';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/40 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> High-DPI &amp; Resolution Remastering Suite
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Modern Graphics &amp; Frame Rate Stabilizer
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
              Virtua Cop 2 was designed for 640x480 DirectDraw in 1997. This optimizer converts legacy rendering calls 
              to native DirectX 11/12, stabilizes the 60 FPS physics clock, and synchronizes the mouse hitboxes on high-DPI displays.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Packaging Patch...' : 'Download Full Patch (.ZIP)'}</span>
            </button>

            <button
              onClick={onLaunchArcade}
              className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Crosshair className="w-4 h-4" />
              <span>Play Remastered In-Browser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Visual Comparison Slider */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Real-Time Visual Enhancement Simulation
            </h2>
            <p className="text-xs text-slate-400">
              Drag the comparison slider to see the difference between 1997 640x480 pixelation and modern 4K filtered rendering.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full">
            {comparisonSlider < 50 ? 'Original 1997 DirectDraw (640x480)' : `Remastered 4K 60FPS (${config.targetResolution.label})`}
          </span>
        </div>

        <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 select-none">
          {/* Remastered layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/60 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full h-full relative rounded-lg border border-cyan-500/40 bg-gradient-to-tr from-cyan-950/40 to-slate-900 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
              {/* Modern City Backdrop */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400/20 via-blue-900/40 to-black" />
              
              <div className="relative z-10 space-y-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/40">
                  NATIVE {config.targetResolution.width}x{config.targetResolution.height} • 60 FPS LOCKED • 16x AF • 8x MSAA
                </span>
                <h3 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-300 tracking-wider">
                  VIRTUA COP 2 : REMASTERED
                </h3>
                <p className="text-xs md:text-sm text-cyan-200/80 max-w-lg mx-auto">
                  Silky smooth polygon rendering, crisp texture edge smoothing, anti-aliased crosshair precision, zero mouse aim offset.
                </p>
              </div>

              {/* Crosshair simulation */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 border-cyan-400 flex items-center justify-center animate-pulse pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div className="absolute -top-1 w-0.5 h-3 bg-cyan-400" />
                <div className="absolute -bottom-1 w-0.5 h-3 bg-cyan-400" />
                <div className="absolute -left-1 w-3 h-0.5 bg-cyan-400" />
                <div className="absolute -right-1 w-3 h-0.5 bg-cyan-400" />
              </div>
            </div>
          </div>

          {/* Original 1997 layer (clipped) */}
          <div
            className="absolute inset-y-0 left-0 bg-slate-950 overflow-hidden border-r-2 border-amber-400"
            style={{ width: `${comparisonSlider}%` }}
          >
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center filter contrast-125 saturate-50"
                 style={{ imageRendering: 'pixelated', minWidth: '100%' }}>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  ORIGINAL 1997 DIRECTDRAW (640x480 @ 16-BIT)
                </span>
                <h3 className="text-2xl md:text-4xl font-mono font-bold text-amber-200/70 tracking-widest">
                  SEGA VIRTUA COP 2
                </h3>
                <p className="text-xs text-amber-300/60 max-w-md mx-auto">
                  Heavy pixelation, jagged polygon edges, color banding, and mouse offset when Windows scaling is active.
                </p>
              </div>
            </div>
          </div>

          {/* Slider Controller */}
          <input
            type="range"
            min={0}
            max={100}
            value={comparisonSlider}
            onChange={e => setComparisonSlider(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />

          {/* Slider Divider Line Handle */}
          <div
            className="absolute inset-y-0 pointer-events-none flex items-center justify-center z-20"
            style={{ left: `${comparisonSlider}%` }}
          >
            <div className="w-8 h-8 -ml-4 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl text-xs font-bold border border-slate-300">
              ⟷
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3.5 px-6 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/80 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Interactive Modernizer Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('preview_ini')}
            className={`py-3.5 px-6 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preview_ini'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/80 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="font-mono">VCOP2.INI</span>
            <span>(Config File)</span>
          </button>

          <button
            onClick={() => setActiveTab('preview_dgvoodoo')}
            className={`py-3.5 px-6 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preview_dgvoodoo'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/80 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="font-mono">dgVoodoo.conf</span>
            <span>(D3D11/12 Wrapper)</span>
          </button>

          <button
            onClick={() => setActiveTab('preview_launcher')}
            className={`py-3.5 px-6 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preview_launcher'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/80 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="font-mono">Launch_VC2.bat</span>
            <span>(64-bit Launcher)</span>
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Display & Resolution Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    Target Resolution &amp; Aspect Ratio
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your monitor resolution. The graphics wrapper will upscale Virtua Cop 2's internal pipeline.
                  </p>
                </div>

                {/* Resolution Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Resolution Preset</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {RESOLUTION_PRESETS.map((res) => {
                      const isSelected = config.targetResolution.width === res.width && config.targetResolution.height === res.height;
                      return (
                        <button
                          key={res.label}
                          onClick={() => onChangeConfig({ ...config, targetResolution: res })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-950/50'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-xs">{res.label.split(' (')[0]}</div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{res.width} x {res.height}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Aspect Ratio Handling</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '4:3', label: 'Classic 4:3 (Pillarbox)', desc: 'Preserves original 1997 arcade geometry' },
                      { id: '16:9', label: '16:9 Widescreen', desc: 'Stretches to modern widescreen' },
                      { id: '21:9', label: '21:9 Ultrawide', desc: 'Full ultrawide display coverage' }
                    ].map(ar => (
                      <button
                        key={ar.id}
                        onClick={() => onChangeConfig({ ...config, aspectRatio: ar.id as ModernGraphicsConfig['aspectRatio'] })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          config.aspectRatio === ar.id
                            ? 'bg-cyan-950/40 border-cyan-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{ar.id}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{ar.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* High DPI Scaling Fix Toggle */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      High-DPI Mouse Aim Synchronization Fix
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      Fixes the notorious mouse offset glitch where bullets hit away from the cursor on displays with 125%-250% Windows scaling.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={config.highDpiFix}
                    onChange={e => onChangeConfig({ ...config, highDpiFix: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Performance & Filtering Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    Frame Rate &amp; Visual Filtering
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Virtua Cop 2's physics are timed to 60 FPS. Keep 60Hz lock enabled to prevent the high-refresh speedup glitch.
                  </p>
                </div>

                {/* Frame Rate Limit */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">Frame Rate Cap &amp; Loop Timing</label>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{config.frameRateLimit} FPS</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[60, 120, 144, 240].map(fps => (
                      <button
                        key={fps}
                        onClick={() => onChangeConfig({ ...config, frameRateLimit: fps as ModernGraphicsConfig['frameRateLimit'] })}
                        className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                          config.frameRateLimit === fps
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {fps} {fps === 60 ? '(Recommended)' : 'FPS'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    * 60 FPS is strongly recommended. 120Hz/144Hz without proper wrapper frame-pacing causes enemies to shoot 2x faster.
                  </p>
                </div>

                {/* Anti-Aliasing & Anisotropic Filtering */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Multisample Anti-Aliasing</label>
                    <select
                      value={config.antiAliasing}
                      onChange={e => onChangeConfig({ ...config, antiAliasing: e.target.value as ModernGraphicsConfig['antiAliasing'] })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Off">Off (Pixelated retro edges)</option>
                      <option value="2x MSAA">2x MSAA</option>
                      <option value="4x MSAA">4x MSAA</option>
                      <option value="8x MSAA">8x MSAA (Smooth geometry)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Anisotropic Filtering</label>
                    <select
                      value={config.anisotropicFiltering}
                      onChange={e => onChangeConfig({ ...config, anisotropicFiltering: e.target.value as ModernGraphicsConfig['anisotropicFiltering'] })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Off">Off (Blurry oblique textures)</option>
                      <option value="4x">4x Anisotropic</option>
                      <option value="8x">8x Anisotropic</option>
                      <option value="16x">16x (Crystal clear road/walls)</option>
                    </select>
                  </div>
                </div>

                {/* VSync & Shading */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-slate-700">
                    <div>
                      <div className="text-xs font-bold text-white">VSync Lock</div>
                      <div className="text-[10px] text-slate-500">Eliminates screen tearing</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.vsync}
                      onChange={e => onChangeConfig({ ...config, vsync: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-slate-700">
                    <div>
                      <div className="text-xs font-bold text-white">Gouraud Shading</div>
                      <div className="text-[10px] text-slate-500">Smooth polygon shading</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.shadingMode === 1}
                      onChange={e => onChangeConfig({ ...config, shadingMode: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Game Difficulty & Lives */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gameplay Tuning (Saved to VCOP2.INI)</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Starting Lives:</span>
                      <select
                        value={config.life1P}
                        onChange={e => onChangeConfig({ ...config, life1P: Number(e.target.value) })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white w-full cursor-pointer"
                      >
                        {[3, 4, 5, 7, 9].map(l => (
                          <option key={l} value={l}>{l} Lives</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-1">Continues:</span>
                      <select
                        value={config.continueCount}
                        onChange={e => onChangeConfig({ ...config, continueCount: Number(e.target.value) })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white w-full cursor-pointer"
                      >
                        {[3, 5, 9, 99].map(c => (
                          <option key={c} value={c}>{c === 99 ? 'Infinite' : c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-1">Difficulty:</span>
                      <select
                        value={config.difficulty}
                        onChange={e => onChangeConfig({ ...config, difficulty: Number(e.target.value) as ModernGraphicsConfig['difficulty'] })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white w-full cursor-pointer"
                      >
                        <option value={0}>Easy</option>
                        <option value={1}>Normal</option>
                        <option value={2}>Hard</option>
                        <option value={3}>Very Hard</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VCOP2.INI Preview */}
          {activeTab === 'preview_ini' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-sm font-bold text-white">Generated VCOP2.INI</h4>
                  <p className="text-xs text-slate-400">Place this file directly in your Virtua Cop 2 'Game Files' directory.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(generateVcop2Ini(config))}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownloadIni}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download VCOP2.INI</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96">
                {generateVcop2Ini(config)}
              </pre>
            </div>
          )}

          {/* dgVoodoo.conf Preview */}
          {activeTab === 'preview_dgvoodoo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-sm font-bold text-white">Generated dgVoodoo.conf (D3D11/12 Wrapper)</h4>
                  <p className="text-xs text-slate-400">Ensures seamless 4K rendering and 60 FPS lock on modern GPUs without driver deprecation.</p>
                </div>
                <button
                  onClick={() => handleCopy(generateDgVoodooConf(config))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Config'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-96">
                {generateDgVoodooConf(config)}
              </pre>
            </div>
          )}

          {/* Launcher Script Preview */}
          {activeTab === 'preview_launcher' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-sm font-bold text-white">Generated Launch_VirtuaCop2_Modern.bat</h4>
                  <p className="text-xs text-slate-400">Replaces 16-bit VC2.EXE, bypassing obsolete CLASS.EXE to run on 64-bit Windows 10/11.</p>
                </div>
                <button
                  onClick={() => handleCopy(generateModernLauncherBat())}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 overflow-x-auto max-h-96">
                {generateModernLauncherBat()}
              </pre>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <h5 className="font-bold text-xs text-white mb-1">Companion Registry Patch (VirtuaCop2_HighDPI_Fix.reg):</h5>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                  {generateRegistryFix()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
