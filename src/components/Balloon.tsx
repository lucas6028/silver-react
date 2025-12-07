export const Balloon = ({ color, size = 24, className = "" }: { color: string; size?: number; className?: string }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 24 32" fill="none" className={`drop-shadow-sm ${className}`}>
    {/* String */}
    <path d="M12 24V30" stroke="#999" strokeWidth="1.5" />
    <path d="M12 24L10 26M12 24L14 26" stroke="#999" strokeWidth="1.5" />
    {/* Balloon Body */}
    <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill={color} />
    {/* Shine */}
    <ellipse cx="8" cy="8" rx="3" ry="4" fill="white" fillOpacity="0.3" transform="rotate(-30 8 8)" />
  </svg>
);
