import React from 'react';

interface CyberBackgroundProps {
  theme?: 'dark' | 'light';
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-[#f8fafc]' : 'bg-[#08060f]'
      }`}
    >
      {/* Lightweight hardware-accelerated ambient gradients (No canvas, No heavy JS loops) */}
      {isLight ? (
        <>
          {/* Light Mode Soft Radial Accents */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] rounded-full pointer-events-none opacity-60"
            style={{
              background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 80%)',
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[600px] h-[320px] rounded-full pointer-events-none opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)',
            }}
          />
          {/* Subtle Clean Grid in Light Mode */}
          <div
            className="absolute inset-0 opacity-[0.4] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(100, 116, 139, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.07) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </>
      ) : (
        <>
          {/* Dark Mode Deep Radial Accents */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.06) 50%, transparent 80%)',
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)',
            }}
          />
          {/* Subtle Deep Cyber Grid */}
          <div
            className="absolute inset-0 opacity-[0.25] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(147, 51, 234, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </>
      )}
    </div>
  );
};
