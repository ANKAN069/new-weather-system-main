import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { WeatherCondition } from '../../types';

interface WeatherSceneProps {
  condition: WeatherCondition;
  isDay: boolean;
}

// --- Video Source Management ---
const getVideoSource = (condition: WeatherCondition, isDay: boolean) => {
  // Using reliable preview URLs from Mixkit for demonstration
  if (!isDay) {
     switch (condition) {
        case WeatherCondition.Stormy:
           return "https://assets.mixkit.co/videos/preview/mixkit-lightning-striking-in-the-night-sky-2385-large.mp4";
        case WeatherCondition.Rainy:
           return "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-at-night-3302-large.mp4";
        case WeatherCondition.Cloudy:
           return "https://assets.mixkit.co/videos/preview/mixkit-spooky-night-sky-with-clouds-and-moon-4337-large.mp4";
        default: // Sunny/Clear Night
           return "https://assets.mixkit.co/videos/preview/mixkit-starry-sky-time-lapse-1625-large.mp4";
     }
  } else {
     switch (condition) {
        case WeatherCondition.Stormy:
           return "https://assets.mixkit.co/videos/preview/mixkit-dark-storm-clouds-forming-in-the-sky-2343-large.mp4";
        case WeatherCondition.Rainy:
           return "https://assets.mixkit.co/videos/preview/mixkit-heavy-rain-falling-on-the-window-1569-large.mp4";
        case WeatherCondition.Cloudy:
           return "https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-1168-large.mp4";
        default: // Sunny
           return "https://assets.mixkit.co/videos/preview/mixkit-white-clouds-on-blue-sky-1136-large.mp4";
     }
  }
};

// --- Interactive Camera Rig ---
const CameraRig = () => {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    const targetX = mouse.current.x * 0.5; // Reduced movement for video backdrop harmony
    const targetY = mouse.current.y * 0.2;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.02);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.02);
    state.camera.lookAt(0, 0, -5);
  });

  return null;
};

// --- Particles & Elements ---

const Rain = ({ count = 1000 }) => {
  const points = useRef<THREE.Points>(null!);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current) return;
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const speed = 20;
    
    for (let i = 0; i < count; i++) {
      const yIdx = i * 3 + 1;
      positions[yIdx] -= speed * delta;
      
      if (positions[yIdx] < -15) {
        positions[yIdx] = 20;
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#aaccff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const Sun = () => {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if(mesh.current) {
        const scale = 1 + Math.sin(clock.getElapsedTime()) * 0.05;
        mesh.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[8, 6, -15]}>
        <mesh ref={mesh}>
            <sphereGeometry args={[2, 32, 32]} />
            <meshStandardMaterial
                emissive="#fbbf24"
                emissiveIntensity={2}
                color="#fbbf24"
                toneMapped={false}
                transparent
                opacity={0.9}
            />
        </mesh>
        <mesh position={[0,0,-1]}>
            <circleGeometry args={[4, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
        </mesh>
    </group>
  );
};

const Moon = () => {
  return (
    <mesh position={[6, 6, -15]}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial
        emissive="#cbd5e1"
        emissiveIntensity={0.4}
        color="#f8fafc"
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

const SceneContent: React.FC<{ condition: WeatherCondition; isDay: boolean }> = ({ condition, isDay }) => {
  return (
    <>
      <CameraRig />
      
      {/* Lighting matching the video ambience */}
      <ambientLight intensity={isDay ? 0.8 : 0.4} />
      <pointLight position={[10, 10, 5]} intensity={isDay ? 1.0 : 0.5} color={isDay ? "#ffeedd" : "#aaccff"} />

      {/* Stars Background for Night */}
      {!isDay && (
        <Stars 
          radius={100} 
          depth={50} 
          count={3000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1} 
        />
      )}

      {/* Celestial Objects - Kept for 3D depth against the flat video */}
      {isDay ? (
          condition === WeatherCondition.Sunny && <Sun />
      ) : (
          (condition === WeatherCondition.Sunny || condition === WeatherCondition.Cloudy) && <Moon />
      )}

      {/* 3D Clouds - Reduced opacity to blend with video clouds */}
      {(condition === WeatherCondition.Sunny || condition === WeatherCondition.Cloudy) && isDay && (
         <group>
            <Cloud position={[-8, 0, -10]} opacity={0.4} speed={0.05} segments={20} bounds={[10, 2, 2]} color="#fff" />
            <Cloud position={[8, 2, -8]} opacity={0.4} speed={0.05} segments={20} bounds={[10, 2, 2]} color="#fff" />
         </group>
      )}

      {condition === WeatherCondition.Cloudy && (
        <group>
           <Cloud position={[0, 5, -8]} opacity={0.6} speed={0.1} segments={30} color={isDay ? "#cbd5e1" : "#64748b"} />
        </group>
      )}

      {/* Rain Layers - These look great over a video */}
      {condition === WeatherCondition.Rainy && (
        <Rain count={3000} />
      )}

      {/* Storm Layers */}
      {condition === WeatherCondition.Stormy && (
        <>
          <Cloud position={[0, 8, -8]} opacity={0.8} color="#1e293b" speed={0.5} segments={40} />
          <Rain count={4000} />
          <Sparkles 
             count={20} 
             scale={15} 
             size={15} 
             speed={0.4} 
             opacity={0.6} 
             color="#fbbf24" 
             noise={20}
           />
        </>
      )}
    </>
  );
};

const WeatherScene: React.FC<WeatherSceneProps> = ({ condition, isDay }) => {
  const videoSrc = useMemo(() => getVideoSource(condition, isDay), [condition, isDay]);
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-slate-900">
      {/* 1. Video Background Layer */}
      <div className="absolute inset-0 z-0 transition-opacity duration-1000" style={{ opacity: videoLoaded ? 1 : 0 }}>
        <video
            key={videoSrc} // Force reload on src change
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full scale-105" // Slight scale to prevent edge gaps
            onLoadedData={() => setVideoLoaded(true)}
            src={videoSrc}
        />
        {/* Overlay to ensure text readability */}
        <div className={`absolute inset-0 ${isDay ? 'bg-black/10' : 'bg-black/40'}`} />
      </div>

      {/* Fallback Gradient (while video loads) */}
      {!videoLoaded && (
          <div className={`absolute inset-0 z-0 bg-gradient-to-b ${isDay ? 'from-blue-400 to-blue-200' : 'from-slate-900 to-slate-800'}`} />
      )}

      {/* 2. 3D Particle Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas 
            camera={{ position: [0, 0, 5], fov: 60 }}
            gl={{ alpha: true }} // Important: transparent background
        >
            <SceneContent condition={condition} isDay={isDay} />
        </Canvas>
      </div>
    </div>
  );
};

export default WeatherScene;