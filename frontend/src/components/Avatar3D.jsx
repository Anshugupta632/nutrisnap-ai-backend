import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

const AVATAR_COLORS = {
  haldi: '#E8A33D',
  cream: '#F2EDE4',
  masala: '#C1502E',
  curry: '#6B8E4E',
  steel: '#2B2A28',
  dabba: '#3D3A34',
};

// This component lives INSIDE <Canvas>, so useFrame works here.
function AvatarScene({ stamina, strengthPoints, user }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const eyeLeftRef = useRef();
  const eyeRightRef = useRef();
  const glowRef = useRef();
  const particleRefs = useRef([]);

  const staminaRatio = stamina / 100;
  const isHighStamina = stamina >= 75;
  const isLowStamina = stamina < 40;

  const glowColor = isHighStamina
    ? AVATAR_COLORS.haldi
    : isLowStamina
    ? AVATAR_COLORS.masala
    : AVATAR_COLORS.curry;

  const postureOffset = isHighStamina ? 0.15 : isLowStamina ? -0.2 : 0;
  const glowIntensity = isHighStamina ? 1.2 : isLowStamina ? 0.3 : 0.6;
  const bodyScale = 1 + (staminaRatio - 0.5) * 0.15;

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.15) * 0.12;
      const breathe = Math.sin(time * 1.8) * 0.025;
      groupRef.current.position.y = Math.sin(time * 0.6) * 0.08 + breathe + postureOffset;
    }

    if (bodyRef.current) {
      const breatheScale = 1 + Math.sin(time * 1.8) * 0.02;
      bodyRef.current.scale.setScalar(bodyScale * breatheScale);
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.8) * 0.15;
      headRef.current.rotation.x = Math.sin(time * 1.2) * 0.05;
    }

    if (eyeLeftRef.current && eyeRightRef.current) {
      const blink = Math.sin(time * 0.5) > 0.95 ? 0.1 : 1;
      eyeLeftRef.current.scale.y = blink;
      eyeRightRef.current.scale.y = blink;
      eyeLeftRef.current.position.x = Math.sin(time * 0.7) * 0.08;
      eyeRightRef.current.position.x = Math.sin(time * 0.7) * 0.08;
    }

    if (glowRef.current) {
      const pulse = 1 + Math.sin(time * 2.5) * 0.15 * glowIntensity;
      glowRef.current.scale.setScalar(pulse);
      glowRef.current.material.opacity = 0.15 + Math.sin(time * 2) * 0.08 * glowIntensity;
    }

    particleRefs.current.forEach((particle, i) => {
      if (particle) {
        particle.position.y += delta * (0.5 + i * 0.1);
        particle.position.x += Math.sin(time * 0.5 + i) * delta * 0.3;
        particle.rotation.y += delta * 0.5;

        if (particle.position.y > 3) {
          particle.position.y = -1.5;
          particle.position.x = (Math.random() - 0.5) * 1.5;
          particle.position.z = (Math.random() - 0.5) * 1.5;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh ref={bodyRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[1.1, 48, 48]} />
        <meshPhysicalMaterial
          color={glowColor}
          metalness={0.15}
          roughness={0.35}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          transmission={0.1}
          thickness={0.5}
          ior={1.3}
          emissive={glowColor}
          emissiveIntensity={0.3 * glowIntensity}
          transparent
          opacity={0.9}
        />
      </mesh>

      <group ref={headRef} position={[0, 1.55, 0]}>
        <mesh>
          <sphereGeometry args={[0.75, 32, 32]} />
          <meshPhysicalMaterial
            color={isHighStamina ? glowColor : isLowStamina ? AVATAR_COLORS.masala : AVATAR_COLORS.curry}
            metalness={0.1}
            roughness={0.4}
            clearcoat={0.3}
            clearcoatRoughness={0.3}
            emissive={glowColor}
            emissiveIntensity={0.2}
          />
        </mesh>

        <mesh ref={eyeLeftRef} position={[-0.22, 0.15, 0.6]} scale={isLowStamina ? [1, 0.6, 1] : 1}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#1a1816" roughness={0.1} metalness={0.1} />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.22, 0.15, 0.6]} scale={isLowStamina ? [1, 0.6, 1] : 1}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#1a1816" roughness={0.1} metalness={0.1} />
        </mesh>
      </group>

      <mesh ref={glowRef} position={[0, 0.3, 0]} scale={1.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.12 * glowIntensity}
          depthWrite={false}
          side={2}
          blending={2}
        />
      </mesh>

      <StaminaParticles refs={particleRefs} color={glowColor} count={isHighStamina ? 12 : isLowStamina ? 3 : 6} />
    </group>
  );
}

function StaminaParticles({ refs, color, count }) {
  const [particles] = useState(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 3 - 1,
    z: (Math.random() - 0.5) * 2,
  })));

  return (
    <group>
      {particles.map((p) => (
        <mesh
          key={p.id}
          ref={(el) => { refs.current[p.id] = el; }}
          position={[p.x, p.y, p.z]}
          scale={0.15}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} blending={2} />
        </mesh>
      ))}
    </group>
  );
}

function SkeletonAvatar() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshBasicMaterial color={AVATAR_COLORS.dabba} transparent opacity={0.3} wireframe />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.75, 24, 24]} />
        <meshBasicMaterial color={AVATAR_COLORS.dabba} transparent opacity={0.3} wireframe />
      </mesh>
    </group>
  );
}

// Outer wrapper - owns state, animates stamina/strength numbers, renders Canvas + HTML overlay.
// Does NOT call useFrame itself (that's inside AvatarScene, which is a Canvas child).
function BlobAvatar({ stamina = 100, strengthPoints = 0, level = 1, user = null }) {
  const [animatedStamina, setAnimatedStamina] = useState(stamina);
  const [animatedStrength, setAnimatedStrength] = useState(strengthPoints);

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const startStamina = animatedStamina;
    const startStrength = animatedStrength;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedStamina(Math.floor(startStamina + (stamina - startStamina) * eased));
      setAnimatedStrength(Math.floor(startStrength + (strengthPoints - startStrength) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamina, strengthPoints]);

  return (
    <div className="relative w-full h-64">
      <Canvas
        camera={{ position: [0, 1.2, 5.5], fov: 32 }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => gl.setClearColor(0x2b2a28, 0)}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 3]} intensity={1.2} color="#fffbe6" />
        <pointLight position={[-2, 3, 2]} intensity={0.8} color={AVATAR_COLORS.haldi} />
        <pointLight position={[2, 2, -2]} intensity={0.5} color={AVATAR_COLORS.masala} />

        <Suspense fallback={<SkeletonAvatar />}>
          <AvatarScene stamina={animatedStamina} strengthPoints={animatedStrength} user={user} />
        </Suspense>

        <Html position={[0, 2.8, 0]} center>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
            className="pointer-events-none select-none text-center"
          >
            <motion.div
              key={level}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-[11px] font-mono font-bold shadow-lg"
            >
              <span className="text-haldi">★</span> Lvl {level}
            </motion.div>
          </motion.div>
        </Html>
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full px-4 pb-3 pt-6 text-center pointer-events-none bg-gradient-to-t from-black/70 via-black/40 to-transparent"
      >
        <div className="flex items-center justify-center gap-2">
          <motion.span
            key={animatedStamina}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="font-mono text-haldi text-lg font-bold"
          >
            {animatedStamina}%
          </motion.span>
          <span className="text-cream/50 text-xs font-body uppercase tracking-wider">Stamina</span>
        </div>
        <motion.div
          key={animatedStrength}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-1.5 mt-1 text-cream/60 text-xs font-body"
        >
          <span className="text-haldi">⚡</span>
          <span>{animatedStrength} strength pts</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Avatar3DWrapper({ stamina = 100, strengthPoints = 0, deficitDays = 0, user = null, level = 1 }) {
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow3D(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-64 bg-dabba/30 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
      {show3D ? (
        <BlobAvatar stamina={stamina} strengthPoints={strengthPoints} level={level} user={user} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-3 border-haldi/30 border-t-haldi rounded-full"
          />
        </div>
      )}
    </div>
  );
}
