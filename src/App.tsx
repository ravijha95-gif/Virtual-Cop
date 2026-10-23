/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Sliders, Crosshair, Target, Folder, Download, Sparkles, CheckCircle } from 'lucide-react';
import { ModernGraphicsConfig } from './types/game';
import { SecurityAuditView } from './components/SecurityAuditView';
import { GraphicsOptimizerView } from './components/GraphicsOptimizerView';
import { ArcadeGameView } from './components/ArcadeGameView';
import { HighDpiCalibrator } from './components/HighDpiCalibrator';
import { FileExplorerView } from './components/FileExplorerView';
import { createPatchBundleZip } from './utils/patchGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'audit' | 'graphics' | 'arcade' | 'calibrator' | 'files'>('audit');

  // Modern graphics configuration state
  const [config, setConfig] = useState<ModernGraphicsConfig>({
    targetResolution: { width: 3840, height: 2160, label: '4K Ultra HD (3840x2160)' },
    aspectRatio: '4:3',
    colorDepth: 32,
    frameRateLimit: 60,
    vsync: true,
    highDpiFix: true,
    antiAliasing: '8x MSAA',
    anisotropicFiltering: '16x',
    textureBilinear: true,
    shadingMode: 1, // Gouraud
    frameSkip: 0, // No frameskip for smooth 60fps
    difficulty: 1, // Normal
    continueCount: 5,
    life1P: 7,
    life2P: 4,
    sightOff: 0,
    wrapperType: 'dgVoodoo2',
    mouseSensitivity: 1.0
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPatch = async () => {
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
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-cyan-500/20 flex-shrink-0">
              VC2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Virtua Cop 2</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  REMASTER &amp; AUDIT
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Portable PC Edition (SEGA 1997) • Security Verified &amp; 4K Modernized
              </div>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('graphics')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'graphics'
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Graphics &amp; High-DPI</span>
            </button>

            <button
              onClick={() => setActiveTab('arcade')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'arcade'
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Play Remastered</span>
            </button>

            <button
              onClick={() => setActiveTab('calibrator')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'calibrator'
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Aim Calibrator</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Archive Files</span>
            </button>
          </nav>

          {/* Quick Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPatch}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDownloading ? 'Packaging...' : 'Download Patch Pack'}</span>
              <span className="sm:hidden">Patch</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 bg-slate-950 border-t border-slate-800 text-xs gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${activeTab === 'audit' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security
          </button>
          <button
            onClick={() => setActiveTab('graphics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${activeTab === 'graphics' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Graphics Fix
          </button>
          <button
            onClick={() => setActiveTab('arcade')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${activeTab === 'arcade' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" /> Play Remaster
          </button>
          <button
            onClick={() => setActiveTab('calibrator')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${activeTab === 'calibrator' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-400" /> Calibrator
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${activeTab === 'files' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <Folder className="w-3.5 h-3.5" /> Files
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'audit' && (
          <SecurityAuditView onGoToOptimizer={() => setActiveTab('graphics')} />
        )}

        {activeTab === 'graphics' && (
          <GraphicsOptimizerView
            config={config}
            onChangeConfig={setConfig}
            onLaunchArcade={() => setActiveTab('arcade')}
          />
        )}

        {activeTab === 'arcade' && (
          <ArcadeGameView config={config} />
        )}

        {activeTab === 'calibrator' && (
          <HighDpiCalibrator />
        )}

        {activeTab === 'files' && (
          <FileExplorerView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Virtua Cop 2 Portable PC Edition (Sega 1997 / Sega AM2)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Security Status: <strong>Zero Malicious Payloads Detected</strong></span>
            <span>•</span>
            <span>Display Target: <strong>{config.targetResolution.label}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
