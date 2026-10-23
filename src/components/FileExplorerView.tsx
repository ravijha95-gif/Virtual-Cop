/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Settings, Info, Folder, Download } from 'lucide-react';

export const FileExplorerView: React.FC = () => {
  const [readmeContent, setReadmeContent] = useState<string>('Loading README.TXT...');
  const [iniContent, setIniContent] = useState<string>('Loading VCOP2.INI...');
  const [selectedFile, setSelectedFile] = useState<'readme' | 'ini' | 'opening' | 'please'>('readme');

  useEffect(() => {
    fetch('/game-assets/readme.txt')
      .then(res => res.text())
      .then(text => setReadmeContent(text))
      .catch(() => setReadmeContent('Failed to load README.TXT'));

    fetch('/game-assets/vcop2.ini')
      .then(res => res.text())
      .then(text => setIniContent(text))
      .catch(() => setIniContent('Failed to load VCOP2.INI'));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Folder className="w-5 h-5 text-cyan-400" />
          Extracted Game Package Asset Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect original documentation, texture splash screens, and initial configuration files extracted directly from the archive.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File selector sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setSelectedFile('readme')}
            className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
              selectedFile === 'readme'
                ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs truncate">README.TXT</div>
              <div className="text-[10px] text-slate-500 font-mono">Original Sega Manual (2.8 KB)</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedFile('ini')}
            className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
              selectedFile === 'ini'
                ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs truncate">VCOP2.INI</div>
              <div className="text-[10px] text-slate-500 font-mono">Default Engine Config (3.0 KB)</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedFile('opening')}
            className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
              selectedFile === 'opening'
                ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs truncate">OPENING.BMP</div>
              <div className="text-[10px] text-slate-500 font-mono">Title Splash Screen (352x240)</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedFile('please')}
            className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
              selectedFile === 'please'
                ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs truncate">PLEASE.BMP</div>
              <div className="text-[10px] text-slate-500 font-mono">Loading Screen Asset (352x240)</div>
            </div>
          </button>
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {selectedFile === 'readme' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-cyan-400">Game Files / README.TXT</span>
                <span className="text-[11px] text-slate-400">Encoding: Windows-1252 / ASCII</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed">
                {readmeContent}
              </pre>
            </div>
          )}

          {selectedFile === 'ini' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-emerald-400">Game Files / VCOP2.INI</span>
                <span className="text-[11px] text-slate-400">Configuration Format</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed">
                {iniContent}
              </pre>
            </div>
          )}

          {selectedFile === 'opening' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-amber-400">Game Files / OPENING.BMP</span>
                <span className="text-[11px] text-slate-400">Dimensions: 352 x 240 (8-bit indexed)</span>
              </div>
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                <img
                  src="/game-assets/opening.bmp"
                  alt="Virtua Cop 2 Opening Splash"
                  className="rounded-lg shadow-xl max-w-full h-auto border border-slate-800"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p className="text-xs text-slate-400 mt-4 text-center">
                  Original 1997 title screen backdrop rendered at Sega Model 2 aspect ratio.
                </p>
              </div>
            </div>
          )}

          {selectedFile === 'please' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-indigo-400">Game Files / PLEASE.BMP</span>
                <span className="text-[11px] text-slate-400">Dimensions: 352 x 240 (8-bit indexed)</span>
              </div>
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                <img
                  src="/game-assets/please.bmp"
                  alt="Virtua Cop 2 Please Wait Splash"
                  className="rounded-lg shadow-xl max-w-full h-auto border border-slate-800"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p className="text-xs text-slate-400 mt-4 text-center">
                  "Please Wait" loading intermission screen from Sega PC port.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
