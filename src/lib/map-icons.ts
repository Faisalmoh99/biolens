import L from 'leaflet';
import type { TriageColor } from '@/types/patient';

const COLORS: Record<TriageColor, { bg: string; ring: string; glow: string }> = {
  red:   { bg: '#ef4444', ring: '#dc2626', glow: 'rgba(239, 68, 68, 0.6)' },
  green: { bg: '#22c55e', ring: '#16a34a', glow: 'rgba(34, 197, 94, 0.5)' },
};

export function makeTriageIcon(color: TriageColor): L.DivIcon {
  const c = COLORS[color];
  return L.divIcon({
    className: 'bioprint-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="position:relative;width:32px;height:32px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${c.glow};animation:bioprint-pulse 2s infinite;"></div>
        <div style="position:absolute;inset:6px;border-radius:50%;background:${c.bg};border:2px solid ${c.ring};box-shadow:0 0 12px ${c.glow};"></div>
      </div>
      <style>
        @keyframes bioprint-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0; }
        }
      </style>
    `,
  });
}
