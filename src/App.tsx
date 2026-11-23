import { useEffect, useState } from 'react';
import {
  Car,
  ShoppingBag,
  Navigation,
  Settings,
  RefreshCw,
  ShieldAlert,
  X,
  MapPin,
  Bell,
  UserCheck,
  Lock,
  History,
  RotateCcw,
} from 'lucide-react';
import {
  AdminRole,
  AdminUser,
  AuthUser,
  BootstrapStatus,
  CURRENCIES,
  CurrencyCode,
  DeliveryProduct,
  DriverProfile,
  ExchangeRates,
  FinancialEntry,
  INITIAL_ADMIN_USERS,
  INITIAL_CATALOG,
  INITIAL_DRIVERS,
  INITIAL_FINANCIAL_ENTRIES,
  INITIAL_MERCHANTS,
  INITIAL_RATES,
  INITIAL_SERVICE_HISTORY,
  INITIAL_TRACKED_DISPATCH,
  PartnerRequest,
  RestaurantMerchant,
  SERVICE_CITIES,
  ServiceHistoryEntry,
  ServiceHistoryOrderItem,
  TrackedDispatch,
} from './data/ubidelyData';
import { MEDIA_ASSETS, resolveAssetUrl } from './assets/mediaAssets';
import { RideScreen } from './components/RideScreen';
import { CartItem, DeliveryScreen } from './components/DeliveryScreen';
import { LiveTrackScreen } from './components/LiveTrackScreen';
import { UserHistoryScreen } from './components/UserHistoryScreen';
import { AdminScreen } from './components/AdminScreen';
import { AuthGatePanel } from './components/AuthGatePanel';
import { CheckoutModal } from './components/CheckoutModal';
import { DriverArrivalToast } from './components/DriverArrivalToast';
import { PushSettingsModal } from './components/PushSettingsModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  PushPreferences,
  PushStatusSummary,
  inspectPushStatus,
  registerPushServiceWorker,
  subscribeUserToPush,
  triggerStatusPushAlert,
  unsubscribeUserFromPush,
} from './services/pushService';
import {
  createAdminAccount,
  decidePartnerRequest,
  deleteAdminAccount,
  fetchAdminOverview,
  fetchBootstrapStatus,
  logoutCurrentUser,
  refreshCurrentSession,
  toggleAdminAccount,
  verifyAdminModuleAccess,
} from './services/authService';

type ActiveTab = 'ride' | 'delivery' | 'track' | 'history' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ride');
  const [selectedCityId, setSelectedCityId] = useState<string>('ciudad-central');
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('USD');
  const [rates, setRates] = useState<ExchangeRates>(INITIAL_RATES);

  // Estado operativo administrable (conductores, comercios, menús, usuarios admin, ingresos/gastos)
  const [drivers, setDrivers] = useState<DriverProfile[]>(INITIAL_DRIVERS);
  const [merchants, setMerchants] = useState<RestaurantMerchant[]>(INITIAL_MERCHANTS);
  const [catalog, setCatalog] = useState<DeliveryProduct[]>(INITIAL_CATALOG);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_ADMIN_USERS);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(
    INITIAL_FINANCIAL_ENTRIES
  );
  const [serviceHistory, setServiceHistory] =
    useState<ServiceHistoryEntry[]>(INITIAL_SERVICE_HISTORY);
  const [repeatNotice, setRepeatNotice] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([
    {
      product: INITIAL_CATALOG[0],
      quantity: 1,
    },
  ]);

  const [trackedDispatch, setTrackedDispatch] = useState<TrackedDispatch>(INITIAL_TRACKED_DISPATCH);
  const [showArrivalNotification, setShowArrivalNotification] = useState<boolean>(true);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pendingRidePayload, setPendingRidePayload] = useState<{
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
  } | null>(null);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const isOnline = useOnlineStatus();
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({
    ownerClaimed: false,
    requiresPasscode: false,
    companyName: null,
    companyCode: null,
    ownerEmail: null,
  });
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);

  const [pushPreferences, setPushPreferences] = useState<PushPreferences>({
    rides: true,
    delivery: true,
  });
  const [pushStatus, setPushStatus] = useState<PushStatusSummary>({
    supported: true,
    pushManagerSupported: true,
    permission: 'default',
    subscribed: false,
    endpoint: null,
    mode: 'unavailable',
    detail: 'Verificando soporte de Web Push API...',
  });

  const syncAdminOverview = async (user: AuthUser) => {
    const isAdmin =
      user.active &&
      user.approvalStatus === 'aprobado' &&
      (user.role === 'Propietario' ||
        user.role === 'Super Admin' ||
        user.role === 'Operaciones' ||
        user.role === 'Finanzas');
    if (!isAdmin) {
      setPartnerRequests([]);
      setAdminUsers([]);
      return;
    }
    try {
      const overview = await fetchAdminOverview();
      setPartnerRequests(overview.partnerRequests);
      setAdminUsers(overview.adminUsers);
    } catch {
      // Si el token expiró o no tiene acceso, limpiar
    }
  };

  const handleAuthSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    const boot = await fetchBootstrapStatus().catch(() => null);
    if (boot) setBootstrapStatus(boot);
    await syncAdminOverview(user);
    if (
      user.role === 'Propietario' ||
      user.role === 'Super Admin' ||
      user.role === 'Operaciones' ||
      user.role === 'Finanzas'
    ) {
      setAuthModalOpen(false);
    }
  };

  const handleRefreshSession = async () => {
    const res = await refreshCurrentSession();
    const boot = await fetchBootstrapStatus().catch(() => null);
    if (boot) setBootstrapStatus(boot);
    if (res?.user) {
      setCurrentUser(res.user);
      await syncAdminOverview(res.user);
    } else {
      setCurrentUser(null);
      setPartnerRequests([]);
      setAdminUsers([]);
    }
  };

  const handleLogout = async () => {
    await logoutCurrentUser();
    setCurrentUser(null);
    setPartnerRequests([]);
    setAdminUsers([]);
  };

  const handleDecidePartnerRequest = async (
    requestId: string,
    decision: 'aprobado' | 'rechazado'
  ) => {
    const { request: updated } = await decidePartnerRequest(requestId, decision);
    setPartnerRequests((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );

    if (decision === 'aprobado') {
      if (updated.role === 'Conductor' && updated.driverData) {
        setDrivers((prev) => [
          {
            id: `drv-${updated.userId}`,
            name: updated.name,
            phone: updated.phone,
            vehicle: updated.driverData!.vehicle,
            plate: updated.driverData!.plate,
            tier: updated.driverData!.tier,
            rating: '5.00',
            avatar: MEDIA_ASSETS.courierAvatarCarlos,
            status: 'Disponible',
          },
          ...prev,
        ]);
      } else if (updated.role === 'Comerciante' && updated.merchantData) {
        const merchantId = `m-${updated.userId}`;
        const mData = updated.merchantData;
        setMerchants((prev) => [
          {
            id: merchantId,
            name: mData.merchantName,
            category: mData.category,
            zone: mData.zone,
            prepTime: mData.prepTime,
            active: true,
          },
          ...prev,
        ]);
        const newProducts: DeliveryProduct[] = mData.menuItems.map((item, idx) => ({
          id: `prod-${updated.userId}-${idx}`,
          merchantId,
          name: item.name,
          merchant: mData.merchantName,
          zoneLabel: mData.zone,
          category: mData.category,
          prepTime: mData.prepTime,
          priceUsd: item.priceUsd,
          description: item.description,
          imageUrl: resolveAssetUrl(item.imageUrl),
        }));
        setCatalog((prev) => [...newProducts, ...prev]);
      }
    }
  };

  useEffect(() => {
    void registerPushServiceWorker().catch(() => undefined);
    void inspectPushStatus().then(setPushStatus);
    void fetchBootstrapStatus()
      .then(setBootstrapStatus)
      .catch(() => undefined);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'PUSH_NOTIFICATION_CLICK') {
          setActiveTab('track');
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, []);

  const selectedCity =
    SERVICE_CITIES.find((c) => c.id === selectedCityId) ?? SERVICE_CITIES[0];

  const handleRefreshRates = () => {
    const jitter = Number(((Math.random() - 0.5) * 0.14).toFixed(2));
    const nextVes = Number(Math.max(46.2, 46.85 + jitter).toFixed(2));
    const nextEur = Number((nextVes * 1.0805).toFixed(2));
    setRates((prev) => ({
      ...prev,
      USD_TO_VES: nextVes,
      EUR_TO_VES: nextEur,
      updatedAt: 'Actualizado · Ahora',
    }));
  };

  const handleAddToCart = (product: DeliveryProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotalUsd = cart.reduce((sum, item) => sum + item.product.priceUsd * item.quantity, 0);
  const cartTotalUsd = cart.length > 0 ? Number((cartSubtotalUsd + 1.9).toFixed(2)) : 0;

  const pickAssignedDriver = (preferredTier?: string): DriverProfile => {
    const available = drivers.filter((d) => d.status === 'Disponible');
    const pool = available.length > 0 ? available : drivers;
    if (preferredTier) {
      const match = pool.find((d) => d.tier === preferredTier);
      if (match) return match;
    }
    return pool[0] ?? INITIAL_DRIVERS[0];
  };

  const finalizeRideDispatch = (
    payload: NonNullable<typeof pendingRidePayload>,
    methodLabel: string
  ) => {
    const assigned = pickAssignedDriver(payload.tierName);

    setFinancialEntries((prev) => [
      {
        id: `fin-${Date.now()}`,
        type: 'ingreso',
        concept: `${payload.tierName} · ${payload.originLabel} → ${payload.destinationLabel}`,
        category: payload.tierName.includes('Encomienda') ? 'Encomiendas' : 'Movilidad',
        amountUsd: payload.amountUsd,
        method: methodLabel,
        dateLabel: 'Ahora',
        daysAgo: 0,
      },
      ...prev,
    ]);

    const newDispatch: TrackedDispatch = {
      id: `UD-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'ride',
      mode: payload.mode,
      cityId: payload.cityId,
      destinationCityId: payload.destinationCityId,
      title: `${payload.tierName} · ${payload.originLabel} → ${payload.destinationLabel}`,
      subtitle:
        payload.mode === 'national'
          ? 'Corredor interurbano · Rastreo GPS verificado'
          : `${selectedCity.name} · Despacho GPS en tiempo real`,
      originZoneId: payload.originId,
      destinationZoneId: payload.destinationId,
      driverName: assigned.name,
      driverAvatar: assigned.avatar,
      driverRating: assigned.rating,
      driverPhone: assigned.phone,
      vehicle: assigned.vehicle,
      plate: assigned.plate,
      amountUsd: payload.amountUsd,
      paymentMethod: methodLabel,
      progressStep: 0,
      etaMinutes: payload.etaMinutes,
    };

    setTrackedDispatch(newDispatch);
    setServiceHistory((prev) => [
      {
        id: newDispatch.id,
        type: 'ride',
        status: 'En curso',
        dateLabel: 'Hoy · En curso',
        cityId: payload.cityId,
        cityName:
          payload.mode === 'national'
            ? `${selectedCity.name} (Corredor Nacional)`
            : selectedCity.name,
        title: newDispatch.title,
        originLabel: payload.originLabel,
        destinationLabel: payload.destinationLabel,
        vehicleOrTier: `${payload.tierName} · ${assigned.vehicle}`,
        driverName: assigned.name,
        driverAvatar: assigned.avatar,
        plate: assigned.plate,
        paymentMethod: methodLabel,
        amountUsd: payload.amountUsd,
      },
      ...prev,
    ]);
    setShowArrivalNotification(true);
    setActiveTab('track');

    if (pushStatus.subscribed) {
      void triggerStatusPushAlert({
        title: `UbiDely · ${payload.tierName} confirmado`,
        body: `${assigned.name} (${assigned.vehicle} · Placa ${assigned.plate}) va en camino a buscarte.`,
        category: 'ride',
        tag: `ubidely-${newDispatch.id}`,
        dispatchId: newDispatch.id,
        preferences: pushPreferences,
        localMode: pushStatus.mode === 'local-sw',
      });
    }
  };

  const handleDispatchRideRequest = (payload: NonNullable<typeof pendingRidePayload>) => {
    if (payload.paymentMethod === 'Pago Móvil') {
      setPendingRidePayload(payload);
      setCheckoutOpen(true);
      return;
    }
    finalizeRideDispatch(payload, payload.paymentMethod);
  };

  const handleCompleteCheckout = (methodLabel: string) => {
    if (pendingRidePayload) {
      finalizeRideDispatch(pendingRidePayload, methodLabel);
      setPendingRidePayload(null);
      setCheckoutOpen(false);
      return;
    }

    const firstMerchant = cart[0]?.product.merchant ?? 'Comercio UbiDely';
    const orderSummary =
      cart.length === 1
        ? cart[0].product.name
        : `${firstMerchant} + ${cart.length - 1} producto(s)`;
    const assigned = pickAssignedDriver('Moto Express');

    setFinancialEntries((prev) => [
      {
        id: `fin-${Date.now()}`,
        type: 'ingreso',
        concept: `Pedido Delivery · ${orderSummary}`,
        category: 'Delivery',
        amountUsd: cartTotalUsd,
        method: methodLabel,
        dateLabel: 'Ahora',
        daysAgo: 0,
      },
      ...prev,
    ]);

    const deliveryDispatch: TrackedDispatch = {
      id: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'delivery',
      mode: 'urban',
      cityId: selectedCity.id,
      destinationCityId: selectedCity.id,
      title: `Moto Express · ${orderSummary}`,
      subtitle: `${selectedCity.name} · Retiro en ${firstMerchant}`,
      originZoneId: selectedCity.zones[0].id,
      destinationZoneId: selectedCity.zones[selectedCity.zones.length - 1].id,
      driverName: assigned.name,
      driverAvatar: assigned.avatar,
      driverRating: assigned.rating,
      driverPhone: assigned.phone,
      vehicle: assigned.vehicle,
      plate: assigned.plate,
      amountUsd: cartTotalUsd,
      paymentMethod: methodLabel,
      progressStep: 0,
      etaMinutes: 12,
    };

    const snapshotOrderItems: ServiceHistoryOrderItem[] = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      merchant: item.product.merchant,
      category: item.product.category,
      zoneLabel: item.product.zoneLabel,
      prepTime: item.product.prepTime,
      description: item.product.description,
      quantity: item.quantity,
      unitPriceUsd: item.product.priceUsd,
      imageUrl: item.product.imageUrl,
    }));

    setTrackedDispatch(deliveryDispatch);
    setServiceHistory((prev) => [
      {
        id: deliveryDispatch.id,
        type: 'delivery',
        status: 'En curso',
        dateLabel: 'Hoy · En curso',
        cityId: selectedCity.id,
        cityName: selectedCity.name,
        title: `${firstMerchant} · ${orderSummary}`,
        originLabel: cart[0]?.product.zoneLabel ?? selectedCity.zones[0].name,
        destinationLabel: selectedCity.zones[selectedCity.zones.length - 1].name,
        vehicleOrTier: `Moto Express · ${assigned.vehicle}`,
        driverName: assigned.name,
        driverAvatar: assigned.avatar,
        plate: assigned.plate,
        paymentMethod: methodLabel,
        amountUsd: cartTotalUsd,
        merchantName: firstMerchant,
        orderItems: snapshotOrderItems,
      },
      ...prev,
    ]);
    setCart([]);
    setRepeatNotice(null);
    setCheckoutOpen(false);
    setShowArrivalNotification(true);
    setActiveTab('track');

    if (pushStatus.subscribed) {
      void triggerStatusPushAlert({
        title: `UbiDely · Pedido confirmado en ${firstMerchant}`,
        body: `${assigned.name} (${assigned.vehicle} · ${assigned.plate}) retirará tu pedido.`,
        category: 'delivery',
        tag: `ubidely-${deliveryDispatch.id}`,
        dispatchId: deliveryDispatch.id,
        preferences: pushPreferences,
        localMode: pushStatus.mode === 'local-sw',
      });
    }
  };

  const handleTopAction = () => {
    if (cartCount > 0) {
      setPendingRidePayload(null);
      setCheckoutOpen(true);
    } else {
      setActiveTab('track');
    }
  };

  const handleRepeatDeliveryOrder = (entry: ServiceHistoryEntry) => {
    if (!entry.orderItems || entry.orderItems.length === 0) return;
    const rebuiltCart: CartItem[] = entry.orderItems.map((item) => {
      const catalogMatch = catalog.find(
        (p) =>
          p.id === item.productId ||
          (p.name === item.name && p.merchant === item.merchant)
      );
      const product: DeliveryProduct = catalogMatch ?? {
        id: item.productId,
        merchantId: `hist-${item.productId}`,
        name: item.name,
        merchant: item.merchant,
        zoneLabel: item.zoneLabel,
        category: item.category,
        prepTime: item.prepTime,
        priceUsd: item.unitPriceUsd,
        description: item.description,
        imageUrl: resolveAssetUrl(item.imageUrl),
      };
      return {
        product,
        quantity: Math.max(1, item.quantity),
      };
    });

    const totalItems = rebuiltCart.reduce((sum, item) => sum + item.quantity, 0);
    setCart(rebuiltCart);
    setRepeatNotice(
      `Pedido repetido de ${entry.merchantName ?? entry.id} agregado a tu bolsa (${totalItems} artículo${totalItems === 1 ? '' : 's'}).`
    );
    setActiveTab('delivery');
  };

  const advanceDispatchStage = () => {
    const nextStep = Math.min(3, trackedDispatch.progressStep + 1);
    setTrackedDispatch((prev) => ({
      ...prev,
      progressStep: nextStep,
    }));

    if (nextStep === 3) {
      setServiceHistory((prev) =>
        prev.map((entry) =>
          entry.id === trackedDispatch.id
            ? { ...entry, status: 'Completado', dateLabel: 'Hoy · Completado' }
            : entry
        )
      );
    }

    if (pushStatus.subscribed && nextStep !== trackedDispatch.progressStep) {
      const stageTitles = [
        'Servicio confirmado',
        `${trackedDispatch.driverName} va en camino a buscarte`,
        `${trackedDispatch.driverName} está llegando al punto de recogida`,
        `¡${trackedDispatch.driverName} llegó a tu ubicación!`,
      ];
      void triggerStatusPushAlert({
        title: `UbiDely · ${stageTitles[nextStep]}`,
        body: `${trackedDispatch.vehicle} · Placa ${trackedDispatch.plate} (${trackedDispatch.title})`,
        category: trackedDispatch.type,
        tag: `ubidely-${trackedDispatch.id}`,
        dispatchId: trackedDispatch.id,
        preferences: pushPreferences,
        localMode: pushStatus.mode === 'local-sw',
      });
    }
  };

  const navItems: Array<{ id: ActiveTab; label: string; icon: typeof Car }> = [
    { id: 'ride', label: 'Traslados', icon: Car },
    { id: 'delivery', label: 'Delivery', icon: ShoppingBag },
    { id: 'track', label: 'Rastreo', icon: Navigation },
    { id: 'history', label: 'Mis Viajes', icon: History },
    { id: 'admin', label: 'Administración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#111413] text-[#E1E3E1] pb-24 md:pb-12">
      {/* Barra superior de 3 zonas */}
      <header className="sticky top-0 z-30 bg-[#111413]/92 backdrop-blur-md border-b border-[#24302C]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('ride')}
            className="text-xl font-bold tracking-tight text-[#E1E3E1] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Ubi<span className="text-[#7EF8E6]">Dely</span>
          </button>

          <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    isActive
                      ? 'text-[#7EF8E6] border-[#7EF8E6]'
                      : 'text-[#A0ABA6] border-transparent hover:text-[#E1E3E1]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleTopAction}
              className="min-h-[40px] px-4 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {cartCount > 0 ? `Pagar (${cartCount})` : 'Rastreo en vivo'}
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 space-y-5">
        {/* Barra de Utilidades: Selector de Ciudad + Monedas + Tasa de referencia */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#24302C]/70">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <MapPin className="w-3.5 h-3.5 text-[#7EF8E6] absolute left-3.5 pointer-events-none" />
              <select
                aria-label="Seleccionar ciudad"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="min-h-[38px] pl-9 pr-4 rounded-full bg-[#191D1C] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-bold text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6] cursor-pointer"
              >
                {SERVICE_CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.region})
                  </option>
                ))}
              </select>
            </div>

            <div
              className="flex items-center gap-1.5 overflow-x-auto"
              role="group"
              aria-label="Moneda de visualización"
            >
              {(['USD', 'VES', 'EUR', 'COP'] as CurrencyCode[]).map((code) => {
                const meta = CURRENCIES[code];
                const isSelected = activeCurrency === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setActiveCurrency(code)}
                    className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold tracking-wide border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                        : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44] hover:text-[#E1E3E1]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className={`min-h-[38px] px-3.5 rounded-full border text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentUser
                  ? 'bg-[#142521] border-[#006A60] hover:border-[#7EF8E6] text-[#7EF8E6]'
                  : 'bg-[#191D1C] border-[#354A44] hover:border-[#7EF8E6] text-[#E1E3E1]'
              }`}
            >
              {currentUser ? (
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {currentUser
                  ? `${currentUser.role}${
                      currentUser.approvalStatus !== 'aprobado'
                        ? ` (${currentUser.approvalStatus})`
                        : ''
                    }`
                  : 'Acceso'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPushModalOpen(true)}
              className={`min-h-[38px] px-3.5 rounded-full border text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                pushStatus.subscribed
                  ? 'bg-[#142521] border-[#006A60] hover:border-[#7EF8E6] text-[#7EF8E6]'
                  : 'bg-[#191D1C] border-[#354A44] hover:border-[#7EF8E6] text-[#E1E3E1]'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span>{pushStatus.subscribed ? 'Push Activo' : 'Activar Push'}</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshRates}
              className="min-h-[38px] px-3.5 rounded-full bg-[#142521] border border-[#006A60] hover:border-[#7EF8E6] text-xs font-bold text-[#7EF8E6] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Actualizar tasa de cambio"
            >
              <RefreshCw className="w-3 h-3 shrink-0" />
              <span className="tabular-nums">
                Cambio: Bs. {rates.USD_TO_VES.toFixed(2)} / $ · {rates.updatedAt}
              </span>
            </button>
          </div>
        </div>

        {/* Notificación persistente con foto del conductor y vehículo desde confirmación hasta recogida */}
        <DriverArrivalToast
          dispatch={trackedDispatch}
          visible={showArrivalNotification}
          onDismiss={() => setShowArrivalNotification(false)}
          onOpenTrack={() => setActiveTab('track')}
          onAdvanceStage={advanceDispatchStage}
        />

        {/* Pantallas principales */}
        {activeTab === 'ride' && (
          <RideScreen
            selectedCity={selectedCity}
            onChangeCity={setSelectedCityId}
            activeCurrency={activeCurrency}
            rates={rates}
            onDispatchRide={handleDispatchRideRequest}
            onTriggerSos={() => {
              setSosSent(false);
              setSosModalOpen(true);
            }}
          />
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-4">
            {repeatNotice && (
              <div className="bg-[#142521] border border-[#006A60] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#7EF8E6] font-medium">
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>{repeatNotice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingRidePayload(null);
                      setCheckoutOpen(true);
                    }}
                    className="min-h-[36px] px-4 rounded-full bg-[#7EF8E6] hover:bg-[#5edac9] text-xs font-bold text-[#111413] cursor-pointer"
                  >
                    Pagar ahora
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatNotice(null)}
                    className="w-8 h-8 rounded-full bg-[#191D1C] border border-[#24302C] text-[#A0ABA6] hover:text-[#E1E3E1] flex items-center justify-center cursor-pointer"
                    aria-label="Cerrar aviso de pedido repetido"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <DeliveryScreen
              selectedCity={selectedCity}
              catalog={catalog}
              activeCurrency={activeCurrency}
              rates={rates}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenCheckout={() => {
                setPendingRidePayload(null);
                setCheckoutOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === 'track' && (
          <LiveTrackScreen
            dispatch={trackedDispatch}
            activeCurrency={activeCurrency}
            rates={rates}
            onAdvanceStage={advanceDispatchStage}
            onResetDemo={() =>
              setTrackedDispatch((prev) => ({
                ...prev,
                progressStep: 0,
              }))
            }
            onTriggerSos={() => {
              setSosSent(false);
              setSosModalOpen(true);
            }}
          />
        )}

        {activeTab === 'history' && (
          <UserHistoryScreen
            currentUser={currentUser}
            history={serviceHistory}
            activeCurrency={activeCurrency}
            rates={rates}
            onRepeatDeliveryOrder={handleRepeatDeliveryOrder}
            onOpenTrack={() => setActiveTab('track')}
            onOpenAccountModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminScreen
            currentUser={currentUser}
            bootstrapStatus={bootstrapStatus}
            onAuthSuccess={handleAuthSuccess}
            onRefreshSession={handleRefreshSession}
            onLogout={handleLogout}
            partnerRequests={partnerRequests}
            onDecidePartnerRequest={handleDecidePartnerRequest}
            activeCurrency={activeCurrency}
            rates={rates}
            drivers={drivers}
            onAddDriver={(drv) => {
              void verifyAdminModuleAccess('operations').then((ok) => {
                if (ok) {
                  setDrivers((prev) => [{ ...drv, id: `drv-${Date.now()}` }, ...prev]);
                }
              });
            }}
            onToggleDriverStatus={(id) => {
              void verifyAdminModuleAccess('operations').then((ok) => {
                if (ok) {
                  setDrivers((prev) =>
                    prev.map((d) =>
                      d.id === id
                        ? { ...d, status: d.status === 'Disponible' ? 'En servicio' : 'Disponible' }
                        : d
                    )
                  );
                }
              });
            }}
            onDeleteDriver={(id) => {
              void verifyAdminModuleAccess('operations').then((ok) => {
                if (ok) {
                  setDrivers((prev) => prev.filter((d) => d.id !== id));
                }
              });
            }}
            merchants={merchants}
            onAddMerchant={(m) => {
              void verifyAdminModuleAccess('operations').then((ok) => {
                if (ok) {
                  setMerchants((prev) => [{ ...m, id: `m-${Date.now()}` }, ...prev]);
                }
              });
            }}
            onDeleteMerchant={(id) => {
              void verifyAdminModuleAccess('operations').then((ok) => {
                if (ok) {
                  setMerchants((prev) => prev.filter((m) => m.id !== id));
                }
              });
            }}
            catalog={catalog}
            onAddProduct={(p) => {
              void verifyAdminModuleAccess('operations').then((ok) => {
                if (ok) {
                  setCatalog((prev) => [{ ...p, id: `prod-${Date.now()}` }, ...prev]);
                }
              });
            }}
            onDeleteProduct={(id) => {
              void verifyAdminModuleAccess('operations').then((ok) => {
                if (ok) {
                  setCatalog((prev) => prev.filter((p) => p.id !== id));
                }
              });
            }}
            adminUsers={adminUsers}
            onAddAdminUser={async (payload: {
              name: string;
              email: string;
              password: string;
              role: Exclude<AdminRole, 'Propietario'>;
            }) => {
              const { user } = await createAdminAccount(payload);
              setAdminUsers((prev) => [user, ...prev]);
            }}
            onToggleAdminActive={async (id) => {
              const { user } = await toggleAdminAccount(id);
              setAdminUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
            }}
            onDeleteAdminUser={async (id) => {
              await deleteAdminAccount(id);
              setAdminUsers((prev) => prev.filter((u) => u.id !== id));
            }}
            financialEntries={financialEntries}
            onAddFinancialEntry={(entry) => {
              void verifyAdminModuleAccess('finance').then((ok) => {
                if (ok) {
                  setFinancialEntries((prev) => [
                    {
                      ...entry,
                      id: `fin-${Date.now()}`,
                      dateLabel: 'Ahora',
                      daysAgo: 0,
                    },
                    ...prev,
                  ]);
                }
              });
            }}
          />
        )}
      </main>

      {/* Navegación móvil inferior */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#191D1C]/95 backdrop-blur-md border-t border-[#24302C] grid grid-cols-5 items-center px-1"
        aria-label="Navegación móvil"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-[#7EF8E6]' : 'text-[#A0ABA6]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modal de Pago */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setPendingRidePayload(null);
        }}
        totalUsd={pendingRidePayload ? pendingRidePayload.amountUsd : cartTotalUsd}
        summaryTitle={
          pendingRidePayload
            ? `${pendingRidePayload.tierName} · ${pendingRidePayload.originLabel} → ${pendingRidePayload.destinationLabel}`
            : `Bolsa de Delivery (${cartCount} artículo${cartCount === 1 ? '' : 's'})`
        }
        activeCurrency={activeCurrency}
        rates={rates}
        onCompletePayment={(methodLabel) => handleCompleteCheckout(methodLabel)}
      />

      {/* Modal de Seguridad SOS */}
      {sosModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-title"
        >
          <div className="w-full max-w-md bg-[#202624] border border-[#FF5449]/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-[#FF5449] shrink-0" />
                <h2 id="sos-title" className="text-lg font-bold text-[#E1E3E1]">
                  Mesa de Seguridad UbiDely (SOS)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#191D1C] text-[#A0ABA6] hover:text-[#E1E3E1] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar alerta SOS"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sosSent ? (
              <div className="bg-[#142521] border border-[#006A60] rounded-xl p-4 text-sm text-[#7EF8E6] space-y-1">
                <p className="font-bold">Baliza GPS en vivo transmitida</p>
                <p className="text-xs text-[#E1E3E1]">
                  El centro de operaciones de {selectedCity.name} y tus contactos de confianza recibieron las coordenadas del servicio {trackedDispatch.id}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#A0ABA6] leading-relaxed">
                Comparte de inmediato tus coordenadas GPS cifradas, la placa del vehículo ({trackedDispatch.plate}) y enlace de asistencia 24/7.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="min-h-[44px] px-5 rounded-full border border-[#354A44] text-xs font-semibold text-[#E1E3E1] cursor-pointer"
              >
                Cerrar
              </button>
              {!sosSent && (
                <button
                  type="button"
                  onClick={() => setSosSent(true)}
                  className="min-h-[44px] px-5 rounded-full bg-[#93000a] hover:bg-[#b3000d] text-xs font-bold text-[#ffdad6] cursor-pointer"
                >
                  Enviar alerta GPS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración Web Push API */}
      <PushSettingsModal
        isOpen={pushModalOpen}
        onClose={() => setPushModalOpen(false)}
        status={pushStatus}
        preferences={pushPreferences}
        onUpdatePreferences={(next) => {
          setPushPreferences(next);
          if (pushStatus.subscribed) {
            void subscribeUserToPush(next).then(setPushStatus);
          }
        }}
        onEnablePush={async () => {
          const next = await subscribeUserToPush(pushPreferences);
          setPushStatus(next);
        }}
        onDisablePush={async () => {
          const next = await unsubscribeUserFromPush();
          setPushStatus(next);
        }}
        onSendTestPush={async (delayMs) => {
          await triggerStatusPushAlert({
            title: `UbiDely · ${trackedDispatch.driverName} está llegando`,
            body: `${trackedDispatch.vehicle} · Placa ${trackedDispatch.plate} — ${trackedDispatch.title}`,
            category: trackedDispatch.type,
            tag: `ubidely-test-${Date.now()}`,
            dispatchId: trackedDispatch.id,
            delayMs,
            preferences: { rides: true, delivery: true },
            localMode: pushStatus.mode === 'local-sw',
          });
        }}
      />

      {/* Modal de Acceso, Propietario y Registro de Conductores/Comercios */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Acceso y vinculación empresarial"
        >
          <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#111413] border border-[#354A44] text-[#A0ABA6] hover:text-[#E1E3E1] flex items-center justify-center cursor-pointer"
              aria-label="Cerrar ventana de acceso"
            >
              <X className="w-4 h-4" />
            </button>

            {currentUser &&
            (currentUser.role === 'Propietario' ||
              currentUser.role === 'Super Admin' ||
              currentUser.role === 'Operaciones' ||
              currentUser.role === 'Finanzas') ? (
              <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-[#E1E3E1]">
                  Sesión activa: {currentUser.name}
                </h2>
                <p className="text-xs text-[#A0ABA6]">
                  Rol: <strong className="text-[#7EF8E6]">{currentUser.role}</strong> ·{' '}
                  {currentUser.email}
                  {currentUser.companyCode ? ` · Código empresa: ${currentUser.companyCode}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setActiveTab('admin');
                    }}
                    className="min-h-[42px] px-5 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] cursor-pointer"
                  >
                    Ir al Panel Administrativo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setActiveTab('history');
                    }}
                    className="min-h-[42px] px-5 rounded-full bg-[#142521] border border-[#006A60] hover:border-[#7EF8E6] text-xs font-bold text-[#7EF8E6] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Mis Viajes y Pedidos ({serviceHistory.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleLogout();
                    }}
                    className="min-h-[42px] px-5 rounded-full bg-[#111413] border border-[#354A44] hover:border-[#FF5449] text-xs font-semibold text-[#E1E3E1] cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AuthGatePanel
                  currentUser={currentUser}
                  bootstrapStatus={bootstrapStatus}
                  onAuthSuccess={handleAuthSuccess}
                  onRefreshSession={handleRefreshSession}
                  onLogout={handleLogout}
                />
                <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#E1E3E1]">
                      Módulo de Usuario · Historial de Servicios
                    </p>
                    <p className="text-[11px] text-[#A0ABA6]">
                      Consulta tus traslados realizados y repite pedidos de delivery anteriores.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setActiveTab('history');
                    }}
                    className="min-h-[40px] px-4 rounded-full bg-[#142521] border border-[#006A60] hover:border-[#7EF8E6] text-xs font-bold text-[#7EF8E6] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Mis Viajes y Pedidos ({serviceHistory.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Indicador de modo sin conexión */}
      {!isOnline && (
        <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-[#F59E0B] px-3.5 py-2 text-xs font-bold text-[#111413] shadow-lg">
          <span>Sin conexión — Mostrando datos en caché</span>
        </div>
      )}
    </div>
  );
}
