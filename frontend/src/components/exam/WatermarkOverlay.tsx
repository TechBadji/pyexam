const REPEAT = 48;

export default function WatermarkOverlay({
  name,
  studentNumber,
}: {
  name: string;
  studentNumber: string | null;
}) {
  const label = studentNumber ? `${name} · ${studentNumber}` : name;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 15 }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          inset: "-60%",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0 48px",
          transform: "rotate(-28deg)",
          opacity: 0.07,
          alignContent: "space-around",
        }}
      >
        {Array.from({ length: REPEAT }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#3730a3",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
              padding: "28px 0",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
