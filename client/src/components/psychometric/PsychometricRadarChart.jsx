import React from "react";

/**
 * Self-contained SVG Radar / Spider Chart component.
 * Renders concentric grid rings, polar axes, gradient polygon fill, data point markers, and trait labels.
 */
export default function PsychometricRadarChart({ data = [], size = 320 }) {
  if (!data || data.length < 3) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-xs text-ink-soft italic">
        Need at least 3 traits to render radar visualization.
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = cx - 50; // Leave space for labels
  const total = data.length;
  const angleStep = (Math.PI * 2) / total;

  // Compute 2D Cartesian point from polar coordinates
  const getCoordinates = (index, valuePercent) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top 12 o'clock
    const r = (valuePercent / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Grid Rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Polygon points string for candidate data
  const dataPoints = data.map((d, i) => getCoordinates(i, d.percentage || 0));
  const polygonPointsStr = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible font-body">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent, #6366f1)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-accent, #6366f1)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Concentric Grid Rings */}
        {rings.map((ringScale, ringIdx) => {
          const ringPoints = data
            .map((_, i) => getCoordinates(i, ringScale * 100))
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" ");

          return (
            <polygon
              key={ringIdx}
              points={ringPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={ringScale === 1.0 ? "1.5" : "1"}
              strokeDasharray={ringScale < 1.0 ? "3,3" : undefined}
            />
          );
        })}

        {/* Polar Axes Lines */}
        {data.map((_, i) => {
          const outerPt = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Candidate Score Polygon */}
        <polygon
          points={polygonPointsStr}
          fill="url(#radarGradient)"
          stroke="var(--color-accent, #6366f1)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data Point Dots */}
        {dataPoints.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="4" fill="var(--color-accent, #6366f1)" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        ))}

        {/* Trait Labels around perimeter */}
        {data.map((d, i) => {
          const labelPt = getCoordinates(i, 115); // Offset outside outer ring
          let textAnchor = "middle";
          if (labelPt.x > cx + 10) textAnchor = "start";
          else if (labelPt.x < cx - 10) textAnchor = "end";

          return (
            <text
              key={i}
              x={labelPt.x}
              y={labelPt.y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="text-[11px] font-semibold font-body"
              fill="#334155"
            >
              {d.name} ({d.percentage}%)
            </text>
          );
        })}
      </svg>
    </div>
  );
}
