import { useMemo, useState } from 'react';
import {
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  MapPin,
  Navigation,
  RotateCcw,
  Search,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import {
  AuthUser,
  CurrencyCode,
  ExchangeRates,
  ServiceHistoryEntry,
  formatDualPrice,
} from '../data/ubidelyData';
import { ImageWithFallback } from './ImageWithFallback';

interface UserHistoryScreenProps {
  currentUser: AuthUser | null;
  history: ServiceHistoryEntry[];
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  onRepeatDeliveryOrder: (entry: ServiceHistoryEntry) => void;
  onOpenTrack: () => void;
  onOpenAccountModal: () => void;
}

type HistoryFilter = 'todos' | 'ride' | 'delivery';

export function UserHistoryScreen({
  currentUser,
  history,
  activeCurrency,
  rates,
  onRepeatDeliveryOrder,
  onOpenTrack,
  onOpenAccountModal,
}: UserHistoryScreenProps) {
  const [filter, setFilter] = useState<HistoryFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(history[1]?.id ?? null);

  const stats = useMemo(() => {
    const rides = history.filter((item) => item.type === 'ride').length;
    const deliveries = history.filter((item) => item.type === 'delivery').length;
    return {
      total: history.length,
      rides,
      deliveries,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter((entry) => {
      const matchesType = filter === 'todos' || entry.type === filter;
      const matchesQuery =
        !q ||
        entry.id.toLowerCase().includes(q) ||
        entry.title.toLowerCase().includes(q) ||
        entry.driverName.toLowerCase().includes(q) ||
        entry.cityName.toLowerCase().includes(q) ||
        (entry.merchantName && entry.merchantName.toLowerCase().includes(q)) ||
        (entry.orderItems &&
          entry.orderItems.some((item) => item.name.toLowerCase().includes(q)));
      return matchesType && matchesQuery;
    });
  }, [history, filter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo de Usuario: Mis Viajes y Pedidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#142521] border border-[#006A60] flex items-center justify-center text-[#7EF8E6] shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E1E3E1]">
              Mis Viajes y Pedidos
            </h1>
            <p className="text-sm text-[#A0ABA6] mt-0.5">
              Historial completo de tus traslados y pedidos de delivery realizados en UbiDely
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAccountModal}
          className="min-h-[42px] px-4 rounded-full bg-[#191D1C] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#E1E3E1] inline-flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <UserCheck className="w-4 h-4 text-[#7EF8E6]" />
          <span>
            {currentUser
              ? `${currentUser.name} · ${currentUser.role}`
              : 'Cuenta de Usuario / Acceso'}
          </span>
        </button>
      </div>

      {/* Tarjetas de resumen del usuario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#A0ABA6]">Total de servicios</p>
            <p className="text-2xl font-bold text-[#E1E3E1] tabular-nums mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#202624] border border-[#354A44] flex items-center justify-center text-[#7EF8E6]">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#A0ABA6]">Viajes de movilidad</p>
            <p className="text-2xl font-bold text-[#7EF8E6] tabular-nums mt-1">{stats.rides}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#142521] border border-[#006A60] flex items-center justify-center text-[#7EF8E6]">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#A0ABA6]">Pedidos de Delivery</p>
            <p className="text-2xl font-bold text-[#3B82F6] tabular-nums mt-1">
              {stats.deliveries}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#111413] border border-[#24302C] flex items-center justify-center text-[#3B82F6]">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6C7A75] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por comercio, plato, ruta, conductor o código..."
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6] focus:ring-2 focus:ring-[#7EF8E6]/20 transition-colors"
          />
        </div>

        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
          role="group"
          aria-label="Filtrar historial de servicios"
        >
          {(
            [
              { id: 'todos', label: 'Todos' },
              { id: 'ride', label: 'Viajes' },
              { id: 'delivery', label: 'Delivery' },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[44px] px-4 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                    : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44] hover:text-[#E1E3E1]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de historial */}
      {filteredHistory.length === 0 ? (
        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-semibold text-[#E1E3E1]">
            No hay servicios que coincidan con tu filtro
          </p>
          <p className="text-sm text-[#A0ABA6]">
            Limpiar la búsqueda o cambia el filtro para ver todos tus viajes y pedidos.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('todos');
              setSearchQuery('');
            }}
            className="min-h-[44px] px-5 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-semibold text-[#E1E3E1] transition-colors cursor-pointer"
          >
            Mostrar todo el historial
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((entry) => {
            const dual = formatDualPrice(entry.amountUsd, activeCurrency, rates);
            const isDelivery = entry.type === 'delivery';
            const isExpanded = expandedId === entry.id;
            const canRepeat = isDelivery && Array.isArray(entry.orderItems) && entry.orderItems.length > 0;

            return (
              <article
                key={entry.id}
                className={`bg-[#191D1C] rounded-2xl p-5 space-y-4 transition-colors ${
                  entry.status === 'En curso'
                    ? 'border border-[#006A60]'
                    : 'border border-[#24302C] hover:border-[#354A44]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDelivery
                          ? 'bg-[#111413] border-[#24302C] text-[#3B82F6]'
                          : 'bg-[#142521] border-[#006A60] text-[#7EF8E6]'
                      }`}
                    >
                      {isDelivery ? (
                        <ShoppingBag className="w-5 h-5" />
                      ) : (
                        <Car className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono-tabular font-bold text-[#7EF8E6]">
                          {entry.id}
                        </span>
                        <span className="text-[#6C7A75]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[#A0ABA6]">{entry.dateLabel}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            entry.status === 'En curso'
                              ? 'bg-[#7EF8E6]/12 border-[#7EF8E6]/50 text-[#7EF8E6]'
                              : 'bg-[#2ECC71]/12 border-[#2ECC71]/40 text-[#2ECC71]'
                          }`}
                        >
                          {entry.status === 'En curso' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          <span>{entry.status}</span>
                        </span>
                      </div>

                      <h2 className="text-base font-semibold text-[#E1E3E1] leading-snug">
                        {entry.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A0ABA6]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#7EF8E6]" />
                          {entry.cityName}: {entry.originLabel} → {entry.destinationLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-[#A0ABA6]" />
                          {entry.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#24302C]">
                    <div className="text-left md:text-right">
                      <div className="text-lg font-bold text-[#E1E3E1] tabular-nums">
                        {dual.primary}
                      </div>
                      <div className="text-xs text-[#A0ABA6] tabular-nums">{dual.secondary}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.status === 'En curso' && (
                        <button
                          type="button"
                          onClick={onOpenTrack}
                          className="min-h-[42px] px-4 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Ver rastreo</span>
                        </button>
                      )}

                      {canRepeat && (
                        <button
                          type="button"
                          onClick={() => onRepeatDeliveryOrder(entry)}
                          className="min-h-[42px] px-4 rounded-full bg-[#7EF8E6] hover:bg-[#5edac9] text-xs font-bold text-[#111413] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Repetir pedido</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="w-10 h-10 rounded-full bg-[#111413] border border-[#24302C] hover:border-[#354A44] text-[#A0ABA6] hover:text-[#E1E3E1] flex items-center justify-center transition-colors cursor-pointer"
                        aria-label={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalle expandible del servicio o productos del pedido */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#24302C] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111413] border border-[#24302C] rounded-xl p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#354A44] shrink-0">
                          <ImageWithFallback
                            src={entry.driverAvatar}
                            alt={entry.driverName}
                            fallbackTitle={entry.driverName}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#E1E3E1] truncate">
                            {entry.driverName}
                          </p>
                          <p className="text-xs text-[#A0ABA6] truncate">{entry.vehicleOrTier}</p>
                        </div>
                      </div>
                      <span className="font-mono-tabular text-xs font-bold text-[#E1E3E1] bg-[#202624] border border-[#354A44] px-2.5 py-1 rounded-md">
                        Placa: {entry.plate}
                      </span>
                    </div>

                    {isDelivery && entry.orderItems && entry.orderItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#A0ABA6]">
                          Artículos del pedido ({entry.merchantName})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {entry.orderItems.map((item) => {
                            const itemDual = formatDualPrice(
                              item.unitPriceUsd * item.quantity,
                              activeCurrency,
                              rates
                            );
                            return (
                              <div
                                key={`${entry.id}-${item.productId}`}
                                className="flex items-center justify-between gap-3 bg-[#111413] border border-[#24302C] rounded-xl p-2.5"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-[#191D1C]">
                                    <ImageWithFallback
                                      src={item.imageUrl}
                                      alt={item.name}
                                      fallbackTitle={item.merchant}
                                      lazy
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#E1E3E1] truncate">
                                      {item.quantity}x {item.name}
                                    </p>
                                    <p className="text-[11px] text-[#A0ABA6] truncate">
                                      {item.merchant}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-[#7EF8E6] tabular-nums shrink-0">
                                  {itemDual.primary}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
