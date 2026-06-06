'use client';

import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read token HSL triplets from CSS variables so canvas colors follow the theme
    const rootStyle = getComputedStyle(document.documentElement);
    const tokenHsl = (name: string, fallback: string) => {
      const v = rootStyle.getPropertyValue(name).trim();
      return v || fallback;
    };
    const accentHsl = tokenHsl('--accent', '28 40% 90%');
    const primaryHsl = tokenHsl('--primary', '24 50% 30%');
    const mutedFgHsl = tokenHsl('--muted-foreground', '28 13% 43%');
    const mealDinnerHsl = tokenHsl('--meal-dinner', '14 64% 49%');
    const hsla = (triplet: string, alpha: number) => `hsla(${triplet} / ${alpha})`;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles configuration
    const particles: Particle[] = [];
    const particleCount = 50;
    const connectionDistance = 150;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || 1920);
        this.y = Math.random() * (canvas?.height || 1080);
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        
        // Color palette: theme-token-derived warm/neutral tones
        const colors = [
          hsla(mealDinnerHsl, 0.6),  // meal-dinner (terracotta)
          hsla(primaryHsl, 0.6),     // primary (espresso)
          hsla(accentHsl, 0.4),      // accent
          hsla(mutedFgHsl, 0.4),     // muted-foreground
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update() {
        if (!canvas) return;
        
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Keep within bounds
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }

      draw() {
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Draw connections between particles
    const drawConnections = () => {
      if (!ctx) return;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            const opacity = (1 - distance / connectionDistance) * 0.15;
            ctx.strokeStyle = hsla(mealDinnerHsl, opacity);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    // Draw geometric shapes in the background
    const drawGeometricShapes = () => {
      if (!ctx) return;

      const time = Date.now() * 0.0001;

      // Large rotating circles
      ctx.save();
      ctx.globalAlpha = 0.05;
      
      // Circle 1
      ctx.beginPath();
      const x1 = canvas.width * 0.2 + Math.sin(time) * 50;
      const y1 = canvas.height * 0.3 + Math.cos(time) * 50;
      ctx.arc(x1, y1, 200, 0, Math.PI * 2);
      ctx.strokeStyle = hsla(mealDinnerHsl, 1);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Circle 2
      ctx.beginPath();
      const x2 = canvas.width * 0.8 + Math.cos(time * 0.7) * 30;
      const y2 = canvas.height * 0.7 + Math.sin(time * 0.7) * 30;
      ctx.arc(x2, y2, 150, 0, Math.PI * 2);
      ctx.strokeStyle = hsla(primaryHsl, 1);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Floating triangles
      ctx.beginPath();
      const tx = canvas.width * 0.5 + Math.sin(time * 0.5) * 100;
      const ty = canvas.height * 0.5 + Math.cos(time * 0.5) * 100;
      ctx.moveTo(tx, ty - 30);
      ctx.lineTo(tx - 25, ty + 20);
      ctx.lineTo(tx + 25, ty + 20);
      ctx.closePath();
      ctx.strokeStyle = hsla(mealDinnerHsl, 1);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    };

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw geometric shapes
      drawGeometricShapes();

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      drawConnections();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--accent)) 50%, hsl(var(--muted)) 100%)',
        zIndex: 0
      }}
    />
  );
}
