import {
  AdminRole,
  AdminUser,
  AuthUser,
  BootstrapStatus,
  CompanyInfo,
  DeliveryCategory,
  DriverProfile,
  PartnerRequest,
  PartnerSubmittedMenuItem,
} from '../data/ubidelyData';

// Bearer token held strictly in JS memory (never localStorage or sessionStorage)
let memoryAuthToken: string | null = null;

export function getAuthToken(): string | null {
  return memoryAuthToken;
}

export function clearAuthToken(): void {
  memoryAuthToken = null;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (memoryAuthToken) {
    headers.Authorization = `Bearer ${memoryAuthToken}`;
  }
  return headers;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Error de comunicación con el servidor.');
  }
  return data;
}

export async function fetchBootstrapStatus(): Promise<BootstrapStatus> {
  const res = await fetch('/api/auth/bootstrap-status');
  return parseJsonOrThrow<BootstrapStatus>(res);
}

export async function bootstrapCompanyOwner(params: {
  companyName: string;
  name: string;
  email: string;
  password: string;
  accessCode?: string;
}): Promise<{ user: AuthUser; company: CompanyInfo }> {
  const res = await fetch('/api/auth/bootstrap-owner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseJsonOrThrow<{
    token: string;
    user: AuthUser;
    company: CompanyInfo;
  }>(res);
  memoryAuthToken = data.token;
  return { user: data.user, company: data.company };
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; company: CompanyInfo | null }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseJsonOrThrow<{
    token: string;
    user: AuthUser;
    company: CompanyInfo | null;
  }>(res);
  memoryAuthToken = data.token;
  return { user: data.user, company: data.company };
}

export async function registerPartnerAccount(params: {
  role: 'Conductor' | 'Comerciante';
  ownerReference: string;
  name: string;
  email: string;
  phone: string;
  password: string;
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
}): Promise<{ user: AuthUser; request: PartnerRequest }> {
  const res = await fetch('/api/auth/register-partner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseJsonOrThrow<{
    token: string;
    user: AuthUser;
    request: PartnerRequest;
  }>(res);
  memoryAuthToken = data.token;
  return { user: data.user, request: data.request };
}

export async function refreshCurrentSession(): Promise<{
  user: AuthUser;
  company: CompanyInfo | null;
} | null> {
  if (!memoryAuthToken) return null;
  const res = await fetch('/api/auth/me', {
    headers: authHeaders(),
  });
  if (!res.ok) {
    memoryAuthToken = null;
    return null;
  }
  return parseJsonOrThrow<{ user: AuthUser; company: CompanyInfo | null }>(res);
}

export async function logoutCurrentUser(): Promise<void> {
  if (memoryAuthToken) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: authHeaders(),
    }).catch(() => undefined);
  }
  memoryAuthToken = null;
}

export async function fetchAdminOverview(): Promise<{
  partnerRequests: PartnerRequest[];
  adminUsers: AdminUser[];
  company: CompanyInfo | null;
}> {
  const res = await fetch('/api/admin/overview', {
    headers: authHeaders(),
  });
  return parseJsonOrThrow<{
    partnerRequests: PartnerRequest[];
    adminUsers: AdminUser[];
    company: CompanyInfo | null;
  }>(res);
}

export async function decidePartnerRequest(
  requestId: string,
  decision: 'aprobado' | 'rechazado',
  reason?: string
): Promise<{ request: PartnerRequest }> {
  const res = await fetch(`/api/admin/partners/${encodeURIComponent(requestId)}/decision`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ decision, reason }),
  });
  return parseJsonOrThrow<{ request: PartnerRequest }>(res);
}

export async function createAdminAccount(params: {
  name: string;
  email: string;
  password: string;
  role: Exclude<AdminRole, 'Propietario'>;
}): Promise<{ user: AdminUser }> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  return parseJsonOrThrow<{ user: AdminUser }>(res);
}

export async function toggleAdminAccount(id: string): Promise<{ user: AdminUser }> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return parseJsonOrThrow<{ user: AdminUser }>(res);
}

export async function deleteAdminAccount(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await parseJsonOrThrow<{ ok: boolean }>(res);
}

export async function verifyAdminModuleAccess(
  module: 'operations' | 'finance'
): Promise<boolean> {
  const res = await fetch('/api/admin/authorize-module', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ module }),
  });
  return res.ok;
}
