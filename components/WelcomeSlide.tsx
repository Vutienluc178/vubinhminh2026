
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WelcomeSlideProps {
  onStart: () => void;
}

type EffectType = 'balloons' | 'fireworks' | 'sunflowers' | 'birds' | 'solar';

export const WelcomeSlide: React.FC<WelcomeSlideProps> = ({ onStart }) => {
  const [effect, setEffect] = useState<EffectType>('balloons');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const effects: EffectType[] = ['balloons', 'fireworks', 'sunflowers', 'birds', 'solar'];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    setEffect(randomEffect);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: any[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    if (effect === 'balloons') {
      // Balloons Effect
      class Balloon {
        x: number = 0; y: number = 0; size: number = 0; color: string = ''; speed: number = 0;
        isPopped: boolean = false; popTimer: number = 0;
        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * width;
          this.y = height + 100;
          this.size = 30 + Math.random() * 40;
          this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
          this.speed = 1 + Math.random() * 3;
          this.isPopped = false;
          this.popTimer = 0;
        }
        update() {
          if (this.isPopped) {
            this.popTimer++;
            if (this.popTimer > 10) this.reset();
            return;
          }
          this.y -= this.speed;
          if (this.y < -100 || Math.random() < 0.001) { // Random pop
            if (this.y < height * 0.8) this.isPopped = true;
            else if (this.y < -100) this.reset();
          }
        }
        draw() {
          if (!ctx) return;
          if (this.isPopped) {
            // Draw pop effect
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              ctx.moveTo(this.x + Math.cos(angle) * 10, this.y + Math.sin(angle) * 10);
              ctx.lineTo(this.x + Math.cos(angle) * 30, this.y + Math.sin(angle) * 30);
            }
            ctx.stroke();
            return;
          }
          ctx.beginPath();
          ctx.fillStyle = this.color;
          ctx.ellipse(this.x, this.y, this.size * 0.8, this.size, 0, 0, Math.PI * 2);
          ctx.fill();
          // String
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.moveTo(this.x, this.y + this.size);
          ctx.lineTo(this.x, this.y + this.size + 40);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 30; i++) particles.push(new Balloon());

      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(); });
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    } else if (effect === 'fireworks') {
      // Fireworks Effect
      class Firework {
        x: number; y: number; sx: number; sy: number; color: string; life: number;
        constructor(x: number, y: number, color: string) {
          this.x = x; this.y = y;
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          this.sx = Math.cos(angle) * speed;
          this.sy = Math.sin(angle) * speed;
          this.color = color;
          this.life = 100;
        }
        update() {
          this.x += this.sx;
          this.y += this.sy;
          this.sy += 0.1; // Gravity
          this.life -= 2;
        }
        draw() {
          if (!ctx) return;
          ctx.beginPath();
          ctx.fillStyle = this.color;
          ctx.globalAlpha = this.life / 100;
          ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      let activeFireworks: Firework[] = [];
      const createExplosion = () => {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.6;
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        for (let i = 0; i < 50; i++) activeFireworks.push(new Firework(x, y, color));
      };

      const animate = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, width, height);
        if (Math.random() < 0.05) createExplosion();
        activeFireworks = activeFireworks.filter(f => f.life > 0);
        activeFireworks.forEach(f => { f.update(); f.draw(); });
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    } else if (effect === 'sunflowers') {
      // Sunflowers Effect
      class Sunflower {
        x: number; y: number; size: number; maxSize: number; opacity: number; state: 'growing' | 'fading';
        constructor() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.size = 0;
          this.maxSize = 50 + Math.random() * 100;
          this.opacity = 1;
          this.state = 'growing';
        }
        update() {
          if (this.state === 'growing') {
            this.size += 2;
            if (this.size >= this.maxSize) this.state = 'fading';
          } else {
            this.opacity -= 0.01;
            if (this.opacity <= 0) {
              this.x = Math.random() * width;
              this.y = Math.random() * height;
              this.size = 0;
              this.opacity = 1;
              this.state = 'growing';
            }
          }
        }
        draw() {
          if (!ctx) return;
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.globalAlpha = this.opacity;
          // Petals
          ctx.fillStyle = '#fbbf24';
          for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.ellipse(this.size * 0.4, 0, this.size * 0.4, this.size * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          // Center
          ctx.beginPath();
          ctx.fillStyle = '#78350f';
          ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      for (let i = 0; i < 15; i++) particles.push(new Sunflower());
      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(); });
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    } else if (effect === 'birds') {
      // Birds Effect
      class Bird {
        x: number; y: number; speed: number; wingPos: number; side: 'left' | 'right'; size: number;
        constructor() {
          this.side = Math.random() > 0.5 ? 'left' : 'right';
          this.x = this.side === 'left' ? -100 : width + 100;
          this.y = Math.random() * height * 0.5;
          this.speed = (3 + Math.random() * 5) * (this.side === 'left' ? 1 : -1);
          this.wingPos = 0;
          this.size = 1;
        }
        update() {
          this.x += this.speed;
          this.y += (height * 0.2 - this.y) * 0.005; // Move towards horizon
          this.size *= 0.995; // Shrink for depth
          this.wingPos += 0.2;
          if (this.size < 0.1 || (this.side === 'left' && this.x > width + 100) || (this.side === 'right' && this.x < -100)) {
            this.side = Math.random() > 0.5 ? 'left' : 'right';
            this.x = this.side === 'left' ? -100 : width + 100;
            this.y = Math.random() * height * 0.5;
            this.speed = (3 + Math.random() * 5) * (this.side === 'left' ? 1 : -1);
            this.size = 1;
          }
        }
        draw() {
          if (!ctx) return;
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.scale(this.size, this.size);
          ctx.beginPath();
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          const wingY = Math.sin(this.wingPos) * 10;
          ctx.moveTo(-15, wingY);
          ctx.quadraticCurveTo(0, -10, 15, wingY);
          ctx.stroke();
          ctx.restore();
        }
      }
      for (let i = 0; i < 20; i++) particles.push(new Bird());
      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(); });
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    } else if (effect === 'solar') {
      // Solar System Effect
      const planets = [
        { dist: 80, size: 4, color: '#94a3b8', speed: 0.02, tilt: 0.2 }, // Mercury
        { dist: 120, size: 8, color: '#fbbf24', speed: 0.015, tilt: -0.1 }, // Venus
        { dist: 170, size: 9, color: '#3b82f6', speed: 0.012, tilt: 0.3 }, // Earth
        { dist: 220, size: 7, color: '#ef4444', speed: 0.01, tilt: -0.2 }, // Mars
        { dist: 290, size: 18, color: '#d97706', speed: 0.007, tilt: 0.1 }, // Jupiter
        { dist: 360, size: 15, color: '#eab308', speed: 0.005, tilt: -0.3 }, // Saturn
        { dist: 420, size: 12, color: '#22d3ee', speed: 0.004, tilt: 0.2 }, // Uranus
        { dist: 480, size: 11, color: '#6366f1', speed: 0.003, tilt: -0.1 }, // Neptune
      ];
      const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2,
        blink: Math.random() * Math.PI
      }));

      let angle = 0;
      const animate = () => {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);

        // Stars
        stars.forEach(s => {
          s.blink += 0.05;
          ctx.globalAlpha = 0.5 + Math.sin(s.blink) * 0.5;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        const centerX = width / 2;
        const centerY = height / 2;

        // Sun
        ctx.save();
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#f59e0b';
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
        gradient.addColorStop(0, '#fef08a');
        gradient.addColorStop(0.4, '#facc15');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Planets
        angle += 1;
        planets.forEach(p => {
          // Orbit (Elliptical for 3D feel)
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.ellipse(centerX, centerY, p.dist, p.dist * 0.6, p.tilt, 0, Math.PI * 2);
          ctx.stroke();

          // Planet
          const px = centerX + Math.cos(angle * p.speed) * p.dist;
          const py = centerY + Math.sin(angle * p.speed) * p.dist * 0.6;
          
          // Rotate planet position based on orbit tilt
          const rotatedX = centerX + (px - centerX) * Math.cos(p.tilt) - (py - centerY) * Math.sin(p.tilt);
          const rotatedY = centerY + (px - centerX) * Math.sin(p.tilt) + (py - centerY) * Math.cos(p.tilt);

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(rotatedX, rotatedY, p.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Planet Glow
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(rotatedX, rotatedY, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [effect]);

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={onStart}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      <div className="relative z-10 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] uppercase tracking-tighter"
        >
          Chào mừng các em đến tiết học hôm nay
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="text-white/50 mt-8 text-sm font-bold uppercase tracking-[0.3em]"
        >
          Click để bắt đầu
        </motion.p>
      </div>
    </div>
  );
};
