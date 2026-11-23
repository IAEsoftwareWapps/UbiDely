import { useState } from 'react';
import { X, Copy, Check, Fingerprint, Smartphone, CheckCircle2 } from 'lucide-react';
import {
  BANK_OPTIONS,
  CurrencyCode,
  ExchangeRates,
  convertFromUsd,
  formatCurrencyAmount,
  formatDualPrice,
} from '../data/ubidelyData';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUsd: number;
  summaryTitle: string;
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  onCompletePayment: (methodLabel: string, reference: string) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  totalUsd,
  summaryTitle,
  activeCurrency,
  rates,
  onCompletePayment,
}: CheckoutModalProps) {
  const [tab, setTab] = useState<'pago-movil' | 'biometric'>('pago-movil');
  const [bankCode, setBankCode] = useState('0134');
  const [docPrefix, setDocPrefix] = useState<'V' | 'E' | 'J'>('V');
  const [docId, setDocId] = useState('24891032');
  const [refCode, setRefCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const dual = formatDualPrice(totalUsd, activeCurrency, rates);
  const exactVes = formatCurrencyAmount(convertFromUsd(totalUsd, 'VES', rates), 'VES');

  const handleCopy = () => {
    const payload = `0134 Banesco | J-50129483-2 | 0414-901-4420 | ${exactVes}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePagoConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = refCode.replace(/\D/g, '');
    if (cleanRef.length < 4) {
      setErrorMsg('Ingresa los últimos 4 a 6 dígitos de tu referencia bancaria.');
      return;
    }
    const bankName = BANK_OPTIONS.find((b) => b.code === bankCode)?.name ?? 'Banesco';
    onCompletePayment(`Pago Móvil (${bankName} · ${docPrefix}-${docId})`, cleanRef);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-[#202624] border border-[#354A44] rounded-t-3xl sm:rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="checkout-modal-title" className="text-lg font-bold text-[#E1E3E1]">
              Confirmar Pago UbiDely
            </h2>
            <p className="text-xs text-[#A0ABA6] mt-0.5">{summaryTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#191D1C] border border-[#24302C] text-[#A0ABA6] hover:text-[#E1E3E1] flex items-center justify-center cursor-pointer"
            aria-label="Cerrar pago"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#142521] border border-[#006A60] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#7EF8E6]">Total a confirmar</span>
            <div className="text-2xl font-bold text-[#E1E3E1] tabular-nums mt-0.5">
              {dual.primary}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#A0ABA6] block">Equivalente en Bs.</span>
            <span className="text-base font-bold text-[#7EF8E6] tabular-nums">{exactVes}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab('pago-movil')}
            className={`min-h-[44px] rounded-full text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
              tab === 'pago-movil'
                ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Pago Móvil</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('biometric')}
            className={`min-h-[44px] rounded-full text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
              tab === 'biometric'
                ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6]'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Pago Biométrico</span>
          </button>
        </div>

        {tab === 'pago-movil' ? (
          <form onSubmit={handlePagoConfirm} className="space-y-4">
            <div className="bg-[#111413] border border-[#24302C] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#E1E3E1]">
                  0134 Banesco · J-50129483-2 · 0414-901-4420
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[#7EF8E6] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[#A0ABA6]">
                Transfiere exactamente <strong className="text-[#E1E3E1]">{exactVes}</strong> e ingresa el número de referencia abajo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-bank" className="block text-xs text-[#A0ABA6] mb-1">
                  Banco emisor
                </label>
                <select
                  id="modal-bank"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-xs text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} · {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-doc" className="block text-xs text-[#A0ABA6] mb-1">
                  Documento de identidad
                </label>
                <div className="flex gap-1.5">
                  <select
                    aria-label="Prefijo"
                    value={docPrefix}
                    onChange={(e) => setDocPrefix(e.target.value as 'V' | 'E' | 'J')}
                    className="w-14 h-11 px-2 rounded-xl bg-[#111413] border border-[#24302C] text-xs font-bold text-[#E1E3E1]"
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="J">J</option>
                  </select>
                  <input
                    id="modal-doc"
                    type="text"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                    className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-xs font-mono-tabular text-[#E1E3E1]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="modal-ref" className="block text-xs text-[#A0ABA6] mb-1">
                Número de referencia bancaria
              </label>
              <input
                id="modal-ref"
                type="text"
                value={refCode}
                onChange={(e) => {
                  setRefCode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ej. 928410"
                className="w-full h-12 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-mono-tabular text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
              />
              {errorMsg && <p className="text-xs text-[#FFB4AB] mt-1.5">{errorMsg}</p>}
            </div>

            <button
              type="submit"
              className="w-full h-[52px] rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-bold text-[#E1E3E1] transition-colors cursor-pointer"
            >
              Confirmar Pago y Asignar Conductor
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#111413] border border-[#24302C] rounded-xl p-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#2ECC71] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Método Biométrico Verificado</span>
              </div>
              <p className="text-[#A0ABA6]">
                Autoriza el cargo inmediato de {dual.primary} ({exactVes}) para recibir al instante la foto, vehículo y placa de tu conductor.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onCompletePayment(
                  'Pago Rápido Biométrico',
                  String(Math.floor(100000 + Math.random() * 900000))
                )
              }
              className="w-full h-[52px] rounded-full bg-[#7EF8E6] hover:bg-[#5edac9] text-sm font-bold text-[#111413] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Fingerprint className="w-5 h-5" />
              <span>Confirmar con Biometría · {dual.primary}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
