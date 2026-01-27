import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

// Device and performance detection
const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|tablet/.test(userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 4 ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4);

  return {
    isMobile,
    isLowEnd,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2 for performance
  };
};

// Adaptive quality settings based on device
const getQualitySettings = () => {
  const device = getDeviceType();

  if (device.isMobile || device.isLowEnd) {
    return {
      isMobile: true,
      particleCount: 300,      // Much fewer particles
      foregroundCount: 30,     // Fewer foreground particles
      particleSize: 0.004,
      enableShape: false,      // Disable 3D shape on mobile
      enableFloat: false,
      enableLighting: false,   // Simpler lighting
      enableFog: false,
      frameSkip: 2,           // Skip frames for smoother performance
      pixelRatio: 1,          // Lower pixel ratio
    };
  }

  return {
    isMobile: false,
    particleCount: 1000,
    foregroundCount: 80,
    particleSize: 0.003,
    enableShape: true,
    enableFloat: true,
    enableLighting: true,
    enableFog: true,
    frameSkip: 1,
    pixelRatio: device.pixelRatio,
  };
};

const ParticleField = ({ count = 1500, color = "#10b981", size = 0.002, radius = 1.5, frameSkip = 1 }) => {
  const ref = useRef();
  const frameCount = useRef(0);

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
    }
    return p;
  }, [count, radius]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Frame skipping for lower-end devices
    frameCount.current++;
    if (frameCount.current % frameSkip !== 0) return;

    ref.current.rotation.x -= delta / 15;
    ref.current.rotation.y -= delta / 20;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled>
        <PointMaterial
          transparent
          color={color}
          size={size}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};

const CyberShape = ({ frameSkip = 1 }) => {
  const meshRef = useRef();
  const frameCount = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Frame skipping optimization
    frameCount.current++;
    if (frameCount.current % frameSkip !== 0) return;

    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
  });

  return (
    <Icosahedron args={[1, 1]} ref={meshRef} scale={0.8}>
      <meshStandardMaterial
        color="#059669"
        emissive="#064e3b"
        emissiveIntensity={2}
        wireframe
        transparent
        opacity={0.3}
        roughness={0}
        metalness={1}
      />
    </Icosahedron>
  );
};

const OptimizedCyberShape = ({ enableFloat, frameSkip }) => {
  if (enableFloat) {
    return (
      <Float speed={4} rotationIntensity={1} floatIntensity={2}>
        <CyberShape frameSkip={frameSkip} />
      </Float>
    );
  }
  return <CyberShape frameSkip={frameSkip} />;
};

const Background3D = () => {
  const [quality, setQuality] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback for non-blocking initialization
    const initQuality = () => {
      setQuality(getQualitySettings());
      setIsLoaded(true);
      // Small delay before showing canvas for smooth transition
      setTimeout(() => setIsCanvasReady(true), 200);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(initQuality, { timeout: 500 });
    } else {
      setTimeout(initQuality, 50);
    }
  }, []);

  // Return static background early for mobile OR while loading to save resources/avoid crash
  if (!quality || quality.isMobile) {
    return (
      <div className="fixed inset-0 z-[-1] bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,150,105,0.05)_0%,#000000_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[-1] bg-black transition-opacity duration-1000 ${isCanvasReady ? 'opacity-100' : 'opacity-0'
        }`}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 75 }}
        dpr={quality.pixelRatio}
        performance={{ min: 0.5 }}
        gl={{
          antialias: false, // Disable antialiasing for performance
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        frameloop="always"
      >
        {quality.enableFog && <fog attach="fog" args={['#000000', 1, 5]} />}

        {/* Background Stars */}
        <ParticleField
          count={quality.particleCount}
          color="#059669"
          size={quality.particleSize}
          radius={2.5}
          frameSkip={quality.frameSkip}
        />

        {/* Foreground Particles */}
        <ParticleField
          count={quality.foregroundCount}
          color="#34d399"
          size={quality.particleSize * 2.5}
          radius={1.5}
          frameSkip={quality.frameSkip}
        />

        {/* Hero Object - Only on desktop */}
        {quality.enableShape && (
          <group position={[1, 0, -0.5]}>
            <OptimizedCyberShape
              enableFloat={quality.enableFloat}
              frameSkip={quality.frameSkip}
            />
          </group>
        )}

        {/* Lighting - Simplified on mobile */}
        {quality.enableLighting ? (
          <>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#10b981" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
          </>
        ) : (
          <ambientLight intensity={0.4} />
        )}
      </Canvas>

      {/* Vignette & Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/80 pointer-events-none" />
    </div>
  );
};

export default Background3D;
