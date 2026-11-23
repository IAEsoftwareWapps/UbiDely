import { useEffect, useMemo, useState } from 'react';
import {
  Car,
  Store,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  UtensilsCrossed,
  Wallet,
  UserCheck,
  CheckCircle2,
  XCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  AdminRole,
  AdminUser,
  AuthUser,
  BootstrapStatus,
  CurrencyCode,
  DeliveryCategory,
  DeliveryProduct,
  DriverProfile,
  ExchangeRates,
  FinancialEntry,
  PartnerRequest,
  RestaurantMerchant,
  formatDualPrice,
} from '../data/ubidelyData';
import { MEDIA_ASSETS } from '../assets/mediaAssets';
import { ImageWithFallback } from './ImageWithFallback';
import { FinancialDashboard } from './FinancialDashboard';
import { AuthGatePanel } from './AuthGatePanel';

type AdminSection = 'requests' | 'drivers' | 'merchants' | 'users' | 'finance';

interface AdminScreenProps {
  currentUser: AuthUser | null;
  bootstrapStatus: BootstrapStatus;
  onAuthSuccess: (user: AuthUser) => Promise<void> | void;
  onRefreshSession: () => Promise<void>;
  onLogout: () => Promise<void>;
  partnerRequests: PartnerRequest[];
  onDecidePartnerRequest: (requestId: string, decision: 'aprobado' | 'rechazado') => Promise<void>;
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  drivers: DriverProfile[];
  onAddDriver: (driver: Omit<DriverProfile, 'id'>) => void;
  onToggleDriverStatus: (id: string) => void;
  onDeleteDriver: (id: string) => void;
  merchants: RestaurantMerchant[];
  onAddMerchant: (merchant: Omit<RestaurantMerchant, 'id'>) => void;
  onDeleteMerchant: (id: string) => void;
  catalog: DeliveryProduct[];
  onAddProduct: (product: Omit<DeliveryProduct, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
  adminUsers: AdminUser[];
  onAddAdminUser: (user: {
    name: string;
    email: string;
    password: string;
    role: Exclude<AdminRole, 'Propietario'>;
  }) => Promise<void>;
  onToggleAdminActive: (id: string) => Promise<void>;
  onDeleteAdminUser: (id: string) => Promise<void>;
  financialEntries: FinancialEntry[];
  onAddFinancialEntry: (entry: Omit<FinancialEntry, 'id' | 'dateLabel'>) => void;
}

const CATALOG_IMAGE_PRESETS = [
  { label: 'Plato Criollo / Arepas', url: MEDIA_ASSETS.dishArepaReina },
  { label: 'Hamburguesa / Grill', url: MEDIA_ASSETS.dishSmashBurger },
  { label: 'Farmacia / Cuidado', url: MEDIA_ASSETS.pharmacyWellnessKit },
  { label: 'Mercado / Frutas y Café', url: MEDIA_ASSETS.groceryFreshProduce },
];

export function AdminScreen({
  currentUser,
  bootstrapStatus,
  onAuthSuccess,
  onRefreshSession,
  onLogout,
  partnerRequests,
  onDecidePartnerRequest,
  activeCurrency,
  rates,
  drivers,
  onAddDriver,
  onToggleDriverStatus,
  onDeleteDriver,
  merchants,
  onAddMerchant,
  onDeleteMerchant,
  catalog,
  onAddProduct,
  onDeleteProduct,
  adminUsers,
  onAddAdminUser,
  onToggleAdminActive,
  onDeleteAdminUser,
  financialEntries,
  onAddFinancialEntry,
}: AdminScreenProps) {
  const isAuthorizedAdmin = Boolean(
    currentUser &&
      currentUser.active &&
      currentUser.approvalStatus === 'aprobado' &&
      (currentUser.role === 'Propietario' ||
        currentUser.role === 'Super Admin' ||
        currentUser.role === 'Operaciones' ||
        currentUser.role === 'Finanzas')
  );

  const allowedSections = useMemo<AdminSection[]>(() => {
    if (!currentUser || !isAuthorizedAdmin) return [];
    switch (currentUser.role) {
      case 'Propietario':
        return ['requests', 'drivers', 'merchants', 'users', 'finance'];
      case 'Super Admin':
        return ['drivers', 'merchants', 'users', 'finance'];
      case 'Operaciones':
        return ['drivers', 'merchants'];
      case 'Finanzas':
        return ['finance'];
      default:
        return [];
    }
  }, [currentUser, isAuthorizedAdmin]);

  const [section, setSection] = useState<AdminSection>('drivers');

  useEffect(() => {
    if (allowedSections.length > 0 && !allowedSections.includes(section)) {
      setSection(allowedSections[0]);
    }
  }, [allowedSections, section]);

  // Formulario Conductores
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvVehicle, setDrvVehicle] = useState('');
  const [drvPlate, setDrvPlate] = useState('');
  const [drvTier, setDrvTier] = useState<DriverProfile['tier']>('Carro Confort');

  // Formulario Restaurantes / Comercios
  const [merchName, setMerchName] = useState('');
  const [merchCat, setMerchCat] = useState<Exclude<DeliveryCategory, 'Todos'>>('Restaurantes');
  const [merchZone, setMerchZone] = useState('');
  const [merchPrep, setMerchPrep] = useState('20–30 min');

  // Formulario Menús / Productos
  const [prodMerchantId, setProdMerchantId] = useState(merchants[0]?.id ?? '');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('10.00');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState(CATALOG_IMAGE_PRESETS[0].url);

  // Formulario Usuarios Admin
  const [admName, setAdmName] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admPassword, setAdmPassword] = useState('');
  const [admRole, setAdmRole] = useState<Exclude<AdminRole, 'Propietario'>>('Operaciones');
  const [admFeedback, setAdmFeedback] = useState<string | null>(null);
  const [admError, setAdmError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // Formulario Control Financiero (Ingresos y Gastos)
  const [finFilter, setFinFilter] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [finType, setFinType] = useState<'ingreso' | 'gasto'>('ingreso');
  const [finConcept, setFinConcept] = useState('');
  const [finCategory, setFinCategory] = useState('Movilidad');
  const [finAmount, setFinAmount] = useState('');
  const [finMethod, setFinMethod] = useState('Transferencia');

  const totalIngresosUsd = financialEntries
    .filter((e) => e.type === 'ingreso')
    .reduce((sum, e) => sum + e.amountUsd, 0);
  const totalGastosUsd = financialEntries
    .filter((e) => e.type === 'gasto')
    .reduce((sum, e) => sum + e.amountUsd, 0);
  const netBalanceUsd = totalIngresosUsd - totalGastosUsd;
  const marginPct =
    totalIngresosUsd > 0 ? Math.round((netBalanceUsd / totalIngresosUsd) * 100) : 0;

  const filteredFinance = financialEntries.filter(
    (entry) => finFilter === 'todos' || entry.type === finFilter
  );

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drvName.trim() || !drvVehicle.trim() || !drvPlate.trim()) return;
    onAddDriver({
      name: drvName.trim(),
      phone: drvPhone.trim() || '+58 414-000-0000',
      vehicle: drvVehicle.trim(),
      plate: drvPlate.trim().toUpperCase(),
      tier: drvTier,
      rating: '5.00',
      avatar: MEDIA_ASSETS.courierAvatarCarlos,
      status: 'Disponible',
    });
    setDrvName('');
    setDrvPhone('');
    setDrvVehicle('');
    setDrvPlate('');
  };

  const handleMerchantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchName.trim()) return;
    onAddMerchant({
      name: merchName.trim(),
      category: merchCat,
      zone: merchZone.trim() || 'Zona Central',
      prepTime: merchPrep.trim() || '20–30 min',
      active: true,
    });
    setMerchName('');
    setMerchZone('');
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const targetMerchant =
      merchants.find((m) => m.id === prodMerchantId) ?? merchants[0];
    if (!targetMerchant) return;

    onAddProduct({
      merchantId: targetMerchant.id,
      name: prodName.trim(),
      merchant: targetMerchant.name,
      zoneLabel: targetMerchant.zone,
      category: targetMerchant.category,
      prepTime: targetMerchant.prepTime,
      priceUsd: Math.max(0.5, parseFloat(prodPrice) || 8),
      description:
        prodDesc.trim() ||
        'Preparado al momento con despacho directo mediante flota UbiDely.',
      imageUrl: prodImage,
    });
    setProdName('');
    setProdDesc('');
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmError(null);
    setAdmFeedback(null);
    if (!admName.trim() || !admEmail.trim() || admPassword.length < 6) {
      setAdmError('Ingresa nombre, correo válido y contraseña de al menos 6 caracteres.');
      return;
    }
    try {
      await onAddAdminUser({
        name: admName.trim(),
        email: admEmail.trim().toLowerCase(),
        password: admPassword,
        role: admRole,
      });
      setAdmName('');
      setAdmEmail('');
      setAdmPassword('');
      setAdmFeedback('Administrador autorizado creado correctamente.');
    } catch (err) {
      setAdmError(err instanceof Error ? err.message : 'No se pudo crear el administrador.');
    }
  };

  const handleFinanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(finAmount);
    if (!finConcept.trim() || !Number.isFinite(numeric) || numeric <= 0) return;
    onAddFinancialEntry({
      type: finType,
      concept: finConcept.trim(),
      category: finCategory,
      amountUsd: numeric,
      method: finMethod,
    });
    setFinConcept('');
    setFinAmount('');
  };

  if (!isAuthorizedAdmin || !currentUser) {
    return (
      <div className="py-2">
        <AuthGatePanel
          currentUser={currentUser}
          bootstrapStatus={bootstrapStatus}
          onAuthSuccess={onAuthSuccess}
          onRefreshSession={onRefreshSession}
          onLogout={onLogout}
          contextNote="Solo los usuarios administradores autorizados (Propietario, Super Admin, Operaciones o Finanzas) pueden acceder al módulo de Administración."
        />
      </div>
    );
  }

  const pendingCount = partnerRequests.filter((r) => r.status === 'pendiente').length;

  const allTabs: Array<{ id: AdminSection; label: string; icon: typeof Car }> = [
    {
      id: 'requests',
      label: pendingCount > 0 ? `Solicitudes (${pendingCount})` : 'Solicitudes',
      icon: UserCheck,
    },
    { id: 'drivers', label: 'Conductores', icon: Car },
    { id: 'merchants', label: 'Restaurantes y Menús', icon: Store },
    { id: 'users', label: 'Usuarios Admin', icon: Users },
    { id: 'finance', label: 'Ingresos y Gastos', icon: Wallet },
  ];

  const tabs = allTabs.filter((t) => allowedSections.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Barra de sesión administrativa autorizada */}
      <div className="bg-[#142521] border border-[#006A60] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#7EF8E6] shrink-0" />
          <span className="text-[#E1E3E1] font-semibold">
            {currentUser.name} ·{' '}
            <span className="text-[#7EF8E6]">{currentUser.role}</span>
          </span>
          {currentUser.companyName && (
            <span className="text-[#A0ABA6]">
              · {currentUser.companyName}
              {currentUser.role === 'Propietario' && currentUser.companyCode
                ? ` (Código: ${currentUser.companyCode})`
                : ''}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="min-h-[34px] px-3 rounded-full bg-[#111413] border border-[#354A44] hover:border-[#FF5449] text-xs font-semibold text-[#E1E3E1] flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Encabezado y Pestañas Administrativas filtradas por rol */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E1E3E1]">
            Panel Administrativo UbiDely
          </h1>
          <p className="text-sm text-[#A0ABA6] mt-0.5">
            Vistas habilitadas para tu nivel ({currentUser.role})
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = section === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSection(t.id)}
                className={`min-h-[44px] px-4 rounded-full text-xs font-bold border flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                    : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44] hover:text-[#E1E3E1]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 0: SOLICITUDES DE CONDUCTORES Y RESTAURANTES (SOLO PROPIETARIO) */}
      {section === 'requests' && allowedSections.includes('requests') && (
        <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24302C] pb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#E1E3E1]">
                Autorización de Conductores y Restaurantes vinculados
              </h2>
              <p className="text-xs text-[#A0ABA6] mt-0.5">
                Comparte el código <strong className="text-[#7EF8E6]">{currentUser.companyCode}</strong> o tu correo ({currentUser.email}) para que conductores y comercios soliciten ingreso.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#7EF8E6] tabular-nums">
              {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
            </span>
          </div>

          {partnerRequests.length === 0 ? (
            <div className="bg-[#111413] border border-[#24302C] rounded-xl p-6 text-center space-y-1">
              <p className="text-sm font-medium text-[#E1E3E1]">
                Aún no hay solicitudes de registro vinculadas
              </p>
              <p className="text-xs text-[#A0ABA6]">
                Cuando un conductor o restaurante se registre con tu código de empresa, aparecerá aquí para que autorices su ingreso.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#24302C]">
              {partnerRequests.map((req) => (
                <div key={req.id} className="py-4 space-y-3 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#E1E3E1]">
                        {req.role === 'Conductor' ? (
                          <Car className="w-4 h-4 text-[#7EF8E6] shrink-0" />
                        ) : (
                          <Store className="w-4 h-4 text-[#7EF8E6] shrink-0" />
                        )}
                        <span>{req.name}</span>
                        <span className="text-[#A0ABA6] font-normal">· {req.role}</span>
                      </div>
                      <p className="text-xs text-[#A0ABA6]">
                        {req.email} · {req.phone}
                      </p>

                      {req.driverData && (
                        <p className="text-xs text-[#E1E3E1] pt-1">
                          Vehículo: <strong>{req.driverData.vehicle}</strong> · Placa{' '}
                          <span className="font-mono-tabular text-[#7EF8E6]">
                            {req.driverData.plate}
                          </span>{' '}
                          · {req.driverData.tier}
                        </p>
                      )}

                      {req.merchantData && (
                        <div className="text-xs text-[#E1E3E1] pt-1 space-y-1">
                          <p>
                            Comercio: <strong>{req.merchantData.merchantName}</strong> ·{' '}
                            {req.merchantData.category} · {req.merchantData.zone} ({req.merchantData.prepTime})
                          </p>
                          <p className="text-[#A0ABA6]">
                            Menú propuesto ({req.merchantData.menuItems.length} ítem
                            {req.merchantData.menuItems.length === 1 ? '' : 's'}):{' '}
                            {req.merchantData.menuItems
                              .map((m) => `${m.name} ($${m.priceUsd.toFixed(2)})`)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pendiente' ? (
                        <>
                          <button
                            type="button"
                            disabled={decidingId === req.id}
                            onClick={async () => {
                              setDecidingId(req.id);
                              await onDecidePartnerRequest(req.id, 'aprobado');
                              setDecidingId(null);
                            }}
                            className="min-h-[38px] px-4 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#7EF8E6]" />
                            <span>Autorizar ingreso</span>
                          </button>
                          <button
                            type="button"
                            disabled={decidingId === req.id}
                            onClick={async () => {
                              setDecidingId(req.id);
                              await onDecidePartnerRequest(req.id, 'rechazado');
                              setDecidingId(null);
                            }}
                            className="min-h-[38px] px-3.5 rounded-full bg-[#111413] border border-[#FF5449]/60 hover:bg-[#2A1515] text-xs font-semibold text-[#FFB4AB] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-bold ${
                            req.status === 'aprobado' ? 'text-[#2ECC71]' : 'text-[#FFB4AB]'
                          }`}
                        >
                          {req.status === 'aprobado' ? 'Autorizado' : 'Rechazado'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 1: CONDUCTORES */}
      {section === 'drivers' && allowedSections.includes('drivers') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleDriverSubmit}
            className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold text-[#E1E3E1]">Agregar conductor</h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="drv-name" className="block text-xs text-[#A0ABA6] mb-1">
                  Nombre completo
                </label>
                <input
                  id="drv-name"
                  type="text"
                  required
                  value={drvName}
                  onChange={(e) => setDrvName(e.target.value)}
                  placeholder="Ej. Mateo Silva"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="drv-phone" className="block text-xs text-[#A0ABA6] mb-1">
                    Teléfono
                  </label>
                  <input
                    id="drv-phone"
                    type="tel"
                    value={drvPhone}
                    onChange={(e) => setDrvPhone(e.target.value)}
                    placeholder="+58 414-555-0192"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-mono-tabular text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
                <div>
                  <label htmlFor="drv-tier" className="block text-xs text-[#A0ABA6] mb-1">
                    Categoría
                  </label>
                  <select
                    id="drv-tier"
                    value={drvTier}
                    onChange={(e) => setDrvTier(e.target.value as DriverProfile['tier'])}
                    className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                  >
                    <option value="Moto Express">Moto Express</option>
                    <option value="Carro Confort">Carro Confort</option>
                    <option value="SUV Ejecutiva">SUV Ejecutiva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="drv-vehicle" className="block text-xs text-[#A0ABA6] mb-1">
                    Vehículo y color
                  </label>
                  <input
                    id="drv-vehicle"
                    type="text"
                    required
                    value={drvVehicle}
                    onChange={(e) => setDrvVehicle(e.target.value)}
                    placeholder="Ej. Hyundai Accent Blanco"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
                <div>
                  <label htmlFor="drv-plate" className="block text-xs text-[#A0ABA6] mb-1">
                    Placa
                  </label>
                  <input
                    id="drv-plate"
                    type="text"
                    required
                    value={drvPlate}
                    onChange={(e) => setDrvPlate(e.target.value)}
                    placeholder="Ej. AC301KL"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-mono-tabular uppercase text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-bold text-[#E1E3E1] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar conductor</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#E1E3E1]">Flota registrada</h2>
              <span className="text-xs font-semibold text-[#7EF8E6] tabular-nums">
                {drivers.length} unidades
              </span>
            </div>

            <div className="divide-y divide-[#24302C]">
              {drivers.map((drv) => (
                <div
                  key={drv.id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3 first:pt-1 last:pb-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#354A44] shrink-0">
                      <ImageWithFallback
                        src={drv.avatar}
                        alt={drv.name}
                        fallbackTitle={drv.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#E1E3E1] truncate">
                        {drv.name} · <span className="text-[#7EF8E6]">{drv.tier}</span>
                      </div>
                      <p className="text-xs text-[#A0ABA6] truncate mt-0.5">
                        {drv.vehicle} · Placa <span className="font-mono-tabular text-[#E1E3E1]">{drv.plate}</span> · {drv.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleDriverStatus(drv.id)}
                      className={`min-h-[36px] px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        drv.status === 'Disponible'
                          ? 'bg-[#2ECC71]/15 border-[#2ECC71]/50 text-[#2ECC71]'
                          : 'bg-[#202624] border-[#354A44] text-[#7EF8E6]'
                      }`}
                    >
                      {drv.status}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDriver(drv.id)}
                      className="w-9 h-9 rounded-full bg-[#111413] border border-[#24302C] hover:border-[#FF5449] text-[#A0ABA6] hover:text-[#FFB4AB] flex items-center justify-center transition-colors cursor-pointer"
                      aria-label={`Eliminar conductor ${drv.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: RESTAURANTES Y MENÚS */}
      {section === 'merchants' && allowedSections.includes('merchants') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Alta de Restaurante / Comercio */}
            <form
              onSubmit={handleMerchantSubmit}
              className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#7EF8E6]" />
                <h2 className="text-base font-semibold text-[#E1E3E1]">
                  Agregar restaurante o comercio
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="m-name" className="block text-xs text-[#A0ABA6] mb-1">
                    Nombre del comercio
                  </label>
                  <input
                    id="m-name"
                    type="text"
                    required
                    value={merchName}
                    onChange={(e) => setMerchName(e.target.value)}
                    placeholder="Ej. Pizzería Bella Vista"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="m-cat" className="block text-xs text-[#A0ABA6] mb-1">
                      Vertical
                    </label>
                    <select
                      id="m-cat"
                      value={merchCat}
                      onChange={(e) =>
                        setMerchCat(e.target.value as Exclude<DeliveryCategory, 'Todos'>)
                      }
                      className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                    >
                      <option value="Restaurantes">Restaurantes</option>
                      <option value="Farmacia">Farmacia</option>
                      <option value="Supermercado">Supermercado</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="m-prep" className="block text-xs text-[#A0ABA6] mb-1">
                      Tiempo estimado
                    </label>
                    <input
                      id="m-prep"
                      type="text"
                      value={merchPrep}
                      onChange={(e) => setMerchPrep(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="m-zone" className="block text-xs text-[#A0ABA6] mb-1">
                    Zona o sector
                  </label>
                  <input
                    id="m-zone"
                    type="text"
                    value={merchZone}
                    onChange={(e) => setMerchZone(e.target.value)}
                    placeholder="Ej. Paseo Norte"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar comercio</span>
              </button>

              {/* Lista compacta de comercios */}
              <div className="pt-3 border-t border-[#24302C] space-y-2">
                <span className="text-xs font-semibold text-[#A0ABA6] block">
                  Comercios activos ({merchants.length})
                </span>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {merchants.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 bg-[#111413] border border-[#24302C] rounded-xl px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#E1E3E1] truncate">{m.name}</p>
                        <p className="text-[#A0ABA6] truncate">
                          {m.category} · {m.zone}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteMerchant(m.id)}
                        className="text-[#A0ABA6] hover:text-[#FFB4AB] p-1.5 cursor-pointer"
                        aria-label={`Eliminar ${m.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Alta y Catálogo de Menús */}
            <div className="lg:col-span-7 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-5">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#7EF8E6]" />
                <h2 className="text-base font-semibold text-[#E1E3E1]">
                  Agregar producto al menú (se publica en Delivery)
                </h2>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-3 border-b border-[#24302C] pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="p-merchant" className="block text-xs text-[#A0ABA6] mb-1">
                      Comercio asociado
                    </label>
                    <select
                      id="p-merchant"
                      value={prodMerchantId}
                      onChange={(e) => setProdMerchantId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                    >
                      {merchants.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="p-name" className="block text-xs text-[#A0ABA6] mb-1">
                      Nombre del plato o producto
                    </label>
                    <input
                      id="p-name"
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ej. Pizza Artesanal Margherita"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="p-price" className="block text-xs text-[#A0ABA6] mb-1">
                      Precio (USD)
                    </label>
                    <input
                      id="p-price"
                      type="number"
                      step="0.25"
                      min="0.5"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-bold tabular-nums text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="p-img" className="block text-xs text-[#A0ABA6] mb-1">
                      Fotografía del catálogo
                    </label>
                    <select
                      id="p-img"
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                    >
                      {CATALOG_IMAGE_PRESETS.map((img) => (
                        <option key={img.label} value={img.url}>
                          {img.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="p-desc" className="block text-xs text-[#A0ABA6] mb-1">
                    Descripción corta
                  </label>
                  <input
                    id="p-desc"
                    type="text"
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Ingredientes, presentación o tamaño..."
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-full bg-[#7EF8E6] hover:bg-[#5edac9] text-xs font-bold text-[#111413] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar ítem en el menú</span>
                </button>
              </form>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#A0ABA6]">
                    Ítems activos en Delivery ({catalog.length})
                  </span>
                </div>
                <div className="divide-y divide-[#24302C] max-h-[280px] overflow-y-auto pr-1">
                  {catalog.map((item) => {
                    const dual = formatDualPrice(item.priceUsd, activeCurrency, rates);
                    return (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-[#111413]">
                            <ImageWithFallback
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#E1E3E1] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[#A0ABA6] truncate">
                              {item.merchant} · {item.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#E1E3E1] tabular-nums">
                              {dual.primary}
                            </div>
                            <div className="text-[11px] text-[#A0ABA6] tabular-nums">
                              {dual.secondary}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(item.id)}
                            className="w-9 h-9 rounded-full bg-[#111413] border border-[#24302C] hover:border-[#FF5449] text-[#A0ABA6] hover:text-[#FFB4AB] flex items-center justify-center transition-colors cursor-pointer"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: USUARIOS ADMINISTRADORES */}
      {section === 'users' && allowedSections.includes('users') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={(e) => void handleAdminSubmit(e)}
            className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold text-[#E1E3E1]">
              Agregar usuario administrador
            </h2>

            {admError && (
              <div className="bg-[#2A1515] border border-[#FF5449]/60 rounded-xl px-3.5 py-2.5 text-xs text-[#FFB4AB]">
                {admError}
              </div>
            )}
            {admFeedback && (
              <div className="bg-[#142521] border border-[#006A60] rounded-xl px-3.5 py-2.5 text-xs text-[#7EF8E6]">
                {admFeedback}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="adm-name" className="block text-xs text-[#A0ABA6] mb-1">
                  Nombre completo
                </label>
                <input
                  id="adm-name"
                  type="text"
                  required
                  value={admName}
                  onChange={(e) => setAdmName(e.target.value)}
                  placeholder="Ej. Gabriel Mendoza"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                />
              </div>

              <div>
                <label htmlFor="adm-email" className="block text-xs text-[#A0ABA6] mb-1">
                  Correo corporativo
                </label>
                <input
                  id="adm-email"
                  type="email"
                  required
                  value={admEmail}
                  onChange={(e) => setAdmEmail(e.target.value)}
                  placeholder="operador@ubidely.app"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                />
              </div>

              <div>
                <label htmlFor="adm-password" className="block text-xs text-[#A0ABA6] mb-1">
                  Contraseña de acceso (mín. 6 caracteres)
                </label>
                <input
                  id="adm-password"
                  type="password"
                  required
                  minLength={6}
                  value={admPassword}
                  onChange={(e) => setAdmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                />
              </div>

              <div>
                <label htmlFor="adm-role" className="block text-xs text-[#A0ABA6] mb-1">
                  Rol de permisos
                </label>
                <select
                  id="adm-role"
                  value={admRole}
                  onChange={(e) =>
                    setAdmRole(e.target.value as Exclude<AdminRole, 'Propietario'>)
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                >
                  <option value="Super Admin">Super Admin (acceso operativo y financiero)</option>
                  <option value="Operaciones">Operaciones (conductores y menús)</option>
                  <option value="Finanzas">Finanzas (ingresos y gastos)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-bold text-[#E1E3E1] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear administrador</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#E1E3E1]">Equipo administrador</h2>
              <span className="text-xs font-semibold text-[#7EF8E6] tabular-nums">
                {adminUsers.length} usuarios
              </span>
            </div>

            <div className="divide-y divide-[#24302C]">
              {adminUsers.map((usr) => {
                const isOwnerRow = usr.role === 'Propietario';
                return (
                  <div
                    key={usr.id}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3 first:pt-1 last:pb-1"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#E1E3E1] truncate">
                        {usr.name} · <span className="text-[#7EF8E6]">{usr.role}</span>
                      </p>
                      <p className="text-xs text-[#A0ABA6] truncate mt-0.5">{usr.email}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwnerRow ? (
                        <span className="text-xs font-semibold text-[#2ECC71]">
                          Titular de empresa
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => void onToggleAdminActive(usr.id)}
                            className={`min-h-[36px] px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                              usr.active
                                ? 'bg-[#2ECC71]/15 border-[#2ECC71]/50 text-[#2ECC71]'
                                : 'bg-[#202624] border-[#354A44] text-[#A0ABA6]'
                            }`}
                          >
                            {usr.active ? 'Activo' : 'Suspendido'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteAdminUser(usr.id)}
                            className="w-9 h-9 rounded-full bg-[#111413] border border-[#24302C] hover:border-[#FF5449] text-[#A0ABA6] hover:text-[#FFB4AB] flex items-center justify-center transition-colors cursor-pointer"
                            aria-label={`Eliminar administrador ${usr.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: CONTROL DE INGRESOS Y GASTOS */}
      {section === 'finance' && allowedSections.includes('finance') && (
        <div className="space-y-6">
          {/* KPIs Financieros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#A0ABA6]">
                <span>Ingresos Totales</span>
                <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
              </div>
              <div className="text-2xl font-bold text-[#2ECC71] tabular-nums">
                {formatDualPrice(totalIngresosUsd, activeCurrency, rates).primary}
              </div>
              <div className="text-xs text-[#A0ABA6] tabular-nums">
                {formatDualPrice(totalIngresosUsd, activeCurrency, rates).secondary}
              </div>
            </div>

            <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#A0ABA6]">
                <span>Gastos Operativos</span>
                <TrendingDown className="w-4 h-4 text-[#FF5449]" />
              </div>
              <div className="text-2xl font-bold text-[#FFB4AB] tabular-nums">
                {formatDualPrice(totalGastosUsd, activeCurrency, rates).primary}
              </div>
              <div className="text-xs text-[#A0ABA6] tabular-nums">
                {formatDualPrice(totalGastosUsd, activeCurrency, rates).secondary}
              </div>
            </div>

            <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#A0ABA6]">
                <span>Balance Neto</span>
                <Wallet className="w-4 h-4 text-[#7EF8E6]" />
              </div>
              <div className="text-2xl font-bold text-[#E1E3E1] tabular-nums">
                {formatDualPrice(netBalanceUsd, activeCurrency, rates).primary}
              </div>
              <div className="text-xs text-[#A0ABA6] tabular-nums">
                {formatDualPrice(netBalanceUsd, activeCurrency, rates).secondary}
              </div>
            </div>

            <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-semibold text-[#A0ABA6] block">Margen Operativo</span>
              <div className="text-2xl font-bold text-[#7EF8E6] tabular-nums">{marginPct}%</div>
              <div className="text-xs text-[#6C7A75] tabular-nums">
                {financialEntries.length} movimientos registrados
              </div>
            </div>
          </div>

          {/* Dashboard Financiero (Recharts 7 días + Movilidad vs. Delivery) */}
          <FinancialDashboard
            financialEntries={financialEntries}
            activeCurrency={activeCurrency}
            rates={rates}
          />

          {/* Formulario de Registro + Libro Mayor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleFinanceSubmit}
              className="lg:col-span-5 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-lg font-semibold text-[#E1E3E1]">
                Registrar ingreso o gasto
              </h2>

              <div className="grid grid-cols-2 gap-2 p-1 bg-[#111413] border border-[#24302C] rounded-full">
                <button
                  type="button"
                  onClick={() => setFinType('ingreso')}
                  className={`min-h-[40px] rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    finType === 'ingreso'
                      ? 'bg-[#2ECC71] text-[#111413]'
                      : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
                  }`}
                >
                  Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFinType('gasto')}
                  className={`min-h-[40px] rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    finType === 'gasto'
                      ? 'bg-[#93000a] text-[#ffdad6]'
                      : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
                  }`}
                >
                  Gasto (-)
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="fin-concept" className="block text-xs text-[#A0ABA6] mb-1">
                    Concepto o descripción
                  </label>
                  <input
                    id="fin-concept"
                    type="text"
                    required
                    value={finConcept}
                    onChange={(e) => setFinConcept(e.target.value)}
                    placeholder="Ej. Combustible flota norte o comisión delivery"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fin-cat" className="block text-xs text-[#A0ABA6] mb-1">
                      Categoría
                    </label>
                    <select
                      id="fin-cat"
                      value={finCategory}
                      onChange={(e) => setFinCategory(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                    >
                      <option value="Movilidad">Movilidad</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Encomiendas">Encomiendas</option>
                      <option value="Nómina y Flota">Nómina y Flota</option>
                      <option value="Operaciones">Operaciones</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fin-amount" className="block text-xs text-[#A0ABA6] mb-1">
                      Monto (USD)
                    </label>
                    <input
                      id="fin-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={finAmount}
                      onChange={(e) => setFinAmount(e.target.value)}
                      placeholder="15.00"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-bold tabular-nums text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fin-method" className="block text-xs text-[#A0ABA6] mb-1">
                    Método de pago
                  </label>
                  <select
                    id="fin-method"
                    value={finMethod}
                    onChange={(e) => setFinMethod(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                  >
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta / Biométrico">Tarjeta / Biométrico</option>
                    <option value="Efectivo USD">Efectivo USD</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-bold text-[#E1E3E1] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar movimiento</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#E1E3E1]">
                  Libro de ingresos y gastos
                </h2>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: 'todos', label: 'Todos' },
                      { id: 'ingreso', label: 'Ingresos' },
                      { id: 'gasto', label: 'Gastos' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFinFilter(f.id)}
                      className={`min-h-[36px] px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        finFilter === f.id
                          ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                          : 'bg-[#111413] border-[#24302C] text-[#A0ABA6]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-[#24302C] max-h-[360px] overflow-y-auto pr-1">
                {filteredFinance.map((entry) => {
                  const dual = formatDualPrice(entry.amountUsd, activeCurrency, rates);
                  const isIncome = entry.type === 'ingreso';
                  return (
                    <div
                      key={entry.id}
                      className="py-3 flex items-center justify-between gap-4 first:pt-1 last:pb-1"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#E1E3E1] truncate">
                          {entry.concept}
                        </p>
                        <p className="text-xs text-[#A0ABA6] truncate mt-0.5">
                          {entry.category} · {entry.method} · {entry.dateLabel}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-bold tabular-nums ${
                            isIncome ? 'text-[#2ECC71]' : 'text-[#FFB4AB]'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {dual.primary}
                        </div>
                        <div className="text-[11px] text-[#A0ABA6] tabular-nums">
                          {dual.secondary}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
