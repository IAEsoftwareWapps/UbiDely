import { useEffect, useState } from 'react';
import {
  Building2,
  Car,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  AuthUser,
  BootstrapStatus,
  DeliveryCategory,
  DriverProfile,
  PartnerSubmittedMenuItem,
} from '../data/ubidelyData';
import { MEDIA_ASSETS } from '../assets/mediaAssets';
import {
  bootstrapCompanyOwner,
  loginUser,
  registerPartnerAccount,
} from '../services/authService';

interface AuthGatePanelProps {
  currentUser: AuthUser | null;
  bootstrapStatus: BootstrapStatus;
  onAuthSuccess: (user: AuthUser) => Promise<void> | void;
  onRefreshSession: () => Promise<void>;
  onLogout: () => Promise<void>;
  contextNote?: string;
}

type AuthMode = 'login' | 'bootstrap' | 'partner';

const MENU_IMAGE_OPTIONS = [
  { label: 'Plato Criollo / Arepas', url: MEDIA_ASSETS.dishArepaReina },
  { label: 'Hamburguesa / Grill', url: MEDIA_ASSETS.dishSmashBurger },
  { label: 'Farmacia / Cuidado', url: MEDIA_ASSETS.pharmacyWellnessKit },
  { label: 'Mercado / Frutas y Café', url: MEDIA_ASSETS.groceryFreshProduce },
];

export function AuthGatePanel({
  currentUser,
  bootstrapStatus,
  onAuthSuccess,
  onRefreshSession,
  onLogout,
  contextNote,
}: AuthGatePanelProps) {
  const [mode, setMode] = useState<AuthMode>(
    bootstrapStatus.ownerClaimed ? 'login' : 'bootstrap'
  );
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!bootstrapStatus.ownerClaimed && mode === 'partner') {
      setMode('bootstrap');
    }
  }, [bootstrapStatus.ownerClaimed, mode]);

  // Estado Inicio de sesión
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estado Configuración inicial de Propietario de Empresa
  const [companyName, setCompanyName] = useState('UbiDely Operaciones');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerAccessCode, setOwnerAccessCode] = useState('');

  // Estado Registro Conductor / Restaurante vinculado a Propietario
  const [partnerRole, setPartnerRole] = useState<'Conductor' | 'Comerciante'>('Conductor');
  const [ownerReference, setOwnerReference] = useState(
    bootstrapStatus.companyCode ?? bootstrapStatus.ownerEmail ?? ''
  );
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');

  // Campos Conductor
  const [drvVehicle, setDrvVehicle] = useState('');
  const [drvPlate, setDrvPlate] = useState('');
  const [drvTier, setDrvTier] = useState<DriverProfile['tier']>('Carro Confort');

  // Campos Comerciante + Menú
  const [merchName, setMerchName] = useState('');
  const [merchCategory, setMerchCategory] =
    useState<Exclude<DeliveryCategory, 'Todos'>>('Restaurantes');
  const [merchZone, setMerchZone] = useState('');
  const [merchPrep, setMerchPrep] = useState('20–30 min');
  const [menuDraftName, setMenuDraftName] = useState('');
  const [menuDraftPrice, setMenuDraftPrice] = useState('9.50');
  const [menuDraftDesc, setMenuDraftDesc] = useState('');
  const [menuDraftImage, setMenuDraftImage] = useState(MENU_IMAGE_OPTIONS[0].url);
  const [menuItems, setMenuItems] = useState<PartnerSubmittedMenuItem[]>([]);

  useEffect(() => {
    if (!ownerReference && (bootstrapStatus.companyCode || bootstrapStatus.ownerEmail)) {
      setOwnerReference(bootstrapStatus.companyCode ?? bootstrapStatus.ownerEmail ?? '');
    }
  }, [bootstrapStatus.companyCode, bootstrapStatus.ownerEmail, ownerReference]);

  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const res = await bootstrapCompanyOwner({
        companyName: companyName.trim(),
        name: ownerName.trim(),
        email: ownerEmail.trim(),
        password: ownerPassword,
        accessCode: ownerAccessCode.trim() || undefined,
      });
      await onAuthSuccess(res.user);
      setSuccessMsg(
        `Cuenta de Propietario configurada. Código de vinculación empresarial: ${res.company.code}`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const res = await loginUser({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      await onAuthSuccess(res.user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddDraftMenuItem = () => {
    if (!menuDraftName.trim()) return;
    const price = Math.max(0.5, parseFloat(menuDraftPrice) || 8);
    setMenuItems((prev) => [
      ...prev,
      {
        name: menuDraftName.trim(),
        priceUsd: Number(price.toFixed(2)),
        description:
          menuDraftDesc.trim() || 'Preparado al momento con despacho mediante UbiDely.',
        imageUrl: menuDraftImage,
      },
    ]);
    setMenuDraftName('');
    setMenuDraftDesc('');
  };

  const handlePartnerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let itemsToSubmit = menuItems;
    if (partnerRole === 'Comerciante' && itemsToSubmit.length === 0 && menuDraftName.trim()) {
      const price = Math.max(0.5, parseFloat(menuDraftPrice) || 8);
      itemsToSubmit = [
        {
          name: menuDraftName.trim(),
          priceUsd: Number(price.toFixed(2)),
          description:
            menuDraftDesc.trim() || 'Preparado al momento con despacho mediante UbiDely.',
          imageUrl: menuDraftImage,
        },
      ];
    }

    setBusy(true);
    try {
      const res = await registerPartnerAccount({
        role: partnerRole,
        ownerReference: ownerReference.trim(),
        name: partnerName.trim(),
        email: partnerEmail.trim(),
        phone: partnerPhone.trim(),
        password: partnerPassword,
        driverData:
          partnerRole === 'Conductor'
            ? {
                vehicle: drvVehicle.trim(),
                plate: drvPlate.trim().toUpperCase(),
                tier: drvTier,
              }
            : undefined,
        merchantData:
          partnerRole === 'Comerciante'
            ? {
                merchantName: merchName.trim(),
                category: merchCategory,
                zone: merchZone.trim() || 'Zona Central',
                prepTime: merchPrep.trim() || '20–30 min',
                menuItems: itemsToSubmit,
              }
            : undefined,
      });
      await onAuthSuccess(res.user);
      setSuccessMsg(
        'Solicitud registrada y vinculada al Propietario de Empresa. Esperando autorización.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setBusy(false);
    }
  };

  // Si ya hay un Conductor o Comerciante autenticado, mostrar su vínculo empresarial y estado de autorización
  if (currentUser && (currentUser.role === 'Conductor' || currentUser.role === 'Comerciante')) {
    const isApproved = currentUser.approvalStatus === 'aprobado';
    const isRejected = currentUser.approvalStatus === 'rechazado';

    return (
      <div className="max-w-2xl mx-auto bg-[#191D1C] border border-[#24302C] rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-[#24302C] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#142521] border border-[#006A60] flex items-center justify-center text-[#7EF8E6] shrink-0">
              {currentUser.role === 'Conductor' ? (
                <Car className="w-5 h-5" />
              ) : (
                <Store className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E1E3E1]">
                {currentUser.name} · {currentUser.role}
              </h2>
              <p className="text-xs text-[#A0ABA6]">
                {currentUser.email} · Vinculado a {currentUser.companyName} (
                {currentUser.companyCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="min-h-[38px] px-3.5 rounded-full bg-[#111413] border border-[#354A44] hover:border-[#FF5449] text-xs font-semibold text-[#E1E3E1] flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>

        <div
          className={`rounded-2xl border p-4 space-y-2 ${
            isApproved
              ? 'bg-[#142521] border-[#006A60]'
              : isRejected
              ? 'bg-[#2A1515] border-[#FF5449]/50'
              : 'bg-[#111413] border-[#354A44]'
          }`}
        >
          <div className="flex items-center gap-2">
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
            ) : isRejected ? (
              <XCircle className="w-5 h-5 text-[#FFB4AB] shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-[#F59E0B] shrink-0" />
            )}
            <span className="text-sm font-bold text-[#E1E3E1]">
              {isApproved
                ? 'Autorización aprobada por el Propietario de Empresa'
                : isRejected
                ? 'Solicitud rechazada por el Propietario de Empresa'
                : 'Pendiente de autorización del Propietario de Empresa'}
            </span>
          </div>

          <p className="text-xs text-[#A0ABA6] leading-relaxed">
            {isApproved
              ? `Tu cuenta de ${currentUser.role} ya está habilitada y activa en la plataforma bajo la supervisión de ${currentUser.linkedOwnerName ?? 'el Propietario'}.`
              : isRejected
              ? currentUser.rejectionReason ||
                'Comunícate con el Propietario de la Empresa para revisar tus datos.'
              : `Tu solicitud está vinculada a ${currentUser.linkedOwnerName ?? 'la empresa'} (${currentUser.companyCode}). Hasta que el Propietario autorice tu ingreso, no podrás operar ni acceder a las vistas administrativas.`}
          </p>
        </div>

        <div className="bg-[#111413] border border-[#24302C] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#A0ABA6]">
            <Lock className="w-4 h-4 text-[#7EF8E6] shrink-0" />
            <span>
              Los módulos administrativos son exclusivos para administradores autorizados de la empresa.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void onRefreshSession()}
            className="min-h-[38px] px-3.5 rounded-full bg-[#202624] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#7EF8E6] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verificar autorización</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-[#191D1C] border border-[#24302C] rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24302C] pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#142521] border border-[#006A60] flex items-center justify-center text-[#7EF8E6] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#E1E3E1]">
              Control de Acceso y Vinculación Empresarial
            </h2>
            <p className="text-xs text-[#A0ABA6] mt-0.5">
              {contextNote ||
                'Inicia sesión como administrador autorizado o registra un conductor/comercio vinculado al Propietario de Empresa.'}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="flex flex-wrap items-center gap-2">
        {!bootstrapStatus.ownerClaimed && (
          <button
            type="button"
            onClick={() => {
              setMode('bootstrap');
              setErrorMsg(null);
            }}
            className={`min-h-[40px] px-4 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'bootstrap'
                ? 'bg-[#7EF8E6] border-[#7EF8E6] text-[#111413]'
                : 'bg-[#111413] border-[#24302C] text-[#A0ABA6] hover:text-[#E1E3E1]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Crear Propietario de Empresa</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMsg(null);
          }}
          className={`min-h-[40px] px-4 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
            mode === 'login'
              ? 'bg-[#7EF8E6] border-[#7EF8E6] text-[#111413]'
              : 'bg-[#111413] border-[#24302C] text-[#A0ABA6] hover:text-[#E1E3E1]'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Iniciar sesión</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('partner');
            setErrorMsg(null);
          }}
          className={`min-h-[40px] px-4 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
            mode === 'partner'
              ? 'bg-[#7EF8E6] border-[#7EF8E6] text-[#111413]'
              : 'bg-[#111413] border-[#24302C] text-[#A0ABA6] hover:text-[#E1E3E1]'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Registrar Conductor o Restaurante</span>
        </button>
      </div>

      {bootstrapStatus.ownerClaimed && (
        <div className="bg-[#111413] border border-[#24302C] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#A0ABA6]">
            Empresa activa:{' '}
            <strong className="text-[#E1E3E1]">{bootstrapStatus.companyName}</strong>
          </span>
          <span className="text-[#7EF8E6] font-mono-tabular font-semibold">
            Código de vinculación: {bootstrapStatus.companyCode}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#2A1515] border border-[#FF5449]/60 rounded-xl px-4 py-3 text-xs text-[#FFB4AB]">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-[#142521] border border-[#006A60] rounded-xl px-4 py-3 text-xs text-[#7EF8E6]">
          {successMsg}
        </div>
      )}

      {/* FORMULARIO 1: CONFIGURACIÓN INICIAL DEL PROPIETARIO DE EMPRESA */}
      {mode === 'bootstrap' && !bootstrapStatus.ownerClaimed && (
        <form onSubmit={(e) => void handleBootstrapSubmit(e)} className="space-y-4">
          <div className="bg-[#142521]/60 border border-[#006A60] rounded-xl p-3.5 text-xs text-[#A0ABA6] leading-relaxed">
            Configura por primera vez la cuenta maestra de <strong className="text-[#E1E3E1]">Propietario de Empresa</strong>.
            Este usuario tendrá el control total para crear administradores por nivel y aprobar o rechazar solicitudes de conductores y restaurantes.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="own-company" className="block text-xs text-[#A0ABA6] mb-1">
                Nombre de la empresa
              </label>
              <input
                id="own-company"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>

            <div>
              <label htmlFor="own-name" className="block text-xs text-[#A0ABA6] mb-1">
                Nombre del Propietario
              </label>
              <input
                id="own-name"
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ej. Sofía Navarro"
                className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>

            <div>
              <label htmlFor="own-email" className="block text-xs text-[#A0ABA6] mb-1">
                Correo del Propietario
              </label>
              <input
                id="own-email"
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="propietario@empresa.com"
                className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>

            <div>
              <label htmlFor="own-pass" className="block text-xs text-[#A0ABA6] mb-1">
                Contraseña (mín. 6 caracteres)
              </label>
              <input
                id="own-pass"
                type="password"
                required
                minLength={6}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>
          </div>

          {bootstrapStatus.requiresPasscode && (
            <div>
              <label htmlFor="own-code" className="block text-xs text-[#A0ABA6] mb-1">
                Código maestro de servidor (OWNER_ACCESS_CODE)
              </label>
              <input
                id="own-code"
                type="password"
                required
                value={ownerAccessCode}
                onChange={(e) => setOwnerAccessCode(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-bold text-[#E1E3E1] transition-colors cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Configurando cuenta...' : 'Registrar Propietario de Empresa y acceder'}
          </button>
        </form>
      )}

      {/* FORMULARIO 2: INICIAR SESIÓN */}
      {mode === 'login' && (
        <form onSubmit={(e) => void handleLoginSubmit(e)} className="space-y-4">
          {!bootstrapStatus.ownerClaimed && (
            <div className="bg-[#111413] border border-[#354A44] rounded-xl p-3.5 text-xs text-[#A0ABA6]">
              Aún no hay un Propietario de Empresa configurado. Usa la pestaña{' '}
              <strong className="text-[#7EF8E6]">Crear Propietario de Empresa</strong> para inicializar el sistema.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="auth-email" className="block text-xs text-[#A0ABA6] mb-1">
                Correo electrónico
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="usuario@ubidely.app"
                className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>

            <div>
              <label htmlFor="auth-pass" className="block text-xs text-[#A0ABA6] mb-1">
                Contraseña
              </label>
              <input
                id="auth-pass"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || !bootstrapStatus.ownerClaimed}
            className="w-full h-12 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-bold text-[#E1E3E1] transition-colors cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Verificando credenciales...' : 'Iniciar sesión'}
          </button>
        </form>
      )}

      {/* FORMULARIO 3: REGISTRO DE CONDUCTOR O RESTAURANTE + MENÚ VINCULADO AL PROPIETARIO */}
      {mode === 'partner' && (
        <form onSubmit={(e) => void handlePartnerRegisterSubmit(e)} className="space-y-4">
          {!bootstrapStatus.ownerClaimed ? (
            <div className="bg-[#111413] border border-[#354A44] rounded-xl p-4 text-xs text-[#A0ABA6]">
              Primero debe registrarse una cuenta de <strong className="text-[#7EF8E6]">Propietario de Empresa</strong> para poder vincular conductores y restaurantes.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#111413] border border-[#24302C] rounded-full">
                <button
                  type="button"
                  onClick={() => setPartnerRole('Conductor')}
                  className={`min-h-[40px] rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    partnerRole === 'Conductor'
                      ? 'bg-[#7EF8E6] text-[#111413]'
                      : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Conductor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerRole('Comerciante')}
                  className={`min-h-[40px] rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    partnerRole === 'Comerciante'
                      ? 'bg-[#7EF8E6] text-[#111413]'
                      : 'text-[#A0ABA6] hover:text-[#E1E3E1]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Restaurante / Comercio</span>
                </button>
              </div>

              <div>
                <label htmlFor="part-owner-ref" className="block text-xs text-[#A0ABA6] mb-1">
                  Código de Empresa o Correo del Propietario (vinculación obligatoria)
                </label>
                <input
                  id="part-owner-ref"
                  type="text"
                  required
                  value={ownerReference}
                  onChange={(e) => setOwnerReference(e.target.value)}
                  placeholder={`Ej. ${bootstrapStatus.companyCode ?? 'UBID-01'} o correo del propietario`}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="part-name" className="block text-xs text-[#A0ABA6] mb-1">
                    {partnerRole === 'Conductor' ? 'Nombre del conductor' : 'Nombre del responsable'}
                  </label>
                  <input
                    id="part-name"
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Ej. Mateo Silva"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
                <div>
                  <label htmlFor="part-phone" className="block text-xs text-[#A0ABA6] mb-1">
                    Teléfono de contacto
                  </label>
                  <input
                    id="part-phone"
                    type="tel"
                    required
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="+58 414-555-0192"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-mono-tabular text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
                <div>
                  <label htmlFor="part-email" className="block text-xs text-[#A0ABA6] mb-1">
                    Correo de acceso
                  </label>
                  <input
                    id="part-email"
                    type="email"
                    required
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="socio@correo.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
                <div>
                  <label htmlFor="part-pass" className="block text-xs text-[#A0ABA6] mb-1">
                    Contraseña (mín. 6 caracteres)
                  </label>
                  <input
                    id="part-pass"
                    type="password"
                    required
                    minLength={6}
                    value={partnerPassword}
                    onChange={(e) => setPartnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                  />
                </div>
              </div>

              {partnerRole === 'Conductor' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#24302C]">
                  <div>
                    <label htmlFor="part-tier" className="block text-xs text-[#A0ABA6] mb-1">
                      Categoría
                    </label>
                    <select
                      id="part-tier"
                      value={drvTier}
                      onChange={(e) => setDrvTier(e.target.value as DriverProfile['tier'])}
                      className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                    >
                      <option value="Moto Express">Moto Express</option>
                      <option value="Carro Confort">Carro Confort</option>
                      <option value="SUV Ejecutiva">SUV Ejecutiva</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="part-vehicle" className="block text-xs text-[#A0ABA6] mb-1">
                      Vehículo y color
                    </label>
                    <input
                      id="part-vehicle"
                      type="text"
                      required
                      value={drvVehicle}
                      onChange={(e) => setDrvVehicle(e.target.value)}
                      placeholder="Hyundai Accent Blanco"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                    />
                  </div>
                  <div>
                    <label htmlFor="part-plate" className="block text-xs text-[#A0ABA6] mb-1">
                      Placa
                    </label>
                    <input
                      id="part-plate"
                      type="text"
                      required
                      value={drvPlate}
                      onChange={(e) => setDrvPlate(e.target.value)}
                      placeholder="AC301KL"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm font-mono-tabular uppercase text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-[#24302C]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="pm-name" className="block text-xs text-[#A0ABA6] mb-1">
                        Nombre del restaurante / comercio
                      </label>
                      <input
                        id="pm-name"
                        type="text"
                        required
                        value={merchName}
                        onChange={(e) => setMerchName(e.target.value)}
                        placeholder="Ej. Pizzería Bella Vista"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                      />
                    </div>
                    <div>
                      <label htmlFor="pm-cat" className="block text-xs text-[#A0ABA6] mb-1">
                        Vertical
                      </label>
                      <select
                        id="pm-cat"
                        value={merchCategory}
                        onChange={(e) =>
                          setMerchCategory(e.target.value as Exclude<DeliveryCategory, 'Todos'>)
                        }
                        className="w-full h-11 px-3 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                      >
                        <option value="Restaurantes">Restaurantes</option>
                        <option value="Farmacia">Farmacia</option>
                        <option value="Supermercado">Supermercado</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pm-zone" className="block text-xs text-[#A0ABA6] mb-1">
                        Zona o sector
                      </label>
                      <input
                        id="pm-zone"
                        type="text"
                        value={merchZone}
                        onChange={(e) => setMerchZone(e.target.value)}
                        placeholder="Ej. Paseo Norte"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                      />
                    </div>
                    <div>
                      <label htmlFor="pm-prep" className="block text-xs text-[#A0ABA6] mb-1">
                        Tiempo de preparación
                      </label>
                      <input
                        id="pm-prep"
                        type="text"
                        value={merchPrep}
                        onChange={(e) => setMerchPrep(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                      />
                    </div>
                  </div>

                  {/* Menú inicial del restaurante */}
                  <div className="bg-[#111413] border border-[#24302C] rounded-xl p-3.5 space-y-3">
                    <span className="text-xs font-semibold text-[#7EF8E6] block">
                      Menú inicial para revisión del Propietario
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={menuDraftName}
                        onChange={(e) => setMenuDraftName(e.target.value)}
                        placeholder="Nombre del plato"
                        className="sm:col-span-2 h-10 px-3 rounded-lg bg-[#191D1C] border border-[#24302C] text-xs text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                      />
                      <input
                        type="number"
                        step="0.25"
                        min="0.5"
                        value={menuDraftPrice}
                        onChange={(e) => setMenuDraftPrice(e.target.value)}
                        placeholder="USD"
                        className="h-10 px-3 rounded-lg bg-[#191D1C] border border-[#24302C] text-xs font-bold tabular-nums text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={menuDraftDesc}
                        onChange={(e) => setMenuDraftDesc(e.target.value)}
                        placeholder="Descripción corta"
                        className="sm:col-span-2 h-10 px-3 rounded-lg bg-[#191D1C] border border-[#24302C] text-xs text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6]"
                      />
                      <select
                        value={menuDraftImage}
                        onChange={(e) => setMenuDraftImage(e.target.value)}
                        className="h-10 px-2.5 rounded-lg bg-[#191D1C] border border-[#24302C] text-xs text-[#E1E3E1] focus:outline-none focus:border-[#7EF8E6]"
                      >
                        {MENU_IMAGE_OPTIONS.map((img) => (
                          <option key={img.label} value={img.url}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDraftMenuItem}
                      className="min-h-[36px] px-3.5 rounded-full bg-[#202624] border border-[#354A44] hover:border-[#7EF8E6] text-xs font-semibold text-[#7EF8E6] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar plato al envío ({menuItems.length})</span>
                    </button>

                    {menuItems.length > 0 && (
                      <div className="divide-y divide-[#24302C] pt-1">
                        {menuItems.map((item, idx) => (
                          <div
                            key={`${item.name}-${idx}`}
                            className="py-1.5 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-[#E1E3E1] truncate">
                              {item.name} ·{' '}
                              <span className="text-[#7EF8E6] tabular-nums">
                                ${item.priceUsd.toFixed(2)}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setMenuItems((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-[#A0ABA6] hover:text-[#FFB4AB] p-1 cursor-pointer"
                              aria-label={`Quitar ${item.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full h-12 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-bold text-[#E1E3E1] transition-colors cursor-pointer disabled:opacity-50"
              >
                {busy
                  ? 'Enviando solicitud...'
                  : 'Enviar solicitud vinculada al Propietario de Empresa'}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
