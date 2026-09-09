export default function CertifCampLogo({
  size = 40,
  tone = "seal",
}: {
  size?: number;
  tone?: "seal" | "light";
}) {
  const light = tone === "light";
  const tile = light ? "#ffffff" : "#8e2a63";
  const back = light ? "#ca6e9f" : "#e2c179";
  const front = light ? "#8e2a63" : "#ffffff";

  const C = "M31.43 24.34A10 10 0 1031.43 39.66";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="CertifCamp"
    >
      <rect width="64" height="64" rx="16" fill={tile} />
      <path
        d="M45.43 24.34A10 10 0 1045.43 39.66"
        stroke={back}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* knocked out in the tile colour so the two C's stay distinct at 18px */}
      <path d={C} stroke={tile} strokeWidth="10" strokeLinecap="round" />
      <path d={C} stroke={front} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
