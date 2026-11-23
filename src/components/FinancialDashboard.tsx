import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Car, ShoppingBag } from 'lucide-react';
import {
  CURRENCIES,
  CurrencyCode,
  ExchangeRates,
  FinancialEntry,
  convertFromUsd,
  formatCurrencyAmount,
} from '../data/ubidelyData';

interface FinancialDashboardProps {
  financialEntries: FinancialEntry[];
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
}

interface DailyIncomePoint {
  dayKey: string;
  dayShort: string;
  dayFull: string;
  movilidadUsd: number;
  deliveryUsd: number;
  totalUsd: number;
  movilidad: number;
  delivery: number;
  total: number;
}

type ChartDisplayMode = 'desglosado' | 'total';

const WEEKDAY_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function normalizeIncomeBucket(category: string): 'movilidad' | 'delivery' {
  const lower = category.toLowerCase();
  if (lower.includes('delivery')) {
    return 'delivery';
  }
  return 'movilidad';
}

function formatAxisTick(value: number, currency: CurrencyCode): string {
  const symbol = CURRENCIES[currency].symbol;
  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }
  return `${symbol}${Math.round(value)}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyIncomePoint;
  }>;
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
}

function DashboardTooltip({
  active,
  payload,
  activeCurrency,
  rates,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  const movilidadDisplay = formatCurrencyAmount(point.movilidad, activeCurrency);
  const deliveryDisplay = formatCurrencyAmount(point.delivery, activeCurrency);
  const totalDisplay = formatCurrencyAmount(point.total, activeCurrency);
  const secondaryTotal =
    activeCurrency === 'VES'
      ? `${formatCurrencyAmount(point.totalUsd, 'USD')} USD`
      : formatCurrencyAmount(convertFromUsd(point.totalUsd, 'VES', rates), 'VES');

  return (
    <div className="bg-[#111413] border border-[#354A44] rounded-xl px-3.5 py-3 shadow-xl min-w-[210px] space-y-2">
      <div className="flex items-center justify-between gap-4 border-b border-[#24302C] pb-1.5">
        <span className="text-xs font-semibold text-[#E1E3E1]">{point.dayFull}</span>
        <span className="text-xs font-bold text-[#7EF8E6] tabular-nums">{totalDisplay}</span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#A0ABA6] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-[#7EF8E6] inline-block" aria-hidden="true" />
            Movilidad
          </span>
          <span className="font-semibold text-[#E1E3E1] tabular-nums">{movilidadDisplay}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#A0ABA6] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-[#3B82F6] inline-block" aria-hidden="true" />
            Delivery
          </span>
          <span className="font-semibold text-[#E1E3E1] tabular-nums">{deliveryDisplay}</span>
        </div>
      </div>

      <div className="pt-1 border-t border-[#24302C] text-[11px] text-[#A0ABA6] text-right tabular-nums">
        Ref: {secondaryTotal}
      </div>
    </div>
  );
}

export function FinancialDashboard({
  financialEntries,
  activeCurrency,
  rates,
}: FinancialDashboardProps) {
  const [chartMode, setChartMode] = useState<ChartDisplayMode>('desglosado');

  const {
    dailySeries,
    weeklyTotalUsd,
    movilidadTotalUsd,
    deliveryTotalUsd,
    movilidadCount,
    deliveryCount,
    movilidadPct,
    deliveryPct,
    peakDay,
  } = useMemo(() => {
    const today = new Date();
    const buckets: DailyIncomePoint[] = [];

    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const weekday = WEEKDAY_SHORT_ES[d.getDay()];
      const dayNumber = String(d.getDate()).padStart(2, '0');
      const monthNumber = String(d.getMonth() + 1).padStart(2, '0');

      buckets.push({
        dayKey: String(offset),
        dayShort: offset === 0 ? 'Hoy' : `${weekday} ${dayNumber}`,
        dayFull:
          offset === 0
            ? `Hoy (${weekday} ${dayNumber}/${monthNumber})`
            : offset === 1
            ? `Ayer (${weekday} ${dayNumber}/${monthNumber})`
            : `${weekday} ${dayNumber}/${monthNumber}`,
        movilidadUsd: 0,
        deliveryUsd: 0,
        totalUsd: 0,
        movilidad: 0,
        delivery: 0,
        total: 0,
      });
    }

    let movSum = 0;
    let delSum = 0;
    let movOps = 0;
    let delOps = 0;

    for (const entry of financialEntries) {
      if (entry.type !== 'ingreso') continue;
      const daysAgo = typeof entry.daysAgo === 'number' ? entry.daysAgo : 0;
      if (daysAgo < 0 || daysAgo > 6) continue;

      const bucketIndex = 6 - daysAgo;
      const targetBucket = buckets[bucketIndex];
      const kind = normalizeIncomeBucket(entry.category);

      if (kind === 'movilidad') {
        targetBucket.movilidadUsd += entry.amountUsd;
        movSum += entry.amountUsd;
        movOps += 1;
      } else {
        targetBucket.deliveryUsd += entry.amountUsd;
        delSum += entry.amountUsd;
        delOps += 1;
      }
      targetBucket.totalUsd += entry.amountUsd;
    }

    for (const b of buckets) {
      b.movilidadUsd = Number(b.movilidadUsd.toFixed(2));
      b.deliveryUsd = Number(b.deliveryUsd.toFixed(2));
      b.totalUsd = Number(b.totalUsd.toFixed(2));
      b.movilidad = Number(convertFromUsd(b.movilidadUsd, activeCurrency, rates).toFixed(2));
      b.delivery = Number(convertFromUsd(b.deliveryUsd, activeCurrency, rates).toFixed(2));
      b.total = Number(convertFromUsd(b.totalUsd, activeCurrency, rates).toFixed(2));
    }

    const totalUsd = movSum + delSum;
    const movPct = totalUsd > 0 ? Math.round((movSum / totalUsd) * 100) : 0;
    const delPct = totalUsd > 0 ? 100 - movPct : 0;

    const topDay = buckets.reduce(
      (best, item) => (item.totalUsd > best.totalUsd ? item : best),
      buckets[0]
    );

    return {
      dailySeries: buckets,
      weeklyTotalUsd: totalUsd,
      movilidadTotalUsd: movSum,
      deliveryTotalUsd: delSum,
      movilidadCount: movOps,
      deliveryCount: delOps,
      movilidadPct: movPct,
      deliveryPct: delPct,
      peakDay: topDay,
    };
  }, [financialEntries, activeCurrency, rates]);

  const weeklyPrimary = formatCurrencyAmount(
    convertFromUsd(weeklyTotalUsd, activeCurrency, rates),
    activeCurrency
  );
  const dailyAvgPrimary = formatCurrencyAmount(
    convertFromUsd(weeklyTotalUsd / 7, activeCurrency, rates),
    activeCurrency
  );
  const movilidadPrimary = formatCurrencyAmount(
    convertFromUsd(movilidadTotalUsd, activeCurrency, rates),
    activeCurrency
  );
  const deliveryPrimary = formatCurrencyAmount(
    convertFromUsd(deliveryTotalUsd, activeCurrency, rates),
    activeCurrency
  );

  const hasWeeklyIncome = weeklyTotalUsd > 0;

  return (
    <section
      aria-labelledby="financial-dashboard-heading"
      className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-5"
    >
      {/* Encabezado del Dashboard Financiero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24302C]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#142521] border border-[#006A60] flex items-center justify-center text-[#7EF8E6] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="financial-dashboard-heading"
              className="text-lg font-semibold text-[#E1E3E1]"
            >
              Dashboard Financiero
            </h2>
            <p className="text-xs text-[#A0ABA6] mt-0.5">
              Ingresos diarios de los últimos 7 días · Promedio diario{' '}
              <span className="text-[#E1E3E1] font-semibold tabular-nums">{dailyAvgPrimary}</span>
              {' · '}Total semanal{' '}
              <span className="text-[#7EF8E6] font-semibold tabular-nums">{weeklyPrimary}</span>
            </p>
          </div>
        </div>

        {/* Selector de modo del gráfico */}
        <div
          className="inline-flex items-center p-1 bg-[#111413] border border-[#24302C] rounded-full self-start sm:self-auto"
          role="group"
          aria-label="Modo de visualización del gráfico"
        >
          <button
            type="button"
            onClick={() => setChartMode('desglosado')}
            className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartMode === 'desglosado'
                ? 'bg-[#7EF8E6] text-[#111413]'
                : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
            }`}
          >
            Movilidad vs. Delivery
          </button>
          <button
            type="button"
            onClick={() => setChartMode('total')}
            className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartMode === 'total'
                ? 'bg-[#7EF8E6] text-[#111413]'
                : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
            }`}
          >
            Total diario
          </button>
        </div>
      </div>

      {/* Gráfico de barras Recharts + Desglose Movilidad vs. Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A0ABA6]">
            <span>Ingresos diarios (última semana)</span>
            <div className="flex items-center gap-4">
              {chartMode === 'desglosado' ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[#E1E3E1]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#7EF8E6]" aria-hidden="true" />
                    Movilidad
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#E1E3E1]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#3B82F6]" aria-hidden="true" />
                    Delivery
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#E1E3E1]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2ECC71]" aria-hidden="true" />
                  Ingreso diario consolidado
                </span>
              )}
            </div>
          </div>

          {!hasWeeklyIncome ? (
            <div className="h-[270px] rounded-xl bg-[#111413] border border-[#24302C] flex flex-col items-center justify-center text-center px-6">
              <p className="text-sm font-medium text-[#E1E3E1]">
                Sin ingresos registrados en los últimos 7 días
              </p>
              <p className="text-xs text-[#A0ABA6] mt-1">
                Registra un ingreso en el formulario inferior o completa un servicio para ver la gráfica semanal.
              </p>
            </div>
          ) : (
            <div className="h-[270px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart
                  data={dailySeries}
                  margin={{ top: 10, right: 8, left: 0, bottom: 4 }}
                  barGap={4}
                >
                  <CartesianGrid
                    stroke="#24302C"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dayShort"
                    tick={{ fill: '#A0ABA6', fontSize: 12 }}
                    axisLine={{ stroke: '#24302C' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#A0ABA6', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    tickFormatter={(val: number) => formatAxisTick(val, activeCurrency)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(126, 248, 230, 0.06)' }}
                    content={
                      <DashboardTooltip activeCurrency={activeCurrency} rates={rates} />
                    }
                  />
                  {chartMode === 'desglosado' ? (
                    <>
                      <Bar
                        dataKey="movilidad"
                        name="Movilidad"
                        fill="#7EF8E6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={26}
                      />
                      <Bar
                        dataKey="delivery"
                        name="Delivery"
                        fill="#3B82F6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={26}
                      />
                    </>
                  ) : (
                    <Bar
                      dataKey="total"
                      name="Total diario"
                      fill="#2ECC71"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Desglose por categorías: Movilidad vs. Delivery */}
        <div className="lg:col-span-4 space-y-4 lg:border-l lg:border-[#24302C] lg:pl-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E1E3E1]">
              Desglose por categoría
            </h3>
            <span className="text-xs text-[#A0ABA6] tabular-nums">
              {movilidadCount + deliveryCount} ops.
            </span>
          </div>

          {/* Barra comparativa unificada */}
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded-full bg-[#111413] overflow-hidden flex">
              <div
                className="h-full bg-[#7EF8E6] transition-all duration-300"
                style={{ width: `${movilidadPct}%` }}
                aria-label={`Movilidad ${movilidadPct}%`}
              />
              <div
                className="h-full bg-[#3B82F6] transition-all duration-300"
                style={{ width: `${deliveryPct}%` }}
                aria-label={`Delivery ${deliveryPct}%`}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#A0ABA6] tabular-nums">
              <span>Movilidad {movilidadPct}%</span>
              <span>Delivery {deliveryPct}%</span>
            </div>
          </div>

          {/* Detalle Movilidad */}
          <div className="pt-3 border-t border-[#24302C] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#E1E3E1]">
                <Car className="w-4 h-4 text-[#7EF8E6] shrink-0" />
                <span>Movilidad</span>
              </div>
              <span className="text-sm font-bold text-[#7EF8E6] tabular-nums">
                {movilidadPrimary}
              </span>
            </div>
            <p className="text-xs text-[#A0ABA6] tabular-nums">
              Traslados y encomiendas · {movilidadCount} movimiento{movilidadCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* Detalle Delivery */}
          <div className="pt-3 border-t border-[#24302C] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#E1E3E1]">
                <ShoppingBag className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>Delivery</span>
              </div>
              <span className="text-sm font-bold text-[#3B82F6] tabular-nums">
                {deliveryPrimary}
              </span>
            </div>
            <p className="text-xs text-[#A0ABA6] tabular-nums">
              Restaurantes, farmacia y mercado · {deliveryCount} movimiento{deliveryCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* Día pico */}
          {peakDay && peakDay.totalUsd > 0 && (
            <div className="pt-3 border-t border-[#24302C] flex items-center justify-between gap-2 text-xs">
              <span className="text-[#A0ABA6]">Mejor día de la semana</span>
              <span className="font-semibold text-[#E1E3E1] tabular-nums">
                {peakDay.dayShort} ·{' '}
                {formatCurrencyAmount(peakDay.total, activeCurrency)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
