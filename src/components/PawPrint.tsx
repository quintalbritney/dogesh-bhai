export default function PawPrint({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="32" cy="42" rx="14" ry="12" />
      <ellipse cx="14" cy="24" rx="7" ry="9" transform="rotate(-20 14 24)" />
      <ellipse cx="50" cy="24" rx="7" ry="9" transform="rotate(20 50 24)" />
      <ellipse cx="24" cy="12" rx="6" ry="8" transform="rotate(-8 24 12)" />
      <ellipse cx="40" cy="12" rx="6" ry="8" transform="rotate(8 40 12)" />
    </svg>
  );
}
