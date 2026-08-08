import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { motion } from 'framer-motion';

const THALI_COLORS = {
  protein: '#FF5722',
  carbs: '#FFC107',
  fats: '#8BC34A',
  track: '#22201D',
  metal: '#4A4741',
  center: '#F2EDE4',
};

const segmentConfigs = [
  { key: 'protein', start: 0, color: THALI_COLORS.protein, label: 'Protein' },
  { key: 'carbs', start: 120, color: THALI_COLORS.carbs, label: 'Carbs' },
  { key: 'fats', start: 240, color: THALI_COLORS.fats, label: 'Fats' },
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
        <div className="flex items-center justify-center w-64 h-64 rounded-full bg-dabba/40 border border-white/5 animate-pulse">
          <span className="text-cream/50 font-body text-sm">Rendering 3D Thali...</span>
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
          }}
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, 15, -10]} intensity={0.8} color="#ffd1a4" />

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
            autoRotateSpeed={0.6}
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
      {/* Outer Metallic Rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[11.8, 0.9, 24, 64]} />
        <meshStandardMaterial
          color={THALI_COLORS.metal}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Base Dark Track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <torusGeometry args={[11.8, 0.7, 16, 64]} />
        <meshStandardMaterial
          color={THALI_COLORS.track}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function MacroSegments({ macros }) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {segmentConfigs.map((config) => {
        const progress = macros[config.key] || 0;
        const angle = Math.max(0.05, (progress / 100) * ((Math.PI * 2) / 3));
        const torusArgs = [11.8, 0.75, 16, 48, angle];

        return (
          <mesh
            key={config.key}
            rotation={[-Math.PI / 2, 0, (config.start * Math.PI) / 180]}
          >
            <torusGeometry args={torusArgs} />
            <meshStandardMaterial
              color={config.color}
              roughness={0.2}
              metalness={0.3}
              emissive={config.color}
              emissiveIntensity={0.6}
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
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        className="flex flex-col items-center justify-center pointer-events-none select-none text-center"
      >
        <div className="px-5 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col items-center">
          <span className="text-3xl font-extrabold font-mono tracking-tight" style={{ color: THALI_COLORS.center }}>
            {progress}%
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-cream/60 uppercase">
            Overall Target
          </span>
        </div>
      </motion.div>
    </Html>
  );
}

function Legend({ macros }) {
  return (
    <div className="flex gap-4 justify-center flex-wrap max-w-xs">
      {segmentConfigs.map((config, i) => (
        <motion.div
          key={config.key}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18, delay: 0.1 * i }}
          className="flex items-center gap-2 bg-dabba/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5"
        >
          <div
            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: config.color, color: config.color }}
          />
          <span className="text-xs font-body text-cream/80">
            {config.label}{' '}
            <strong className="font-mono text-cream ml-0.5">
              {macros[config.key] || 0}%
            </strong>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default ThaliRing;