import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Lightformer, Sparkles, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage, LANGUAGE_OPTIONS, AppLanguage } from '../context/LanguageContext.tsx';
import { PRODUCT_IMAGE_MAP } from '../utils/productImages.ts';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Store,
  Image as ImageIcon,
  ShoppingBag,
  ScanBarcode,
  PackageCheck,
  Globe
} from 'lucide-react';

export interface StorePhotoItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export const STORE_BACKGROUND_PHOTOS: StorePhotoItem[] = [
  {
    id: 'interior',
    title: 'Supermarket Storefront',
    subtitle: 'Main Retail Aisle & Shelving',
    badge: 'STORE FLOOR',
    url: '/src/assets/images/retail_store_interior_1794242047222.jpg',
    position: [-4.4, 1.85, -2.3],
    rotation: [0.06, 0.28, -0.04]
  },
  {
    id: 'pos-counter',
    title: 'POS Billing & UPI Counter',
    subtitle: 'Barcode Scanner & Instant QR',
    badge: 'POS TERMINAL',
    url: '/src/assets/images/pos_checkout_counter_1794242048129.jpg',
    position: [4.4, 1.8, -2.4],
    rotation: [0.05, -0.28, 0.04]
  },
  {
    id: 'grocery-aisle',
    title: 'FMCG & Grocery Racks',
    subtitle: 'Organized Multi-Category Stock',
    badge: 'RETAIL AISLE',
    url: '/src/assets/images/grocery_aisle_display_1794242048756.jpg',
    position: [-4.3, -1.55, -2.1],
    rotation: [-0.05, 0.25, 0.03]
  },
  {
    id: 'warehouse',
    title: 'Smart Stock & Barcode Hub',
    subtitle: 'Real-Time Inventory Deduction',
    badge: 'STOCKROOM',
    url: '/src/assets/images/store_warehouse_inventory_1794242049393.jpg',
    position: [4.3, -1.55, -2.2],
    rotation: [-0.05, -0.25, -0.03]
  }
];

export const LISTED_STORE_PRODUCTS_SHOWCASE = [
  { id: 'prod-1', name: 'Aashirvaad Atta 5kg', price: '₹340', url: PRODUCT_IMAGE_MAP['prod-1'] },
  { id: 'prod-2', name: 'Amul Cow Ghee 1L', price: '₹645', url: PRODUCT_IMAGE_MAP['prod-2'] },
  { id: 'prod-3', name: 'Fortune Sunlite Oil 1L', price: '₹145', url: PRODUCT_IMAGE_MAP['prod-3'] },
  { id: 'prod-4', name: 'Tata Salt 1kg', price: '₹28', url: PRODUCT_IMAGE_MAP['prod-4'] },
  { id: 'prod-5', name: 'India Gate Basmati 5kg', price: '₹499', url: PRODUCT_IMAGE_MAP['prod-5'] },
  { id: 'prod-6', name: 'Cadbury Silk 150g', price: '₹180', url: PRODUCT_IMAGE_MAP['prod-6'] },
  { id: 'prod-7', name: 'Amul Taaza Milk 1L', price: '₹56', url: PRODUCT_IMAGE_MAP['prod-7'] },
  { id: 'prod-8', name: 'Surf Excel Matic 1L', price: '₹230', url: PRODUCT_IMAGE_MAP['prod-8'] },
  { id: 'prod-9', name: 'Dettol Handwash 750ml', price: '₹119', url: PRODUCT_IMAGE_MAP['prod-9'] },
  { id: 'prod-10', name: 'Maggi Noodles 420g', price: '₹96', url: PRODUCT_IMAGE_MAP['prod-10'] },
  { id: 'prod-11', name: 'Nescafe Classic 100g', price: '₹320', url: PRODUCT_IMAGE_MAP['prod-11'] },
  { id: 'prod-12', name: 'Parle-G Gold 1kg', price: '₹90', url: PRODUCT_IMAGE_MAP['prod-12'] },
  { id: 'prod-13', name: 'Colgate Total 150g', price: '₹155', url: PRODUCT_IMAGE_MAP['prod-13'] },
  { id: 'prod-14', name: "Lay's Magic Masala", price: '₹30', url: PRODUCT_IMAGE_MAP['prod-14'] },
  { id: 'prod-15', name: 'Red Bull Can 250ml', price: '₹125', url: PRODUCT_IMAGE_MAP['prod-15'] }
];

// ==============================================================
// 1. FLOATING BACKGROUND GEOMETRIES & 3D STORE PROTOTYPES
// ==============================================================
interface FloatingShapeProps {
  position: [number, number, number];
  rotationSpeed?: [number, number, number];
  color: string;
  metalness?: number;
  roughness?: number;
  type: 'torus' | 'sphere' | 'octahedron' | 'torusKnot';
  scale?: number;
}

const FloatingShape: React.FC<FloatingShapeProps> = ({
  position,
  rotationSpeed = [0.005, 0.008, 0.003],
  color,
  metalness = 0.9,
  roughness = 0.15,
  type,
  scale = 1
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed[0] * delta * 60;
      meshRef.current.rotation.y += rotationSpeed[1] * delta * 60;
      meshRef.current.rotation.z += rotationSpeed[2] * delta * 60;
    }
  });

  return (
    <Float
      speed={2.2}
      rotationIntensity={1.1}
      floatIntensity={1.8}
      floatingRange={[-0.25, 0.25]}
    >
      <mesh ref={meshRef} position={position} scale={scale} castShadow receiveShadow>
        {type === 'torus' && <torusGeometry args={[1.05, 0.3, 32, 64]} />}
        {type === 'sphere' && <sphereGeometry args={[0.95, 48, 48]} />}
        {type === 'octahedron' && <octahedronGeometry args={[1.05, 0]} />}
        {type === 'torusKnot' && <torusKnotGeometry args={[0.8, 0.24, 96, 24]} />}
        <meshPhysicalMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          clearcoat={0.95}
          clearcoatRoughness={0.1}
          reflectivity={1}
          envMapIntensity={2}
        />
      </mesh>
    </Float>
  );
};

// Composite 3D Store Shopping Bag Prototype
const StoreShoppingBagPrototype: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.35 * delta;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1.5}>
      <group ref={groupRef} position={position} scale={0.68}>
        <RoundedBox args={[1.4, 1.6, 0.65]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#10b981"
            metalness={0.65}
            roughness={0.22}
            clearcoat={0.8}
            envMapIntensity={1.8}
          />
        </RoundedBox>
        <RoundedBox args={[1.44, 0.22, 0.68]} radius={0.05} position={[0, 0.72, 0]}>
          <meshPhysicalMaterial color="#059669" metalness={0.8} roughness={0.15} />
        </RoundedBox>
        <mesh position={[0, 0.9, 0.18]}>
          <torusGeometry args={[0.32, 0.045, 16, 32, Math.PI]} />
          <meshPhysicalMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.9, -0.18]}>
          <torusGeometry args={[0.32, 0.045, 16, 32, Math.PI]} />
          <meshPhysicalMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
        </mesh>
        <RoundedBox args={[0.55, 0.35, 0.08]} radius={0.04} position={[0, -0.05, 0.33]}>
          <meshPhysicalMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </RoundedBox>
      </group>
    </Float>
  );
};

// Composite 3D POS Terminal Prototype
const POSTerminalPrototype: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= 0.3 * delta;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={1.4}>
      <group ref={groupRef} position={position} scale={0.7}>
        <RoundedBox args={[1.2, 0.2, 1.0]} radius={0.06} position={[0, -0.65, 0]} castShadow>
          <meshPhysicalMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, -0.25, -0.1]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.2, 0.7, 24]} />
          <meshPhysicalMaterial color="#64748b" metalness={0.9} roughness={0.15} />
        </mesh>
        <group position={[0, 0.22, 0.05]} rotation={[-0.35, 0, 0]}>
          <RoundedBox args={[1.7, 1.15, 0.12]} radius={0.08} castShadow>
            <meshPhysicalMaterial color="#1e293b" metalness={0.8} roughness={0.2} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[1.52, 0.96, 0.04]} radius={0.04} position={[0, 0, 0.06]}>
            <meshPhysicalMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.45}
              roughness={0.1}
              metalness={0.3}
            />
          </RoundedBox>
        </group>
      </group>
    </Float>
  );
};

// ==============================================================
// 2. PURE WEBGL 3D PHOTO SHOWCASE FRAMES (NO NESTED HTML PORTALS)
// ==============================================================
interface FloatingStorePhotoCardProps {
  item: StorePhotoItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  mousePos: { x: number; y: number };
}

const FloatingStorePhotoCard: React.FC<FloatingStorePhotoCardProps> = ({
  item,
  isActive,
  onSelect,
  mousePos
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      item.url,
      loadedTex => {
        if (!isMounted) return;
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTex);
      },
      undefined,
      () => {
        // Fallback silently if texture fails
      }
    );
    return () => {
      isMounted = false;
    };
  }, [item.url]);

  useFrame(() => {
    if (groupRef.current) {
      const targetRotY = item.rotation[1] + mousePos.x * 0.1;
      const targetRotX = item.rotation[0] - mousePos.y * 0.08;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.06);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.06);
    }
  });

  return (
    <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.9} floatingRange={[-0.15, 0.15]}>
      <group
        ref={groupRef}
        position={item.position}
        rotation={item.rotation}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {/* 3D Metallic Frame */}
        <RoundedBox args={[2.5, 1.72, 0.12]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={isActive ? '#3b82f6' : '#1e293b'}
            metalness={0.85}
            roughness={0.2}
            clearcoat={0.9}
          />
        </RoundedBox>

        {/* WebGL Textured Store / Product Photo Surface */}
        <mesh position={[0, 0, 0.065]}>
          <planeGeometry args={[2.28, 1.5]} />
          {texture ? (
            <meshBasicMaterial map={texture} toneMapped={false} />
          ) : (
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          )}
        </mesh>

        {/* Active Glow Rim */}
        {isActive && (
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[2.65, 1.86]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.35} />
          </mesh>
        )}
      </group>
    </Float>
  );
};

// ==============================================================
// 3. 3D GLASSMORPHISM CARD IN WEBGL CANVAS
// ==============================================================
interface GlassCardProps {
  mousePos: { x: number; y: number };
}

const GlassSignInCardMesh: React.FC<GlassCardProps> = ({ mousePos }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      const targetRotX = -mousePos.y * 0.14;
      const targetRotY = mousePos.x * 0.16;
      const targetPosX = mousePos.x * 0.22;
      const targetPosY = mousePos.y * 0.22;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.08);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.08);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosX, 0.08);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosY, 0.08);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.15, 0]}>
      {/* 3D Glass Object with meshPhysicalMaterial: transmission=1, roughness=0.2, thickness=1.4 */}
      <RoundedBox
        args={[4.6, 5.8, 0.28]}
        radius={0.35}
        smoothness={6}
        receiveShadow
        castShadow
        position={[0, 0, 0]}
      >
        <meshPhysicalMaterial
          transmission={1}
          roughness={0.2}
          thickness={1.4}
          ior={1.52}
          transparent={true}
          opacity={0.96}
          color="#ffffff"
          attenuationColor="#60a5fa"
          attenuationDistance={1.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2.2}
          reflectivity={0.9}
        />
      </RoundedBox>

      {/* Decorative Inner Glow Bezel */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[4.5, 5.7, 0.04]} />
        <meshStandardMaterial
          color="#93c5fd"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </group>
  );
};

// ==============================================================
// 4. MAIN CINEMATIC 3D SCENE WITH STORE & PRODUCT PHOTOS
// ==============================================================
export const LockScreen: React.FC = () => {
  const { login, unlockScreen, securityConfig, updateSecurityConfig, switchRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activePhotoId, setActivePhotoId] = useState<string>('interior');
  const [customBackdropUrl, setCustomBackdropUrl] = useState<string | null>(null);
  const [customBackdropTitle, setCustomBackdropTitle] = useState<string | null>(null);

  // Interactive Sign-In form states
  const [authMode, setAuthMode] = useState<'email' | 'pin' | 'setpin'>('pin');
  const [loginRole, setLoginRole] = useState<'admin' | 'cashier'>('admin');
  const [email, setEmail] = useState('admin@businesspos.com');
  const [password, setPassword] = useState('admin123');
  const [pin, setPin] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pinUpdateMessage, setPinUpdateMessage] = useState<string | null>(null);

  const activePhoto =
    STORE_BACKGROUND_PHOTOS.find(p => p.id === activePhotoId) || STORE_BACKGROUND_PHOTOS[0];

  const backdropUrl = customBackdropUrl || activePhoto.url;
  const backdropTitle = customBackdropTitle || activePhoto.title;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setMousePos({ x, y });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSuccess(true);
      await login({ email: email.trim(), password });
      switchRole(loginRole);
    } catch (err: any) {
      setSuccess(false);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinDigit = async (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setLoading(true);
        setError(null);
        const ok = await unlockScreen(newPin);
        setLoading(false);
        if (!ok) {
          setError(`Invalid PIN code. ${securityConfig.pinHint || 'Default is 1234.'}`);
          setPin('');
        } else {
          switchRole(loginRole);
          setSuccess(true);
        }
      }
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPinUpdateMessage(null);
    try {
      await updateSecurityConfig({
        currentPin: currentPinInput || '1234',
        newPin: newPinInput
      });
      setPinUpdateMessage('New Dukandar Security PIN saved! Use it to unlock.');
      setCurrentPinInput('');
      setNewPinInput('');
      setTimeout(() => {
        setAuthMode('pin');
        setPinUpdateMessage(null);
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Could not update PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      className="fixed inset-0 z-50 bg-[#050811] overflow-hidden select-none"
    >
      {/* Full-Bleed Store Photography Background Layer with Spatial Parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={backdropUrl}
          alt={backdropTitle}
          referrerPolicy="no-referrer"
          style={{
            transform: `scale(1.08) translate3d(${-mousePos.x * 18}px, ${mousePos.y * 14}px, 0)`
          }}
          className="w-full h-full object-cover transition-transform duration-300 ease-out opacity-55"
        />
        {/* Cinematic Dark Studio Vignette & Radial Lighting Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/50 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(5,8,17,0.85)_100%)]" />
      </div>

      {/* Top Store Showcase Badge + Language Switcher */}
      <div className="absolute top-3 left-4 right-4 sm:left-6 sm:right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5 bg-slate-950/80 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white backdrop-blur-md pointer-events-none">
          <Store className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="font-bold tracking-tight block leading-none">
              Shree Ganesh Supermarket & Retail
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Active Backdrop: {backdropTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Interactive Language Switcher on 3D Sign-In Screen */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 border border-white/20 px-2.5 py-1.5 rounded-xl text-xs text-white backdrop-blur-md shadow-lg">
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as AppLanguage)}
              aria-label="Change Language"
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
                  {opt.nativeLabel} ({opt.label})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 border border-white/15 px-3.5 py-2 rounded-xl text-[11px] text-slate-300 backdrop-blur-md pointer-events-none">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dukandar PIN Lock Active</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <ScanBarcode className="w-3.5 h-3.5 text-blue-400" />
              <span>Barcode & UPI POS</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Khata & Stock</span>
            </span>
          </div>
        </div>
      </div>

      {/* Three.js React Fiber 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 8.2], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15
        }}
        className="w-full h-full relative z-0"
      >
        {/* Studio & Ambient Lighting with cool blue/purple tint */}
        <ambientLight intensity={0.7} color="#c7d2fe" />

        {/* Studio Key PointLight with cool blue/purple tint casting soft shadows */}
        <pointLight
          position={[5, 4, 4]}
          intensity={55}
          color="#818cf8"
          castShadow
          shadow-bias={-0.0005}
          shadow-mapSize={[1024, 1024]}
        />

        {/* Soft cyan rim fill light */}
        <pointLight position={[-5, -3, 3]} intensity={40} color="#38bdf8" />

        {/* Top directional accent light */}
        <directionalLight position={[0, 8, 2]} intensity={1.3} color="#ffffff" />

        {/* Local procedural studio Environment map — zero external network requests */}
        <Suspense fallback={null}>
          <Environment resolution={128}>
            <group rotation={[-Math.PI / 3, 0, 1]}>
              <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
              <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
              <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
              <Lightformer form="rect" intensity={2.5} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[10, 2, 1]} color="#60a5fa" />
            </group>
          </Environment>
        </Suspense>

        {/* Subtle cinematic space dust particles */}
        <Sparkles count={40} scale={13} size={2.2} speed={0.35} color="#93c5fd" />

        {/* Floating 3D Store Photo Showcase Frames in the Background */}
        {STORE_BACKGROUND_PHOTOS.map(item => (
          <FloatingStorePhotoCard
            key={item.id}
            item={item}
            isActive={!customBackdropUrl && activePhotoId === item.id}
            onSelect={id => {
              setCustomBackdropUrl(null);
              setCustomBackdropTitle(null);
              setActivePhotoId(id);
            }}
            mousePos={mousePos}
          />
        ))}

        {/* 3D Store Prototypes (Shopping Bag & POS Terminal) */}
        <StoreShoppingBagPrototype position={[-2.8, 2.55, -3.2]} />
        <POSTerminalPrototype position={[2.8, 2.55, -3.2]} />

        {/* 4 Floating Metallic / Iridescent Background Geometries */}
        <FloatingShape
          position={[-3.2, 0.2, -3.4]}
          rotationSpeed={[0.006, 0.009, 0.004]}
          color="#6366f1"
          metalness={0.92}
          roughness={0.12}
          type="torus"
          scale={0.75}
        />

        <FloatingShape
          position={[3.2, 0.1, -3.5]}
          rotationSpeed={[-0.005, 0.008, 0.006]}
          color="#06b6d4"
          metalness={0.95}
          roughness={0.08}
          type="torusKnot"
          scale={0.68}
        />

        <FloatingShape
          position={[2.7, -2.5, -3.2]}
          rotationSpeed={[0.007, -0.006, 0.005]}
          color="#a855f7"
          metalness={0.88}
          roughness={0.18}
          type="sphere"
          scale={0.72}
        />

        <FloatingShape
          position={[-2.7, -2.5, -3.0]}
          rotationSpeed={[0.008, 0.007, -0.005]}
          color="#3b82f6"
          metalness={0.95}
          roughness={0.15}
          type="octahedron"
          scale={0.78}
        />

        {/* 3D Glassmorphism Card Mesh in the center */}
        <GlassSignInCardMesh mousePos={mousePos} />
      </Canvas>

      {/* Spatial 3D-Synced Functional Sign-In Card Overlay (Aligned with the 3D Glass Card) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 pb-16">
        <div
          style={{
            transform: `perspective(1000px) rotateX(${mousePos.y * 7}deg) rotateY(${mousePos.x * 8}deg) translate3d(${mousePos.x * 12}px, ${-mousePos.y * 12}px, 0)`
          }}
          className="pointer-events-auto w-[370px] sm:w-[400px] p-5 sm:p-6 text-white font-sans antialiased text-left rounded-3xl bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.65)] transition-transform duration-150 ease-out"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>BusinessPOS</span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                    Dukandar Lock
                  </span>
                </h1>
                <p className="text-[11px] text-slate-300">{t('auth_subtitle', 'Retail Inventory & POS System')}</p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Access Mode Selector: Dukandar (Owner) vs Staff / Cashier */}
          <div className="grid grid-cols-2 gap-1.5 mt-3 p-1 bg-slate-900/90 rounded-xl border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setLoginRole('admin')}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                loginRole === 'admin'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dukandar (Owner)
            </button>
            <button
              type="button"
              onClick={() => setLoginRole('cashier')}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                loginRole === 'cashier'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff / Cashier (Locked)
            </button>
          </div>

          {/* Auth Method Switcher */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10 my-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                authMode === 'pin'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t('auth_pin_tab', 'PIN Unlock')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                authMode === 'email'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t('auth_email_tab', 'Email')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('setpin');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                authMode === 'setpin'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Set PIN</span>
            </button>
          </div>

          {/* Feedback error */}
          {error && (
            <div className="mb-3 p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Feedback success */}
          {(success || pinUpdateMessage) && (
            <div className="mb-3 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{pinUpdateMessage || 'Verified! Opening terminal...'}</span>
            </div>
          )}

          {/* MODE 1: EMAIL SIGN IN */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth_email_label', 'Email Address')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@store.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    {t('auth_password_label', 'Password')}
                  </label>
                  <span className="text-[10px] text-blue-400 font-mono">Demo: admin123</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? t('auth_authenticating', 'Authenticating...') : t('auth_signin_btn', 'Sign In to Store')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
              </button>
            </form>
          )}

          {/* MODE 2: QUICK PIN KEYPAD */}
          {authMode === 'pin' && (
            <div className="space-y-2.5 text-center">
              <p className="text-xs text-slate-300">{t('auth_enter_pin', 'Enter 4-digit Store Owner PIN')}</p>

              <div className="flex justify-center gap-3 py-1">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      pin.length > idx
                        ? 'bg-blue-400 border-blue-400 shadow-md shadow-blue-400/50 scale-110'
                        : 'border-white/30 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                  <button
                    key={k}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (k === 'C') setPin('');
                      else if (k === '⌫') setPin(pin.slice(0, -1));
                      else handlePinDigit(k);
                    }}
                    className="h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-blue-600/60 text-white font-mono font-bold text-sm transition-all border border-white/10 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                {securityConfig.hasCustomPin ? (
                  <span>Hint: <strong className="font-mono text-emerald-300">{securityConfig.pinHint || 'Custom PIN set'}</strong></span>
                ) : (
                  <span>Default PIN: <strong className="font-mono text-blue-300">1234</strong></span>
                )}
              </div>
            </div>
          )}

          {/* MODE 3: SET / CHANGE DUKANDAR PIN DIRECTLY ON LOCK SCREEN */}
          {authMode === 'setpin' && (
            <form onSubmit={handleChangePinSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Current PIN (Default: 1234)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={currentPinInput}
                  onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter current PIN (e.g. 1234)"
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/15 rounded-xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Set New 4-Digit Dukandar PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new 4-digit PIN"
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/15 rounded-xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || newPinInput.length < 4}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {loading ? 'Saving PIN...' : 'Save New Dukandar PIN'}
              </button>
            </form>
          )}

          {/* Security badge footer */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dukandar Security Shield</span>
            </span>
            <span className="font-mono">
              {loginRole === 'cashier' ? 'Staff Restricted Mode' : 'Owner Full Access'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Dock: Store Backdrops + All 15 Listed Store Products */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 w-[96vw] max-w-6xl bg-slate-950/85 border border-white/15 rounded-2xl px-3.5 py-2 shadow-2xl backdrop-blur-md space-y-1.5">
        {/* Row 1: Store Backdrop Switcher */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t('auth_store_backdrops', 'Store Backdrops:')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {STORE_BACKGROUND_PHOTOS.map(photo => {
              const isSelected = !customBackdropUrl && activePhotoId === photo.id;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    setCustomBackdropUrl(null);
                    setCustomBackdropTitle(null);
                    setActivePhotoId(photo.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded object-cover"
                  />
                  <span>{photo.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: All 15 Listed Store Products Photo Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 pr-1">
            {t('auth_listed_items', 'Listed Items (15):')}
          </span>
          {LISTED_STORE_PRODUCTS_SHOWCASE.map(prod => {
            const isSelected = customBackdropUrl === prod.url;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => {
                  setCustomBackdropUrl(prod.url);
                  setCustomBackdropTitle(`${prod.name} (${prod.price})`);
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600/30 border-emerald-400 text-white'
                    : 'bg-slate-900/90 border-white/10 hover:border-white/30 text-slate-200'
                }`}
                title={`Preview ${prod.name} on Backdrop`}
              >
                <img
                  src={prod.url}
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded object-cover shrink-0 border border-white/15"
                />
                <div className="leading-tight">
                  <div className="text-[10px] font-semibold truncate max-w-[95px]">{prod.name}</div>
                  <div className="text-[9px] font-mono text-emerald-400">{prod.price}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
