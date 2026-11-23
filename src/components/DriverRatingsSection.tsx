import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  Calendar,
  Car,
  Filter,
  MessageSquare,
  RotateCcw,
  ShoppingBag,
  Star,
  TrendingUp,
} from 'lucide-react';
import {
  DriverProfile,
  DriverRatingRecord,
  getRelativeIsoDate,
} from '../data/ubidelyData';

interface DriverRatingsSectionProps {
  drivers: DriverProfile[];
  ratings: DriverRatingRecord[];
}

type DatePreset = '7d' | '15d' | '30d' | 'all' | 'custom';

interface DailyRatingPoint {
  dateIso: string;
  dateShort: string;
  avgRating: number;
  count: number;
}

interface DistributionPoint {
  label: string;
  stars: number;
  count: number;
  pct: number;
  color: string;
}

const STAR_COLORS: Record<number, string> = {
  5: '#2ECC71',
  4: '#7EF8E6',
  3: '#F59E0B',
  2: '#FB923C',
  1: '#FF5449',
};

function formatShortIsoDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyRatingPoint;
  }>;
}

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#111413] border border-[#354A44] rounded-xl px-3.5 py-2.5 shadow-xl space-y-1">
      <div className="text-xs font-semibold text-[#E1E3E1]">{point.dateIso}</div>
      <div className="flex items-center gap-2 text-xs">
        <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
        <span className="font-bold text-[#7EF8E6] tabular-nums">
          {point.avgRating.toFixed(2)} / 5.00
        </span>
      </div>
      <div className="text-[11px] text-[#A0ABA6] tabular-nums">
        {point.count} calificación{point.count === 1 ? '' : 'es'}
      </div>
    </div>
  );
}

interface DistTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DistributionPoint;
  }>;
}

function DistributionTooltip({ active, payload }: DistTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#111413] border border-[#354A44] rounded-xl px-3.5 py-2.5 shadow-xl space-y-1">
      <div className="text-xs font-semibold text-[#E1E3E1]">{point.label}</div>
      <div className="text-xs font-bold text-[#7EF8E6] tabular-nums">
        {point.count} evaluación{point.count === 1 ? '' : 'es'} ({point.pct}%)
      </div>
    </div>
  );
}

export function DriverRatingsSection({ drivers, ratings }: DriverRatingsSectionProps) {
  const todayIso = useMemo(() => getRelativeIsoDate(0), []);
  const earliestIso = useMemo(() => {
    if (ratings.length === 0) return getRelativeIsoDate(30);
    return ratings.reduce(
      (min, item) => (item.dateIso < min ? item.dateIso : min),
      ratings[0].dateIso
    );
  }, [ratings]);

  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [startDate, setStartDate] = useState<string>(() => getRelativeIsoDate(30));
  const [endDate, setEndDate] = useState<string>(() => getRelativeIsoDate(0));

  const driverOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; tier?: string }>();
    for (const d of drivers) {
      map.set(d.id, { id: d.id, name: d.name, tier: d.tier });
    }
    for (const r of ratings) {
      if (!map.has(r.driverId)) {
        map.set(r.driverId, { id: r.driverId, name: r.driverName });
      }
    }
    return Array.from(map.values());
  }, [drivers, ratings]);

  const applyPreset = (preset: Exclude<DatePreset, 'custom'>) => {
    setDatePreset(preset);
    setEndDate(todayIso);
    if (preset === '7d') {
      setStartDate(getRelativeIsoDate(7));
    } else if (preset === '15d') {
      setStartDate(getRelativeIsoDate(15));
    } else if (preset === '30d') {
      setStartDate(getRelativeIsoDate(30));
    } else {
      setStartDate(earliestIso);
    }
  };

  const resetFilters = () => {
    setSelectedDriverId('all');
    applyPreset('30d');
  };

  const filteredRatings = useMemo(() => {
    const normalizedStart = startDate <= endDate ? startDate : endDate;
    const normalizedEnd = startDate <= endDate ? endDate : startDate;

    return ratings
      .filter((item) => {
        const matchesDriver =
          selectedDriverId === 'all' || item.driverId === selectedDriverId;
        const matchesDate =
          (!normalizedStart || item.dateIso >= normalizedStart) &&
          (!normalizedEnd || item.dateIso <= normalizedEnd);
        return matchesDriver && matchesDate;
      })
      .sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  }, [ratings, selectedDriverId, startDate, endDate]);

  const {
    avgRating,
    positivePct,
    rideCount,
    deliveryCount,
    dailySeries,
    distributionSeries,
    driverLeaderboard,
    topDriver,
  } = useMemo(() => {
    const total = filteredRatings.length;
    const sumStars = filteredRatings.reduce((acc, item) => acc + item.stars, 0);
    const avg = total > 0 ? sumStars / total : 0;
    const positives = filteredRatings.filter((item) => item.stars >= 4).length;
    const posPct = total > 0 ? Math.round((positives / total) * 100) : 0;

    let rides = 0;
    let deliveries = 0;
    const byDate = new Map<string, { sum: number; count: number }>();
    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const byDriver = new Map<
      string,
      { driverId: string; driverName: string; sum: number; count: number; fiveStars: number }
    >();

    for (const item of filteredRatings) {
      if (item.serviceType === 'ride') rides += 1;
      else deliveries += 1;

      starCounts[item.stars] = (starCounts[item.stars] ?? 0) + 1;

      const dateBucket = byDate.get(item.dateIso) ?? { sum: 0, count: 0 };
      dateBucket.sum += item.stars;
      dateBucket.count += 1;
      byDate.set(item.dateIso, dateBucket);

      const drvBucket = byDriver.get(item.driverId) ?? {
        driverId: item.driverId,
        driverName: item.driverName,
        sum: 0,
        count: 0,
        fiveStars: 0,
      };
      drvBucket.sum += item.stars;
      drvBucket.count += 1;
      if (item.stars === 5) drvBucket.fiveStars += 1;
      byDriver.set(item.driverId, drvBucket);
    }

    const sortedDates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
    const trend: DailyRatingPoint[] = sortedDates.map((iso) => {
      const entry = byDate.get(iso)!;
      return {
        dateIso: iso,
        dateShort: formatShortIsoDate(iso),
        avgRating: Number((entry.sum / entry.count).toFixed(2)),
        count: entry.count,
      };
    });

    const distribution: DistributionPoint[] = [5, 4, 3, 2, 1].map((stars) => {
      const count = starCounts[stars] ?? 0;
      return {
        label: `${stars} estrella${stars === 1 ? '' : 's'}`,
        stars,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: STAR_COLORS[stars],
      };
    });

    const leaderboard = Array.from(byDriver.values())
      .map((d) => ({
        ...d,
        avg: Number((d.sum / d.count).toFixed(2)),
      }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count);

    return {
      avgRating: avg,
      positivePct: posPct,
      rideCount: rides,
      deliveryCount: deliveries,
      dailySeries: trend,
      distributionSeries: distribution,
      driverLeaderboard: leaderboard,
      topDriver: leaderboard[0] ?? null,
    };
  }, [filteredRatings]);

  return (
    <div className="space-y-6">
      {/* Barra de filtros: Conductor y rango de fechas */}
      <section className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24302C] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#142521] border border-[#006A60] flex items-center justify-center text-[#F59E0B] shrink-0">
              <Star className="w-5 h-5 fill-[#F59E0B]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E1E3E1]">
                Calificaciones y Desempeño de Conductores
              </h2>
              <p className="text-xs text-[#A0ABA6] mt-0.5">
                Analiza la puntuación promedio, tendencia temporal y comentarios filtrados por conductor y fechas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="min-h-[38px] px-3.5 rounded-full bg-[#111413] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#E1E3E1] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7EF8E6]" />
            <span>Restablecer filtros</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Selector de conductor */}
          <div className="lg:col-span-4">
            <label
              htmlFor="rating-driver-filter"
              className="flex items-center gap-1.5 text-xs font-medium text-[#A0ABA6] mb-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-[#7EF8E6]" />
              <span>Filtrar por conductor</span>
            </label>
            <select
              id="rating-driver-filter"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
            >
              <option value="all">Todos los conductores ({driverOptions.length})</option>
              {driverOptions.map((drv) => (
                <option key={drv.id} value={drv.id}>
                  {drv.name}
                  {drv.tier ? ` · ${drv.tier}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Presets rápidos de fechas */}
          <div className="lg:col-span-4 space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#A0ABA6]">
              <Calendar className="w-3.5 h-3.5 text-[#7EF8E6]" />
              <span>Rango rápido</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Rango de fechas rápido">
              {(
                [
                  { id: '7d', label: '7 días' },
                  { id: '15d', label: '15 días' },
                  { id: '30d', label: '30 días' },
                  { id: 'all', label: 'Histórico' },
                ] as const
              ).map((preset) => {
                const active = datePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={`min-h-[42px] px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                        : 'bg-[#111413] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44] hover:text-[#E1E3E1]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fechas personalizadas Desde / Hasta */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rating-date-start" className="block text-xs font-medium text-[#A0ABA6] mb-1.5">
                Desde
              </label>
              <input
                id="rating-date-start"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-xs font-mono-tabular text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>
            <div>
              <label htmlFor="rating-date-end" className="block text-xs font-medium text-[#A0ABA6] mb-1.5">
                Hasta
              </label>
              <input
                id="rating-date-end"
                type="date"
                value={endDate}
                min={startDate}
                max={todayIso}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-xs font-mono-tabular text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* KPIs de Calificaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#A0ABA6]">
            <span>Promedio del período</span>
            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#E1E3E1] tabular-nums">
            {filteredRatings.length > 0 ? `${avgRating.toFixed(2)} ★` : '—'}
          </div>
          <div className="text-xs text-[#A0ABA6] tabular-nums">
            Basado en {filteredRatings.length} reseña{filteredRatings.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#A0ABA6]">
            <span>Satisfacción (4–5 ★)</span>
            <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
          </div>
          <div className="text-2xl font-bold text-[#2ECC71] tabular-nums">
            {filteredRatings.length > 0 ? `${positivePct}%` : '—'}
          </div>
          <div className="text-xs text-[#A0ABA6]">Evaluaciones positivas</div>
        </div>

        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#A0ABA6]">
            <span>Servicios evaluados</span>
            <Car className="w-4 h-4 text-[#7EF8E6]" />
          </div>
          <div className="text-2xl font-bold text-[#7EF8E6] tabular-nums">
            {filteredRatings.length}
          </div>
          <div className="text-xs text-[#A0ABA6] tabular-nums">
            {rideCount} traslados · {deliveryCount} delivery
          </div>
        </div>

        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#A0ABA6]">
            <span>Mejor evaluado</span>
            <Award className="w-4 h-4 text-[#7EF8E6]" />
          </div>
          <div className="text-lg font-bold text-[#E1E3E1] truncate">
            {topDriver ? topDriver.driverName : 'Sin datos'}
          </div>
          <div className="text-xs text-[#7EF8E6] tabular-nums">
            {topDriver
              ? `${topDriver.avg.toFixed(2)} ★ (${topDriver.count} reseña${topDriver.count === 1 ? '' : 's'})`
              : 'Ajusta el rango de fechas'}
          </div>
        </div>
      </div>

      {/* Gráficos Recharts */}
      {filteredRatings.length === 0 ? (
        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-semibold text-[#E1E3E1]">
            No hay calificaciones registradas en este filtro
          </p>
          <p className="text-xs text-[#A0ABA6]">
            Amplía el rango de fechas o selecciona otro conductor para visualizar las métricas.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-[42px] px-5 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] transition-colors cursor-pointer"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Gráfico 1: Tendencia temporal de calificaciones */}
          <div className="lg:col-span-7 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-[#E1E3E1]">
                  Evolución del puntaje promedio
                </h3>
                <p className="text-xs text-[#A0ABA6]">
                  Promedio diario de estrellas recibidas en el rango seleccionado
                </p>
              </div>
              <span className="text-xs font-mono-tabular text-[#7EF8E6]">
                {startDate} → {endDate}
              </span>
            </div>

            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={dailySeries}
                  margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="ratingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7EF8E6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7EF8E6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#24302C" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateShort"
                    tick={{ fill: '#A0ABA6', fontSize: 11 }}
                    axisLine={{ stroke: '#24302C' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fill: '#A0ABA6', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}★`}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="avgRating"
                    stroke="#7EF8E6"
                    strokeWidth={2.5}
                    fill="url(#ratingAreaGrad)"
                    activeDot={{ r: 5, fill: '#7EF8E6', stroke: '#111413', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Distribución por estrellas */}
          <div className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4 min-w-0">
            <div>
              <h3 className="text-base font-semibold text-[#E1E3E1]">
                Distribución por estrellas
              </h3>
              <p className="text-xs text-[#A0ABA6]">
                Cantidad de calificaciones desde 5★ hasta 1★
              </p>
            </div>

            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={distributionSeries}
                  layout="vertical"
                  margin={{ top: 4, right: 18, left: 10, bottom: 4 }}
                >
                  <CartesianGrid stroke="#24302C" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#A0ABA6', fontSize: 11 }}
                    axisLine={{ stroke: '#24302C' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={78}
                    tick={{ fill: '#E1E3E1', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(126, 248, 230, 0.06)' }}
                    content={<DistributionTooltip />}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {distributionSeries.map((entry) => (
                      <Cell key={entry.stars} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Comparativa por conductor + Comentarios del período */}
      {filteredRatings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ranking por conductor */}
          <div className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#E1E3E1]">
                Comparativa por conductor
              </h3>
              <span className="text-xs text-[#A0ABA6] tabular-nums">
                {driverLeaderboard.length} conductor{driverLeaderboard.length === 1 ? '' : 'es'}
              </span>
            </div>

            <div className="space-y-3">
              {driverLeaderboard.map((drv) => {
                const isSelected = selectedDriverId === drv.driverId;
                const widthPct = Math.round((drv.avg / 5) * 100);
                return (
                  <button
                    key={drv.driverId}
                    type="button"
                    onClick={() =>
                      setSelectedDriverId(isSelected ? 'all' : drv.driverId)
                    }
                    className={`w-full text-left rounded-xl p-3 border transition-colors cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#142521] border-[#7EF8E6]'
                        : 'bg-[#111413] border-[#24302C] hover:border-[#354A44]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#E1E3E1] truncate">
                        {drv.driverName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F59E0B] tabular-nums shrink-0">
                        <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                        {drv.avg.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#191D1C] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#006A60] to-[#7EF8E6]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A0ABA6] tabular-nums">
                      <span>
                        {drv.count} calificación{drv.count === 1 ? '' : 'es'}
                      </span>
                      <span>{drv.fiveStars} con 5★</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de reseñas y comentarios filtrados */}
          <div className="lg:col-span-7 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#7EF8E6]" />
                <h3 className="text-base font-semibold text-[#E1E3E1]">
                  Reseñas recibidas en el período
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#7EF8E6] tabular-nums">
                {filteredRatings.length} registro{filteredRatings.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-[#24302C] max-h-[360px] overflow-y-auto pr-1">
              {filteredRatings.map((item) => (
                <div key={item.id} className="py-3.5 space-y-1.5 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[#E1E3E1]">{item.driverName}</span>
                      <span className="text-[#6C7A75]" aria-hidden="true">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#A0ABA6]">
                        {item.serviceType === 'ride' ? (
                          <Car className="w-3 h-3 text-[#7EF8E6]" />
                        ) : (
                          <ShoppingBag className="w-3 h-3 text-[#3B82F6]" />
                        )}
                        <span className="font-mono-tabular">{item.serviceId}</span>
                      </span>
                      <span className="text-[#6C7A75]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono-tabular text-[#A0ABA6]">{item.dateIso}</span>
                    </div>

                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111413] border border-[#24302C] text-xs font-bold tabular-nums">
                      <Star
                        className="w-3.5 h-3.5"
                        style={{
                          color: STAR_COLORS[item.stars],
                          fill: STAR_COLORS[item.stars],
                        }}
                      />
                      <span style={{ color: STAR_COLORS[item.stars] }}>{item.stars}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#E1E3E1] leading-relaxed">“{item.comment}”</p>
                  <p className="text-[11px] text-[#6C7A75]">Pasajero / Cliente: {item.passengerName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
