import { useState } from 'react';
import { Minus, Plus, Crosshair, ShieldAlert, Navigation } from 'lucide-react';
import { SERVICE_CITIES, ServiceCity, CityZone } from '../data/ubidelyData';

interface CityMapProps {
  mode: 'urban' | 'national';
  city: ServiceCity;
  destinationCity?: ServiceCity;
  originZoneId: string;
  destinationZoneId: string;
  onSelectZone?: (id: string, target: 'origin' | 'destination') => void;
  liveProgress?: number; // 0..1
  etaLabel?: string;
  distanceKm?: number;
  onTriggerSos?: () => void;
}

export function CityMap({
  mode,
  city,
  destinationCity,
  originZoneId,
  destinationZoneId,
  onSelectZone,
  liveProgress,
  etaLabel,
  distanceKm,
  onTriggerSos,
}: CityMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [selectionMode, setSelectionMode] = useState<'destination' | 'origin'>('destination');

  let originPoint = { x: 40, y: 40, label: '' };
  let destPoint = { x: 65, y: 70, label: '' };

  if (mode === 'national') {
    const targetCity = destinationCity ?? SERVICE_CITIES[1];
    originPoint = { x: city.nationalX, y: city.nationalY, label: city.name };
    destPoint = { x: targetCity.nationalX, y: targetCity.nationalY, label: targetCity.name };
  } else {
    const oZone = city.zones.find((z) => z.id === originZoneId) ?? city.zones[0];
    const dZone =
      city.zones.find((z) => z.id === destinationZoneId) ?? city.zones[city.zones.length - 1];
    originPoint = { x: oZone.x, y: oZone.y, label: oZone.name };
    destPoint = { x: dZone.x, y: dZone.y, label: dZone.name };
  }

  const midX = (originPoint.x + destPoint.x) / 2;
  const midY = (originPoint.y + destPoint.y) / 2 - 8;

  const t = liveProgress !== undefined ? Math.min(1, Math.max(0, liveProgress)) : null;
  const driverPos =
    t !== null
      ? {
          x:
            (1 - t) * (1 - t) * originPoint.x +
            2 * (1 - t) * t * midX +
            t * t * destPoint.x,
          y:
            (1 - t) * (1 - t) * originPoint.y +
            2 * (1 - t) * t * midY +
            t * t * destPoint.y,
        }
      : null;

  const handleNodeClick = (id: string) => {
    if (!onSelectZone) return;
    onSelectZone(id, selectionMode);
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[580px] rounded-2xl overflow-hidden bg-[#0c0f0e] border border-[#24302C] select-none">
      {/* Píldora flotante superior */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="tier-3-glass pointer-events-auto border border-[#354A44] rounded-full px-3.5 py-2 flex items-center gap-2.5 max-w-full">
          <Navigation className="w-3.5 h-3.5 text-[#7EF8E6] shrink-0" />
          <span className="text-xs font-semibold text-[#E1E3E1] truncate">
            {mode === 'urban' ? `${city.name}: ` : 'Ruta Interurbana: '}
            {originPoint.label} → {destPoint.label}
          </span>
          {distanceKm !== undefined && etaLabel && (
            <span className="text-xs font-medium text-[#7EF8E6] tabular-nums whitespace-nowrap shrink-0">
              · {distanceKm} km · {etaLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {onTriggerSos && (
            <button
              type="button"
              onClick={onTriggerSos}
              className="tier-3-glass min-h-[40px] px-3.5 rounded-full border border-[#FF5449]/50 text-[#FFB4AB] hover:bg-[#93000a]/60 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="Emergencia SOS"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF5449]" />
              <span>SOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Lienzo SVG topográfico */}
      <div
        className="w-full h-full transition-transform duration-200 ease-out origin-center"
        style={{ transform: `scale(${zoom})` }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
          role="img"
          aria-label={
            mode === 'national'
              ? 'Mapa interactivo interurbano'
              : `Mapa urbano interactivo de ${city.name}`
          }
        >
          <defs>
            <radialGradient id="ud-glow" cx="50%" cy="46%" r="62%">
              <stop offset="0%" stopColor="#142521" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#0c0f0e" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="ud-route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7EF8E6" />
              <stop offset="100%" stopColor="#2ECC71" />
            </linearGradient>
            <filter id="ud-mint-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="100" height="100" fill="url(#ud-glow)" />

          {mode === 'national' ? (
            <>
              <g stroke="#182220" strokeWidth="0.2">
                {[20, 40, 60, 80].map((v) => (
                  <line key={`nh-${v}`} x1="0" y1={v} x2="100" y2={v} />
                ))}
                {[20, 40, 60, 80].map((v) => (
                  <line key={`nv-${v}`} x1={v} y1="0" x2={v} y2="100" />
                ))}
              </g>

              {/* Topografía regional abstracta */}
              <g stroke="#1f302c" strokeWidth="0.3" fill="none" opacity="0.8">
                <path d="M 6,28 Q 34,18 60,24 T 94,20" />
                <path d="M 10,60 Q 42,50 70,55 T 92,45" />
                <path d="M 16,78 Q 48,70 82,76" />
              </g>

              {/* Red troncal interurbana */}
              <path
                d="M 18,24 L 22,46 L 41,29 L 52,25 L 69,26 L 74,48"
                fill="none"
                stroke="#22332e"
                strokeWidth="0.55"
                strokeDasharray="1 1"
              />

              <text
                x="50"
                y="9.5"
                textAnchor="middle"
                fill="#6C7A75"
                fontSize="2.2"
                letterSpacing="0.3"
                fontWeight="600"
              >
                RED INTERURBANA DE MOVILIDAD Y ENCOMIENDAS · UBIDELY
              </text>
            </>
          ) : (
            <>
              <g stroke="#1f302c" strokeWidth="0.25" fill="none" opacity="0.85">
                <path d="M 0,18 Q 25,10 48,16 T 100,12" />
                <path d="M 0,13 Q 30,5 55,11 T 100,7" />
                <path d="M 0,22 Q 22,16 52,20 T 100,17" />
              </g>
              <text
                x="50"
                y="10.5"
                textAnchor="middle"
                fill="#6C7A75"
                fontSize="2.1"
                letterSpacing="0.28"
                fontWeight="600"
              >
                {city.landmarkLabel}
              </text>

              <g stroke="#19211f" strokeWidth="0.2">
                {[20, 30, 40, 50, 60, 70, 80].map((v) => (
                  <line key={`h-${v}`} x1="0" y1={v} x2="100" y2={v} />
                ))}
                {[15, 30, 45, 60, 75, 90].map((v) => (
                  <line key={`v-${v}`} x1={v} y1="15" x2={v} y2="100" />
                ))}
              </g>

              <path
                d="M 4,58 Q 28,53 52,55 T 96,65"
                fill="none"
                stroke="#163038"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 4,56 Q 28,51 52,53 T 96,63"
                fill="none"
                stroke="#243833"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
              <path
                d="M 10,46 L 42,46 L 62,36 L 84,32"
                fill="none"
                stroke="#2b3d38"
                strokeWidth="0.55"
              />
              <path
                d="M 32,64 L 46,45 L 54,28 M 54,60 L 66,74 L 82,84"
                fill="none"
                stroke="#212d2a"
                strokeWidth="0.45"
              />
            </>
          )}

          {/* Trayectoria activa */}
          <path
            d={`M ${originPoint.x},${originPoint.y} Q ${midX},${midY} ${destPoint.x},${destPoint.y}`}
            fill="none"
            stroke="#006A60"
            strokeWidth="1.6"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
          <path
            d={`M ${originPoint.x},${originPoint.y} Q ${midX},${midY} ${destPoint.x},${destPoint.y}`}
            fill="none"
            stroke="url(#ud-route-grad)"
            strokeWidth="0.85"
            strokeDasharray="1.8 1.2"
            strokeLinecap="round"
            filter="url(#ud-mint-glow)"
          />

          <g opacity="0.65">
            <circle cx="38" cy="40" r="0.85" fill="#84d5c8" />
            <circle cx="62" cy="44" r="0.85" fill="#84d5c8" />
            <circle cx="49" cy="57" r="0.85" fill="#84d5c8" />
          </g>

          {mode === 'national'
            ? SERVICE_CITIES.map((c) => {
                const isOrigin = c.id === city.id;
                const isDest = c.id === (destinationCity?.id ?? '');
                const isEndpoint = isOrigin || isDest;

                return (
                  <g
                    key={c.id}
                    onClick={() => handleNodeClick(c.id)}
                    className={onSelectZone ? 'cursor-pointer' : ''}
                  >
                    <circle cx={c.nationalX} cy={c.nationalY} r="4.5" fill="transparent" />
                    {isEndpoint ? (
                      <>
                        <circle
                          cx={c.nationalX}
                          cy={c.nationalY}
                          r="3"
                          fill={isOrigin ? '#006A60' : '#7EF8E6'}
                          fillOpacity="0.24"
                        />
                        <circle
                          cx={c.nationalX}
                          cy={c.nationalY}
                          r="1.6"
                          fill={isOrigin ? '#2ECC71' : '#7EF8E6'}
                          stroke="#111413"
                          strokeWidth="0.5"
                        />
                      </>
                    ) : (
                      <circle
                        cx={c.nationalX}
                        cy={c.nationalY}
                        r="1.2"
                        fill="#202624"
                        stroke="#485B55"
                        strokeWidth="0.4"
                      />
                    )}
                    <text
                      x={c.nationalX}
                      y={c.nationalY - 2.6}
                      textAnchor="middle"
                      fill={isEndpoint ? '#E1E3E1' : '#A0ABA6'}
                      fontSize={isEndpoint ? '2.5' : '2.0'}
                      fontWeight={isEndpoint ? '700' : '500'}
                    >
                      {c.name}
                    </text>
                  </g>
                );
              })
            : city.zones.map((zone: CityZone) => {
                const isOrigin = zone.id === originZoneId;
                const isDest = zone.id === destinationZoneId;
                const isEndpoint = isOrigin || isDest;

                return (
                  <g
                    key={zone.id}
                    onClick={() => handleNodeClick(zone.id)}
                    className={onSelectZone ? 'cursor-pointer' : ''}
                  >
                    <circle cx={zone.x} cy={zone.y} r="4.5" fill="transparent" />
                    {isEndpoint ? (
                      <>
                        <circle
                          cx={zone.x}
                          cy={zone.y}
                          r="3"
                          fill={isOrigin ? '#006A60' : '#7EF8E6'}
                          fillOpacity="0.22"
                        />
                        <circle
                          cx={zone.x}
                          cy={zone.y}
                          r="1.6"
                          fill={isOrigin ? '#2ECC71' : '#7EF8E6'}
                          stroke="#111413"
                          strokeWidth="0.5"
                        />
                      </>
                    ) : (
                      <circle
                        cx={zone.x}
                        cy={zone.y}
                        r="1.15"
                        fill="#202624"
                        stroke="#485B55"
                        strokeWidth="0.4"
                      />
                    )}
                    <text
                      x={zone.x}
                      y={zone.y - 2.6}
                      textAnchor="middle"
                      fill={isEndpoint ? '#E1E3E1' : '#A0ABA6'}
                      fontSize={isEndpoint ? '2.4' : '2.0'}
                      fontWeight={isEndpoint ? '700' : '500'}
                    >
                      {zone.name}
                    </text>
                  </g>
                );
              })}

          {driverPos && (
            <g transform={`translate(${driverPos.x}, ${driverPos.y})`}>
              <circle r="3.6" fill="#7EF8E6" fillOpacity="0.2" />
              <circle r="1.9" fill="#7EF8E6" stroke="#111413" strokeWidth="0.55" />
            </g>
          )}
        </svg>
      </div>

      {/* Controles inferiores */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="tier-3-glass pointer-events-auto border border-[#24302C] rounded-full px-3 py-1.5 flex items-center gap-2">
          {liveProgress !== undefined ? (
            <>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-[#7EF8E6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7EF8E6]" />
              </span>
              <span className="text-xs font-medium text-[#E1E3E1] whitespace-nowrap">
                Telemetría GPS en vivo
              </span>
            </>
          ) : (
            <span className="text-xs text-[#A0ABA6] whitespace-nowrap">
              {mode === 'national'
                ? 'Toca cualquier ciudad en el mapa para fijar ruta'
                : `Toca una zona de ${city.name} para fijar ruta`}
            </span>
          )}
        </div>

        <div className="tier-3-glass pointer-events-auto border border-[#24302C] rounded-full p-1 flex items-center gap-0.5">
          {onSelectZone && (
            <button
              type="button"
              onClick={() =>
                setSelectionMode((m) => (m === 'destination' ? 'origin' : 'destination'))
              }
              className="hidden sm:inline-flex items-center px-2.5 h-8 rounded-full text-[11px] font-semibold text-[#7EF8E6] hover:bg-[#142521] transition-colors cursor-pointer"
            >
              Al tocar: {selectionMode === 'destination' ? 'Destino' : 'Origen'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.9, Number((z - 0.15).toFixed(2))))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A0ABA6] hover:text-[#E1E3E1] hover:bg-[#202624] transition-colors cursor-pointer"
            aria-label="Alejar mapa"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A0ABA6] hover:text-[#7EF8E6] hover:bg-[#202624] transition-colors cursor-pointer"
            aria-label="Centrar mapa"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A0ABA6] hover:text-[#E1E3E1] hover:bg-[#202624] transition-colors cursor-pointer"
            aria-label="Acercar mapa"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
