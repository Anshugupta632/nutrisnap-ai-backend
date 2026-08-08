import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';

function BackgroundParticles() {
  const particlesRef = useRef([]);
  const count = 35;

  useEffect(() => {
    particlesRef.current = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 120,
      z: (Math.random() - 0.5) * 30,
      size: Math.random() * 0.35 + 0.1,
      speed: Math.random() * 0.02 + 0.005,
      angle: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? '#E8A33D' : '#C1502E',
      opacity: Math.random() * 0.4 + 0.15,
    }));
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 50 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.5} />
      {particlesRef.current.map((p, i) => (
        <Particle key={i} data={p} />
      ))}
    </Canvas>
  );
}

function Particle({ data }) {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y -= data.speed * delta * 60;
      data.angle += data.speed * delta;
      meshRef.current.position.x += Math.sin(data.angle) * 0.03;

      if (meshRef.current.position.y < -60) {
        meshRef.current.position.y = 60;
        meshRef.current.position.x = (Math.random() - 0.5) * 80;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[data.x, data.y, data.z]}
    >
      <sphereGeometry args={[data.size, 8, 8]} />
      <meshBasicMaterial
        color={data.color}
        transparent
        opacity={data.opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-steel" />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `
            radial-gradient(circle at 15% 15%, rgba(232, 163, 61, 0.25), transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(193, 80, 46, 0.25), transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(107, 142, 78, 0.15), transparent 50%)
          `,
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 opacity-15"
        style={{
          background: `
            conic-gradient(from 0deg at 50% 50%, 
              transparent 0%, 
              #E8A33D20 25%, 
              transparent 50%, 
              #C1502E20 75%, 
              transparent 100%
            )
          `,
        }}
      />
    </div>
  );
}

export function BackgroundEffect({ enabled = true }) {
  if (!enabled) return null;

  return (
    <>
      <GradientBackground />
      <BackgroundParticles />
    </>
  );
}

export function SkeletonLoader({ className = '' }) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="h-8 bg-cream/10 rounded-xl w-3/4 backdrop-blur-md"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="h-6 bg-cream/10 rounded-xl w-1/2 backdrop-blur-md"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="h-4 bg-cream/10 rounded-xl w-full backdrop-blur-md"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="h-4 bg-cream/10 rounded-xl w-full backdrop-blur-md"
      />
    </div>
  );
}

export function CardSkeleton({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`bg-dabba/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl ${className}`}
    >
      <SkeletonLoader />
    </motion.div>
  );
}

export function ThaliRingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="flex flex-col items-center gap-5 w-72 h-72"
    >
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-64 h-64 rounded-full border-4 border-cream/10 bg-dabba/30 backdrop-blur-md shadow-inner"
      />
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            className="flex items-center gap-2 bg-dabba/40 px-3 py-1.5 rounded-xl border border-white/5"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cream/20" />
            <div className="h-3 w-12 bg-cream/20 rounded" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}