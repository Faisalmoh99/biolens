import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { fetchAllPatients } from '@/lib/patients';
import { makeTriageIcon } from '@/lib/map-icons';
import type { Patient } from '@/types/patient';
import { useTranslation } from 'react-i18next';
import { TriageBadge } from '@/components/ui/triage-badge';
import { Button } from '@/components/ui/button';

const MECCA_CENTER: [number, number] = [21.4225, 39.8262];
const TRIAGE_WEIGHT: Record<string, number> = {
  red: 1.0,
  green: 0.3,
};

function HeatmapLayer({ patients }: { patients: Patient[] }) {
  const map = useMap();
  useEffect(() => {
    const points = patients
      .filter((p) => p.demoLocation)
      .map(
        (p) =>
          [
            p.demoLocation!.lat,
            p.demoLocation!.lng,
            TRIAGE_WEIGHT[p.demoSeverity] ?? 0.3,
          ] as [number, number, number],
      );
    const layer = L.heatLayer(points, {
      radius: 50,
      blur: 35,
      maxZoom: 17,
      gradient: { 0.4: '#22c55e', 0.8: '#ef4444' },
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, patients]);
  return null;
}

export default function CasesMap() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    fetchAllPatients().then(setPatients);
  }, []);

  const lang = i18n.language as 'ar' | 'en';

  return (
    <PageTransition>
      <div className="relative h-[calc(100vh-4rem)] w-full flex">
        {/* Sidebar */}
        <aside className="w-80 bg-medical-surface/80 backdrop-blur-md border-r border-medical-cyan/20 overflow-y-auto p-4 z-[1000]">
          <h2 className="text-lg font-bold text-medical-cyan mb-1">
            {t('map.title')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('map.subtitle')}
          </p>
          <div className="space-y-2">
            {patients.map((p) => (
              <motion.button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  markerRefs.current[p.id]?.openPopup();
                }}
                whileHover={{ scale: 1.02 }}
                className={`w-full text-${lang === 'ar' ? 'right' : 'left'} p-3 rounded-lg border transition ${
                  selectedId === p.id
                    ? 'border-medical-cyan bg-medical-cyan/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                    : 'border-border bg-medical-deep/40 hover:border-medical-cyan/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TriageBadge color={p.demoSeverity} />
                  <span className="text-xs text-muted-foreground">
                    {p.demoLocation?.siteName[lang] ?? ''}
                  </span>
                </div>
                <div className="font-semibold text-sm">
                  {p.fullName[lang]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.age}yo · {p.nationality[lang]}
                </div>
              </motion.button>
            ))}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative" dir="ltr">
          <MapContainer
            center={MECCA_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%', background: '#050b1a' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap, &copy; CARTO'
              subdomains="abcd"
              maxZoom={19}
            />
            <HeatmapLayer patients={patients} />
            {patients
              .filter((p) => p.demoLocation)
              .map((p) => (
                <Marker
                  key={p.id}
                  position={[p.demoLocation!.lat, p.demoLocation!.lng]}
                  icon={makeTriageIcon(p.demoSeverity)}
                  ref={(ref) => {
                    if (ref) markerRefs.current[p.id] = ref;
                  }}
                  eventHandlers={{ click: () => setSelectedId(p.id) }}
                >
                  <Popup>
                    <div className="min-w-[200px]" dir={i18n.dir()}>
                      <div className="flex items-center gap-2 mb-2">
                        <TriageBadge color={p.demoSeverity} />
                      </div>
                      <div className="font-bold text-base">
                        {p.fullName[lang]}
                      </div>
                      <div className="text-sm text-gray-600">
                        {p.age}yo · {p.nationality[lang]}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {p.demoLocation?.siteName[lang]}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/patient/${p.id}`)}
                        className="w-full"
                      >
                        {t('map.openProfile')}
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>
    </PageTransition>
  );
}
