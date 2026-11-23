import { Car, CheckCircle2, Navigation, Star, X, FastForward } from 'lucide-react';
import { TrackedDispatch } from '../data/ubidelyData';
import { ImageWithFallback } from './ImageWithFallback';

interface DriverArrivalToastProps {
  dispatch: TrackedDispatch;
  visible: boolean;
  onDismiss: () => void;
  onOpenTrack: () => void;
  onAdvanceStage: () => void;
}

const NOTIFICATION_COPY = [
  {
    headline: 'Servicio confirmado · Conductor asignado',
    detail: 'Preparando salida hacia tu punto de recogida.',
  },
  {
    headline: 'Tu conductor va en camino a buscarte',
    detail: 'Sigue su recorrido en tiempo real hasta tu ubicación.',
  },
  {
    headline: 'El conductor está llegando a buscarte',
    detail: 'Verifica la placa y el vehículo al salir.',
  },
  {
    headline: 'El conductor ha llegado al punto de recogida',
    detail: 'Te espera en la entrada principal.',
  },
];

export function DriverArrivalToast({
  dispatch,
  visible,
  onDismiss,
  onOpenTrack,
  onAdvanceStage,
}: DriverArrivalToastProps) {
  if (!visible) return null;

  const stepIndex = Math.min(3, Math.max(0, dispatch.progressStep));
  const copy = NOTIFICATION_COPY[stepIndex];
  const remainingMin = Math.max(0, dispatch.etaMinutes - stepIndex * 2);

  return (
    <div
      className="bg-[#191D1C] border border-[#006A60] rounded-2xl p-4 shadow-lg shadow-[#006A60]/15 flex flex-col md:flex-row md:items-center justify-between gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Foto del conductor */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#7EF8E6] bg-[#111413]">
            <ImageWithFallback
              src={dispatch.driverAvatar}
              alt={dispatch.driverName}
              fallbackTitle={dispatch.driverName}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <span
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#111413] border border-[#7EF8E6] flex items-center justify-center"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#7EF8E6]" />
          </span>
        </div>

        {/* Datos de notificación, conductor y vehículo */}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#7EF8E6]">{copy.headline}</span>
            <span className="text-xs text-[#A0ABA6] tabular-nums">
              · {remainingMin === 0 ? 'En el punto' : `Llega en ${remainingMin} min`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm font-semibold text-[#E1E3E1]">
            <span>{dispatch.driverName}</span>
            <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B] tabular-nums">
              <Star className="w-3 h-3 fill-[#F59E0B]" />
              {dispatch.driverRating}
            </span>
            <span className="text-[#6C7A75]" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A0ABA6]">
              <Car className="w-3.5 h-3.5 text-[#7EF8E6]" />
              <span>{dispatch.vehicle}</span>
            </span>
            <span className="font-mono-tabular text-xs font-bold text-[#E1E3E1] bg-[#202624] border border-[#354A44] px-2 py-0.5 rounded-md">
              {dispatch.plate}
            </span>
          </div>

          <p className="text-xs text-[#A0ABA6] truncate">{copy.detail}</p>
        </div>
      </div>

      {/* Acciones de la notificación */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {stepIndex < 3 && (
          <button
            type="button"
            onClick={onAdvanceStage}
            className="min-h-[40px] px-3.5 rounded-full bg-[#202624] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#E1E3E1] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FastForward className="w-3.5 h-3.5 text-[#7EF8E6]" />
            <span>Actualizar estado</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenTrack}
          className="min-h-[40px] px-4 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Ver en mapa</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="w-10 h-10 rounded-full bg-[#111413] border border-[#24302C] text-[#A0ABA6] hover:text-[#E1E3E1] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Ocultar notificación de conductor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
