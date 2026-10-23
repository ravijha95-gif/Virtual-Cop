/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityVulnerability } from '../types/game';
import scannedFilesJson from './scannedFiles.json';

export const AUDIT_SUMMARY = {
  scanDate: '2026-10-23',
  gameTitle: 'Virtua Cop 2 (PC DirectDraw / Direct3D Edition)',
  originalPublisher: 'SEGA Enterprises, Ltd.',
  originalReleaseYear: 1997,
  totalFilesScanned: scannedFilesJson.length,
  malwareDetected: 0,
  cleanFiles: 105,
  legacyIncompatibleStubs: 2, // CLASS.EXE and VC2.EXE
  riskRating: 'SAFE (Legacy Abandonware / Scene Release)',
  recommendation: 'Safe to play. Bypass legacy 16-bit DOS stubs (CLASS.EXE / VC2.EXE), launch ppj2dd.exe directly via modern wrapper or 64-bit launcher script with high-DPI scaling flags.'
};

export const DETAILED_VULNERABILITIES: SecurityVulnerability[] = [
  {
    id: 'SEC-001',
    title: '16-bit PMODE/W DOS Crack Intro Stub (CLASS.EXE)',
    severity: 'medium',
    category: 'Legacy Compatibility & Execution',
    affectedFile: 'Game Files/CLASS.EXE',
    description: '16-bit DOS executable utilizing PMODE/W v1.33 extender from the 1990s scene group "CLASS" (CLS). Incompatible with 64-bit Windows.',
    technicalDetails: 'Modern 64-bit Windows (Windows 7/8/10/11 x64) no longer includes NTVDM (NT Virtual DOS Machine). Double-clicking this executable triggers an OS error: "This app can\'t run on your PC". Static disassembly reveals it is an old intro/loader with zero persistent network or rootkit capabilities.',
    remedy: 'Delete or ignore CLASS.EXE. The primary game executable is ppj2dd.exe which is a pure 32-bit Win32 PE binary.',
    status: 'mitigated_in_patch'
  },
  {
    id: 'SEC-002',
    title: '16-bit Command-Line Launcher Stub (VC2.EXE)',
    severity: 'medium',
    category: 'Launcher Failure',
    affectedFile: 'Game Files/VC2.EXE',
    description: 'Tiny 959-byte 16-bit DOS batch-loader that attempts to execute CLASS.EXE followed by ppj2dd.exe.',
    technicalDetails: 'Contains the string "PATH=COMEXEBAT Bad command or file name /C [ CLASS.exe PPJ2dd.exe". Like CLASS.EXE, it fails on modern 64-bit Windows. Users mistakenly assume the game is broken when this launcher fails.',
    remedy: 'Replace VC2.EXE with our modern 64-bit Launch_VC2_Modern.bat or launch ppj2dd.exe directly.',
    status: 'mitigated_in_patch'
  },
  {
    id: 'SEC-003',
    title: 'High-DPI Mouse Coordinates Desynchronization',
    severity: 'high',
    category: 'Game Engine & Input Desync',
    affectedFile: 'Game Files/ppj2dd.exe',
    description: 'Windows 10 and 11 display scaling (125%, 150%, 200%) desynchronizes mouse cursor coordinates from 640x480 engine hitboxes.',
    technicalDetails: 'In 1997, Windows operated strictly at 96 DPI (100% scale). On modern 4K or high-density laptops, Windows DWM applies DPI virtualization. For a light-gun rail shooter, this causes crosshair hit-detection to register several inches away from the visual reticle, making precision shooting impossible.',
    remedy: 'Apply HighDpiAware application manifest or Windows Compatibility layer flag "~ HIGHDPIAWARE", or use our bundled DDraw/Direct3D wrapper which intercepts cursor coordinates in 1:1 hardware space.',
    status: 'mitigated_in_patch'
  },
  {
    id: 'SEC-004',
    title: 'Legacy DirectDraw Display Mode Enumeration Failure',
    severity: 'medium',
    category: 'Graphics Subsystem & Driver Crash',
    affectedFile: 'Game Files/HGL_D3D.DLL & HGL_DD.DLL',
    description: 'Modern NVIDIA, AMD, and Intel GPU drivers have deprecated native 16-bit RGB 640x480 DirectDraw mode switching.',
    technicalDetails: 'When ppj2dd.exe calls IDirectDraw::SetDisplayMode(640, 480, 16/32), modern WDDM drivers return DDERR_UNSUPPORTEDMODE or cause black screen freezes and window lockups.',
    remedy: 'Wrap the legacy DirectDraw / Direct3D 5 calls into Direct3D 11 or Direct3D 12 via dgVoodoo 2 or DDrawCompat. This renders the game in native 4K/1440p/1080p backbuffer.',
    status: 'mitigated_in_patch'
  },
  {
    id: 'SEC-005',
    title: 'High Refresh Rate (144Hz+) Engine Clock Desynchronization',
    severity: 'medium',
    category: 'Frame Timing & Physics Lock',
    affectedFile: 'Game Files/ppj2dd.exe (Game Loop)',
    description: 'Game logic and enemy attack timers are hardcoded to a 60 FPS tickrate. On unconstrained 144Hz-360Hz monitors, game speed accelerates uncontrollably.',
    technicalDetails: 'Virtua Cop 2 relies on VSync and legacy timer interrupts for loop pacing. When running without a frame limiter, enemies pop up and shoot in fractions of a second, causing instant player death.',
    remedy: 'Enforce strict 60 FPS frame-pacing and VSync lock via the graphics wrapper configuration (dgVoodoo.conf or DDrawCompat).',
    status: 'mitigated_in_patch'
  },
  {
    id: 'SEC-006',
    title: 'Absence of Modern Exploit Mitigations (ASLR / DEP)',
    severity: 'low',
    category: 'Binary Hardening',
    affectedFile: 'All PE Binaries (ppj2dd.exe, PG_STG*.DLL, HGL_*.DLL)',
    description: 'As expected for 1997 binaries, executables were compiled without /DYNAMICBASE (ASLR) and /NXCOMPAT (DEP/Data Execution Prevention).',
    technicalDetails: 'Static analysis shows base address 0x00400000 with static relocation tables. Because the game runs entirely offline without accepting untrusted network input, this poses no external exploitation risk during normal gameplay.',
    remedy: 'Run under standard user privileges (never run as Administrator). Ensure game is placed in a user-writable directory (e.g. C:\\Games\\VirtuaCop2) rather than Program Files to avoid UAC virtualization.',
    status: 'clean'
  }
];

export const PRIMARY_BINARIES = [
  {
    name: 'ppj2dd.exe',
    role: 'Main 32-bit Game Executable (Virtua Cop 2)',
    size: '992,768 bytes',
    sha256: 'c7a7389c18a1236250ebf85c8488e1fd70cc0c5113bed081515860dbc0352ce8',
    format: 'Win32 PE (i386)',
    timestamp: '1997-10-30 01:08:18 UTC',
    securityStatus: 'VERIFIED CLEAN',
    imports: ['KERNEL32.DLL', 'USER32.DLL', 'WINMM.DLL', 'COMCTL32.DLL', 'DINPUT.DLL', 'DSOUND.DLL', 'DPCTRL.DLL'],
    verdict: 'Original Sega release executable. Zero malicious code, zero network backdoors.'
  },
  {
    name: 'CLASS.EXE',
    role: 'Legacy 16-bit DOS Scene Intro / Crack',
    size: '58,247 bytes',
    sha256: '297da46ad61e8c747553658c09eeea05aa82080724d050c9caf7a9762d84ed3e',
    format: '16-bit DOS MZ (PMODE/W v1.33)',
    timestamp: '1997-11-01',
    securityStatus: 'INCOMPATIBLE / BENIGN HISTORICAL STUB',
    imports: ['DOS INT 21h / PMODE/W Extender'],
    verdict: 'Harmless 90s crack intro, but fails on 64-bit Windows. Safe to delete.'
  },
  {
    name: 'VC2.EXE',
    role: '16-bit DOS Batch Launcher',
    size: '959 bytes',
    sha256: '24794e6450368de6d7f2785e916f980c93d214d9e238a2d8cab1049fa7b629f8',
    format: '16-bit DOS Executable Stub',
    timestamp: '1997-11-01',
    securityStatus: 'INCOMPATIBLE / REDUNDANT LAUNCHER',
    imports: ['DOS Exec'],
    verdict: 'Redundant launcher that attempts to call CLASS.EXE. Bypass completely.'
  },
  {
    name: 'PG_STG1.DLL',
    role: 'Stage 1 Game Logic & Collision ("Arms City")',
    size: '904,704 bytes',
    sha256: 'd3ac106259677d253b7cf2d77b6eec29757677ecddac4ae937a74b0a1ded3996',
    format: 'Win32 Dynamic Link Library',
    timestamp: '1997-10-30',
    securityStatus: 'VERIFIED CLEAN',
    imports: ['KERNEL32.DLL', 'USER32.DLL', 'DDGL.DLL'],
    verdict: 'Official Sega stage library. Safe.'
  },
  {
    name: 'PG_STG2.DLL',
    role: 'Stage 2 Game Logic & Collision ("On the Run")',
    size: '486,400 bytes',
    sha256: '96879202342bc0c0722c1d5312b1cfdd2e573313a5f1b0e505a55b6b244a97a0',
    format: 'Win32 Dynamic Link Library',
    timestamp: '1997-10-30',
    securityStatus: 'VERIFIED CLEAN',
    imports: ['KERNEL32.DLL', 'USER32.DLL', 'DDGL.DLL'],
    verdict: 'Official Sega stage library. Safe.'
  },
  {
    name: 'PG_STG3.DLL',
    role: 'Stage 3 Game Logic & Collision ("Gang Headquarters")',
    size: '1,101,824 bytes',
    sha256: '29cc4eb471895706ed9e2300c1f25df06291011bb805ca401b9b70c811dd9df7',
    format: 'Win32 Dynamic Link Library',
    timestamp: '1997-10-30',
    securityStatus: 'VERIFIED CLEAN',
    imports: ['KERNEL32.DLL', 'USER32.DLL', 'DDGL.DLL'],
    verdict: 'Official Sega stage library. Safe.'
  },
  {
    name: 'HGL_D3D.DLL',
    role: 'Sega Hardware Graphics Layer (Direct3D 5 Backend)',
    size: '111,616 bytes',
    sha256: 'cf70eca20b1554065958328e6d639c6c34ba2114293caa514755811408f4803d',
    format: 'Win32 Dynamic Link Library',
    timestamp: '1997-10-30',
    securityStatus: 'VERIFIED CLEAN',
    imports: ['DDRAW.DLL', 'KERNEL32.DLL', 'USER32.DLL'],
    verdict: 'Official Sega 3D renderer abstraction layer. Safe.'
  },
  {
    name: 'WINCPUID.DLL',
    role: 'Sega CPU Feature Detection Library',
    size: '122,368 bytes',
    sha256: '102439d25f0f753b718472c5ea48076d95bb67d9630c0d22897cb4386139fe2a',
    format: 'Win32 Dynamic Link Library',
    timestamp: '1997-10-30',
    securityStatus: 'VERIFIED CLEAN',
    imports: ['KERNEL32.DLL'],
    verdict: 'Checks MMX / Pentium Pro support. Standard in late 90s Sega ports.'
  }
];
