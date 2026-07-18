import React from "react";
import { DailyLog } from "../types";

interface CustomChartProps {
  logs: DailyLog[];
}

export default function CustomChart({ logs }: CustomChartProps) {
  // Sort logs by date ascending to render chronologically
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  // If we have fewer than 7 logs, pad them with mock historical data to show a full weekly overview
  const chartData = [...sortedLogs];
  const daysToShow = 7;

  if (chartData.length < daysToShow) {
    const missingDays = daysToShow - chartData.length;
    const today = new Date();
    for (let i = missingDays; i > 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i + sortedLogs.length));
      const dateString = date.toISOString().split("T")[0];
      
      // Generate some realistic seed logs for demonstration of weekly history
      chartData.unshift({
        date: dateString,
        screenHours: Math.round((5 + Math.random() * 4) * 10) / 10,
        sleepHours: Math.round((5.5 + Math.random() * 2) * 10) / 10,
        habitSlips: Math.random() > 0.5 ? ["Scrolling"] : [],
      });
    }
  }

  // Find max values to scale the SVG dynamically
  const maxScreen = Math.max(...chartData.map((d) => d.screenHours), 1);
  const maxSleep = Math.max(...chartData.map((d) => d.sleepHours), 1);
  const maxValue = Math.max(maxScreen, maxSleep, 12); // Bound by at least 12 hours for visual scaling

  // Chart dimensions
  const width = 500;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = chartData.map((d, index) => {
    const x = paddingLeft + (index / (daysToShow - 1)) * chartWidth;
    
    // Screen hours coordinate (Y increases downwards, so subtract from chartHeight)
    const yScreen = paddingTop + chartHeight - (d.screenHours / maxValue) * chartHeight;
    // Sleep hours coordinate
    const ySleep = paddingTop + chartHeight - (d.sleepHours / maxValue) * chartHeight;

    const dateObj = new Date(d.date);
    const label = dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

    return { x, yScreen, ySleep, label, ...d };
  });

  // SVG Paths
  const screenLinePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yScreen}`).join(" ");
  const sleepLinePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.ySleep}`).join(" ");

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Habits Log</h4>
          <p className="text-xs text-slate-500">Comparing Screen time and Sleep patterns</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Screen Hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Sleep Hours</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[420px] h-auto overflow-visible"
        >
          {/* Y-Axis Grid Lines & Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = Math.round(ratio * maxValue);
            const y = paddingTop + chartHeight - ratio * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  className="stroke-slate-800/80 stroke-1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  className="fill-slate-500 text-[10px] font-semibold text-right"
                  textAnchor="end"
                >
                  {val}h
                </text>
              </g>
            );
          })}

          {/* Render lines */}
          <path
            d={screenLinePath}
            fill="none"
            className="stroke-emerald-400 stroke-3 stroke-linecap-round"
          />
          <path
            d={sleepLinePath}
            fill="none"
            className="stroke-cyan-400 stroke-3 stroke-linecap-round"
          />

          {/* Render Points on Interactive Markers */}
          {points.map((p, index) => (
            <g key={index} className="group">
              {/* Screen Points */}
              <circle
                cx={p.x}
                cy={p.yScreen}
                r={4}
                className="fill-slate-950 stroke-emerald-400 stroke-2 hover:r-6 transition-all cursor-pointer"
              />
              {/* Sleep Points */}
              <circle
                cx={p.x}
                cy={p.ySleep}
                r={4}
                className="fill-slate-950 stroke-cyan-400 stroke-2 hover:r-6 transition-all cursor-pointer"
              />

              {/* Day Labels */}
              <text
                x={p.x}
                y={height - 12}
                className="fill-slate-400 text-[10px] font-bold"
                textAnchor="middle"
              >
                {p.label}
              </text>

              {/* Hover Value Tooltips */}
              <g className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect
                  x={p.x - 30}
                  y={Math.min(p.yScreen, p.ySleep) - 35}
                  width={60}
                  height={25}
                  rx={6}
                  className="fill-slate-950 stroke-slate-800 stroke-1"
                />
                <text
                  x={p.x}
                  y={Math.min(p.yScreen, p.ySleep) - 19}
                  className="fill-slate-100 text-[9px] font-bold"
                  textAnchor="middle"
                >
                  Scr: {p.screenHours}h | Slp: {p.sleepHours}h
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
