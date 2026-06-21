import React, { useState } from "react";
import { TrendingUp, BarChart2, Calendar, Award } from "lucide-react";
import { ScoreRecord } from "../types";

interface KpmHistoryChartProps {
  history: ScoreRecord[];
}

export const KpmHistoryChart: React.FC<KpmHistoryChartProps> = ({ history }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // If there's no history, render empty state
  if (!history || history.length === 0) {
    return (
      <div 
        id="kpm-chart-empty"
        className="w-full h-[154px] bg-[#0a0a0a] border border-[#222] rounded-lg flex flex-col items-center justify-center p-4 text-center"
      >
        <BarChart2 size={24} className="text-neutral-700 mb-2 animate-pulse" />
        <p className="text-xs font-bold text-neutral-400">測定履歴がありません</p>
        <p className="text-[10px] text-neutral-600 mt-1 max-w-[240px]">
          レッスンを完了すると、あなたの打鍵速度（KPM）の成長曲線がここに描かれます。
        </p>
      </div>
    );
  }

  // Slice last 15 attempts and reverse so they run oldest to newest (left to right)
  const chartData = [...history].slice(0, 15).reverse();
  const kpms = chartData.map(d => d.kpm);
  
  const originalMax = Math.max(...kpms);
  const originalMin = Math.min(...kpms);
  const range = originalMax - originalMin;
  
  // Calculate padded display ranges for high aesthetics
  const yMax = Math.round(originalMax + (range === 0 ? 30 : Math.max(10, range * 0.2)));
  const yMin = Math.max(0, Math.round(originalMin - (range === 0 ? 30 : Math.max(10, range * 0.2))));
  const yRange = yMax - yMin;

  // SVG Geometry Settings
  const width = 500;
  const height = 110;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 16;

  // Map data points to SVG coordinates
  const points = chartData.map((d, index) => {
    const x = paddingLeft + (index / Math.max(1, chartData.length - 1)) * (width - paddingLeft - paddingRight);
    const yTarget = height - paddingBottom - ((d.kpm - yMin) / (yRange || 1)) * (height - paddingTop - paddingBottom);
    // Boundary check safety
    const y = Math.min(height - paddingBottom, Math.max(paddingTop, yTarget));
    return { x, y, record: d };
  });

  // Create SVG path strings
  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Closed path for filled area under the curve
    areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  // Active highlighted point details for interactive feedback
  const activePoint = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < points.length 
    ? points[hoveredIndex] 
    : points[points.length - 1]; // Default to newest point

  const scoreDate = activePoint?.record?.timestamp 
    ? new Date(activePoint.record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  return (
    <div 
      id="kpm-history-panel" 
      className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3 flex flex-col gap-2 select-none"
    >
      {/* Dynamic Mini Headings Info Row */}
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-neutral-900/50 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} className="text-[#00ff88]" />
          <span className="text-neutral-400 font-bold uppercase tracking-wide">KPM GROWTH CURVE</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-500 font-bold">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"></span>
            MAX: <span className="text-white">{originalMax}</span>
          </span>
          <span>AVG: <span className="text-white">{Math.round(kpms.reduce((a, b) => a + b, 0) / kpms.length)}</span></span>
        </div>
      </div>

      {/* Main SVG Plotting Canvas Area */}
      <div className="relative h-[116px] w-full mt-0.5 bg-black/15 border border-dashed border-neutral-900/50 rounded flex items-center justify-center">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full"
        >
          <defs>
            {/* Glowing neon stroke gradient */}
            <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00ccff" />
              <stop offset="50%" stopColor="#00ff88" />
              <stop offset="100%" stopColor="#9d00ff" />
            </linearGradient>
            
            {/* Soft backdrop field gradient */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Guideline Y-axis borders */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop} 
            x2={width - paddingRight} 
            y2={paddingTop} 
            stroke="#161616" 
            strokeWidth="1" 
            strokeDasharray="2,3" 
          />
          <line 
            x1={paddingLeft} 
            y1={(paddingTop + height - paddingBottom) / 2} 
            x2={width - paddingRight} 
            y2={(paddingTop + height - paddingBottom) / 2} 
            stroke="#161616" 
            strokeWidth="1" 
            strokeDasharray="2,3" 
          />
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            stroke="#1e1e1e" 
            strokeWidth="1" 
          />

          {/* Guidelines labels */}
          <text x={paddingLeft - 6} y={paddingTop + 3} fill="#444" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">{yMax}</text>
          <text x={paddingLeft - 6} y={(paddingTop + height - paddingBottom) / 2 + 3} fill="#333" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">{Math.round((yMax + yMin) / 2)}</text>
          <text x={paddingLeft - 6} y={height - paddingBottom + 3} fill="#444" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">{yMin}</text>

          {/* Filled Area Graphic */}
          {areaPath && (
            <path d={areaPath} fill="url(#areaGradient)" />
          )}

          {/* Glowing Line Graphic */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="url(#neonGradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Circular Interactive Point Handles */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const isActive = hoveredIndex === null ? (i === points.length - 1) : isHovered;
            
            return (
              <g key={pt.record.id}>
                {/* Outer larger interactive hover target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="9"
                  className="fill-transparent cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                
                {/* Aesthetic point stroke rings */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? "5.5" : "3.5"}
                  className={`transition-all duration-150 pointer-events-none ${
                    isActive 
                      ? "stroke-[#00ff88] fill-black stroke-[2px]" 
                      : "stroke-[#00ff88]/50 fill-black stroke-[1.5px]"
                  }`}
                />
                
                {/* Mini Center Core Point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="1.5"
                  className={`pointer-events-none ${
                    isActive ? "fill-[#00ff88]" : "fill-neutral-600"
                  }`}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tactile Data Context HUD Overlay */}
      {activePoint && (
        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 bg-neutral-950/40 border border-neutral-900/60 p-2 rounded shrink-0 leading-relaxed">
          <div className="flex flex-col min-w-0">
            <span className="text-[#666] font-bold text-[8.5px] uppercase">SELECTED ATTEMPT</span>
            <span className="text-white font-extrabold truncate max-w-[170px] mt-0.5">
              {activePoint.record.categoryName.replace(" (60秒測定)", "")}
            </span>
          </div>

          <div className="flex gap-4 items-center shrink-0">
            <div className="text-right">
              <span className="text-[#666] font-bold block text-[8px] uppercase">SPEED</span>
              <span className="text-[#00ff88] font-black text-[11px] block mt-0.5">{activePoint.record.kpm} KPM</span>
            </div>
            <div className="text-right border-l border-neutral-900/80 pl-3">
              <span className="text-[#666] font-bold block text-[8px] uppercase">ACCURACY</span>
              <span className="text-cyan-400 font-extrabold text-[10px] block mt-0.5">{activePoint.record.accuracy}%</span>
            </div>
            <div className="text-right border-l border-neutral-900/80 pl-3 text-neutral-500 text-[8px] hidden md:block">
              <span className="font-bold block uppercase text-[#666]">TIME</span>
              <span className="block mt-1 font-bold">{scoreDate || "測定直後"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
