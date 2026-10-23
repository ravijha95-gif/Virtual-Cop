/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Shield, Crosshair, Award } from 'lucide-react';
import { ModernGraphicsConfig, GameEnemy, Civilian, Particle, FloatingText } from '../types/game';
import { soundEngine } from '../utils/audioSynthesizer';

interface Props {
  config: ModernGraphicsConfig;
}

export const ArcadeGameView: React.FC<Props> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [life, setLife] = useState<number>(config.life1P);
  const [bullets, setBullets] = useState<number>(6);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [justiceShots, setJusticeShots] = useState<number>(0);
  const [headshots, setHeadshots] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [totalShots, setTotalShots] = useState<number>(0);
  const [hitsLanded, setHitsLanded] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);
  const [dpiScale, setDpiScale] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Weapon
  const [weapon, setWeapon] = useState<'Guardian' | 'Shotgun' | 'MachineGun' | 'Magnum'>('Guardian');

  // Internal game engine references
  const gameStateRef = useRef<{
    enemies: GameEnemy[];
    civilians: Civilian[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    cameraPos: { x: number; y: number; z: number };
    targetCameraPos: { x: number; y: number; z: number };
    crosshair: { x: number; y: number };
    isShooting: boolean;
    reloading: boolean;
    lastFrameTime: number;
    fpsCounter: number;
    fpsTimer: number;
    enemiesSpawned: number;
    enemiesDefeated: number;
    stageProgress: number;
    maxStageEnemies: number;
  }>({
    enemies: [],
    civilians: [],
    particles: [],
    floatingTexts: [],
    cameraPos: { x: 0, y: 0, z: 0 },
    targetCameraPos: { x: 0, y: 0, z: 0 },
    crosshair: { x: 50, y: 50 },
    isShooting: false,
    reloading: false,
    lastFrameTime: performance.now(),
    fpsCounter: 0,
    fpsTimer: performance.now(),
    enemiesSpawned: 0,
    enemiesDefeated: 0,
    stageProgress: 0,
    maxStageEnemies: 18,
  });

  const nextEnemyId = useRef(1);

  // Toggle mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  // Reload action
  const handleReload = useCallback(() => {
    if (gameStateRef.current.reloading) return;
    gameStateRef.current.reloading = true;
    soundEngine.playReload();

    const maxBullets = weapon === 'MachineGun' ? 24 : weapon === 'Shotgun' ? 4 : 6;
    setTimeout(() => {
      setBullets(maxBullets);
      gameStateRef.current.reloading = false;
    }, 280);
  }, [weapon]);

  // Start / Restart game
  const startGame = useCallback((stageNum: 1 | 2 | 3 = 1) => {
    setCurrentStage(stageNum);
    setScore(0);
    setLife(config.life1P);
    setBullets(6);
    setWeapon('Guardian');
    setIsGameOver(false);
    setIsVictory(false);
    setJusticeShots(0);
    setHeadshots(0);
    setTotalShots(0);
    setHitsLanded(0);
    setAccuracy(100);

    gameStateRef.current.enemies = [];
    gameStateRef.current.civilians = [];
    gameStateRef.current.particles = [];
    gameStateRef.current.floatingTexts = [];
    gameStateRef.current.cameraPos = { x: 0, y: 0, z: 0 };
    gameStateRef.current.targetCameraPos = { x: 0, y: 0, z: 0 };
    gameStateRef.current.enemiesSpawned = 0;
    gameStateRef.current.enemiesDefeated = 0;
    gameStateRef.current.stageProgress = 0;
    gameStateRef.current.maxStageEnemies = stageNum === 1 ? 16 : stageNum === 2 ? 22 : 28;

    setIsPlaying(true);
  }, [config.life1P]);

  // Spawn an enemy
  const spawnEnemy = useCallback(() => {
    const gs = gameStateRef.current;
    if (gs.enemiesSpawned >= gs.maxStageEnemies) return;

    const id = nextEnemyId.current++;
    gs.enemiesSpawned++;

    // Randomize position across scene
    const xPositions = [20, 32, 48, 65, 80, 25, 75, 40, 60];
    const x = xPositions[Math.floor(Math.random() * xPositions.length)];
    const y = 35 + Math.random() * 30; // 35% to 65% height
    const isBoss = gs.enemiesSpawned === gs.maxStageEnemies && currentStage === 3;

    const lockTime = isBoss ? 2.5 : Math.max(1.5, 3.2 - currentStage * 0.4 - config.difficulty * 0.3);

    const enemy: GameEnemy = {
      id,
      x,
      y,
      type: isBoss ? 'boss_fang' : Math.random() > 0.7 ? 'thug_shotgun' : Math.random() > 0.85 ? 'thug_machinegun' : 'thug_pistol',
      state: 'entering',
      health: isBoss ? 6 : 1,
      maxHealth: isBoss ? 6 : 1,
      lockTimer: lockTime,
      maxLockTimer: lockTime,
      scoreValue: isBoss ? 15000 : 1000,
      hasWeapon: true,
      animFrame: 0,
      distance: 2 + Math.random() * 2,
      speed: 0.8 + Math.random() * 0.5
    };

    gs.enemies.push(enemy);
    soundEngine.playLockOnBeep(0.2);

    // Maybe spawn civilian
    if (Math.random() < 0.25 && gs.civilians.length === 0) {
      gs.civilians.push({
        id: nextEnemyId.current++,
        x: Math.random() > 0.5 ? 15 : 85,
        y: 60,
        type: Math.random() > 0.5 ? 'clerk' : 'woman',
        state: 'fleeing',
        timer: 4.0
      });
    }
  }, [currentStage, config.difficulty]);

  // Shooting logic (Mouse Left Click)
  const handleShoot = useCallback((clientX: number, clientY: number) => {
    if (!isPlaying || isGameOver || isVictory) return;

    if (bullets <= 0) {
      soundEngine.playEmptyClick();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((clientX - rect.left) / rect.width) * 100;
    const clickY = ((clientY - rect.top) / rect.height) * 100;

    // Off-screen reload check (if clicked near border)
    if (clickX < 4 || clickX > 96 || clickY < 4 || clickY > 96) {
      handleReload();
      return;
    }

    // Fire weapon
    setBullets(b => b - 1);
    soundEngine.playGunshot();
    setTotalShots(s => s + 1);

    // Camera recoil kick
    const gs = gameStateRef.current;
    gs.cameraPos.y -= 1.5;

    // Bullet impact particles
    for (let i = 0; i < 8; i++) {
      gs.particles.push({
        id: Math.random(),
        x: clickX,
        y: clickY,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: '#facc15',
        size: 3 + Math.random() * 3,
        life: 0,
        maxLife: 0.25
      });
    }

    let hitSomething = false;

    // 1. Check civilians hit
    for (const civ of gs.civilians) {
      if (civ.state === 'fleeing') {
        const dx = Math.abs(clickX - civ.x);
        const dy = Math.abs(clickY - civ.y);
        if (dx < 5 && dy < 10) {
          civ.state = 'shot';
          hitSomething = true;
          soundEngine.playPenalty();
          setLife(l => Math.max(0, l - 1));
          gs.floatingTexts.push({
            id: Math.random(),
            x: civ.x,
            y: civ.y - 8,
            text: 'DON\'T SHOOT! -1 LIFE',
            color: '#ef4444',
            fontSize: 16,
            life: 1.2
          });
          break;
        }
      }
    }

    // 2. Check enemies hit
    for (const enemy of gs.enemies) {
      if (enemy.state === 'entering' || enemy.state === 'aiming') {
        const dx = clickX - enemy.x;
        const dy = clickY - enemy.y;

        // Weapon hit box: "JUSTICE SHOT" (disarm weapon hand)
        // Hand is slightly offset to right and lower torso
        const isWeaponHand = dx > 2.5 && dx < 6.5 && dy > -2 && dy < 5 && enemy.hasWeapon;
        // Head hit box
        const isHeadshot = Math.abs(dx) < 3.2 && dy < -5 && dy > -12;
        // Body hit box
        const isBody = Math.abs(dx) < 5.5 && Math.abs(dy) < 11;

        if (isWeaponHand) {
          hitSomething = true;
          enemy.hasWeapon = false;
          enemy.health -= 1;
          enemy.state = 'disarmed';
          soundEngine.playJusticeShot();

          setScore(s => s + 5000);
          setJusticeShots(j => j + 1);
          setHitsLanded(h => h + 1);

          gs.floatingTexts.push({
            id: Math.random(),
            x: enemy.x,
            y: enemy.y - 10,
            text: '★ JUSTICE SHOT! +5,000 ★',
            color: '#38bdf8',
            fontSize: 18,
            life: 1.5
          });

          // Weapon drops
          for (let p = 0; p < 12; p++) {
            gs.particles.push({
              id: Math.random(),
              x: enemy.x + 4,
              y: enemy.y,
              vx: (Math.random() - 0.2) * 8,
              vy: (Math.random() - 0.8) * 8,
              color: '#38bdf8',
              size: 4,
              life: 0,
              maxLife: 0.4
            });
          }
          break;
        } else if (isHeadshot) {
          hitSomething = true;
          enemy.health -= 2;
          enemy.state = enemy.health <= 0 ? 'dead' : 'hit';
          soundEngine.playEnemyHit();

          setScore(s => s + 2500);
          setHeadshots(h => h + 1);
          setHitsLanded(h => h + 1);

          gs.floatingTexts.push({
            id: Math.random(),
            x: enemy.x,
            y: enemy.y - 10,
            text: 'HEADSHOT! +2,500',
            color: '#fbbf24',
            fontSize: 16,
            life: 1.2
          });
          break;
        } else if (isBody) {
          hitSomething = true;
          enemy.health -= 1;
          enemy.state = enemy.health <= 0 ? 'dead' : 'hit';
          soundEngine.playEnemyHit();

          setScore(s => s + 1000);
          setHitsLanded(h => h + 1);

          gs.floatingTexts.push({
            id: Math.random(),
            x: enemy.x,
            y: enemy.y - 8,
            text: '+1,000',
            color: '#ffffff',
            fontSize: 14,
            life: 1.0
          });
          break;
        }
      }
    }

    if (hitSomething) {
      setAccuracy(Math.round(((hitsLanded + 1) / (totalShots + 1)) * 100));
    }
  }, [isPlaying, isGameOver, isVictory, bullets, weapon, hitsLanded, totalShots, handleReload]);

  // Mouse Move on Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    gameStateRef.current.crosshair = { x, y };
  };

  // Right Click = Reload
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleReload();
  };

  // Keyboard shortcut (Space = Reload, R = Reload, P = Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReload();
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPlaying(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReload]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (now: number) => {
      const gs = gameStateRef.current;
      const delta = (now - gs.lastFrameTime) / 1000;
      gs.lastFrameTime = now;

      // Update FPS & frame time metrics
      gs.fpsCounter++;
      if (now - gs.fpsTimer >= 500) {
        setFps(Math.round((gs.fpsCounter * 1000) / (now - gs.fpsTimer)));
        setFrameTimeMs(Math.round(delta * 1000 * 10) / 10);
        gs.fpsCounter = 0;
        gs.fpsTimer = now;
      }

      // Handle Retina / High-DPI Canvas scaling
      const dpr = window.devicePixelRatio || 1;
      setDpiScale(dpr);

      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const W = displayWidth;
      const H = displayHeight;

      // 1. UPDATE GAME LOGIC (when playing)
      if (isPlaying && !isGameOver && !isVictory) {
        // Smooth camera sway (arcade rail camera)
        gs.cameraPos.x += (gs.targetCameraPos.x - gs.cameraPos.x) * 0.05;
        gs.cameraPos.y += (gs.targetCameraPos.y - gs.cameraPos.y) * 0.05;
        gs.targetCameraPos.x = Math.sin(now * 0.001) * 3;
        gs.targetCameraPos.y = Math.cos(now * 0.0015) * 1.5;

        // Spawn timer
        if (Math.random() < 0.035 && gs.enemies.length < 5) {
          spawnEnemy();
        }

        // Update enemies
        for (let i = gs.enemies.length - 1; i >= 0; i--) {
          const enemy = gs.enemies[i];
          enemy.animFrame += delta * 6;

          if (enemy.state === 'entering') {
            enemy.state = 'aiming';
          } else if (enemy.state === 'aiming') {
            enemy.lockTimer -= delta;

            // Countdown sound warning
            if (Math.floor(enemy.lockTimer * 4) !== Math.floor((enemy.lockTimer + delta) * 4)) {
              soundEngine.playLockOnBeep(1 - enemy.lockTimer / enemy.maxLockTimer);
            }

            // Enemy fires at player!
            if (enemy.lockTimer <= 0) {
              enemy.state = 'firing';
              soundEngine.playGunshot();
              soundEngine.playPlayerHit();
              setLife(l => {
                const next = Math.max(0, l - 1);
                if (next <= 0) {
                  setIsGameOver(true);
                  setIsPlaying(false);
                }
                return next;
              });

              // Red screen flash
              ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
              ctx.fillRect(0, 0, W, H);

              // remove after shooting once
              setTimeout(() => {
                gs.enemies = gs.enemies.filter(e => e.id !== enemy.id);
                gs.enemiesDefeated++;
              }, 400);
            }
          } else if (enemy.state === 'dead' || enemy.state === 'disarmed') {
            // Fade out / fall down
            enemy.y += delta * 40;
            if (enemy.y > 110) {
              gs.enemies.splice(i, 1);
              gs.enemiesDefeated++;
            }
          }
        }

        // Check stage progression
        if (gs.enemiesDefeated >= gs.maxStageEnemies && gs.enemies.length === 0) {
          if (currentStage < 3) {
            soundEngine.playStageClear();
            setCurrentStage(s => (s + 1) as 1 | 2 | 3);
            gs.enemiesSpawned = 0;
            gs.enemiesDefeated = 0;
            gs.maxStageEnemies += 6;
          } else {
            soundEngine.playStageClear();
            setIsVictory(true);
            setIsPlaying(false);
          }
        }

        // Update civilians
        for (let i = gs.civilians.length - 1; i >= 0; i--) {
          const civ = gs.civilians[i];
          civ.timer -= delta;
          if (civ.state === 'fleeing') {
            civ.x += (civ.x < 50 ? 1 : -1) * delta * 25;
            if (civ.timer <= 0 || civ.x < -10 || civ.x > 110) {
              gs.civilians.splice(i, 1);
              setScore(s => s + 2000); // Saved civilian bonus
              gs.floatingTexts.push({
                id: Math.random(),
                x: 50,
                y: 50,
                text: 'CIVILIAN SAFE! +2,000',
                color: '#34d399',
                fontSize: 16,
                life: 1.2
              });
            }
          }
        }

        // Update particles
        for (let i = gs.particles.length - 1; i >= 0; i--) {
          const p = gs.particles[i];
          p.x += p.vx * delta * 15;
          p.y += p.vy * delta * 15;
          p.life += delta;
          if (p.life >= p.maxLife) {
            gs.particles.splice(i, 1);
          }
        }

        // Update floating texts
        for (let i = gs.floatingTexts.length - 1; i >= 0; i--) {
          const ft = gs.floatingTexts[i];
          ft.y -= delta * 15;
          ft.life -= delta;
          if (ft.life <= 0) {
            gs.floatingTexts.splice(i, 1);
          }
        }
      }

      // 2. RENDER GRAPHICS SCENE
      ctx.clearRect(0, 0, W, H);

      // Environment Background (3D Sega Model 2 Arcade Look)
      const camX = (gs.cameraPos.x / 100) * W;
      const camY = (gs.cameraPos.y / 100) * H;

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      if (currentStage === 1) {
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(1, '#1e293b');
      } else if (currentStage === 2) {
        skyGrad.addColorStop(0, '#172554');
        skyGrad.addColorStop(1, '#38bdf8');
      } else {
        skyGrad.addColorStop(0, '#311042');
        skyGrad.addColorStop(1, '#110726');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // City Skyline Polygons (Perspective Parallax)
      ctx.fillStyle = currentStage === 2 ? '#1e293b' : '#090d16';
      for (let b = 0; b < 12; b++) {
        const bx = (b * (W / 10)) + camX * 0.3;
        const bw = W / 10;
        const bh = H * 0.2 + (Math.sin(b * 3.7) * 40);
        ctx.fillRect(bx, H * 0.5 - bh, bw, bh + H * 0.1);
        // Windows
        ctx.fillStyle = b % 2 === 0 ? 'rgba(250, 204, 21, 0.4)' : 'rgba(56, 189, 248, 0.3)';
        ctx.fillRect(bx + 6, H * 0.5 - bh + 12, 10, 8);
        ctx.fillRect(bx + 20, H * 0.5 - bh + 12, 10, 8);
        ctx.fillStyle = currentStage === 2 ? '#1e293b' : '#090d16';
      }

      // Ground / Floor (Perspective vanishing grid)
      const horizonY = H * 0.52 + camY;
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      roadGrad.addColorStop(0, '#1e293b');
      roadGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      // Perspective Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;
      for (let g = -5; g <= 5; g++) {
        ctx.beginPath();
        ctx.moveTo(W * 0.5 + camX, horizonY);
        ctx.lineTo(W * 0.5 + camX + g * (W * 0.25), H);
        ctx.stroke();
      }

      // Police Car / Scene Obstacles in Foreground (3D Polygons)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H);
      ctx.lineTo(W * 0.22, H * 0.72);
      ctx.lineTo(W * 0.38, H * 0.76);
      ctx.lineTo(W * 0.42, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Police car siren flashing light
      const sirenAlpha = Math.sin(now * 0.015) > 0 ? 0.7 : 0.1;
      const redSirenAlpha = Math.sin(now * 0.015 + Math.PI) > 0 ? 0.7 : 0.1;

      ctx.fillStyle = `rgba(59, 130, 246, ${sirenAlpha})`;
      ctx.beginPath();
      ctx.arc(W * 0.24, H * 0.71, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(239, 68, 68, ${redSirenAlpha})`;
      ctx.beginPath();
      ctx.arc(W * 0.28, H * 0.71, 14, 0, Math.PI * 2);
      ctx.fill();

      // 3. RENDER CIVILIANS
      for (const civ of gs.civilians) {
        const cx = (civ.x / 100) * W;
        const cy = (civ.y / 100) * H;

        // Running animation bob
        const bob = Math.sin(now * 0.018) * 4;

        ctx.fillStyle = civ.state === 'shot' ? '#ef4444' : '#10b981';
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 28 + bob, 10, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillRect(cx - 8, cy - 18 + bob, 16, 26);

        // Warning Text over Civilian
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CIVILIAN! DON\'T SHOOT!', cx, cy - 42 + bob);
      }

      // 4. RENDER ENEMIES & CLASSIC VIRTUA COP LOCK-ON RETICLES
      for (const enemy of gs.enemies) {
        const ex = (enemy.x / 100) * W;
        const ey = (enemy.y / 100) * H;

        // Depth scale
        const scale = 1.0;

        ctx.save();
        ctx.translate(ex, ey);

        if (enemy.state === 'dead' || enemy.state === 'disarmed') {
          ctx.rotate(0.3);
          ctx.globalAlpha = 0.6;
        }

        // Enemy Torso (Polygonal Criminal Suit)
        ctx.fillStyle = enemy.type === 'boss_fang' ? '#831843' : enemy.type === 'thug_shotgun' ? '#1e3a8a' : '#334155';
        ctx.fillRect(-14 * scale, -25 * scale, 28 * scale, 38 * scale);

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(-9 * scale, -45 * scale, 18 * scale, 18 * scale);

        // Sunglasses / Mask
        ctx.fillStyle = '#000000';
        ctx.fillRect(-9 * scale, -39 * scale, 18 * scale, 6 * scale);

        // Gun arm
        if (enemy.hasWeapon) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(10 * scale, -18 * scale, 16 * scale, 8 * scale);
          ctx.fillStyle = '#000000';
          ctx.fillRect(24 * scale, -19 * scale, 10 * scale, 5 * scale); // gun barrel
        }

        ctx.restore();

        // CLASSIC VIRTUA COP TARGET LOCK-ON SIGHT
        if (enemy.state === 'aiming') {
          const urgency = 1 - enemy.lockTimer / enemy.maxLockTimer; // 0 to 1
          const ringRadius = 55 - urgency * 28; // shrinks from 55 to 27px

          // Ring color: Green -> Yellow -> Orange -> Red
          let ringColor = '#22c55e';
          if (urgency > 0.4) ringColor = '#eab308';
          if (urgency > 0.7) ringColor = '#f97316';
          if (urgency > 0.88) ringColor = '#ef4444';

          ctx.save();
          ctx.translate(ex, ey - 15);

          // Outer Shrinking Countdown Ring
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(16, ringRadius), 0, Math.PI * 2);
          ctx.stroke();

          // Outer Bracket corners (Virtua Cop style)
          const bSize = 14;
          ctx.lineWidth = 2.5;
          // top-left
          ctx.beginPath();
          ctx.moveTo(-ringRadius - 6, -ringRadius + bSize);
          ctx.lineTo(-ringRadius - 6, -ringRadius - 6);
          ctx.lineTo(-ringRadius + bSize, -ringRadius - 6);
          ctx.stroke();
          // top-right
          ctx.beginPath();
          ctx.moveTo(ringRadius + 6, -ringRadius + bSize);
          ctx.lineTo(ringRadius + 6, -ringRadius - 6);
          ctx.lineTo(ringRadius - bSize, -ringRadius - 6);
          ctx.stroke();
          // bottom-left
          ctx.beginPath();
          ctx.moveTo(-ringRadius - 6, ringRadius - bSize);
          ctx.lineTo(-ringRadius - 6, ringRadius + 6);
          ctx.lineTo(-ringRadius + bSize, ringRadius + 6);
          ctx.stroke();
          // bottom-right
          ctx.beginPath();
          ctx.moveTo(ringRadius + 6, ringRadius - bSize);
          ctx.lineTo(ringRadius + 6, ringRadius + 6);
          ctx.lineTo(ringRadius - bSize, ringRadius + 6);
          ctx.stroke();

          // Danger Warning Blink
          if (urgency > 0.75 && Math.sin(now * 0.03) > 0) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('DANGER!', 0, -ringRadius - 12);
          }

          ctx.restore();
        }
      }

      // 5. RENDER PARTICLES
      for (const p of gs.particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc((p.x / 100) * W, (p.y / 100) * H, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. RENDER FLOATING TEXTS
      for (const ft of gs.floatingTexts) {
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.fontSize}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, (ft.x / 100) * W, (ft.y / 100) * H);
        ctx.shadowBlur = 0;
      }

      // 7. RENDER HUD (Score, Health, Ammo, Reload Alert)
      // Health Icons (Shields)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`STAGE ${currentStage} - ${currentStage === 1 ? 'BEGINNER (Arms City)' : currentStage === 2 ? 'MEDIUM (On The Run)' : 'EXPERT (HQ Gang)'}`, 20, 32);

      // Score
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`SCORE: ${score.toLocaleString().padStart(8, '0')}`, 20, 60);

      // Lives
      for (let l = 0; l < life; l++) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        const lx = 25 + l * 24;
        const ly = 78;
        // Heart / Badge icon
        ctx.arc(lx - 4, ly, 6, 0, Math.PI * 2);
        ctx.arc(lx + 4, ly, 6, 0, Math.PI * 2);
        ctx.lineTo(lx, ly + 10);
        ctx.fill();
      }

      // Ammo Chamber (Bottom Right)
      const ammoX = W - 140;
      const ammoY = H - 35;
      for (let b = 0; b < 6; b++) {
        const bx = ammoX + b * 20;
        ctx.fillStyle = b < bullets ? '#facc15' : 'rgba(100, 116, 139, 0.4)';
        ctx.fillRect(bx, ammoY, 12, 22);
        ctx.fillStyle = b < bullets ? '#ca8a04' : 'rgba(71, 85, 105, 0.4)';
        ctx.fillRect(bx + 2, ammoY + 2, 8, 5); // bullet primer
      }

      // FLASHING "RELOAD!" WARNING
      if (bullets === 0 && !gs.reloading) {
        if (Math.sin(now * 0.015) > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'black 32px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 8;
          ctx.fillText('⚡ RELOAD! ⚡', W * 0.5, H * 0.82);
          ctx.font = 'bold 14px "Courier New", monospace';
          ctx.fillStyle = '#fef08a';
          ctx.fillText('[ RIGHT CLICK / SPACEBAR / SHOOT OFF-SCREEN ]', W * 0.5, H * 0.87);
          ctx.shadowBlur = 0;
        }
      } else if (gs.reloading) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING...', W * 0.5, H * 0.85);
      }

      // 8. RENDER CROSSHAIR (Virtual Lightgun Sight)
      const chX = (gs.crosshair.x / 100) * W;
      const chY = (gs.crosshair.y / 100) * H;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(chX, chY, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot & cross lines
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(chX, chY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(chX - 22, chY);
      ctx.lineTo(chX - 8, chY);
      ctx.moveTo(chX + 8, chY);
      ctx.lineTo(chX + 22, chY);
      ctx.moveTo(chX, chY - 22);
      ctx.lineTo(chX, chY - 8);
      ctx.moveTo(chX, chY + 8);
      ctx.lineTo(chX, chY + 22);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, isVictory, bullets, life, score, currentStage, spawnEnemy]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Virtua Cop 2: Remastered Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                High-DPI 60FPS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Left Click = Shoot • Right Click / Space = Reload • Shoot Gun Hand = Justice Shot!
            </p>
          </div>
        </div>

        {/* Live Metrics Pill */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FPS: <strong className="text-emerald-400">{fps}</strong></span>
            <span className="text-slate-600">|</span>
            <span>{frameTimeMs} ms</span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            DPI: <strong className="text-cyan-400">{dpiScale}x</strong>
          </div>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {isPlaying ? (
            <button
              onClick={() => setIsPlaying(false)}
              className="px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold hover:bg-amber-500/30 cursor-pointer flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : (
            <button
              onClick={() => isGameOver || isVictory ? startGame(1) : setIsPlaying(true)}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-500 cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {isGameOver || isVictory ? 'Play Again' : 'Start Mission'}
            </button>
          )}

          <button
            onClick={() => startGame(currentStage)}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Restart Stage"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Arcade Viewport Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video md:h-[580px] bg-black rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl select-none"
        onContextMenu={handleContextMenu}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseMove={handleMouseMove}
          onClick={e => handleShoot(e.clientX, e.clientY)}
        />

        {/* Start / Intro Overlay */}
        {!isPlaying && !isGameOver && !isVictory && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-40">
            <div className="max-w-md space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                POLICE DEPT. SPECIAL INVESTIGATION UNIT
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-white tracking-widest drop-shadow-md">
                VIRTUA COP 2
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Experience the authentic Sega light-gun rail shooter remastered in native high-DPI resolution. 
                Disarm criminals with Justice Shots, rescue hostages, and clean up the streets!
              </p>

              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => startGame(1)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wider shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-95 transition-all"
                >
                  START STAGE 1 (City Center)
                </button>

                <button
                  onClick={() => startGame(2)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  STAGE 2 (Harbor Chase)
                </button>
              </div>

              <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-center gap-4">
                <span>🖱️ Left-Click: Fire</span>
                <span>⚡ Right-Click / Space: Reload</span>
                <span>🎯 Disarm: Justice Shot</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-red-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <div className="max-w-sm space-y-3">
              <span className="text-xs font-bold font-mono text-red-400 tracking-widest uppercase">Mission Failed</span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-wider">GAME OVER</h2>
              <div className="bg-slate-950/80 rounded-xl p-4 border border-red-500/30 text-xs space-y-1.5 text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span>FINAL SCORE:</span>
                  <strong className="text-cyan-400">{score.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>JUSTICE SHOTS:</span>
                  <strong className="text-emerald-400">{justiceShots}</strong>
                </div>
                <div className="flex justify-between">
                  <span>HEADSHOTS:</span>
                  <strong className="text-amber-400">{headshots}</strong>
                </div>
                <div className="flex justify-between">
                  <span>ACCURACY:</span>
                  <strong className="text-white">{accuracy}%</strong>
                </div>
              </div>

              <button
                onClick={() => startGame(currentStage)}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 cursor-pointer transition-all active:scale-95"
              >
                Insert Coin / Try Again
              </button>
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {isVictory && (
          <div className="absolute inset-0 bg-blue-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <div className="max-w-md space-y-3">
              <Award className="w-12 h-12 text-yellow-400 mx-auto" />
              <span className="text-xs font-bold font-mono text-yellow-400 tracking-widest uppercase">All Stages Cleared</span>
              <h2 className="text-4xl font-black text-white tracking-wider">ALL CRIMINALS APPREHENDED!</h2>
              <p className="text-xs text-slate-300">
                Superb marksmanship, Officer! The city is safe thanks to your lightning-fast reflexes and precision Justice Shots.
              </p>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-yellow-500/30 text-xs space-y-1.5 text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span>RECORD SCORE:</span>
                  <strong className="text-yellow-400 text-sm">{score.toLocaleString()} PTS</strong>
                </div>
                <div className="flex justify-between">
                  <span>JUSTICE DISARMS:</span>
                  <strong className="text-emerald-400">{justiceShots}</strong>
                </div>
                <div className="flex justify-between">
                  <span>SNIPER HEADSHOTS:</span>
                  <strong className="text-amber-400">{headshots}</strong>
                </div>
                <div className="flex justify-between">
                  <span>FINAL ACCURACY:</span>
                  <strong className="text-white">{accuracy}%</strong>
                </div>
              </div>

              <button
                onClick={() => startGame(1)}
                className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-yellow-500/30 cursor-pointer transition-all active:scale-95"
              >
                Play Again From Stage 1
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Arcade Instructions & Key Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
            1
          </div>
          <div>
            <h4 className="font-bold text-white mb-0.5">Justice Shot Mechanic</h4>
            <p className="text-slate-400 leading-normal">
              Instead of aiming for the body, shoot the enemy's gun hand to disarm them. Awards <strong>+5,000 points</strong> and zero civilian risk!
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
            2
          </div>
          <div>
            <h4 className="font-bold text-white mb-0.5">High-DPI 1:1 Pixel Mapping</h4>
            <p className="text-slate-400 leading-normal">
              Running at native <strong>{dpiScale}x devicePixelRatio</strong>. Mouse coordinates are calculated in normalized viewport space to eliminate aim drift.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
            3
          </div>
          <div>
            <h4 className="font-bold text-white mb-0.5">Hostage Rescue Protection</h4>
            <p className="text-slate-400 leading-normal">
              Civilians in green will dash across the screen shouting for help. Shooting a hostage deducts <strong>1 Life</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
