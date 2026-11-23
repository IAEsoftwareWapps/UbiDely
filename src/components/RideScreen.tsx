import { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Bike,
  Car,
  Package,
  ShieldCheck,
  Fingerprint,
  Smartphone,
  MapPin,
  Globe2,
} from 'lucide-react';
import {
  CurrencyCode,
  ExchangeRates,
  RIDE_TIERS,
  SERVICE_CITIES,
  ServiceCity,
  calculateIntercityDistanceKm,
  calculateZoneDistanceKm,
  formatDualPrice,
} from '../data/ubidelyData';
import { CityMap } from './CityMap';

interface RideScreenProps {
  selectedCity: ServiceCity;
  onChangeCity: (cityId: string) => void;
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  onDispatchRide: (payload: {
    mode: 'urban' | 'national';
    cityId: string;
    destinationCityId: string;
    originId: string;
    destinationId: string;
    originLabel: string;
    destinationLabel: string;
    tierName: string;
    amountUsd: number;
    etaMinutes: number;
    paymentMethod: string;
  }) => void;
  onTriggerSos: () => void;
}

export function RideScreen({
  selectedCity,
  onChangeCity,
  activeCurrency,
  rates,
  onDispatchRide,
  onTriggerSos,
}: RideScreenProps) {
  const [routeMode, setRouteMode] = useState<'urban' | 'national'>('urban');
  const [originZoneId, setOriginZoneId] = useState<string>(selectedCity.zones[0].id);
  const [destZoneId, setDestZoneId] = useState<string>(
    selectedCity.zones[selectedCity.zones.length - 1].id
  );
  const [destCityId, setDestCityId] = useState<string>(
    selectedCity.id === 'valle-industrial' ? 'ciudad-central' : 'valle-industrial'
  );
  const [selectedTierId, setSelectedTierId] = useState<string>('carro-confort');
  const [paymentMethod, setPaymentMethod] = useState<
    'Pago Móvil' | 'Billetera Biométrica' | 'Efectivo USD'
  >('Pago Móvil');

  useEffect(() => {
    setOriginZoneId(selectedCity.zones[0].id);
    setDestZoneId(selectedCity.zones[selectedCity.zones.length - 1].id);
    if (destCityId === selectedCity.id) {
      const fallback = SERVICE_CITIES.find((c) => c.id !== selectedCity.id) ?? SERVICE_CITIES[1];
      setDestCityId(fallback.id);
    }
  }, [selectedCity, destCityId]);

  const destCity = SERVICE_CITIES.find((c) => c.id === destCityId) ?? SERVICE_CITIES[1];
  const originZone =
    selectedCity.zones.find((z) => z.id === originZoneId) ?? selectedCity.zones[0];
  const destZone =
    selectedCity.zones.find((z) => z.id === destZoneId) ??
    selectedCity.zones[selectedCity.zones.length - 1];

  const distanceKm =
    routeMode === 'urban'
      ? calculateZoneDistanceKm(originZone, destZone)
      : calculateIntercityDistanceKm(selectedCity, destCity);

  const visibleTiers =
    routeMode === 'national'
      ? RIDE_TIERS.filter((t) => t.id !== 'moto-express')
      : RIDE_TIERS;

  const activeTier = visibleTiers.find((t) => t.id === selectedTierId) ?? visibleTiers[0];

  const computeTierUsd = (tierId: string) => {
    const t = RIDE_TIERS.find((x) => x.id === tierId) ?? RIDE_TIERS[1];
    if (routeMode === 'urban') {
      return Number((t.baseUsd + distanceKm * t.perKmUsd).toFixed(2));
    }
    return Number((14 + distanceKm * t.intercityMultiplier).toFixed(2));
  };

  const selectedPriceUsd = computeTierUsd(activeTier.id);
  const selectedDual = formatDualPrice(selectedPriceUsd, activeCurrency, rates);

  const selectedEtaMinutes =
    routeMode === 'urban'
      ? Math.max(4, Math.round(distanceKm * 2.2) + activeTier.etaMinutes)
      : Math.max(45, Math.round((distanceKm / 78) * 60));

  const etaLabel =
    routeMode === 'urban'
      ? `${selectedEtaMinutes} min`
      : `${Math.floor(selectedEtaMinutes / 60)}h ${selectedEtaMinutes % 60}m`;

  const handleSwap = () => {
    if (routeMode === 'urban') {
      setOriginZoneId(destZoneId);
      setDestZoneId(originZoneId);
    } else {
      const prevOriginCity = selectedCity.id;
      onChangeCity(destCity.id);
      setDestCityId(prevOriginCity);
    }
  };

  const handleMapSelect = (id: string, target: 'origin' | 'destination') => {
    if (routeMode === 'urban') {
      if (target === 'origin') {
        if (id === destZoneId) setDestZoneId(originZoneId);
        setOriginZoneId(id);
      } else {
        if (id === originZoneId) setOriginZoneId(destZoneId);
        setDestZoneId(id);
      }
    } else {
      if (target === 'origin') {
        if (id === destCityId) setDestCityId(selectedCity.id);
        onChangeCity(id);
      } else {
        if (id === selectedCity.id) return;
        setDestCityId(id);
      }
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'moto-express':
        return <Bike className="w-5 h-5" />;
      case 'encomienda-flash':
        return <Package className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Mapa interactivo */}
      <div className="lg:col-span-7 space-y-4">
        <CityMap
          mode={routeMode}
          city={selectedCity}
          destinationCity={destCity}
          originZoneId={originZone.id}
          destinationZoneId={destZone.id}
          onSelectZone={handleMapSelect}
          distanceKm={distanceKm}
          etaLabel={etaLabel}
          onTriggerSos={onTriggerSos}
        />

        {/* Rutas frecuentes */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#A0ABA6] mr-1">
            {routeMode === 'urban' ? `Rutas en ${selectedCity.name}:` : 'Corredores frecuentes:'}
          </span>
          {routeMode === 'urban'
            ? [
                {
                  label: `${selectedCity.zones[0].name} → ${
                    selectedCity.zones[selectedCity.zones.length - 1].name
                  }`,
                  from: selectedCity.zones[0].id,
                  to: selectedCity.zones[selectedCity.zones.length - 1].id,
                },
                {
                  label: `${selectedCity.zones[1]?.name ?? selectedCity.zones[0].name} → ${
                    selectedCity.zones[3]?.name ?? selectedCity.zones[1].name
                  }`,
                  from: selectedCity.zones[1]?.id ?? selectedCity.zones[0].id,
                  to: selectedCity.zones[3]?.id ?? selectedCity.zones[1].id,
                },
              ].map((preset) => {
                const isActive = originZone.id === preset.from && destZone.id === preset.to;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setOriginZoneId(preset.from);
                      setDestZoneId(preset.to);
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                        : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44] hover:text-[#E1E3E1]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })
            : [
                {
                  label: 'Distrito Central → Valle Industrial',
                  from: 'ciudad-central',
                  to: 'valle-industrial',
                },
                {
                  label: 'Puerto del Lago → Ciudad de la Sierra',
                  from: 'puerto-lago',
                  to: 'ciudad-sierra',
                },
                {
                  label: 'Distrito Central → Bahía de la Costa',
                  from: 'ciudad-central',
                  to: 'bahia-costa',
                },
              ].map((preset) => {
                const isActive = selectedCity.id === preset.from && destCityId === preset.to;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onChangeCity(preset.from);
                      setDestCityId(preset.to);
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                        : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44] hover:text-[#E1E3E1]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
        </div>
      </div>

      {/* Panel de solicitud */}
      <section className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#111413] border border-[#24302C] rounded-full">
          <button
            type="button"
            onClick={() => setRouteMode('urban')}
            className={`min-h-[40px] rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              routeMode === 'urban'
                ? 'bg-[#006A60] text-[#E1E3E1]'
                : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Traslado Urbano</span>
          </button>
          <button
            type="button"
            onClick={() => setRouteMode('national')}
            className={`min-h-[40px] rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              routeMode === 'national'
                ? 'bg-[#006A60] text-[#E1E3E1]'
                : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Ruta Interurbana</span>
          </button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E1E3E1]">
              {routeMode === 'urban' ? `Despacho en ${selectedCity.name}` : 'Traslado Interurbano'}
            </h1>
            <p className="text-sm text-[#A0ABA6] mt-0.5">
              {distanceKm} km estimados · Tarifa multimoneda
            </p>
          </div>
          <span className="text-xs font-semibold text-[#7EF8E6] tabular-nums whitespace-nowrap pt-1">
            Llegada {etaLabel}
          </span>
        </div>

        <div className="relative space-y-3">
          {routeMode === 'urban' ? (
            <>
              <div>
                <label
                  htmlFor="pickup-zone"
                  className="block text-xs font-medium text-[#A0ABA6] mb-1.5"
                >
                  Punto de recogida ({selectedCity.name})
                </label>
                <select
                  id="pickup-zone"
                  value={originZone.id}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === destZone.id) setDestZoneId(originZone.id);
                    setOriginZoneId(next);
                  }}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-medium text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6] focus:ring-2 focus:ring-[#7EF8E6]/20 transition-colors"
                >
                  {selectedCity.zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end -my-1.5 relative z-10 pr-3">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-[#202624] border border-[#354A44] flex items-center justify-center text-[#7EF8E6] hover:bg-[#142521] transition-colors cursor-pointer"
                  aria-label="Intercambiar origen y destino"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label
                  htmlFor="dropoff-zone"
                  className="block text-xs font-medium text-[#A0ABA6] mb-1.5"
                >
                  Destino ({selectedCity.name})
                </label>
                <select
                  id="dropoff-zone"
                  value={destZone.id}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === originZone.id) setOriginZoneId(destZone.id);
                    setDestZoneId(next);
                  }}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-medium text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6] focus:ring-2 focus:ring-[#7EF8E6]/20 transition-colors"
                >
                  {selectedCity.zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.sector})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label
                  htmlFor="origin-city"
                  className="block text-xs font-medium text-[#A0ABA6] mb-1.5"
                >
                  Ciudad de origen
                </label>
                <select
                  id="origin-city"
                  value={selectedCity.id}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === destCityId) setDestCityId(selectedCity.id);
                    onChangeCity(next);
                  }}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-medium text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                >
                  {SERVICE_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end -my-1.5 relative z-10 pr-3">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-[#202624] border border-[#354A44] flex items-center justify-center text-[#7EF8E6] hover:bg-[#142521] transition-colors cursor-pointer"
                  aria-label="Intercambiar ciudades"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label
                  htmlFor="dest-city"
                  className="block text-xs font-medium text-[#A0ABA6] mb-1.5"
                >
                  Ciudad de destino
                </label>
                <select
                  id="dest-city"
                  value={destCity.id}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === selectedCity.id) onChangeCity(destCity.id);
                    setDestCityId(next);
                  }}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-medium text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                >
                  {SERVICE_CITIES.filter((c) => c.id !== selectedCity.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.region}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A0ABA6]">Elige tu vehículo o envío</span>
            <span className="text-xs text-[#6C7A75]">Tarifa dual</span>
          </div>

          <div className="space-y-2.5">
            {visibleTiers.map((tier) => {
              const isSelected = tier.id === activeTier.id;
              const tierUsd = computeTierUsd(tier.id);
              const dual = formatDualPrice(tierUsd, activeCurrency, rates);

              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-2 border-[#7EF8E6] bg-gradient-to-r from-[#006A60]/30 via-[#191D1C] to-[#191D1C]'
                      : 'border border-[#24302C] bg-[#111413]/70 hover:border-[#354A44]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#7EF8E6]/15 text-[#7EF8E6]'
                          : 'bg-[#202624] text-[#A0ABA6]'
                      }`}
                    >
                      {getTierIcon(tier.id)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#E1E3E1] truncate">
                          {tier.name}
                        </span>
                        {routeMode === 'urban' && (
                          <span className="text-xs text-[#7EF8E6] whitespace-nowrap">
                            · {tier.etaMinutes} min
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A0ABA6] truncate mt-0.5">
                        {tier.vehicleExample} · {tier.capacity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-[#E1E3E1] tabular-nums">
                      {dual.primary}
                    </div>
                    <div className="text-xs text-[#A0ABA6] tabular-nums">{dual.secondary}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-1">
          <span className="block text-xs font-semibold text-[#A0ABA6] mb-2">Método de pago</span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { label: 'Pago Móvil', icon: Smartphone },
                { label: 'Billetera Biométrica', icon: Fingerprint },
                { label: 'Efectivo USD', icon: ShieldCheck },
              ] as const
            ).map(({ label, icon: Icon }) => {
              const active = paymentMethod === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPaymentMethod(label)}
                  className={`min-h-[44px] px-2 py-2 rounded-xl border text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                      : 'bg-[#111413] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-full">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onDispatchRide({
              mode: routeMode,
              cityId: selectedCity.id,
              destinationCityId: routeMode === 'urban' ? selectedCity.id : destCity.id,
              originId: originZone.id,
              destinationId: destZone.id,
              originLabel: routeMode === 'urban' ? originZone.name : selectedCity.name,
              destinationLabel: routeMode === 'urban' ? destZone.name : destCity.name,
              tierName: activeTier.name,
              amountUsd: selectedPriceUsd,
              etaMinutes: selectedEtaMinutes,
              paymentMethod,
            })
          }
          className="w-full h-[52px] rounded-full bg-[#006A60] hover:bg-[#004D40] text-[#E1E3E1] font-bold text-sm flex items-center justify-between px-6 transition-all shadow-lg shadow-[#006A60]/20 hover:shadow-[#7EF8E6]/15 cursor-pointer"
        >
          <span>Confirmar {activeTier.name}</span>
          <span className="tabular-nums text-[#7EF8E6]">{selectedDual.primary}</span>
        </button>
      </section>
    </div>
  );
}
