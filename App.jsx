import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  Rocket, Play, ShieldAlert, Zap, Fuel, Package, Compass,
  Volume2, VolumeX, AlertTriangle, CheckCircle2, RotateCcw, Radio, Award, Database, Globe, Cpu, Camera, Radar, Shield, Satellite, Navigation, HelpCircle, X
} from 'lucide-react';

class SpaceAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  setMute(mute) {
    this.muted = mute;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(mute ? 0 : 0.15, this.ctx.currentTime, 0.1);
    }
  }
  playClick() {
    if (this.muted) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }
  startEngine() {
    if (this.muted) return;
    try {
      this.init();
      if (this.engineOsc) return;
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(50, this.ctx.currentTime);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    } catch (e) {}
  }
  stopEngine() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); } catch (e) {}
      this.engineOsc = null;
      this.engineGain = null;
    }
  }
  playAlarm() {
    if (this.muted) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + i * 0.2);
        osc.frequency.setValueAtTime(520, now + i * 0.2 + 0.1);
        gain.gain.setValueAtTime(0.25, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.19);
      }
    } catch (e) {}
  }
  playSuccess() {
    if (this.muted) return;
    try {
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.12);
        osc.stop(this.ctx.currentTime + idx * 0.12 + 0.31);
      });
    } catch (e) {}
  }
}

const audio = new SpaceAudioEngine();

const TARGETS = [
  { 
    id: 'mars', 
    name: 'Mars Orbital Insertion (PDS MEX)', 
    distance: '225M km', 
    maxPayloadKg: 5000, 
    pdsSource: 'WUSTL PDS Geosciences Mars Express',
    color: '#e76f51',
    emissive: '#78290f'
  },
  { 
    id: 'venus', 
    name: 'Venus Atmospheric Orbiter', 
    distance: '108M km', 
    maxPayloadKg: 4500, 
    pdsSource: 'NASA PDS Venus Express Archive',
    color: '#e9c46a',
    emissive: '#ca6702'
  },
  { 
    id: 'jupiter', 
    name: 'Jupiter Magnetospheric Probe', 
    distance: '778M km', 
    maxPayloadKg: 3800, 
    pdsSource: 'NASA PDS Planetary Data System',
    color: '#f4a261',
    emissive: '#bb3e03'
  },
  { 
    id: 'europa', 
    name: 'Europa Ice Reconnaissance', 
    distance: '628M km', 
    maxPayloadKg: 4000, 
    pdsSource: 'PDS Outer Planets Archive',
    color: '#90e0ef',
    emissive: '#0077b6'
  },
  { 
    id: 'titan', 
    name: 'Titan Atmospheric Probe', 
    distance: '1200M km', 
    maxPayloadKg: 3500, 
    pdsSource: 'Cassini Huygens Archive',
    color: '#dda15e',
    emissive: '#99582a'
  }
];

const AVAILABLE_INSTRUMENTS = [
  { id: 'hrsc', name: 'HRSC 3D Camera', weight: 450, power: 40, icon: Camera },
  { id: 'radar', name: 'Subsurface Radar', weight: 600, power: 75, icon: Radar },
  { id: 'mag', name: 'Magnetometer', weight: 250, power: 25, icon: Cpu },
  { id: 'spectro', name: 'IR Spectrometer', weight: 500, power: 50, icon: Shield }
];

function ActualPlanetMesh({ target, scale = 1.3 }) {
  const meshRef = useRef();

  useFrame((state, dr) => {
    if (meshRef.current) meshRef.current.rotation.y += dr * 0.15;
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[scale, 64, 64]} />
        <meshStandardMaterial 
          color={target.color} 
          emissive={target.emissive} 
          emissiveIntensity={0.4} 
          roughness={0.6} 
          metalness={0.2} 
        />
      </mesh>
      <Text position={[0, -2.0, 0]} fontSize={0.22} color="#38bdf8">{target.name.toUpperCase()}</Text>
    </group>
  );
}

function RealEarthMesh() {
  const earthRef = useRef();
  const earthTexture = useLoader(
    THREE.TextureLoader,
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg'
  );

  useFrame((state, dr) => {
    if (earthRef.current) earthRef.current.rotation.y += dr * 0.1;
  });

  return (
    <group position={[-6.2, 0, 0]}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.1, 64, 64]} />
        <meshStandardMaterial map={earthTexture} roughness={0.5} />
      </mesh>
      <Text position={[0, -1.6, 0]} fontSize={0.22} color="#38bdf8">EARTH (ORIGIN)</Text>
    </group>
  );
}

function BackgroundSolarSystem() {
  const marsRef = useRef();
  const venusRef = useRef();
  const jupiterRef = useRef();
  const saturnRef = useRef();

  useFrame((state, dr) => {
    const t = state.clock.getElapsedTime();
    if (marsRef.current) {
      marsRef.current.position.x = Math.cos(t * 0.25) * 8;
      marsRef.current.position.z = Math.sin(t * 0.25) * 5 - 6;
      marsRef.current.rotation.y += dr * 0.5;
    }
    if (venusRef.current) {
      venusRef.current.position.x = Math.cos(t * 0.2 + 1.5) * 11;
      venusRef.current.position.z = Math.sin(t * 0.2 + 1.5) * 6 - 9;
      venusRef.current.rotation.y += dr * 0.4;
    }
    if (jupiterRef.current) {
      jupiterRef.current.position.x = Math.cos(t * 0.12 + 3) * 15;
      jupiterRef.current.position.z = Math.sin(t * 0.12 + 3) * 8 - 14;
      jupiterRef.current.rotation.y += dr * 0.3;
    }
    if (saturnRef.current) {
      saturnRef.current.position.x = Math.cos(t * 0.08 + 4.5) * 19;
      saturnRef.current.position.z = Math.sin(t * 0.08 + 4.5) * 10 - 18;
      saturnRef.current.rotation.y += dr * 0.25;
    }
  });

  return (
    <>
      <group ref={marsRef} position={[4, 1, -6]}>
        <mesh><sphereGeometry args={[1.1, 32, 32]} /><meshStandardMaterial color="#e76f51" emissive="#78290f" emissiveIntensity={0.5} roughness={0.7} /></mesh>
      </group>
      <group ref={venusRef} position={[-6, -1, -9]}>
        <mesh><sphereGeometry args={[1.3, 32, 32]} /><meshStandardMaterial color="#e9c46a" emissive="#ca6702" emissiveIntensity={0.5} roughness={0.4} /></mesh>
      </group>
      <group ref={jupiterRef} position={[8, 2, -14]}>
        <mesh><sphereGeometry args={[2.0, 32, 32]} /><meshStandardMaterial color="#f4a261" emissive="#bb3e03" emissiveIntensity={0.6} roughness={0.5} /></mesh>
      </group>
      <group ref={saturnRef} position={[-10, 3, -18]}>
        <mesh><sphereGeometry args={[1.6, 32, 32]} /><meshStandardMaterial color="#dda15e" emissive="#99582a" emissiveIntensity={0.5} roughness={0.6} /></mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}><ringGeometry args={[2.0, 3.2, 32]} /><meshStandardMaterial color="#f4a261" side={THREE.DoubleSide} transparent opacity={0.8} /></mesh>
      </group>
    </>
  );
}

function SpaceScene({ target, progress, deviation, fuel, isRunning }) {
  const rocketRef = useRef();
  const flameRef = useRef();

  useFrame((state, dr) => {
    try {
      if (rocketRef.current) {
        const targetX = -5 + (progress / 100) * 10;
        const targetY = deviation * 0.1;
        const targetZ = Math.sin(deviation * 0.08) * 1.2;
        rocketRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.1);
        const tilt = -Math.PI / 2 + (deviation * 0.04);
        rocketRef.current.rotation.z = THREE.MathUtils.lerp(rocketRef.current.rotation.z, tilt, 0.1);
        rocketRef.current.rotation.x += dr * 0.5;
        if (flameRef.current) {
          const flicker = isRunning && fuel > 0 ? 0.9 + Math.random() * 0.8 : 0.01;
          flameRef.current.scale.set(1, flicker, 1);
        }
      }
    } catch (e) {}
  });

  return (
    <>
      <color attach="background" args={['#000002']} />
      <Stars radius={220} depth={110} count={18000} factor={6} saturation={1} fade speed={1.8} />
      <ambientLight intensity={1.8} />
      <pointLight position={[30, 30, 30]} intensity={6.0} color="#ffffff" />
      <directionalLight position={[-20, 20, 20]} intensity={3.0} color="#38bdf8" />
      
      {target && (
        <>
          <React.Suspense fallback={null}><RealEarthMesh /></React.Suspense>
          <Line points={[new THREE.Vector3(-5, 0, 0), new THREE.Vector3(5, 0, 0)]} color="#0ea5e9" lineWidth={2} dashed dashSize={0.2} gapSize={0.2} />
          
          <group ref={rocketRef} position={[-5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.3, 1.8, 16]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
              <coneGeometry args={[0.2, 0.7, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.5, 0, 0]}>
              <boxGeometry args={[0.9, 0.06, 0.35]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[-0.5, 0, 0]}>
              <boxGeometry args={[0.9, 0.06, 0.35]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
            </mesh>
            <mesh ref={flameRef} position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.25, 1.4, 12]} />
              <meshBasicMaterial color={deviation !== 0 ? '#ef4444' : '#38bdf8'} />
            </mesh>
          </group>

          <group position={[5.5, 0, 0]}>
            <ActualPlanetMesh key={target.id} target={target} scale={target.id === 'jupiter' ? 1.7 : 1.35} />
          </group>
        </>
      )}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
}

export default function App() {
  const [screen, setScreen] = useState('DASHBOARD');
  const [muted, setMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const [selectedTarget, setSelectedTarget] = useState(TARGETS[0]);
  const [fuelInput, setFuelInput] = useState(90);
  const [energyInput, setEnergyInput] = useState(90);
  const [shieldInput, setShieldInput] = useState(80);
  const [dsnInput, setDsnInput] = useState(50);
  const [launchAzimuth, setLaunchAzimuth] = useState(45);
  const [selectedInstruments, setSelectedInstruments] = useState(['hrsc', 'radar']);

  const [fuel, setFuel] = useState(90);
  const [energy, setEnergy] = useState(90);
  const [progress, setProgress] = useState(0);
  const [deviation, setDeviation] = useState(0);
  const [shearStress, setShearStress] = useState(1.2);
  const [weatherStatus, setWeatherStatus] = useState('NASA API FETCHED: DONKI & APOD');
  const [debrisRisk, setDebrisRisk] = useState({ count: 142, level: 'NOMINAL', color: 'text-emerald-400' });
  const [alertBox, setAlertBox] = useState(null);
  const [logs, setLogs] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [efficiencyScore, setEfficiencyScore] = useState(0);
  const [nasaImage, setNasaImage] = useState(null);

  const totalPayloadWeight = selectedInstruments.reduce((acc, id) => {
    const inst = AVAILABLE_INSTRUMENTS.find(i => i.id === id);
    return acc + (inst ? inst.weight : 0);
  }, 1000);

  const toggleInstrument = (id) => {
    audio.playClick();
    setSelectedInstruments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio.setMute(next);
  };

  const addLog = useCallback((msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 8)]);
  }, []);

  useEffect(() => {
    const debrisCount = Math.floor(80 + Math.abs(Math.sin(launchAzimuth) * 350));
    let level = 'NOMINAL';
    let color = 'text-emerald-400';
    if (debrisCount > 250) {
      level = 'HIGH HAZARD';
      color = 'text-rose-400';
    } else if (debrisCount > 160) {
      level = 'MODERATE SHEAR';
      color = 'text-amber-400';
    }
    setDebrisRisk({ count: debrisCount, level, color });
  }, [launchAzimuth]);

  useEffect(() => {
    async function fetchNASAData() {
      try {
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        const data = await res.json();
        if (data && data.url) setNasaImage(data.url);
      } catch (e) {}
    }
    fetchNASAData();
  }, [addLog]);

  const launchMission = () => {
    audio.init();
    audio.playClick();
    audio.startEngine();
    setFuel(fuelInput);
    setEnergy(energyInput);
    setProgress(0);
    setDeviation(0);
    setShearStress(1.2);
    setAlertBox(null);
    setOutcome(null);
    setLogs([`[LAUNCH] Odyssey active for ${selectedTarget.name}. Azimuth: ${launchAzimuth}°.`]);
    setScreen('SIMULATION');
  };

  const correctCourse = () => {
    audio.playClick();
    if (fuel >= 4) {
      setFuel(f => Math.max(0, f - 4));
      setDeviation(0);
      setAlertBox(null);
      addLog('Thruster burn successful! Trajectory realigned.');
    } else {
      addLog('CRITICAL: Insufficient fuel for correction!');
    }
  };

  useEffect(() => {
    if (screen !== 'SIMULATION' || outcome) return;
    const timer = setInterval(() => {
      const fuelBurn = 0.6;
      setFuel(f => {
        const nextF = Math.max(0, f - fuelBurn);
        if (nextF <= 0) {
          audio.stopEngine();
          audio.playAlarm();
          setOutcome('FAILED');
          setAlertBox({ title: 'PROPELLANT DEPLETED', reason: 'Fuel exhausted before orbital insertion.' });
        }
        return nextF;
      });

      setProgress(p => {
        const nextP = Math.min(100, p + 4);
        if (nextP >= 100) {
          audio.stopEngine();
          audio.playSuccess();
          const score = Math.round(fuel * 0.5 + energy * 0.3 + 20);
          setEfficiencyScore(Math.min(100, score));
          setOutcome('SUCCESS');
          addLog(`SUCCESS! Mission Efficiency Score: ${score}/100`);
        }
        return nextP;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, outcome, fuel, energy]);

  const getRank = (score) => score >= 90 ? 'Chief NASA Flight Director' : score >= 75 ? 'Senior Aerospace Engineer' : 'Junior Trainee';

  return (
    <div className="min-h-screen bg-[#000002] text-slate-100 font-sans select-none flex flex-col relative overflow-hidden">
      {screen === 'DASHBOARD' && (
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
            <color attach="background" args={['#000002']} />
            <Stars radius={220} depth={110} count={18000} factor={6} saturation={1} fade speed={1.8} />
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={4.0} color="#38bdf8" />
            <BackgroundSolarSystem />
          </Canvas>
        </div>
      )}

      <header className="flex justify-between items-center px-6 py-3 bg-slate-950/85 backdrop-blur-md border-b border-sky-500/30 z-30">
        <div className="flex items-center gap-3">
          <Satellite className="w-6 h-6 text-sky-400 animate-pulse" />
          <span className="font-bold tracking-widest text-sm text-sky-300">NASA PDS // REAL SOLAR SYSTEM ODYSSEY 3D</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:flex items-center gap-1.5 text-xs bg-slate-900/90 border border-sky-500/30 px-3 py-1 rounded-full text-sky-300">
            <Database className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> {weatherStatus}
          </span>
          <button onClick={toggleMute} className="p-2 rounded-lg bg-slate-900 border border-sky-500/40 hover:border-cyan-400">
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
          </button>
        </div>
      </header>

      {screen === 'DASHBOARD' && (
        <div className="flex-grow flex items-center justify-between px-12 md:px-24 py-12 relative z-10 overflow-hidden">
          <div className="space-y-6 max-w-lg z-20">
            <div className="inline-block px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(56,189,248,0.3)]">
              NASA Space Apps Challenge #13
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">
              ODYSSEY
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Experience true deep space. Pilot your 3D spacecraft across the solar system to Mars, Venus, Jupiter, Europa, or Titan with realistic Earth texture and distinct planet colors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => { audio.init(); audio.playClick(); setScreen('CONFIG'); }}
                className="px-8 py-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-sm tracking-widest uppercase transition shadow-[0_0_25px_rgba(56,189,248,0.5)] flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> START MISSION
              </button>
              <button
                onClick={() => { audio.playClick(); setShowHowToPlay(true); }}
                className="px-8 py-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-sky-400 border border-sky-500/40 font-bold text-sm tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
              >
                <HelpCircle className="w-4 h-4" /> HOW TO PLAY
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center relative z-20">
            <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-sky-600/30 to-blue-500/10 border border-sky-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(56,189,248,0.3)] animate-pulse">
              <Globe className="w-40 h-40 text-sky-400/90" />
            </div>
          </div>

          {showHowToPlay && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-900 border border-sky-500/50 p-6 rounded-2xl space-y-4 shadow-2xl relative">
                <button onClick={() => setShowHowToPlay(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-sky-300">How to Play Odyssey</h3>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong>Config:</strong> Select your solar system target destination.</li>
                  <li><strong>Simulation:</strong> Watch your 3D rocket travel towards realistic Earth and colorful planets.</li>
                  <li><strong>Controls:</strong> Use <strong>THRUST</strong> and <strong>SHIELD</strong> during flight.</li>
                  <li><strong>Success:</strong> Reach orbit successfully to earn your official NASA ranking!</li>
                </ul>
                <button onClick={() => setShowHowToPlay(false)} className="w-full py-2.5 rounded-xl bg-sky-400 text-slate-950 font-bold text-xs uppercase">
                  GOT IT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === 'CONFIG' && (
        <div className="flex-grow max-w-6xl mx-auto p-6 space-y-6 w-full my-auto z-10 overflow-y-auto">
          <div className="flex justify-between items-center border-b border-sky-500/40 pb-4 bg-slate-900/90 px-5 py-3 rounded-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-sky-300">SOLAR SYSTEM MISSION CONFIGURATION</h2>
            <button onClick={() => { audio.playClick(); setScreen('DASHBOARD'); }} className="text-xs text-sky-400 underline">← Back</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/90 border border-sky-500/30 p-5 rounded-2xl space-y-4 backdrop-blur-md">
              <h3 className="text-sm font-bold text-sky-400 uppercase">Target Destination (Planets)</h3>
              {TARGETS.map(t => (
                <div
                  key={t.id}
                  onClick={() => { audio.playClick(); setSelectedTarget(t); }}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${selectedTarget.id === t.id ? 'border-sky-400 bg-sky-950/80 shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'border-slate-800 bg-slate-950/80'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full shadow-md" style={{ backgroundColor: t.color }} />
                    <div>
                      <div className="font-bold text-sm text-white">{t.name}</div>
                      <div className="text-[11px] text-sky-400 mt-0.5">{t.distance} | {t.pdsSource}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/90 border border-sky-500/30 p-5 rounded-2xl space-y-3 backdrop-blur-md">
              <h3 className="text-sm font-bold text-purple-400 uppercase">Scientific Payload Modules</h3>
              <div className="text-xs text-slate-400 mb-2">Total Mass: <strong className="text-purple-300">{totalPayloadWeight} kg</strong></div>
              {AVAILABLE_INSTRUMENTS.map(inst => {
                const IconComp = inst.icon;
                const isSelected = selectedInstruments.includes(inst.id);
                return (
                  <div
                    key={inst.id}
                    onClick={() => toggleInstrument(inst.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex justify-between items-center ${isSelected ? 'border-purple-400 bg-purple-950/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-slate-800 bg-slate-950/80'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className={`w-4 h-4 ${isSelected ? 'text-purple-300' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">{inst.name}</div>
                        <div className="text-[10px] text-slate-400">{inst.weight} kg | {inst.power}W</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {isSelected ? 'ON' : 'OFF'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900/90 border border-sky-500/30 p-5 rounded-2xl space-y-3 backdrop-blur-md">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">Resource Trade-offs</h3>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Fuel</span><span className="text-sky-300">{fuelInput}%</span></div>
                <input type="range" min="40" max="100" value={fuelInput} onChange={e => setFuelInput(Number(e.target.value))} className="w-full accent-sky-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Energy</span><span className="text-emerald-300">{energyInput}%</span></div>
                <input type="range" min="40" max="100" value={energyInput} onChange={e => setEnergyInput(Number(e.target.value))} className="w-full accent-emerald-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Shielding</span><span className="text-amber-300">{shieldInput}%</span></div>
                <input type="range" min="30" max="100" value={shieldInput} onChange={e => setShieldInput(Number(e.target.value))} className="w-full accent-amber-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>DSN Bandwidth</span><span className="text-sky-300">{dsnInput} Mbps</span></div>
                <input type="range" min="10" max="200" step="10" value={dsnInput} onChange={e => setDsnInput(Number(e.target.value))} className="w-full accent-sky-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Launch Azimuth (Debris)</span><span className="text-purple-300">{launchAzimuth}° ({debrisRisk.level})</span></div>
                <input type="range" min="0" max="360" value={launchAzimuth} onChange={e => setLaunchAzimuth(Number(e.target.value))} className="w-full accent-purple-400" />
              </div>
            </div>
          </div>

          <button
            onClick={launchMission}
            className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-lg tracking-wider shadow-[0_0_25px_rgba(56,189,248,0.4)]"
          >
            🚀 ENGAGE SOLAR SYSTEM MISSION SIMULATION
          </button>
        </div>
      )}

      {screen === 'SIMULATION' && (
        <div className="flex-grow flex flex-col p-4 gap-4 max-w-7xl mx-auto w-full z-10">
          <div className="relative bg-slate-950 border-2 border-sky-500/50 rounded-3xl overflow-hidden h-[420px] w-full shadow-[0_0_40px_rgba(56,189,248,0.3)] flex">
            
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-slate-950/85 p-3 rounded-2xl border border-sky-500/30 backdrop-blur-md">
              <div className="text-[10px] text-sky-400 font-mono">TARGET: <strong className="text-white">{selectedTarget.name.split(' ')[0]}</strong></div>
              <div className="text-[10px] text-sky-400 font-mono">PAYLOAD kg: <strong className="text-white">{totalPayloadWeight}</strong></div>
              <div className="text-[10px] text-sky-400 font-mono">AZIMUTH: <strong className="text-white">{launchAzimuth}°</strong></div>
              <div className="text-[10px] text-sky-400 font-mono">SHIELD: <strong className="text-emerald-400">{shieldInput}%</strong></div>
            </div>

            <div className="absolute top-4 right-4 z-20 flex gap-3 bg-slate-950/85 px-4 py-3 rounded-2xl border border-sky-500/30 backdrop-blur-md">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400">Fuel</span>
                <div className="w-2 h-24 bg-slate-900 rounded-full overflow-hidden"><div className="w-full bg-sky-400" style={{ height: `${fuel}%` }} /></div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400">Energy</span>
                <div className="w-2 h-24 bg-slate-900 rounded-full overflow-hidden"><div className="w-full bg-emerald-400" style={{ height: `${energy}%` }} /></div>
              </div>
            </div>

            <Canvas camera={{ position: [0, 3, 10], fov: 50 }}>
              <SpaceScene target={selectedTarget} progress={progress} deviation={deviation} fuel={fuel} isRunning={!outcome} />
            </Canvas>

            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
              <div className="flex gap-4 pointer-events-auto">
                <button onClick={correctCourse} className="w-20 h-20 rounded-full bg-slate-950/90 border-2 border-sky-400 flex flex-col items-center justify-center text-[11px] font-extrabold text-sky-300 hover:bg-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.5)]">
                  <Navigation className="w-5 h-5 mb-1" /> THRUST
                </button>
                <button onClick={() => setDeviation(0)} className="w-16 h-16 rounded-full bg-slate-950/90 border-2 border-amber-400 flex flex-col items-center justify-center text-[10px] font-bold text-amber-300 hover:bg-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                  <Shield className="w-4 h-4 mb-1" /> SHIELD
                </button>
              </div>

              <div className="pointer-events-auto">
                <button onClick={() => { audio.stopEngine(); setScreen('CONFIG'); }} className="px-5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-500/40 text-xs font-bold text-sky-300 hover:bg-slate-800">
                  RECONFIGURE
                </button>
              </div>
            </div>

            {outcome && (
              <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6">
                <div className={`max-w-md w-full p-6 rounded-3xl border-2 text-center space-y-4 ${outcome === 'SUCCESS' ? 'bg-slate-900 border-emerald-500' : 'bg-slate-900 border-rose-500'}`}>
                  {outcome === 'SUCCESS' ? (
                    <>
                      <Award className="w-12 h-12 text-emerald-400 mx-auto" />
                      <h2 className="text-xl font-bold text-emerald-300">MISSION SUCCESSFUL!</h2>
                      <div className="py-1 px-3 rounded-xl border border-emerald-500 text-xs font-bold text-emerald-300 inline-block">
                        RANK: {getRank(efficiencyScore)}
                      </div>
                      <div className="text-3xl font-extrabold text-white font-mono">{efficiencyScore} / 100</div>
                      {nasaImage && <img src={nasaImage} alt="NASA APOD" className="w-full h-32 object-cover rounded-xl border border-slate-700" />}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
                      <h2 className="text-xl font-bold text-rose-300">{alertBox?.title}</h2>
                      <p className="text-xs text-slate-300">{alertBox?.reason}</p>
                    </>
                  )}
                  <button onClick={() => setScreen('CONFIG')} className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm">
                    NEW MISSION
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}