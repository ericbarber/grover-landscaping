export function GroverBrand({ className = '' }: { className?: string }) {
  return (
    <span className={`grover-brand ${className}`}>
      <svg aria-hidden="true" className="grover-brand-mark" viewBox="0 0 32 32">
        <path d="M6 23C7 11 15 4 27 4c0 12-7 21-19 22" />
        <path d="M7 25c5-7 10-12 18-18" />
      </svg>
      <span>Grover</span>
    </span>
  );
}
