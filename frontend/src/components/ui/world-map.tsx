"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// Define the types for ALL props this component will accept
interface Point {
  lat: number;
  lng: number;
  label?: string;
}

interface MapProps {
  dots?: Array<{
    start: Point;
    end: Point;
  }>;
  lineColor?: string;
  singlePoints?: Array<Point>;
  pointColor?: string;
  onPointClick?: (label: string) => void;
}

// SVG viewbox dimensions
const SVG_WIDTH = 800;
const SVG_HEIGHT = 400;

// Simple equirectangular projection function
// Converts lat/lng to x/y coordinates
const projectPoint = (lat: number, lng: number) => {
  const x = (lng + 180) * (SVG_WIDTH / 360);
  const y = (90 - lat) * (SVG_HEIGHT / 180);
  return { x, y };
};

// Function to create curved paths for connection lines
const createCurvedPath = (
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  const midX = (start.x + end.x) / 2;
  // Curve "up" on the map
  const midY = Math.min(start.y, end.y) - 50;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
};

export function WorldMap({
  dots = [],
  lineColor: customLineColor,
  singlePoints = [],
  pointColor: customPointColor,
  onPointClick,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // --- Interactivity State (for singlePoints) ---
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };
  // --- End Interactivity State ---

  // --- Define Colors ---
  const defaultLineColor = "#0ea5e9"; // Default blue
  const defaultPointColor = "#f59e0b"; // Default amber

  const lineColor = customLineColor || defaultLineColor;
  const pointColor = customPointColor || defaultPointColor;

  return (
    <div className="w-full aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans overflow-hidden">
      {/* Tooltip for singlePoints */}
      {hoveredLabel && (
        <motion.div
          className="absolute z-20 px-3 py-1.5 text-sm font-semibold rounded-md shadow-lg pointer-events-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {hoveredLabel}
        </motion.div>
      )}

      {/* ✅ --- THIS IS THE FIX ---
        This now loads your static /public/worldmap.svg file
        instead of generating it in the browser.
      */}
      <Image
        src="/worldmap.svg" 
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="400"
        width="800"
        draggable={false}
        priority // Load it quickly
      />

      {/* SVG Overlay for animations and interactivity */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full absolute inset-0 select-none"
        onMouseMove={handleMouseMove} // Mouse move for tooltip
      >
        <defs>
          {/* Gradient for connection lines */}
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for points */}
          <filter id="point-glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Render Connection Lines (from dots prop) */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`path-group-${i}`} style={{ pointerEvents: "none" }}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.5 * i,
                  ease: "easeOut",
                }}
              />
            </g>
          );
        })}

        {/* 2. Render Connection Line Endpoints (from dots prop) */}
        {dots.map((dot, i) => (
          <g key={`points-group-${i}`} style={{ pointerEvents: "none" }}>
            {/* Start Point */}
            <g key={`start-${i}`}>
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin={`${i * 0.2}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin={`${i * 0.2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
            {/* End Point */}
            <g key={`end-${i}`}>
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin={`${i * 0.2 + 0.5}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin={`${i * 0.2 + 0.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          </g>
        ))}

        {/* 3. Render Interactive Single Points (from singlePoints prop) */}
        {singlePoints.map((point, i) => {
          const { x, y } = projectPoint(point.lat - 10, point.lng );
          return (
            <g
              key={`single-point-${i}`}
              onClick={() => onPointClick?.(point.label || "Unknown")}
              onMouseEnter={() => setHoveredLabel(point.label || null)}
              onMouseLeave={() => setHoveredLabel(null)}
              className="cursor-pointer"
              style={{ pointerEvents: "all" }} // Make this group interactive
              filter="url(#point-glow)"
            >
              {/* Solid center dot */}
              <circle
                cx={x}
                cy={y}
                r="3"
                fill={pointColor}
                className="transition-all"
              />
              {/* Pulsing halo */}
              <circle
                cx={x}
                cy={y}
                r="3"
                fill={pointColor}
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  from="3"
                  to="12"
                  dur="1.8s"
                  begin={`${i * 0.1}s`} // Stagger animation
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="1.8s"
                  begin={`${i * 0.1}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Invisible click area */}
              <circle cx={x} cy={y} r="15" fill="transparent" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default WorldMap;