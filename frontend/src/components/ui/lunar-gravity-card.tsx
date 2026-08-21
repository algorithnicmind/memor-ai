"use client";

import React, { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

const RADIUS = 2.0;

// High-detail procedural lunar surface texture generator (Zero network dependency, 100% offline & instant)
function createProceduralMoonTexture(): THREE.Texture {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return new THREE.Texture();
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base lunar regolith gray
  ctx.fillStyle = "#8d9095";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Maria (dark volcanic plains like Oceanus Procellarum, Mare Tranquillitatis)
  const mariaPlains = [
    { x: 320, y: 200, r: 170, color: "rgba(42, 45, 50, 0.70)" },
    { x: 440, y: 160, r: 130, color: "rgba(38, 40, 46, 0.65)" },
    { x: 230, y: 290, r: 110, color: "rgba(48, 50, 56, 0.60)" },
    { x: 670, y: 240, r: 150, color: "rgba(44, 46, 52, 0.65)" },
    { x: 790, y: 190, r: 120, color: "rgba(40, 42, 48, 0.60)" },
    { x: 510, y: 350, r: 95, color: "rgba(50, 53, 58, 0.55)" },
    { x: 150, y: 180, r: 85, color: "rgba(46, 48, 54, 0.50)" },
  ];

  mariaPlains.forEach((m) => {
    const grad = ctx.createRadialGradient(m.x, m.y, 15, m.x, m.y, m.r);
    grad.addColorStop(0, m.color);
    grad.addColorStop(0.7, m.color);
    grad.addColorStop(1, "rgba(141, 144, 149, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Impact Craters & Ejecta Rays
  for (let i = 0; i < 400; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const cr = Math.random() * 18 + 2;

    // Bright crater rim
    ctx.strokeStyle = `rgba(235, 240, 245, ${Math.random() * 0.45 + 0.25})`;
    ctx.lineWidth = Math.max(1, cr * 0.22);
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();

    // Dark crater shadow floor
    ctx.fillStyle = `rgba(25, 27, 30, ${Math.random() * 0.55 + 0.25})`;
    ctx.beginPath();
    ctx.arc(cx - cr * 0.12, cy - cr * 0.12, cr * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Central peak for large impact craters (e.g. Tycho, Copernicus)
    if (cr > 8) {
      ctx.fillStyle = "rgba(240, 245, 250, 0.7)";
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fine surface micro-roughness
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 26;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

const RealisticMoon = ({ onClick }: { onClick?: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const moonTexture = useMemo(() => createProceduralMoonTexture(), []);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
  });

  return (
    <mesh 
      ref={meshRef} 
      castShadow 
      receiveShadow 
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }} 
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <meshStandardMaterial 
        map={moonTexture} 
        bumpMap={moonTexture} 
        bumpScale={0.035} 
        roughness={0.82}
        metalness={0.08}
      />
    </mesh>
  );
};

const particlesCount = 60000; 
const [ringPositions, ringColors, ringRandoms] = (() => {
  const pos = new Float32Array(particlesCount * 3);
  const col = new Float32Array(particlesCount * 3);
  const rnd = new Float32Array(particlesCount);

  for (let i = 0; i < particlesCount; i++) {
    const angle = Math.random() * Math.PI * 2;

    const rDist = Math.pow(Math.random(), 1.5);
    const radius = 2.2 + rDist * 2.2; 

    const thickness = 0.4 - (rDist * 0.2); 
    const ySpread = (Math.random() + Math.random() + Math.random() - 1.5);
    const y = ySpread * thickness; 

    pos[i * 3] = Math.cos(angle) * radius;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(angle) * radius;

    const intensity = 1.0 - rDist; 

    const paletteType = Math.random();
    let baseR, baseG, baseB;

    if (paletteType < 0.80) {
      baseR = 0.25; baseG = 0.30; baseB = 0.35;
    } else if (paletteType < 0.92) {
      baseR = 0.0; baseG = 0.6; baseB = 0.8;
    } else {
      baseR = 0.6; baseG = 0.2; baseB = 0.8;
    }

    baseR = Math.min(1.0, Math.max(0.0, baseR + (Math.random() - 0.5) * 0.1));
    baseG = Math.min(1.0, Math.max(0.0, baseG + (Math.random() - 0.5) * 0.1));
    baseB = Math.min(1.0, Math.max(0.0, baseB + (Math.random() - 0.5) * 0.1));

    const sparkle = Math.random() > 0.95 ? 2.5 : 1.0;

    col[i * 3] = baseR * intensity * sparkle;     
    col[i * 3 + 1] = baseG * intensity * sparkle;   
    col[i * 3 + 2] = baseB * intensity * sparkle;   
    rnd[i] = Math.random();
  }
  return [pos, col, rnd];
})();

const ParticleRing = ({
  ringState,
  massiveAsteroidsRef,
}: {
  ringState: "hidden" | "animating" | "visible";
  massiveAsteroidsRef: React.MutableRefObject<Float32Array>;
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const uniforms = useRef({
    uProgress: { value: ringState === "visible" ? 1.0 : 0.0 },
    uAsteroids: { value: new Float32Array(75 * 4) },
    time: { value: 0 },
  });

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.02;
      pointsRef.current.updateMatrix();

      const invMat = new THREE.Matrix4().copy(pointsRef.current.matrix).invert();
      const localAsteroids = new Float32Array(75 * 4);
      for (let i = 0; i < 75; i++) {
        const ast = new THREE.Vector3(
          massiveAsteroidsRef.current[i * 4],
          massiveAsteroidsRef.current[i * 4 + 1],
          massiveAsteroidsRef.current[i * 4 + 2]
        );
        ast.applyMatrix4(invMat);
        localAsteroids[i * 4] = ast.x;
        localAsteroids[i * 4 + 1] = ast.y;
        localAsteroids[i * 4 + 2] = ast.z;
        localAsteroids[i * 4 + 3] = massiveAsteroidsRef.current[i * 4 + 3];
      }
      uniforms.current.uAsteroids.value = localAsteroids;
    }
    uniforms.current.time.value += delta;

    if (ringState === "animating") {
      uniforms.current.uProgress.value += delta * 0.35; 
      if (uniforms.current.uProgress.value > 1.0) uniforms.current.uProgress.value = 1.0;
    } else if (ringState === "visible") {
      uniforms.current.uProgress.value = 1.0;
    } else {
      uniforms.current.uProgress.value = 0.0;
    }
  });

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uProgress = uniforms.current.uProgress;
    shader.uniforms.uAsteroids = uniforms.current.uAsteroids;
    shader.uniforms.time = uniforms.current.time;

    shader.vertexShader = `
      uniform float uProgress;
      uniform vec4 uAsteroids[75];
      uniform float time;
      attribute float aRandom;
      varying float vProgress; 
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `
      vec3 transformed = vec3(position);

      float angle = atan(transformed.x, transformed.z);
      float normalizedAngle = abs(angle) / 3.14159265359;
      float spawnThreshold = 1.0 - normalizedAngle; 

      float progressValue = (uProgress * 1.4) - spawnThreshold;
      float particleProgress = smoothstep(0.0, 0.4, progressValue);
      vProgress = particleProgress;

      transformed.y += sin(angle * 10.0 + time) * 0.05 * aRandom;

      if (uProgress > 0.5) {
        for(int i = 0; i < 75; i++) {
          vec4 astData = uAsteroids[i];
          vec3 delta = transformed - astData.xyz;
          float dist = length(delta);

          float rad = astData.w * 2.0 + 0.15;

          if (dist < rad) {
             float force = pow((rad - dist) / rad, 2.0); 
             transformed += normalize(delta) * force * 0.4;
             transformed.y += force * 0.20 * (aRandom - 0.5);
          }
        }
      }

      float swirl = (1.0 - particleProgress) * 4.0; 
      float s = sin(swirl);
      float c = cos(swirl);
      transformed.xz = mat2(c, -s, s, c) * transformed.xz;

      transformed.y += (1.0 - particleProgress) * (transformed.y >= 0.0 ? 1.0 : -1.0);

      vec3 moonSurface = normalize(transformed) * 2.1;
      transformed = mix(moonSurface, transformed, particleProgress);
      `
    );

    shader.fragmentShader = `
      varying float vProgress;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <color_fragment>`,
      `
      #include <color_fragment>

      diffuseColor.a *= vProgress;
      `
    );
  };

  return (
    <points ref={pointsRef} rotation={[-Math.PI / 2, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={particlesCount}
          array={ringPositions}
          itemSize={3}
          args={[ringPositions, 3]}
        />
        <bufferAttribute 
          attach="attributes-color" 
          count={particlesCount}
          array={ringColors}
          itemSize={3}
          args={[ringColors, 3]}
        />
        <bufferAttribute 
          attach="attributes-aRandom" 
          count={particlesCount}
          array={ringRandoms}
          itemSize={1}
          args={[ringRandoms, 1]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.008} 
        vertexColors 
        transparent 
        opacity={0.8} 
        sizeAttenuation={true} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
        onBeforeCompile={onBeforeCompile} 
      />
    </points>
  );
};

const generateAsteroids = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    const baseRadius = 2.8 + Math.random() * 2.0; 
    const radialAmplitude = 0.5 + Math.random() * 1.5; 
    const radialSpeed = 0.15 + Math.random() * 0.25; 
    const phase = Math.random() * Math.PI * 2;

    const angle = Math.random() * Math.PI * 2;
    const zOffset = (Math.random() - 0.5) * 0.8; 

    const speed = (0.04 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1);

    const rotationSpeedX = (Math.random() - 0.5) * 0.05;
    const rotationSpeedY = (Math.random() - 0.5) * 0.05;
    const rotationSpeedZ = (Math.random() - 0.5) * 0.05;

    const scale = 0.02 + Math.pow(Math.random(), 4) * 0.18;

    data.push({
      angle, baseRadius, radialAmplitude, radialSpeed, phase, zOffset, speed,
      rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
      rsx: rotationSpeedX, rsy: rotationSpeedY, rsz: rotationSpeedZ,
      scale,
    });
  }
  data.sort((a, b) => b.scale - a.scale);
  return data;
};

const AsteroidBelt = ({
  ringState,
  massiveAsteroidsRef,
}: {
  ringState: "hidden" | "animating" | "visible";
  massiveAsteroidsRef: React.MutableRefObject<Float32Array>;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const moonTexture = useMemo(() => createProceduralMoonTexture(), []);

  const count = 75; 
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const [asteroids] = useState(() => generateAsteroids(count));

  const scaleRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const targetScale = ringState === "hidden" ? 0 : 1;
    const lerpSpeed = ringState === "hidden" ? 5 : 2;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * lerpSpeed);

    if (scaleRef.current < 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    asteroids.forEach((ast, i) => {
      ast.angle += ast.speed * delta; 
      ast.phase += ast.radialSpeed * delta;
      let currentRadius = ast.baseRadius + Math.sin(ast.phase) * ast.radialAmplitude;

      if (currentRadius < 2.15) {
        const penetration = 2.15 - currentRadius;
        currentRadius = 2.15 + penetration * 0.85;
      }

      const x = Math.cos(ast.angle) * currentRadius;
      const y = Math.sin(ast.angle) * currentRadius;

      massiveAsteroidsRef.current[i * 4] = x;
      massiveAsteroidsRef.current[i * 4 + 1] = y;
      massiveAsteroidsRef.current[i * 4 + 2] = ast.zOffset;
      massiveAsteroidsRef.current[i * 4 + 3] = ast.scale;

      ast.rx += ast.rsx;
      ast.ry += ast.rsy;
      ast.rz += ast.rsz;

      dummy.position.set(x, y, ast.zOffset);
      dummy.rotation.set(ast.rx, ast.ry, ast.rz);
      dummy.scale.setScalar(ast.scale * scaleRef.current);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        map={moonTexture} 
        bumpMap={moonTexture} 
        bumpScale={0.08}
        color="#ffffff"
        roughness={0.7}
        metalness={0.1}
      />
    </instancedMesh>
  );
};

export interface LunarGravityCardProps {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export default function LunarGravityCard({ 
  className,
  title = (
    <>
      <span className="text-zinc-50 drop-shadow-sm">Memorai</span>
      <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-400 to-zinc-800 drop-shadow-md">
        Memory.
      </span>
    </>
  ),
  description = "An intelligent assistant with persistent memory. Click the moon to explore the ecosystem."
}: LunarGravityCardProps) {
  const [ringState, setRingState] = useState<'hidden' | 'animating' | 'visible'>('hidden');
  const massiveAsteroidsRef = useRef<Float32Array>(new Float32Array(75 * 4));

  return (
    <div className={cn("w-full max-w-[1000px] min-h-[700px] md:min-h-[auto] md:h-[540px] bg-black rounded-[2.5rem] flex flex-col md:flex-row relative overflow-hidden border border-white/[0.08] shadow-[0_30px_100px_rgba(0,0,0,0.4)]", className)}>
      
      <div className="absolute top-0 left-0 md:inset-y-0 md:left-0 w-full h-[60%] md:h-full md:w-[60%] bg-gradient-to-b md:bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none"></div>

      <div className="w-full md:w-[45%] flex flex-col justify-center px-10 py-12 md:p-0 md:pl-16 relative z-20 pointer-events-none">
        <h2 className="text-[4.5rem] md:text-[5.5rem] font-bold tracking-tighter leading-[0.9] mb-6">
          {title}
        </h2>
        <p className="text-base md:text-lg text-zinc-400 font-medium leading-relaxed max-w-[340px]">
          {description}
        </p>
      </div>
     
      <div className="relative md:absolute md:right-0 md:top-0 w-full h-[450px] md:h-full md:w-[65%] pointer-events-auto z-0 flex items-center justify-center cursor-pointer">
        <div className="absolute inset-0 w-full h-full">
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            gl={{ powerPreference: "high-performance", antialias: true }}
            camera={{ position: [0, 4, 10], fov: 45 }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={0.2} />
            <directionalLight position={[8, 5, 5]} intensity={1.8} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />
            <directionalLight position={[-5, -3, -5]} intensity={0.35} color="#8a60e2" />

            <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />

            <group rotation={[Math.PI / 8, 0, 0]}>
              <Suspense fallback={null}>
                <RealisticMoon onClick={() => { if (ringState === 'hidden') setRingState('animating'); }} />
                <ParticleRing ringState={ringState} massiveAsteroidsRef={massiveAsteroidsRef} />
                <AsteroidBelt ringState={ringState} massiveAsteroidsRef={massiveAsteroidsRef} />
              </Suspense>
            </group>
          </Canvas>
        </div>
      </div>

    </div>
  );
}

export { LunarGravityCard as Component };
