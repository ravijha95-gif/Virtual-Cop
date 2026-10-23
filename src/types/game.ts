/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  md5: string;
  sha256: string;
  category: 'Executable / Library' | 'Level / Motion Model' | 'Graphic Texture' | 'Audio / Sound Effect' | 'Configuration / Documentation' | 'Asset';
  ext: string;
  status?: 'safe' | 'caution' | 'legacy_incompatible';
  details?: string;
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'info';
  category: string;
  affectedFile: string;
  description: string;
  technicalDetails: string;
  remedy: string;
  status: 'mitigated_in_patch' | 'clean' | 'advisory';
}

export interface ModernGraphicsConfig {
  targetResolution: { width: number; height: number; label: string };
  aspectRatio: '4:3' | '16:9' | '21:9' | 'original';
  colorDepth: 16 | 32;
  frameRateLimit: 60 | 120 | 144 | 240;
  vsync: boolean;
  highDpiFix: boolean;
  antiAliasing: 'Off' | '2x MSAA' | '4x MSAA' | '8x MSAA';
  anisotropicFiltering: 'Off' | '4x' | '8x' | '16x';
  textureBilinear: boolean;
  shadingMode: 0 | 1; // Flat / Gouraud
  frameSkip: 0 | 1;
  difficulty: 0 | 1 | 2 | 3;
  continueCount: number;
  life1P: number;
  life2P: number;
  sightOff: 0 | 1;
  wrapperType: 'dgVoodoo2' | 'DDrawCompat' | 'NativeDirectX';
  mouseSensitivity: number;
}

export interface GameEnemy {
  id: number;
  x: number; // 0 to 100 percentage of viewport
  y: number;
  type: 'thug_pistol' | 'thug_shotgun' | 'thug_machinegun' | 'boss_fang';
  state: 'entering' | 'aiming' | 'firing' | 'hit' | 'disarmed' | 'dead';
  health: number;
  maxHealth: number;
  lockTimer: number; // countdown in seconds until firing
  maxLockTimer: number;
  scoreValue: number;
  hasWeapon: boolean;
  animFrame: number;
  distance: number; // 1 to 5 depth in 3D perspective
  speed: number;
}

export interface Civilian {
  id: number;
  x: number;
  y: number;
  type: 'clerk' | 'businessman' | 'woman';
  state: 'fleeing' | 'rescued' | 'shot';
  timer: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  life: number;
}
