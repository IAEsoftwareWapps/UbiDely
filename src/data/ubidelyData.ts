import { MEDIA_ASSETS } from '../assets/mediaAssets';

export type CurrencyCode = 'USD' | 'VES' | 'EUR' | 'COP';

export interface ExchangeRates {
  USD_TO_VES: number;
  EUR_TO_VES: number;
  USD_TO_EUR: number;
  USD_TO_COP: number;
  updatedAt: string;
}

export const INITIAL_RATES: ExchangeRates = {
  USD_TO_VES: 46.85,
  EUR_TO_VES: 50.62,
  USD_TO_EUR: 0.925,
  USD_TO_COP: 4380,
  updatedAt: 'Tasa de referencia · 09:00',
};

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  label: string;
  color: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$', label: 'USD $', color: '#2ECC71' },
  VES: { code: 'VES', symbol: 'Bs.', label: 'Bs.', color: '#3B82F6' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR €', color: '#F59E0B' },
  COP: { code: 'COP', symbol: 'COP', label: 'COP', color: '#EC4899' },
};

export function convertFromUsd(usd: number, target: CurrencyCode, rates: ExchangeRates): number {
  switch (target) {
    case 'USD':
      return usd;
    case 'VES':
      return usd * rates.USD_TO_VES;
    case 'EUR':
      return usd * rates.USD_TO_EUR;
    case 'COP':
      return usd * rates.USD_TO_COP;
  }
}

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  switch (currency) {
    case 'USD':
      return `$${amount.toLocaleString('es-419', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'VES':
      return `Bs. ${amount.toLocaleString('es-419', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR':
      return `€${amount.toLocaleString('es-419', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'COP':
      return `COP ${Math.round(amount).toLocaleString('es-419')}`;
  }
}

export function formatDualPrice(
  usdAmount: number,
  activeCurrency: CurrencyCode,
  rates: ExchangeRates
): { primary: string; secondary: string } {
  const primaryValue = convertFromUsd(usdAmount, activeCurrency, rates);
  const primary = formatCurrencyAmount(primaryValue, activeCurrency);

  if (activeCurrency === 'VES') {
    return {
      primary,
      secondary: `${formatCurrencyAmount(usdAmount, 'USD')} USD`,
    };
  }

  const vesValue = convertFromUsd(usdAmount, 'VES', rates);
  return {
    primary,
    secondary: formatCurrencyAmount(vesValue, 'VES'),
  };
}

export interface CityZone {
  id: string;
  name: string;
  sector: string;
  x: number;
  y: number;
}

export interface ServiceCity {
  id: string;
  name: string;
  region: string;
  landmarkLabel: string;
  nationalX: number;
  nationalY: number;
  zones: CityZone[];
}

export const SERVICE_CITIES: ServiceCity[] = [
  {
    id: 'ciudad-central',
    name: 'Distrito Central',
    region: 'Zona Metropolitana',
    landmarkLabel: 'CORREDOR NORTE · PARQUE METROPOLITANO',
    nationalX: 52,
    nationalY: 25,
    zones: [
      { id: 'dc-centro', name: 'Centro Financiero', sector: 'Núcleo', x: 24, y: 46 },
      { id: 'dc-norte', name: 'Paseo Norte', sector: 'Residencial', x: 46, y: 30 },
      { id: 'dc-plaza', name: 'Plaza Mayor', sector: 'Comercial', x: 42, y: 46 },
      { id: 'dc-mirador', name: 'El Mirador', sector: 'Este', x: 58, y: 34 },
      { id: 'dc-arboleda', name: 'La Arboleda', sector: 'Este', x: 74, y: 32 },
      { id: 'dc-galeria', name: 'Galería Sur', sector: 'Comercial', x: 54, y: 60 },
      { id: 'dc-bulevar', name: 'Bulevar Gastronómico', sector: 'Sur', x: 65, y: 74 },
      { id: 'dc-colinas', name: 'Altos de la Colina', sector: 'Sur-Este', x: 84, y: 84 },
    ],
  },
  {
    id: 'valle-industrial',
    name: 'Valle Industrial',
    region: 'Región Centro',
    landmarkLabel: 'RESERVA NATURAL DEL VALLE',
    nationalX: 41,
    nationalY: 29,
    zones: [
      { id: 'vi-vinedo', name: 'Jardines del Valle', sector: 'Norte', x: 42, y: 38 },
      { id: 'vi-oeste', name: 'Urbanización Oeste', sector: 'Oeste', x: 30, y: 48 },
      { id: 'vi-campus', name: 'Ciudad Universitaria', sector: 'Norte', x: 45, y: 24 },
      { id: 'vi-centrocom', name: 'Centro Comercial Este', sector: 'Norte-Este', x: 64, y: 30 },
      { id: 'vi-parque', name: 'Parque Logístico', sector: 'Este', x: 78, y: 42 },
      { id: 'vi-avenida', name: 'Avenida Principal', sector: 'Centro', x: 48, y: 58 },
      { id: 'vi-zona', name: 'Zona Industrial', sector: 'Sur', x: 68, y: 76 },
    ],
  },
  {
    id: 'puerto-lago',
    name: 'Puerto del Lago',
    region: 'Región Occidental',
    landmarkLabel: 'COSTA DEL LAGO · PUENTE METROPOLITANO',
    nationalX: 18,
    nationalY: 24,
    zones: [
      { id: 'pl-costanera', name: 'Av. Costanera', sector: 'Este', x: 58, y: 36 },
      { id: 'pl-boulevard', name: 'Bulevar 5 de Julio', sector: 'Centro', x: 48, y: 48 },
      { id: 'pl-norte', name: 'Sector Universitario', sector: 'Norte', x: 52, y: 28 },
      { id: 'pl-muelle', name: 'Muelle Comercial', sector: 'Costa', x: 72, y: 42 },
      { id: 'pl-delicias', name: 'Las Delicias', sector: 'Oeste', x: 34, y: 36 },
      { id: 'pl-sur', name: 'Terminal Sur', sector: 'Sur', x: 56, y: 76 },
    ],
  },
  {
    id: 'ciudad-sierra',
    name: 'Ciudad de la Sierra',
    region: 'Región Andina',
    landmarkLabel: 'CORDILLERA ALTA · TELEFÉRICO',
    nationalX: 22,
    nationalY: 46,
    zones: [
      { id: 'cs-cumbres', name: 'Las Cumbres', sector: 'Norte', x: 56, y: 26 },
      { id: 'cs-americas', name: 'Av. Las Américas', sector: 'Oeste', x: 38, y: 46 },
      { id: 'cs-plaza', name: 'Casco Histórico', sector: 'Centro', x: 52, y: 48 },
      { id: 'cs-estacion', name: 'Estación Mirador', sector: 'Este', x: 64, y: 54 },
      { id: 'cs-proceres', name: 'Av. Los Próceres', sector: 'Sur-Oeste', x: 34, y: 64 },
      { id: 'cs-valle', name: 'Valle Nuevo', sector: 'Sur', x: 22, y: 76 },
    ],
  },
  {
    id: 'bahia-costa',
    name: 'Bahía de la Costa',
    region: 'Región Oriental',
    landmarkLabel: 'BAHÍA MARÍTIMA · PASEO COSTERO',
    nationalX: 69,
    nationalY: 26,
    zones: [
      { id: 'bc-morro', name: 'Península Norte', sector: 'Costa', x: 40, y: 30 },
      { id: 'bc-playa', name: 'Playa Serena', sector: 'Litoral', x: 48, y: 42 },
      { id: 'bc-principal', name: 'Av. del Mar', sector: 'Centro', x: 54, y: 50 },
      { id: 'bc-nueva', name: 'Ciudad Nueva', sector: 'Sur', x: 62, y: 70 },
      { id: 'bc-puerto', name: 'Puerto Comercial', sector: 'Este', x: 78, y: 38 },
      { id: 'bc-marina', name: 'La Marina', sector: 'Canales', x: 42, y: 58 },
    ],
  },
  {
    id: 'ciudad-rio',
    name: 'Ciudad del Río',
    region: 'Región Sur',
    landmarkLabel: 'CONFLUENCIA FLUVIAL · PARQUE CENTRAL',
    nationalX: 74,
    nationalY: 48,
    zones: [
      { id: 'cr-altavista', name: 'Alta Vista', sector: 'Centro', x: 46, y: 40 },
      { id: 'cr-villa', name: 'Villa Central', sector: 'Comercial', x: 56, y: 46 },
      { id: 'cr-olivos', name: 'Los Olivos', sector: 'Oeste', x: 32, y: 36 },
      { id: 'cr-aeropuerto', name: 'Zona Aeropuerto', sector: 'Oeste', x: 24, y: 54 },
      { id: 'cr-parque', name: 'Parque del Salto', sector: 'Río', x: 68, y: 56 },
      { id: 'cr-este', name: 'Puerto Este', sector: 'Este', x: 82, y: 44 },
    ],
  },
];

export function calculateZoneDistanceKm(from: CityZone, to: CityZone): number {
  const dx = (to.x - from.x) * 0.14;
  const dy = (to.y - from.y) * 0.11;
  const raw = Math.sqrt(dx * dx + dy * dy);
  return Math.max(1.2, Number((raw * 1.15).toFixed(1)));
}

export function calculateIntercityDistanceKm(from: ServiceCity, to: ServiceCity): number {
  const dx = (to.nationalX - from.nationalX) * 14.2;
  const dy = (to.nationalY - from.nationalY) * 12.6;
  const raw = Math.sqrt(dx * dx + dy * dy);
  return Math.max(38, Math.round(raw * 1.18));
}

export interface RideTier {
  id: string;
  name: string;
  vehicleExample: string;
  capacity: string;
  etaMinutes: number;
  baseUsd: number;
  perKmUsd: number;
  intercityMultiplier: number;
}

export const RIDE_TIERS: RideTier[] = [
  {
    id: 'moto-express',
    name: 'Moto Express',
    vehicleExample: 'Moto 150cc · Casco incluido',
    capacity: '1 pasajero',
    etaMinutes: 3,
    baseUsd: 1.8,
    perKmUsd: 0.45,
    intercityMultiplier: 0.65,
  },
  {
    id: 'carro-confort',
    name: 'Carro Confort',
    vehicleExample: 'Sedán con A/A · 4 puertas',
    capacity: 'Hasta 4 personas',
    etaMinutes: 5,
    baseUsd: 3.2,
    perKmUsd: 0.72,
    intercityMultiplier: 0.22,
  },
  {
    id: 'suv-ejecutiva',
    name: 'SUV Ejecutiva',
    vehicleExample: 'Camioneta 4x4 · Prioritaria',
    capacity: 'Hasta 6 personas',
    etaMinutes: 7,
    baseUsd: 5.5,
    perKmUsd: 1.05,
    intercityMultiplier: 0.34,
  },
  {
    id: 'encomienda-flash',
    name: 'Encomienda Express',
    vehicleExample: 'Caja sellada · Entrega con PIN',
    capacity: 'Hasta 15 kg',
    etaMinutes: 4,
    baseUsd: 2.1,
    perKmUsd: 0.5,
    intercityMultiplier: 0.14,
  },
];

export type DeliveryCategory = 'Todos' | 'Restaurantes' | 'Farmacia' | 'Supermercado';

export interface RestaurantMerchant {
  id: string;
  name: string;
  category: Exclude<DeliveryCategory, 'Todos'>;
  zone: string;
  prepTime: string;
  active: boolean;
}

export const INITIAL_MERCHANTS: RestaurantMerchant[] = [
  {
    id: 'm-1',
    name: 'Arepera El Fogón',
    category: 'Restaurantes',
    zone: 'Bulevar Gastronómico',
    prepTime: '18–25 min',
    active: true,
  },
  {
    id: 'm-2',
    name: 'Smash & Grill Urbano',
    category: 'Restaurantes',
    zone: 'El Mirador',
    prepTime: '22–30 min',
    active: true,
  },
  {
    id: 'm-3',
    name: 'Farmacia Salud 24h',
    category: 'Farmacia',
    zone: 'Plaza Mayor',
    prepTime: '15–20 min',
    active: true,
  },
  {
    id: 'm-4',
    name: 'Automercado Fresco',
    category: 'Supermercado',
    zone: 'La Arboleda',
    prepTime: '25–35 min',
    active: true,
  },
];

export interface DeliveryProduct {
  id: string;
  merchantId: string;
  name: string;
  merchant: string;
  zoneLabel: string;
  category: Exclude<DeliveryCategory, 'Todos'>;
  prepTime: string;
  priceUsd: number;
  description: string;
  imageUrl: string;
}

export const INITIAL_CATALOG: DeliveryProduct[] = [
  {
    id: 'arepa-reina-combo',
    merchantId: 'm-1',
    name: 'Combo Arepas Rellenas y Tequeños',
    merchant: 'Arepera El Fogón',
    zoneLabel: 'Bulevar Gastronómico',
    category: 'Restaurantes',
    prepTime: '18–25 min',
    priceUsd: 9.5,
    description:
      'Dos arepas asadas rellenas de pollo con aguacate, 4 tequeños de queso blanco y salsa de ajo de la casa.',
    imageUrl: MEDIA_ASSETS.dishArepaReina,
  },
  {
    id: 'smash-avila-burger',
    merchantId: 'm-2',
    name: 'Doble Smash Burger y Papas Trufadas',
    merchant: 'Smash & Grill Urbano',
    zoneLabel: 'El Mirador',
    category: 'Restaurantes',
    prepTime: '22–30 min',
    priceUsd: 12.8,
    description:
      'Doble carne sellada al grill con queso cheddar fundido, cebolla caramelizada en pan brioche y papas crujientes.',
    imageUrl: MEDIA_ASSETS.dishSmashBurger,
  },
  {
    id: 'kit-bienestar-24h',
    merchantId: 'm-3',
    name: 'Kit Inmune y Recuperación 24h',
    merchant: 'Farmacia Salud 24h',
    zoneLabel: 'Plaza Mayor',
    category: 'Farmacia',
    prepTime: '15–20 min',
    priceUsd: 16.4,
    description:
      'Empaque farmacéutico sellado con Vitamina C + Zinc, sales de hidratación oral y analgésicos esenciales.',
    imageUrl: MEDIA_ASSETS.pharmacyWellnessKit,
  },
  {
    id: 'canasta-fresca-tropical',
    merchantId: 'm-4',
    name: 'Canasta Fresca Tropical y Café Tostado',
    merchant: 'Automercado Fresco',
    zoneLabel: 'La Arboleda',
    category: 'Supermercado',
    prepTime: '25–35 min',
    priceUsd: 18.9,
    description:
      'Aguacates seleccionados, mangos maduros, plátanos y café arábigo tostado medio de origen (340 g).',
    imageUrl: MEDIA_ASSETS.groceryFreshProduce,
  },
  {
    id: 'cachapa-queso-mano',
    merchantId: 'm-1',
    name: 'Cachapa Doble con Queso Fresco',
    merchant: 'Arepera El Fogón',
    zoneLabel: 'Bulevar Gastronómico',
    category: 'Restaurantes',
    prepTime: '15–22 min',
    priceUsd: 8.2,
    description:
      'Cachapa de maíz tierno molido al día con queso artesanal derretido y mantequilla.',
    imageUrl: MEDIA_ASSETS.dishArepaReina,
  },
  {
    id: 'botiquin-express',
    merchantId: 'm-3',
    name: 'Botiquín Urbano Express',
    merchant: 'Farmacia Salud 24h',
    zoneLabel: 'Plaza Mayor',
    category: 'Farmacia',
    prepTime: '12–18 min',
    priceUsd: 11.75,
    description:
      'Kit de primeros auxilios con antiséptico, gasas estériles, termómetro digital y multivitamínico diario.',
    imageUrl: MEDIA_ASSETS.pharmacyWellnessKit,
  },
];

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  tier: 'Moto Express' | 'Carro Confort' | 'SUV Ejecutiva';
  rating: string;
  avatar: string;
  status: 'Disponible' | 'En servicio';
}

export const INITIAL_DRIVERS: DriverProfile[] = [
  {
    id: 'drv-1',
    name: 'Carlos Mendoza',
    phone: '+58 414-329-8841',
    vehicle: 'Toyota Corolla Gris',
    plate: 'AF829LM',
    tier: 'Carro Confort',
    rating: '4.94',
    avatar: MEDIA_ASSETS.courierAvatarCarlos,
    status: 'En servicio',
  },
  {
    id: 'drv-2',
    name: 'Luis Herrera',
    phone: '+58 424-812-0049',
    vehicle: 'Moto SBR 150 Negra',
    plate: 'AB4K92M',
    tier: 'Moto Express',
    rating: '4.91',
    avatar: MEDIA_ASSETS.courierAvatarCarlos,
    status: 'Disponible',
  },
  {
    id: 'drv-3',
    name: 'Andrea Rojas',
    phone: '+58 412-550-7120',
    vehicle: 'Toyota Fortuner Plata',
    plate: 'AG410PT',
    tier: 'SUV Ejecutiva',
    rating: '4.98',
    avatar: MEDIA_ASSETS.courierAvatarCarlos,
    status: 'Disponible',
  },
];

export type AdminRole = 'Propietario' | 'Super Admin' | 'Operaciones' | 'Finanzas';
export type PartnerRole = 'Conductor' | 'Comerciante';
export type UserRole = AdminRole | PartnerRole;
export type ApprovalStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
}

export interface CompanyInfo {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  approvalStatus: ApprovalStatus;
  linkedOwnerId?: string;
  linkedOwnerName?: string;
  companyName?: string;
  companyCode?: string;
  rejectionReason?: string;
}

export interface BootstrapStatus {
  ownerClaimed: boolean;
  requiresPasscode: boolean;
  companyName: string | null;
  companyCode: string | null;
  ownerEmail: string | null;
}

export interface PartnerSubmittedMenuItem {
  name: string;
  priceUsd: number;
  description: string;
  imageUrl: string;
}

export interface PartnerRequest {
  id: string;
  userId: string;
  role: PartnerRole;
  name: string;
  email: string;
  phone: string;
  linkedOwnerId: string;
  companyCode: string;
  companyName: string;
  status: ApprovalStatus;
  createdAt: number;
  rejectionReason?: string;
  driverData?: {
    vehicle: string;
    plate: string;
    tier: DriverProfile['tier'];
  };
  merchantData?: {
    merchantName: string;
    category: Exclude<DeliveryCategory, 'Todos'>;
    zone: string;
    prepTime: string;
    menuItems: PartnerSubmittedMenuItem[];
  };
}

export const INITIAL_ADMIN_USERS: AdminUser[] = [];

export interface FinancialEntry {
  id: string;
  type: 'ingreso' | 'gasto';
  concept: string;
  category: string;
  amountUsd: number;
  method: string;
  dateLabel: string;
  daysAgo?: number;
}

export const INITIAL_FINANCIAL_ENTRIES: FinancialEntry[] = [
  {
    id: 'fin-1',
    type: 'ingreso',
    concept: 'Traslados Carro Confort y SUV · Corredor Norte',
    category: 'Movilidad',
    amountUsd: 48.5,
    method: 'Pago Móvil',
    dateLabel: 'Hoy · 13:42',
    daysAgo: 0,
  },
  {
    id: 'fin-2',
    type: 'ingreso',
    concept: 'Pedidos Delivery · Arepera El Fogón y Smash & Grill',
    category: 'Delivery',
    amountUsd: 64.2,
    method: 'Tarjeta / Biométrico',
    dateLabel: 'Hoy · 11:15',
    daysAgo: 0,
  },
  {
    id: 'fin-3',
    type: 'gasto',
    concept: 'Liquidación operativa de flota motorizada',
    category: 'Nómina y Flota',
    amountUsd: 32.0,
    method: 'Transferencia',
    dateLabel: 'Hoy · 09:30',
    daysAgo: 0,
  },
  {
    id: 'fin-4',
    type: 'ingreso',
    concept: 'Encomiendas y traslados interurbanos · Valle Industrial',
    category: 'Movilidad',
    amountUsd: 56.8,
    method: 'Transferencia USD',
    dateLabel: 'Hace 1 día · 19:08',
    daysAgo: 1,
  },
  {
    id: 'fin-5',
    type: 'ingreso',
    concept: 'Pedidos Farmacia Salud 24h y Automercado Fresco',
    category: 'Delivery',
    amountUsd: 41.4,
    method: 'Pago Móvil',
    dateLabel: 'Hace 1 día · 17:40',
    daysAgo: 1,
  },
  {
    id: 'fin-6',
    type: 'gasto',
    concept: 'Mantenimiento preventivo y GPS unidades',
    category: 'Operaciones',
    amountUsd: 18.5,
    method: 'Efectivo USD',
    dateLabel: 'Hace 1 día · 16:20',
    daysAgo: 1,
  },
  {
    id: 'fin-7',
    type: 'ingreso',
    concept: 'Traslados ejecutivos · Plaza Mayor → Aeropuerto',
    category: 'Movilidad',
    amountUsd: 72.0,
    method: 'Tarjeta / Biométrico',
    dateLabel: 'Hace 2 días · 18:10',
    daysAgo: 2,
  },
  {
    id: 'fin-8',
    type: 'ingreso',
    concept: 'Jornada nocturna restaurantes · Bulevar Gastronómico',
    category: 'Delivery',
    amountUsd: 58.9,
    method: 'Pago Móvil',
    dateLabel: 'Hace 2 días · 21:05',
    daysAgo: 2,
  },
  {
    id: 'fin-9',
    type: 'ingreso',
    concept: 'Flota urbana Moto Express y Carro Confort',
    category: 'Movilidad',
    amountUsd: 39.4,
    method: 'Efectivo USD',
    dateLabel: 'Hace 3 días · 15:25',
    daysAgo: 3,
  },
  {
    id: 'fin-10',
    type: 'ingreso',
    concept: 'Comisiones Delivery · Zona Metropolitana',
    category: 'Delivery',
    amountUsd: 46.5,
    method: 'Transferencia',
    dateLabel: 'Hace 3 días · 14:12',
    daysAgo: 3,
  },
  {
    id: 'fin-11',
    type: 'ingreso',
    concept: 'Encomienda Express · Distrito Central → Puerto del Lago',
    category: 'Encomiendas',
    amountUsd: 61.0,
    method: 'Transferencia USD',
    dateLabel: 'Hace 4 días · 16:50',
    daysAgo: 4,
  },
  {
    id: 'fin-12',
    type: 'ingreso',
    concept: 'Pedidos corporativos almuerzos · Centro Financiero',
    category: 'Delivery',
    amountUsd: 53.7,
    method: 'Transferencia',
    dateLabel: 'Hace 4 días · 13:18',
    daysAgo: 4,
  },
  {
    id: 'fin-13',
    type: 'ingreso',
    concept: 'Traslados urbanos hora pico · Paseo Norte',
    category: 'Movilidad',
    amountUsd: 44.2,
    method: 'Pago Móvil',
    dateLabel: 'Hace 5 días · 18:45',
    daysAgo: 5,
  },
  {
    id: 'fin-14',
    type: 'ingreso',
    concept: 'Delivery supermercado y farmacia · La Arboleda',
    category: 'Delivery',
    amountUsd: 37.8,
    method: 'Tarjeta / Biométrico',
    dateLabel: 'Hace 5 días · 12:05',
    daysAgo: 5,
  },
  {
    id: 'fin-15',
    type: 'ingreso',
    concept: 'Rutas interurbanas fin de semana · Ciudad de la Sierra',
    category: 'Movilidad',
    amountUsd: 52.6,
    method: 'Transferencia USD',
    dateLabel: 'Hace 6 días · 19:30',
    daysAgo: 6,
  },
  {
    id: 'fin-16',
    type: 'ingreso',
    concept: 'Pedidos fin de semana · Arepera El Fogón',
    category: 'Delivery',
    amountUsd: 49.3,
    method: 'Pago Móvil',
    dateLabel: 'Hace 6 días · 20:15',
    daysAgo: 6,
  },
];

export interface BankOption {
  code: string;
  name: string;
}

export const BANK_OPTIONS: BankOption[] = [
  { code: '0134', name: 'Banesco' },
  { code: '0105', name: 'Mercantil' },
  { code: '0102', name: 'Banco Central / Estatal' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0191', name: 'BNC Crédito' },
  { code: '0172', name: 'Bancamiga' },
];

export interface TrackedDispatch {
  id: string;
  type: 'ride' | 'delivery';
  mode: 'urban' | 'national';
  cityId: string;
  destinationCityId: string;
  title: string;
  subtitle: string;
  originZoneId: string;
  destinationZoneId: string;
  driverName: string;
  driverAvatar: string;
  driverRating: string;
  driverPhone: string;
  vehicle: string;
  plate: string;
  amountUsd: number;
  paymentMethod: string;
  progressStep: number; // 0: Confirmado, 1: En camino a buscarte, 2: Llegando a recogida, 3: En ruta a destino
  etaMinutes: number;
}

export const INITIAL_TRACKED_DISPATCH: TrackedDispatch = {
  id: 'UD-4920',
  type: 'ride',
  mode: 'urban',
  cityId: 'ciudad-central',
  destinationCityId: 'ciudad-central',
  title: 'Carro Confort · El Mirador → Bulevar Gastronómico',
  subtitle: 'Distrito Central · Vía Avenida Principal',
  originZoneId: 'dc-mirador',
  destinationZoneId: 'dc-bulevar',
  driverName: 'Carlos Mendoza',
  driverAvatar: MEDIA_ASSETS.courierAvatarCarlos,
  driverRating: '4.94',
  driverPhone: '+58 414-329-8841',
  vehicle: 'Toyota Corolla Gris',
  plate: 'AF829LM',
  amountUsd: 5.2,
  paymentMethod: 'Pago Móvil Verificado',
  progressStep: 1,
  etaMinutes: 4,
};

export interface ServiceHistoryOrderItem {
  productId: string;
  name: string;
  merchant: string;
  category: Exclude<DeliveryCategory, 'Todos'>;
  zoneLabel: string;
  prepTime: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  imageUrl: string;
}

export interface ServiceHistoryEntry {
  id: string;
  type: 'ride' | 'delivery';
  status: 'Completado' | 'En curso';
  dateLabel: string;
  cityId: string;
  cityName: string;
  title: string;
  originLabel: string;
  destinationLabel: string;
  vehicleOrTier: string;
  driverName: string;
  driverAvatar: string;
  plate: string;
  paymentMethod: string;
  amountUsd: number;
  merchantName?: string;
  orderItems?: ServiceHistoryOrderItem[];
}

export const INITIAL_SERVICE_HISTORY: ServiceHistoryEntry[] = [
  {
    id: 'UD-4920',
    type: 'ride',
    status: 'En curso',
    dateLabel: 'Hoy · En curso',
    cityId: 'ciudad-central',
    cityName: 'Distrito Central',
    title: 'Carro Confort · El Mirador → Bulevar Gastronómico',
    originLabel: 'El Mirador',
    destinationLabel: 'Bulevar Gastronómico',
    vehicleOrTier: 'Carro Confort · Toyota Corolla Gris',
    driverName: 'Carlos Mendoza',
    driverAvatar: MEDIA_ASSETS.courierAvatarCarlos,
    plate: 'AF829LM',
    paymentMethod: 'Pago Móvil Verificado',
    amountUsd: 5.2,
  },
  {
    id: 'DEL-8410',
    type: 'delivery',
    status: 'Completado',
    dateLabel: 'Ayer · 20:15',
    cityId: 'ciudad-central',
    cityName: 'Distrito Central',
    title: 'Arepera El Fogón · Combo Arepas y Cachapa',
    originLabel: 'Bulevar Gastronómico',
    destinationLabel: 'Paseo Norte',
    vehicleOrTier: 'Moto Express · Moto SBR 150 Negra',
    driverName: 'Luis Herrera',
    driverAvatar: MEDIA_ASSETS.courierAvatarCarlos,
    plate: 'AB4K92M',
    paymentMethod: 'Pago Móvil (Banesco)',
    amountUsd: 19.6,
    merchantName: 'Arepera El Fogón',
    orderItems: [
      {
        productId: 'arepa-reina-combo',
        name: 'Combo Arepas Rellenas y Tequeños',
        merchant: 'Arepera El Fogón',
        category: 'Restaurantes',
        zoneLabel: 'Bulevar Gastronómico',
        prepTime: '18–25 min',
        description:
          'Dos arepas asadas rellenas de pollo con aguacate, 4 tequeños de queso blanco y salsa de ajo de la casa.',
        quantity: 1,
        unitPriceUsd: 9.5,
        imageUrl: MEDIA_ASSETS.dishArepaReina,
      },
      {
        productId: 'cachapa-queso-mano',
        name: 'Cachapa Doble con Queso Fresco',
        merchant: 'Arepera El Fogón',
        category: 'Restaurantes',
        zoneLabel: 'Bulevar Gastronómico',
        prepTime: '15–22 min',
        description:
          'Cachapa de maíz tierno molido al día con queso artesanal derretido y mantequilla.',
        quantity: 1,
        unitPriceUsd: 8.2,
        imageUrl: MEDIA_ASSETS.dishArepaReina,
      },
    ],
  },
  {
    id: 'UD-4765',
    type: 'ride',
    status: 'Completado',
    dateLabel: 'Hace 2 días · 08:40',
    cityId: 'ciudad-central',
    cityName: 'Distrito Central',
    title: 'SUV Ejecutiva · Plaza Mayor → Altos de la Colina',
    originLabel: 'Plaza Mayor',
    destinationLabel: 'Altos de la Colina',
    vehicleOrTier: 'SUV Ejecutiva · Toyota Fortuner Plata',
    driverName: 'Andrea Rojas',
    driverAvatar: MEDIA_ASSETS.courierAvatarCarlos,
    plate: 'AG410PT',
    paymentMethod: 'Billetera Biométrica',
    amountUsd: 11.8,
  },
  {
    id: 'DEL-8291',
    type: 'delivery',
    status: 'Completado',
    dateLabel: 'Hace 4 días · 13:20',
    cityId: 'ciudad-central',
    cityName: 'Distrito Central',
    title: 'Smash & Grill Urbano · Doble Smash Burger',
    originLabel: 'El Mirador',
    destinationLabel: 'Centro Financiero',
    vehicleOrTier: 'Moto Express · Moto SBR 150 Negra',
    driverName: 'Luis Herrera',
    driverAvatar: MEDIA_ASSETS.courierAvatarCarlos,
    plate: 'AB4K92M',
    paymentMethod: 'Efectivo USD',
    amountUsd: 27.5,
    merchantName: 'Smash & Grill Urbano',
    orderItems: [
      {
        productId: 'smash-avila-burger',
        name: 'Doble Smash Burger y Papas Trufadas',
        merchant: 'Smash & Grill Urbano',
        category: 'Restaurantes',
        zoneLabel: 'El Mirador',
        prepTime: '22–30 min',
        description:
          'Doble carne sellada al grill con queso cheddar fundido, cebolla caramelizada en pan brioche y papas crujientes.',
        quantity: 2,
        unitPriceUsd: 12.8,
        imageUrl: MEDIA_ASSETS.dishSmashBurger,
      },
    ],
  },
  {
    id: 'DEL-8114',
    type: 'delivery',
    status: 'Completado',
    dateLabel: 'Hace 6 días · 17:50',
    cityId: 'ciudad-central',
    cityName: 'Distrito Central',
    title: 'Farmacia Salud 24h · Kit Inmune y Botiquín',
    originLabel: 'Plaza Mayor',
    destinationLabel: 'La Arboleda',
    vehicleOrTier: 'Moto Express · Moto SBR 150 Negra',
    driverName: 'Luis Herrera',
    driverAvatar: MEDIA_ASSETS.courierAvatarCarlos,
    plate: 'AB4K92M',
    paymentMethod: 'Pago Móvil (Mercantil)',
    amountUsd: 18.3,
    merchantName: 'Farmacia Salud 24h',
    orderItems: [
      {
        productId: 'kit-bienestar-24h',
        name: 'Kit Inmune y Recuperación 24h',
        merchant: 'Farmacia Salud 24h',
        category: 'Farmacia',
        zoneLabel: 'Plaza Mayor',
        prepTime: '15–20 min',
        description:
          'Empaque farmacéutico sellado con Vitamina C + Zinc, sales de hidratación oral y analgésicos esenciales.',
        quantity: 1,
        unitPriceUsd: 16.4,
        imageUrl: MEDIA_ASSETS.pharmacyWellnessKit,
      },
    ],
  },
];

export interface DriverRatingRecord {
  id: string;
  driverId: string;
  driverName: string;
  serviceId: string;
  serviceType: 'ride' | 'delivery';
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  passengerName: string;
  dateIso: string;
}

export function getRelativeIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_DRIVER_RATINGS: DriverRatingRecord[] = [
  {
    id: 'rat-1',
    driverId: 'drv-1',
    driverName: 'Carlos Mendoza',
    serviceId: 'UD-4920',
    serviceType: 'ride',
    stars: 5,
    comment: 'Excelente puntualidad, vehículo impecable y conducción muy segura.',
    passengerName: 'Mariana G.',
    dateIso: getRelativeIsoDate(0),
  },
  {
    id: 'rat-2',
    driverId: 'drv-3',
    driverName: 'Andrea Rojas',
    serviceId: 'UD-4912',
    serviceType: 'ride',
    stars: 5,
    comment: 'Ruta interurbana muy cómoda, aire acondicionado perfecto y trato cordial.',
    passengerName: 'Roberto P.',
    dateIso: getRelativeIsoDate(0),
  },
  {
    id: 'rat-3',
    driverId: 'drv-2',
    driverName: 'Luis Herrera',
    serviceId: 'DEL-8410',
    serviceType: 'delivery',
    stars: 5,
    comment: 'Pedido de Arepera El Fogón entregado caliente antes del tiempo estimado.',
    passengerName: 'Valentina R.',
    dateIso: getRelativeIsoDate(1),
  },
  {
    id: 'rat-4',
    driverId: 'drv-1',
    driverName: 'Carlos Mendoza',
    serviceId: 'UD-4889',
    serviceType: 'ride',
    stars: 4,
    comment: 'Buen servicio y comunicación al llegar al punto de recogida.',
    passengerName: 'Andrés V.',
    dateIso: getRelativeIsoDate(2),
  },
  {
    id: 'rat-5',
    driverId: 'drv-2',
    driverName: 'Luis Herrera',
    serviceId: 'DEL-8395',
    serviceType: 'delivery',
    stars: 4,
    comment: 'Entrega cuidadosa y verificación rápida con código.',
    passengerName: 'Sofía M.',
    dateIso: getRelativeIsoDate(2),
  },
  {
    id: 'rat-6',
    driverId: 'drv-3',
    driverName: 'Andrea Rojas',
    serviceId: 'UD-4765',
    serviceType: 'ride',
    stars: 5,
    comment: 'Atención ejecutiva de primer nivel en traslado hacia Altos de la Colina.',
    passengerName: 'Diego L.',
    dateIso: getRelativeIsoDate(3),
  },
  {
    id: 'rat-7',
    driverId: 'drv-2',
    driverName: 'Luis Herrera',
    serviceId: 'DEL-8291',
    serviceType: 'delivery',
    stars: 5,
    comment: 'Muy amable, llegó con la bolsa térmica sellada intacta.',
    passengerName: 'Camila S.',
    dateIso: getRelativeIsoDate(4),
  },
  {
    id: 'rat-8',
    driverId: 'drv-1',
    driverName: 'Carlos Mendoza',
    serviceId: 'UD-4710',
    serviceType: 'ride',
    stars: 5,
    comment: 'Conoce muy bien las vías alternas para evitar tráfico.',
    passengerName: 'José F.',
    dateIso: getRelativeIsoDate(5),
  },
  {
    id: 'rat-9',
    driverId: 'drv-2',
    driverName: 'Luis Herrera',
    serviceId: 'DEL-8114',
    serviceType: 'delivery',
    stars: 3,
    comment: 'Hubo un pequeño retraso por lluvia, aunque avisó por mensaje.',
    passengerName: 'Elena C.',
    dateIso: getRelativeIsoDate(6),
  },
  {
    id: 'rat-10',
    driverId: 'drv-3',
    driverName: 'Andrea Rojas',
    serviceId: 'UD-4650',
    serviceType: 'ride',
    stars: 5,
    comment: 'Puntualidad exacta en recogida corporativa.',
    passengerName: 'Héctor N.',
    dateIso: getRelativeIsoDate(8),
  },
  {
    id: 'rat-11',
    driverId: 'drv-1',
    driverName: 'Carlos Mendoza',
    serviceId: 'UD-4602',
    serviceType: 'ride',
    stars: 4,
    comment: 'Traslado fluido y tarifa transparente.',
    passengerName: 'Paola D.',
    dateIso: getRelativeIsoDate(10),
  },
  {
    id: 'rat-12',
    driverId: 'drv-2',
    driverName: 'Luis Herrera',
    serviceId: 'DEL-8025',
    serviceType: 'delivery',
    stars: 5,
    comment: 'Súper rápido en hora pico.',
    passengerName: 'Javier T.',
    dateIso: getRelativeIsoDate(12),
  },
  {
    id: 'rat-13',
    driverId: 'drv-3',
    driverName: 'Andrea Rojas',
    serviceId: 'UD-4550',
    serviceType: 'ride',
    stars: 5,
    comment: 'Camioneta muy limpia y excelente atención.',
    passengerName: 'Lucía B.',
    dateIso: getRelativeIsoDate(14),
  },
  {
    id: 'rat-14',
    driverId: 'drv-1',
    driverName: 'Carlos Mendoza',
    serviceId: 'UD-4490',
    serviceType: 'ride',
    stars: 3,
    comment: 'Esperé unos minutos en la entrada equivocada, luego todo bien.',
    passengerName: 'Fernando K.',
    dateIso: getRelativeIsoDate(17),
  },
  {
    id: 'rat-15',
    driverId: 'drv-2',
    driverName: 'Luis Herrera',
    serviceId: 'DEL-7960',
    serviceType: 'delivery',
    stars: 2,
    comment: 'La bebida llegó algo agitada al subir al edificio.',
    passengerName: 'Mónica A.',
    dateIso: getRelativeIsoDate(21),
  },
  {
    id: 'rat-16',
    driverId: 'drv-3',
    driverName: 'Andrea Rojas',
    serviceId: 'UD-4410',
    serviceType: 'ride',
    stars: 5,
    comment: 'Siempre confiable para traslados ejecutivos.',
    passengerName: 'Gabriel O.',
    dateIso: getRelativeIsoDate(25),
  },
  {
    id: 'rat-17',
    driverId: 'drv-1',
    driverName: 'Carlos Mendoza',
    serviceId: 'UD-4320',
    serviceType: 'ride',
    stars: 5,
    comment: 'Muy atento con el equipaje y ruta directa.',
    passengerName: 'Daniela H.',
    dateIso: getRelativeIsoDate(29),
  },
  {
    id: 'rat-18',
    driverId: 'drv-2',
    driverName: 'Luis Herrera',
    serviceId: 'DEL-7840',
    serviceType: 'delivery',
    stars: 5,
    comment: 'Excelente disposición y entrega en puerta.',
    passengerName: 'Ricardo Z.',
    dateIso: getRelativeIsoDate(34),
  },
];


