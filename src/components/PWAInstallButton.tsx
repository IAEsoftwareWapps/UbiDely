import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="min-h-[38px] px-3.5 rounded-full bg-[#191D1C] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#7EF8E6] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[38px] px-3.5 rounded-full bg-[#191D1C] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#7EF8E6] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm bg-[#202624] border border-[#354A44] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 id="ios-install-title" className="text-base font-bold text-[#E1E3E1]">
                  Instalar UbiDely en iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-[#191D1C] text-[#A0ABA6] flex items-center justify-center cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#A0ABA6] leading-relaxed">
                1. Toca el botón <strong className="text-[#E1E3E1]">Compartir</strong> en Safari.
                <br />
                2. Selecciona <strong className="text-[#E1E3E1]">Agregar a inicio</strong> para recibir notificaciones Push en pantalla completa.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-full bg-[#006A60] text-xs font-bold text-[#E1E3E1] cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
