import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Suspense, lazy } from 'react';

const THALI_COLORS = {
  protein: '#E8A33D',
  carbs: '#C1502E',
  fats: '#6B8E4E',
  track: '#2B2A28',
  metal: '#4A4741',
  center: '#F2EDE4',
  glowProtein: '#E8A33D',
  glowCarbs: '#C1502E',
  glowFats: '#6B8E4E',
};

const segmentConfigs = [
  { key: 'protein', start: 0, color: THALI_COLORS.protein, glowColor: THALI_COLORS.glowProtein, label: 'Protein' },
  { key: 'carbs', start: 120, color: THALI_COLORS.carbs, glowColor: THALI_COLORS.glowCarbs, label: 'Carbs' },
  { key: 'fats', start: 240, color: THALI_COLORS.fats, glowColor: THALI_COLORS.glowFats, label: 'Fats' },
];

function ThaliRing({ protein = 0, carbs = 0, fats = 0 }) {
  const macros = { protein, carbs, fats };
  const overallProgress = Math.round((protein + carbs + fats) / 3);
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow3D(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!show3D) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-72 h-80">
        <div className="flex items-center justify-center w-64 h-64 rounded-full bg-dabba/40 border border-white/5 animate-pulse relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-3 border-haldi/30 border-t-haldi rounded-full"
          />
        </div>
        <Legend macros={macros} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]">
        <Canvas
          camera={{ position: [0, 25, 40], fov: 35 }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x1a1918, 0);
            gl.physicallyCorrectLights = true;
            gl.outputEncoding = 3000;
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 15, 5]} intensity={1.5} color="#fffbe6" castShadow />
          <pointLight position={[8, 12, 8]} intensity={0.8} color={THALI_COLORS.protein} />
          <pointLight position={[-8, 10, -8]} intensity={0.6} color={THALI_COLORS.carbs} />

          <ThaliPlate />
          <MacroSegments macros={macros} />
          <CenterDisplay progress={overallProgress} />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.2}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
            autoRotate
            autoRotateSpeed={0.5}
            dampingFactor={0.08}
          />
        </Canvas>
      </div>

      <Legend macros={macros} />
    </div>
  );
}

function ThaliPlate() {
  return (
    <group position={[0, -1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12.5, 1.2, 32, 64]} />
        <meshStandardMaterial
          color={THALI_COLORS.metal}
          roughness={0.15}
          metalness={0.9}
          envMapIntensity={1.2}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <torusGeometry args={[12.5, 0.9, 24, 64]} />
        <meshStandardMaterial
          color={THALI_COLORS.track}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]} scale={[1.02, 1.02, 1]}>
        <torusGeometry args={[11.8, 0.15, 16, 64]} />
        <meshStandardMaterial
          color={THALI_COLORS.metal}
          roughness={0.1}
          metalness={0.95}
          emissive={THALI_COLORS.metal}
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}

function MacroSegments({ macros }) {
  const { protein, carbs, fats } = macros;
  const groupRef = useRef();
  const segmentRefs = useRef({});
  const [animatedMacros, setAnimatedMacros] = useState({ protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const start = { ...animatedMacros };
    const target = { protein, carbs, fats };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedMacros({
        protein: start.protein + (target.protein - start.protein) * eased,
        carbs: start.carbs + (target.carbs - start.carbs) * eased,
        fats: start.fats + (target.fats - start.fats) * eased,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [protein, carbs, fats, animatedMacros]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {segmentConfigs.map((config) => {
        const progress = animatedMacros[config.key] || 0;
        const angle = Math.max(0.08, (progress / 100) * ((Math.PI * 2) / 3));
        const torusArgs = [12.5, 0.85, 24, 48, angle];

        return (
          <mesh
            key={config.key}
            ref={(el) => { segmentRefs.current[config.key] = el; }}
            rotation={[-Math.PI / 2, 0, (config.start * Math.PI) / 180]}
            position={[0, Math.sin(Date.now() * 0.001 + config.start * 0.01) * 0.05, 0]}
          >
            <torusGeometry args={torusArgs} />
            <meshPhysicalMaterial
              color={config.color}
              roughness={0.1}
              metalness={0.4}
              clearcoat={0.5}
              clearcoatRoughness={0.1}
              emissive={config.glowColor}
              emissiveIntensity={0.8}
              transmission={0.1}
              thickness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function CenterDisplay({ progress }) {
  return (
    <Html position={[0, 0, 0]} center>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        className="flex flex-col items-center justify-center pointer-events-none select-none text-center"
      >
        <div className="px-6 py-4 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(232,163,61,0.2)] flex flex-col items-center relative">
          <motion.span
            key={progress}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-4xl font-extrabold font-mono tracking-tight relative z-10"
            style={{ color: THALI_COLORS.center, textShadow: `0 0 20px ${THALI_COLORS.protein}80` }}
          >
            {progress}%
          </motion.span>
          <span className="text-[10px] font-semibold tracking-widest text-cream/60 uppercase mt-1">
            Overall Target
          </span>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -inset-2 rounded-full blur-lg pointer-events-none"
            style={{ background: `radial-gradient(circle, ${THALI_COLORS.protein}40, transparent 70%)` }}
          />
        </div>
      </motion.div>
    </Html>
  );
}

function Legend({ macros }) {
  return (
    <div className="flex gap-3 justify-center flex-wrap max-w-xs">
      {segmentConfigs.map((config, i) => {
        const value = macros[config.key] || 0;
        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 * i }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex items-center gap-2 bg-dabba/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5 group cursor-pointer"
          >
            <div className="relative">
              <div
                className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: config.color, color: config.color, boxShadow: `0 0 12px ${config.color}` }}
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                className="absolute inset-0 rounded-full blur-sm"
                style={{ backgroundColor: config.color, opacity: 0.5 }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-body text-cream/80">{config.label}</span>
              <motion.span
                key={value}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-[11px] font-mono font-bold text-cream"
              >
                {value}%
              </motion.span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ThaliRing;
