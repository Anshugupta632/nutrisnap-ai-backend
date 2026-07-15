function ThaliRing({ protein = 0, carbs = 0, fats = 0 }) {
  // Ring ki basic measurements
  const size = 280;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Har segment ko ring ka 1/3 hissa milega, gap ke saath
  const segmentLength = circumference / 3;
  const gap = 6; // segments ke beech chhota sa gap, jaise thali mein katoriyan alag dikhti hain

  // Percentage ko arc length mein convert karne ka helper
  const getDashArray = (percent) => {
    const filled = (segmentLength - gap) * Math.min(percent / 100, 1);
    return `${filled} ${circumference}`;
  };

  const segments = [
    { label: 'Protein', value: protein, color: 'var(--color-masala)', offset: 0 },
    { label: 'Carbs', value: carbs, color: 'var(--color-haldi)', offset: segmentLength },
    { label: 'Fats', value: fats, color: 'var(--color-curry)', offset: segmentLength * 2 },
  ];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track - halka sa base circle har segment ke liye */}
          {segments.map((seg, i) => (
            <circle
              key={`track-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-dabba)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength - gap} ${circumference}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
            />
          ))}

          {/* Actual filled progress - yeh upar overlay hoga */}
          {segments.map((seg, i) => (
            <circle
              key={`fill-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={getDashArray(seg.value)}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          ))}
        </svg>

        {/* Center mein text - total ya kuch summary */}
        <div className="absolute flex flex-col items-center font-mono">
          <span className="text-3xl font-bold text-cream">
            {Math.round((protein + carbs + fats) / 3)}%
          </span>
          <span className="text-xs text-cream/60 font-body tracking-wide">AVG TARGET</span>
        </div>
      </div>

      {/* Legend - teeno macros ki chhoti katoriyan jaisi list */}
      <div className="flex gap-6">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-sm font-body text-cream/80">
              {seg.label} <span className="font-mono text-cream">{seg.value}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThaliRing;