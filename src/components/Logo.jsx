export default function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 512 512" className={`flex-shrink-0 drop-shadow-md text-brand-500 ${className}`}>
      <defs>
        <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <path d="M112,48 h288 c35.35,0 64,28.65 64,64 v224 c0,35.35 -28.65,64 -64,64 h-80 l-64,64 v-64 h-144 c-35.35,0 -64,-28.65 -64,-64 v-224 c0,-35.35 28.65,-64 64,-64 z" fill="url(#brand-gradient)" />
      <path d="M256,144 l-80,80 h32 v80 h32 v-48 h32 v48 h32 v-80 h32 z" fill="#ffffff" />
    </svg>
  );
}
