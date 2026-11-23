import { useState } from 'react';
import { Bell, BellOff, Clock, CheckCircle2, X, Send, Smartphone } from 'lucide-react';
import { PushPreferences, PushStatusSummary } from '../services/pushService';

interface PushSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: PushStatusSummary;
  preferences: PushPreferences;
  onUpdatePreferences: (next: PushPreferences) => void;
  onEnablePush: () => Promise<void>;
  onDisablePush: () => Promise<void>;
  onSendTestPush: (delayMs: number) => Promise<void>;
}

export function PushSettingsModal({
  isOpen,
  onClose,
  status,
  preferences,
  onUpdatePreferences,
  onEnablePush,
  onDisablePush,
  onSendTestPush,
}: PushSettingsModalProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSubscription = async () => {
    setBusy(true);
    setFeedback(null);
    if (status.subscribed) {
      await onDisablePush();
      setFeedback('Notificaciones en segundo plano desactivadas.');
    } else {
      await onEnablePush();
    }
    setBusy(false);
  };

  const handleTest = async (delayMs: number) => {
    setBusy(true);
    await onSendTestPush(delayMs);
    setFeedback(
      delayMs > 0
        ? 'Alerta programada en el servidor para dentro de 5 segundos. Puedes minimizar o cambiar de pestaña.'
        : 'Notificación Push enviada al Service Worker.'
    );
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-[#202624] border border-[#354A44] rounded-t-3xl sm:rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#142521] border border-[#006A60] flex items-center justify-center text-[#7EF8E6] shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 id="push-modal-title" className="text-lg font-bold text-[#E1E3E1]">
                Notificaciones Push (Segundo Plano)
              </h2>
              <p className="text-xs text-[#A0ABA6]">
                Recibe alertas del estado de viajes y delivery sin tener la app abierta
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#191D1C] border border-[#24302C] text-[#A0ABA6] hover:text-[#E1E3E1] flex items-center justify-center cursor-pointer"
            aria-label="Cerrar panel de notificaciones"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Estado actual del Service Worker y Push API */}
        <div className="bg-[#111413] border border-[#24302C] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {status.subscribed ? (
                <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
              ) : (
                <Smartphone className="w-4 h-4 text-[#A0ABA6] shrink-0" />
              )}
              <span className="text-sm font-semibold text-[#E1E3E1]">
                {status.subscribed ? 'Alertas Push activas' : 'Alertas Push desactivadas'}
              </span>
            </div>
            <span className="text-xs font-medium text-[#7EF8E6]">
              Permiso:{' '}
              {status.permission === 'granted'
                ? 'Concedido'
                : status.permission === 'denied'
                ? 'Bloqueado'
                : status.permission === 'default'
                ? 'Pendiente'
                : 'No compatible'}
            </span>
          </div>

          <p className="text-xs text-[#A0ABA6] leading-relaxed">{status.detail}</p>

          <button
            type="button"
            disabled={busy || status.permission === 'unsupported'}
            onClick={() => void handleToggleSubscription()}
            className={`w-full min-h-[46px] rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
              status.subscribed
                ? 'bg-[#191D1C] border border-[#354A44] hover:border-[#FF5449] text-[#E1E3E1]'
                : 'bg-[#006A60] hover:bg-[#004D40] text-[#E1E3E1]'
            }`}
          >
            {status.subscribed ? (
              <>
                <BellOff className="w-4 h-4 text-[#FFB4AB]" />
                <span>Pausar alertas en segundo plano</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-[#7EF8E6]" />
                <span>Activar Web Push API</span>
              </>
            )}
          </button>
        </div>

        {/* Preferencias por tipo de evento */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-[#A0ABA6] block">
            Eventos que generan notificación Push
          </span>

          <label className="flex items-center justify-between bg-[#191D1C] border border-[#24302C] rounded-xl px-4 py-3 cursor-pointer">
            <div>
              <span className="text-sm font-medium text-[#E1E3E1] block">
                Estado del viaje y llegada del conductor
              </span>
              <span className="text-xs text-[#A0ABA6]">
                Confirmación, salida, placa asignada y llegada al punto
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.rides}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, rides: e.target.checked })
              }
              className="w-5 h-5 accent-[#7EF8E6]"
            />
          </label>

          <label className="flex items-center justify-between bg-[#191D1C] border border-[#24302C] rounded-xl px-4 py-3 cursor-pointer">
            <div>
              <span className="text-sm font-medium text-[#E1E3E1] block">
                Estado de pedidos Delivery
              </span>
              <span className="text-xs text-[#A0ABA6]">
                Preparación en comercio, retiro y llegada a tu dirección
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.delivery}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, delivery: e.target.checked })
              }
              className="w-5 h-5 accent-[#7EF8E6]"
            />
          </label>
        </div>

        {/* Pruebas reales de notificación */}
        <div className="space-y-2.5 pt-2 border-t border-[#24302C]">
          <span className="text-xs font-semibold text-[#A0ABA6] block">
            Probar entrega en segundo plano
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={busy || !status.subscribed}
              onClick={() => void handleTest(0)}
              className="min-h-[44px] px-4 rounded-full bg-[#191D1C] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#E1E3E1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45"
            >
              <Send className="w-3.5 h-3.5 text-[#7EF8E6]" />
              <span>Probar alerta ahora</span>
            </button>

            <button
              type="button"
              disabled={busy || !status.subscribed}
              onClick={() => void handleTest(5000)}
              className="min-h-[44px] px-4 rounded-full bg-[#7EF8E6] hover:bg-[#5edac9] text-xs font-bold text-[#111413] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Enviar en 5s (segundo plano)</span>
            </button>
          </div>
          {feedback && (
            <div className="bg-[#142521] border border-[#006A60] rounded-xl px-3.5 py-2.5 text-xs text-[#7EF8E6]">
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
