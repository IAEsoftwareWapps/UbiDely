import { useState, useEffect } from 'react';
import {
  Phone,
  Send,
  Share2,
  CheckCircle2,
  ShieldAlert,
  Star,
  Clock,
  FastForward,
  Car,
} from 'lucide-react';
import {
  CurrencyCode,
  ExchangeRates,
  SERVICE_CITIES,
  TrackedDispatch,
  calculateIntercityDistanceKm,
  calculateZoneDistanceKm,
  formatDualPrice,
} from '../data/ubidelyData';
import { CityMap } from './CityMap';
import { ImageWithFallback } from './ImageWithFallback';

interface LiveTrackScreenProps {
  dispatch: TrackedDispatch;
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  onAdvanceStage: () => void;
  onResetDemo: () => void;
  onTriggerSos: () => void;
}

const STAGES = [
  'Servicio confirmado',
  'Conductor en camino a buscarte',
  'Llegando al punto de recogida',
  'Conductor en tu ubicación',
];

export function LiveTrackScreen({
  dispatch,
  activeCurrency,
  rates,
  onAdvanceStage,
  onResetDemo,
  onTriggerSos,
}: LiveTrackScreenProps) {
  const [messages, setMessages] = useState<
    Array<{ sender: 'driver' | 'user'; text: string; time: string }>
  >([
    {
      sender: 'driver',
      text: '¡Hola! Ya confirmé tu servicio y voy en camino a buscarte.',
      time: 'Ahora',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [callBanner, setCallBanner] = useState(false);

  const targetProgress = Math.min(0.95, 0.2 + dispatch.progressStep * 0.25);
  const [liveProgress, setLiveProgress] = useState(targetProgress);

  useEffect(() => {
    setLiveProgress(targetProgress);
  }, [targetProgress]);

  const originCity = SERVICE_CITIES.find((c) => c.id === dispatch.cityId) ?? SERVICE_CITIES[0];
  const destCity =
    SERVICE_CITIES.find((c) => c.id === dispatch.destinationCityId) ?? originCity;

  const originZone =
    originCity.zones.find((z) => z.id === dispatch.originZoneId) ?? originCity.zones[0];
  const destZone =
    originCity.zones.find((z) => z.id === dispatch.destinationZoneId) ??
    originCity.zones[originCity.zones.length - 1];

  const distanceKm =
    dispatch.mode === 'national'
      ? calculateIntercityDistanceKm(originCity, destCity)
      : calculateZoneDistanceKm(originZone, destZone);

  const remainingEta = Math.max(0, dispatch.etaMinutes - dispatch.progressStep * 2);
  const etaLabel =
    dispatch.mode === 'urban'
      ? remainingEta === 0
        ? 'En punto'
        : `${remainingEta} min`
      : `${Math.floor(remainingEta / 60)}h ${remainingEta % 60}m`;

  const dual = formatDualPrice(dispatch.amountUsd, activeCurrency, rates);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed, time: 'Ahora' }]);
    setDraft('');
  };

  const handleShareTrip = () => {
    const shareText = `UbiDely Viaje ${dispatch.id}: ${dispatch.driverName} (${dispatch.vehicle} · Placa ${dispatch.plate}) Llegada ${etaLabel}.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2400);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-4">
        <CityMap
          mode={dispatch.mode}
          city={originCity}
          destinationCity={destCity}
          originZoneId={originZone.id}
          destinationZoneId={destZone.id}
          liveProgress={liveProgress}
          etaLabel={etaLabel}
          distanceKm={distanceKm}
          onTriggerSos={onTriggerSos}
        />

        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-[#7EF8E6] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7EF8E6]" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#E1E3E1] tabular-nums">
                {dispatch.progressStep >= 3
                  ? 'El conductor llegó al punto de recogida'
                  : `Tu unidad llega a buscarte en ${etaLabel}`}
              </p>
              <p className="text-xs text-[#A0ABA6]">{dispatch.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dispatch.progressStep < 3 ? (
              <button
                type="button"
                onClick={onAdvanceStage}
                className="min-h-[40px] px-4 rounded-full bg-[#202624] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#7EF8E6] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Simular avance</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onResetDemo}
                className="min-h-[40px] px-4 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-semibold text-[#E1E3E1] transition-colors cursor-pointer"
              >
                Reiniciar rastreo
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-[#24302C] pb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7EF8E6]">
              Rastreo {dispatch.id} · {dispatch.paymentMethod}
            </p>
            <h1 className="text-lg font-bold text-[#E1E3E1] mt-1 leading-snug">
              {dispatch.title}
            </h1>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base font-bold text-[#E1E3E1] tabular-nums">{dual.primary}</div>
            <div className="text-xs text-[#A0ABA6] tabular-nums">{dual.secondary}</div>
          </div>
        </div>

        {/* Tarjeta destacada con foto del conductor y vehículo */}
        <div className="bg-[#111413] border border-[#354A44] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#7EF8E6] shrink-0">
                <ImageWithFallback
                  src={dispatch.driverAvatar}
                  alt={dispatch.driverName}
                  fallbackTitle="Conductor"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#E1E3E1] truncate">
                    {dispatch.driverName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F59E0B] tabular-nums">
                    <Star className="w-3 h-3 fill-[#F59E0B]" />
                    {dispatch.driverRating}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#A0ABA6]">
                  <Car className="w-3.5 h-3.5 text-[#7EF8E6] shrink-0" />
                  <span className="truncate">{dispatch.vehicle}</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-[#E1E3E1] bg-[#202624] border border-[#354A44] px-2 py-0.5 rounded-md">
                    Placa: {dispatch.plate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setCallBanner((v) => !v)}
                className="w-11 h-11 rounded-full bg-[#202624] border border-[#354A44] hover:border-[#7EF8E6] text-[#7EF8E6] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Llamar al conductor"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleShareTrip}
                className="w-11 h-11 rounded-full bg-[#202624] border border-[#354A44] hover:border-[#7EF8E6] text-[#E1E3E1] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Compartir ruta en vivo"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {callBanner && (
          <div className="bg-[#142521] border border-[#006A60] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
            <span className="text-[#7EF8E6] font-medium">
              Llamada VoIP lista con {dispatch.driverName} ({dispatch.driverPhone})
            </span>
            <button
              type="button"
              onClick={() => setCallBanner(false)}
              className="text-[#E1E3E1] font-semibold underline ml-2 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {copiedShare && (
          <div className="bg-[#142521] border border-[#006A60] rounded-xl px-3.5 py-2 text-xs text-[#7EF8E6] font-medium">
            Enlace de rastreo en vivo copiado al portapapeles.
          </div>
        )}

        {/* Notificaciones de progreso desde confirmación hasta recogida */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-[#A0ABA6] block">
            Notificaciones de llegada
          </span>
          <div className="space-y-2">
            {STAGES.map((stageLabel, idx) => {
              const completed = idx <= dispatch.progressStep;
              const isCurrent = idx === dispatch.progressStep;
              return (
                <div
                  key={stageLabel}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                    isCurrent
                      ? 'bg-[#142521] border-[#006A60] text-[#E1E3E1]'
                      : completed
                      ? 'bg-[#111413]/70 border-[#24302C] text-[#A0ABA6]'
                      : 'bg-transparent border-[#24302C]/50 text-[#6C7A75]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {completed ? (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isCurrent ? 'text-[#7EF8E6]' : 'text-[#2ECC71]'
                        }`}
                      />
                    ) : (
                      <Clock className="w-4 h-4 shrink-0 text-[#6C7A75]" />
                    )}
                    <span className="text-xs font-medium">{stageLabel}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-[#7EF8E6]">Actual</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat directo */}
        <div className="space-y-2.5 pt-1 border-t border-[#24302C]">
          <span className="text-xs font-semibold text-[#A0ABA6] block">
            Chat directo con el conductor
          </span>

          <div className="bg-[#111413] border border-[#24302C] rounded-xl p-3 space-y-2 max-h-[140px] overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] ${
                    msg.sender === 'user'
                      ? 'bg-[#006A60] text-[#E1E3E1]'
                      : 'bg-[#202624] text-[#E1E3E1]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['Estoy en la entrada', 'Pago enviado', 'Bajo en 2 minutos'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => sendMessage(preset)}
                className="min-h-[34px] px-3 rounded-full bg-[#202624] hover:border-[#7EF8E6] border border-[#24302C] text-[11px] font-medium text-[#A0ABA6] hover:text-[#E1E3E1] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(draft);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Escribe a ${dispatch.driverName}...`}
              className="flex-1 h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-xs text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
            />
            <button
              type="submit"
              className="w-11 h-11 rounded-xl bg-[#006A60] hover:bg-[#004D40] text-[#E1E3E1] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={onTriggerSos}
          className="w-full min-h-[44px] rounded-full border border-[#FF5449]/40 bg-[#93000a]/25 hover:bg-[#93000a]/45 text-xs font-semibold text-[#FFB4AB] flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4 text-[#FF5449]" />
          <span>Centro de Seguridad 24/7 (SOS)</span>
        </button>
      </section>
    </div>
  );
}
