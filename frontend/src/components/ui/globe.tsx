"use client";

import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";
import type { Globe as GlobeInstance } from "cobe";
import { MapPin } from "lucide-react";

export interface GlobeMarker {
  location: [number, number];
  size: number;
  label?: string;
}

interface GlobeProps {
  className?: string;
  markers?: GlobeMarker[];
  onMarkerClick?: (label: string) => void;
  dark?: boolean;
  selectedLabel?: string;
}

const THETA = 0.3;
const DEG = Math.PI / 180;
// Canvas [-1,1] maps to full canvas; markers at MARKER_R from origin.
const GLOBE_R_FRAC = 0.5;
const MARKER_R = 0.85; // cobe: 0.8 (globe radius) + 0.05 (marker elevation)
const LABEL_H = 28;
const LABEL_GAP = 5;
const MAX_PER_SIDE = 10;

// Derived from cobe's actual marker vertex shader and O() projection function.
// Cobe's 3D coords: [cos(lat)cos(lng), sin(lat), -cos(lat)sin(lng)]
// Rotation matrix uses cos(phi+lng) / sin(phi+lng) for screen mapping.
function projectMarker(lat: number, lng: number, phi: number) {
  const la = lat * DEG,
    lo = lng * DEG;
  const cosLa = Math.cos(la),
    sinLa = Math.sin(la);
  const ct = Math.cos(THETA),
    st = Math.sin(THETA);
  const cplo = Math.cos(phi + lo),
    splo = Math.sin(phi + lo);
  // From cobe vertex shader: l.x, l.y, l.z
  const c = cosLa * cplo; // screen X (GL)
  const s = st * cosLa * splo + ct * sinLa; // screen Y (GL, +up)
  const depth = st * sinLa - ct * cosLa * splo; // depth (>0 = front)
  return {
    nx: MARKER_R * c,
    ny: -MARKER_R * s, // flip for canvas Y
    visible: depth >= 0 || MARKER_R * MARKER_R * (c * c + s * s) >= 0.64,
  };
}

// Inverse projection: screen click → lat/lng
function clickToLatLng(
  nx: number,
  ny: number,
  phi: number
): [number, number] | null {
  // nx, ny in [-1,1] canvas coords (Y down). Un-scale to unit sphere.
  const c = nx / MARKER_R;
  const s = -ny / MARKER_R; // flip Y back to GL
  const r2 = c * c + s * s;
  if (r2 > 1) return null;
  const depth = Math.sqrt(1 - r2);
  const ct = Math.cos(THETA),
    st = Math.sin(THETA);
  const cp = Math.cos(phi),
    sp = Math.sin(phi);
  // Invert rotation: a = M^T * [c, s, depth]
  const ax = cp * c + sp * st * s - sp * ct * depth;
  const ay = ct * s + st * depth;
  const az = sp * c - cp * st * s + cp * ct * depth;
  // cobe world: ax = cos(lat)cos(lng), ay = sin(lat), az = -cos(lat)sin(lng)
  const lat = Math.asin(Math.max(-1, Math.min(1, ay)));
  const lng = Math.atan2(-az, ax);
  return [lat / DEG, lng / DEG];
}

type Projected = {
  i: number;
  dotX: number;
  dotY: number;
  side: "l" | "r";
  labelY: number;
};

function spaceLabels(
  items: Omit<Projected, "labelY">[],
  cy: number,
  globeR: number
): Projected[] {
  const sorted = [...items].sort((a, b) => a.dotY - b.dotY);
  const limited =
    sorted.length > MAX_PER_SIDE
      ? sorted
          .sort((a, b) => Math.abs(a.dotY - cy) - Math.abs(b.dotY - cy))
          .slice(0, MAX_PER_SIDE)
          .sort((a, b) => a.dotY - b.dotY)
      : sorted;

  const total = limited.length * (LABEL_H + LABEL_GAP) - LABEL_GAP;
  const top = cy - globeR + 10;
  const bottom = cy + globeR - 10;
  let startY = Math.max(top, cy - total / 2);
  if (startY + total > bottom) startY = Math.max(top, bottom - total);

  return limited.map((item, idx) => ({
    ...item,
    labelY: startY + idx * (LABEL_H + LABEL_GAP) + LABEL_H / 2,
  }));
}

export function Globe({
  className = "",
  markers = [],
  onMarkerClick,
  dark = true,
  selectedLabel,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groupRefs = useRef<Map<number, SVGGElement>>(new Map());
  const pathRefs = useRef<Map<number, SVGPathElement>>(new Map());
  const circleRefs = useRef<Map<number, SVGCircleElement>>(new Map());
  const labelRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const phiRef = useRef(0);
  const widthRef = useRef(0);
  const globeRef = useRef<GlobeInstance | null>(null);
  const rafRef = useRef<number>(0);
  const isDesktopRef = useRef(true);

  const isDragging = useRef(false);
  const totalDrag = useRef(0);
  const lastX = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      isDragging.current = true;
      lastX.current = e.clientX;
      totalDrag.current = 0;
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;
      const d = e.clientX - lastX.current;
      lastX.current = e.clientX;
      totalDrag.current += Math.abs(d);
      phiRef.current += d / 150;
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const wasDrag = totalDrag.current > 5;
      isDragging.current = false;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      if (wasDrag || !onMarkerClick || !markers.length) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const rad = r.width / 2;
      const nx = (e.clientX - r.left - rad) / rad;
      const ny = (e.clientY - r.top - rad) / rad;
      const ll = clickToLatLng(nx, ny, phiRef.current);
      if (!ll) return;

      let best: GlobeMarker | null = null;
      let bestD = Infinity;
      for (const m of markers) {
        let dLng = ll[1] - m.location[1];
        if (dLng > 180) dLng -= 360;
        if (dLng < -180) dLng += 360;
        const d = Math.sqrt((ll[0] - m.location[0]) ** 2 + dLng ** 2);
        if (d < bestD && d < 15) {
          bestD = d;
          best = m;
        }
      }
      if (best?.label) onMarkerClick(best.label);
    },
    [markers, onMarkerClick]
  );

  const onPointerLeave = useCallback(() => {
    isDragging.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  const onResize = useCallback(() => {
    if (canvasRef.current) widthRef.current = canvasRef.current.offsetWidth;
    isDesktopRef.current = window.innerWidth >= 1024;
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: 1200,
      height: 1200,
      phi: 0,
      theta: THETA,
      dark: dark ? 1 : 0,
      diffuse: dark ? 3 : 2,
      mapSamples: 20000,
      mapBrightness: dark ? 6 : 8,
      baseColor: dark ? [0.15, 0.18, 0.25] : [0.88, 0.87, 0.76],
      markerColor: [0.25, 0.64, 0.85],
      glowColor: dark ? [0.04, 0.12, 0.22] : [0.94, 0.93, 0.81],
      markers: markers.map((m) => ({
        location: m.location as [number, number],
        size: m.size,
      })),
    });
    globeRef.current = globe;

    const animate = () => {
      globe.update({
        phi: phiRef.current,
        width: widthRef.current * 2,
        height: widthRef.current * 2,
      });

      const cw = canvasWrapRef.current;
      const ctr = containerRef.current;
      if (!cw || !ctr || !isDesktopRef.current) {
        for (let i = 0; i < markers.length; i++) {
          const g = groupRefs.current.get(i);
          if (g) g.style.opacity = "0";
        }
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const cRect = ctr.getBoundingClientRect();
      const gRect = cw.getBoundingClientRect();
      const gSize = gRect.width;
      const gR = gSize * GLOBE_R_FRAC;
      const cx = gRect.left - cRect.left + gSize / 2;
      const cy = gRect.top - cRect.top + gSize / 2;
      const cW = cRect.width;

      const leftItems: Omit<Projected, "labelY">[] = [];
      const rightItems: Omit<Projected, "labelY">[] = [];

      for (let i = 0; i < markers.length; i++) {
        const [lat, lng] = markers[i].location;
        const p = projectMarker(lat, lng, phiRef.current);
        if (!p.visible) continue;
        const dotX = cx + p.nx * gR;
        const dotY = cy + p.ny * gR;
        const side = (p.nx < 0 ? "l" : "r") as "l" | "r";
        if (side === "l") leftItems.push({ i, dotX, dotY, side });
        else rightItems.push({ i, dotX, dotY, side });
      }

      const spacedL = spaceLabels(leftItems, cy, gR);
      const spacedR = spaceLabels(rightItems, cy, gR);
      const spacedAll = [...spacedL, ...spacedR];
      const spacedSet = new Set(spacedAll.map((s) => s.i));

      const margin = 10;
      const leftAnchor = Math.max(margin, cx - gR - margin);
      const rightAnchor = Math.min(cW - margin, cx + gR + margin);
      const maxLW = Math.max(40, leftAnchor - 4);
      const maxRW = Math.max(40, cW - rightAnchor - 4);

      for (const m of spacedAll) {
        const label = labelRefs.current.get(m.i);
        const group = groupRefs.current.get(m.i);
        const path = pathRefs.current.get(m.i);
        const circle = circleRefs.current.get(m.i);
        if (!label || !group || !path || !circle) continue;

        const isSel = markers[m.i].label === selectedLabel;

        label.style.opacity = "1";
        label.style.top = `${m.labelY - LABEL_H / 2}px`;
        if (m.side === "l") {
          label.style.right = `${cW - leftAnchor}px`;
          label.style.left = "";
          label.style.maxWidth = `${maxLW}px`;
        } else {
          label.style.left = `${rightAnchor}px`;
          label.style.right = "";
          label.style.maxWidth = `${maxRW}px`;
        }

        const lx = m.side === "l" ? leftAnchor : rightAnchor;
        const ly = m.labelY;
        const dx = Math.abs(m.dotX - lx);
        const cpOff = dx * 0.45;
        const cp1x = m.dotX + (m.side === "l" ? -cpOff : cpOff);
        const cp2x = lx + (m.side === "l" ? cpOff : -cpOff);

        path.setAttribute(
          "d",
          `M ${m.dotX} ${m.dotY} C ${cp1x} ${m.dotY} ${cp2x} ${ly} ${lx} ${ly}`
        );
        path.setAttribute(
          "stroke",
          isSel ? "rgba(64,162,216,0.6)" : "rgba(11,96,176,0.25)"
        );
        path.setAttribute("stroke-width", isSel ? "1.5" : "1");

        circle.setAttribute("cx", String(m.dotX));
        circle.setAttribute("cy", String(m.dotY));
        circle.setAttribute("r", isSel ? "3.5" : "2.5");
        circle.setAttribute("opacity", isSel ? "0.95" : "0.6");

        group.style.opacity = "1";
      }

      for (let i = 0; i < markers.length; i++) {
        if (!spacedSet.has(i)) {
          const label = labelRefs.current.get(i);
          if (label) label.style.opacity = "0";
          const group = groupRefs.current.get(i);
          if (group) group.style.opacity = "0";
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    }, 0);

    return () => {
      cancelAnimationFrame(rafRef.current);
      globe.destroy();
      globeRef.current = null;
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, dark, onResize, selectedLabel]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <div
        ref={canvasWrapRef}
        className="relative aspect-square w-full lg:w-[70%] lg:mx-auto"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full opacity-0 transition-opacity duration-500 cursor-grab touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
        />
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden lg:block">
        <defs>
          <filter id="dot-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {markers.map((_, i) => (
          <g
            key={i}
            ref={(el) => {
              if (el) groupRefs.current.set(i, el);
              else groupRefs.current.delete(i);
            }}
            style={{ opacity: 0, transition: "opacity 0.2s" }}
          >
            <path
              ref={(el) => {
                if (el) pathRefs.current.set(i, el);
                else pathRefs.current.delete(i);
              }}
              fill="none"
              strokeLinecap="round"
            />
            <circle
              ref={(el) => {
                if (el) circleRefs.current.set(i, el);
                else circleRefs.current.delete(i);
              }}
              fill="#40A2D8"
              filter="url(#dot-glow)"
            />
          </g>
        ))}
      </svg>

      <div className="hidden lg:block">
        {markers.map((m, i) => {
          const isSel = m.label === selectedLabel;
          return (
            <button
              key={i}
              ref={(el) => {
                if (el) labelRefs.current.set(i, el);
                else labelRefs.current.delete(i);
              }}
              onClick={() => m.label && onMarkerClick?.(m.label)}
              style={{ opacity: 0, position: "absolute", height: LABEL_H }}
              className={`z-20 inline-flex items-center gap-1.5 px-3 rounded-full text-[11px] font-medium backdrop-blur-sm transition-all duration-150 cursor-pointer border overflow-hidden text-ellipsis whitespace-nowrap ${
                isSel
                  ? "bg-sky-100/90 dark:bg-sky/15 border-sky/50 dark:border-sky/30 text-navy dark:text-sky shadow-md shadow-steel/10 dark:shadow-sky/10"
                  : "bg-cream-50/80 dark:bg-navy/70 border-cream-300/60 dark:border-navy-700/50 text-steel dark:text-sky/70 hover:text-navy dark:hover:text-cream hover:border-steel/30 dark:hover:border-sky/30 hover:shadow-md"
              }`}
            >
              <MapPin
                className={`w-3 h-3 flex-shrink-0 ${
                  isSel
                    ? "text-steel dark:text-sky"
                    : "text-sky dark:text-sky/50"
                }`}
              />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      {markers.length > 0 && (
        <div className="lg:hidden flex flex-wrap gap-2 justify-center mt-4 px-2">
          {markers.map((m, i) => {
            const isSel = m.label === selectedLabel;
            return (
              <button
                key={`m-${i}`}
                onClick={() => m.label && onMarkerClick?.(m.label)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isSel
                    ? "bg-sky/15 dark:bg-sky/10 border-sky/40 dark:border-sky/25 text-navy dark:text-sky"
                    : "bg-cream-50 dark:bg-navy border-cream-300 dark:border-navy-700 text-steel dark:text-sky/70"
                }`}
              >
                <MapPin className="w-3 h-3" />
                {m.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Globe;
