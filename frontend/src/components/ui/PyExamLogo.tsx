export default function PyExamLogo({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PyExam logo"
    >
      <rect width="64" height="64" rx="16" fill="#4f46e5" />
      <polygon points="32,11 53,22 32,33 11,22" fill="white" opacity="0.95" />
      <path
        d="M21 28 L21 39 Q21 43 25 44 L39 44 Q43 44 43 39 L43 28 Z"
        fill="white"
        opacity="0.85"
      />
      <line x1="53" y1="22" x2="53" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="53" cy="40" r="3" fill="white" opacity="0.9" />
    </svg>
  );
}
