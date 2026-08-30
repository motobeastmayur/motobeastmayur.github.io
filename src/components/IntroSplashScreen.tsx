import React, { useState, useEffect, useRef } from 'react';
import { FastForward } from 'lucide-react';

const MOBILE_INTRO_URL =
  'https://res.cloudinary.com/dhvsei89/video/upload/v1788086577/mobile-intro.mp4.mp4';
const DESKTOP_INTRO_URL =
  'https://res.cloudinary.com/dhvsei89/video/upload/v1788086579/desktop-intro.mp4.mp4';

interface IntroSplashScreenProps {
  onComplete?: () => void;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const dynamicFallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = () => {
    if (isFadingOut || !isVisible) return;
    setIsFadingOut(true);

    if (dynamicFallbackTimerRef.current) {
      clearTimeout(dynamicFallbackTimerRef.current);
      dynamicFallbackTimerRef.current = null;
    }

    // Allow 700ms for smooth CSS opacity transition to complete
    fadeoutTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 700);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      if (dynamicFallbackTimerRef.current) {
        clearTimeout(dynamicFallbackTimerRef.current);
      }
      // Calculate dynamic timeout based on exact duration + 1000ms buffer
      const durationMs = Math.ceil(video.duration * 1000) + 1000;
      dynamicFallbackTimerRef.current = setTimeout(() => {
        handleClose();
      }, durationMs);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    // Explicitly attempt programmatic play on mount for strict browser policies
    const playPromises: Promise<void>[] = [];
    if (mobileVideoRef.current) {
      mobileVideoRef.current.muted = true;
      const p = mobileVideoRef.current.play();
      if (p !== undefined) playPromises.push(p);
    }
    if (desktopVideoRef.current) {
      desktopVideoRef.current.muted = true;
      const p = desktopVideoRef.current.play();
      if (p !== undefined) playPromises.push(p);
    }

    Promise.allSettled(playPromises).then(() => {
      // Autoplay handled
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (dynamicFallbackTimerRef.current) clearTimeout(dynamicFallbackTimerRef.current);
      if (fadeoutTimerRef.current) clearTimeout(fadeoutTimerRef.current);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="intro-splash-screen"
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Mobile Video (< 768px) */}
      <video
        ref={mobileVideoRef}
        id="mobile-intro-video"
        className={`w-full h-full object-cover absolute inset-0 ${
          isMobile ? 'block' : 'hidden'
        }`}
        src={MOBILE_INTRO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        style={{ objectFit: 'cover' }}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleClose}
        onError={() => {
          console.log('[Intro] Mobile video stream error, fallback active.');
        }}
      />

      {/* Desktop Video (>= 768px) */}
      <video
        ref={desktopVideoRef}
        id="desktop-intro-video"
        className={`w-full h-full object-cover absolute inset-0 ${
          !isMobile ? 'block' : 'hidden'
        }`}
        src={DESKTOP_INTRO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        style={{ objectFit: 'cover' }}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleClose}
        onError={() => {
          console.log('[Intro] Desktop video stream error, fallback active.');
        }}
      />

      {/* Futuristic Scanline & Cyber Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-black/20 to-black/80" />

      {/* Glowing Neon Skip Intro Button */}
      <button
        id="skip-intro-button"
        onClick={handleClose}
        type="button"
        className="absolute top-4 right-4 z-50 px-4 py-2 rounded-full border border-[#00f3ff]/60 bg-black/75 backdrop-blur-md text-[#00f3ff] text-xs font-mono uppercase tracking-widest hover:bg-[#00f3ff]/20 hover:border-[#00f3ff] hover:shadow-[0_0_20px_rgba(0,243,255,0.7)] active:scale-95 transition-all duration-300 flex items-center gap-2 group cursor-pointer shadow-[0_0_10px_rgba(0,243,255,0.3)]"
      >
        <span>Skip Intro</span>
        <FastForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#00f3ff]" />
      </button>

      {/* Creator Brand Tag Watermark */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <span className="text-[11px] font-mono tracking-widest text-[#00f3ff]/70 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)] uppercase">
          AI Architecture &bull; Mayur B Sannakki
        </span>
      </div>
    </div>
  );
};
