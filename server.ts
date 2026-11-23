import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateVAPIDKeys, sendNotification, setVapidDetails } from 'web-push';
import type { PushSubscription } from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Load VAPID keys from environment or fall back safely to an ephemeral runtime pair
function initVapidKeys(): { publicKey: string; privateKey: string } {
  const defaultSubject = 'mailto:notificaciones@ubidely.app';
  const envPublicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const rawSubject = process.env.VAPID_SUBJECT?.trim() ?? '';
  const candidateSubject =
    rawSubject.startsWith('mailto:') || rawSubject.startsWith('https://')
      ? rawSubject
      : defaultSubject;

  if (envPublicKey && envPrivateKey) {
    try {
      setVapidDetails(candidateSubject, envPublicKey, envPrivateKey);
      return { publicKey: envPublicKey, privateKey: envPrivateKey };
    } catch (err) {
      console.warn(
        'VAPID env vars invalid; falling back to ephemeral runtime VAPID keys:',
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  const generated = generateVAPIDKeys();
  setVapidDetails(defaultSubject, generated.publicKey, generated.privateKey);
  return generated;
}

const vapidKeys = initVapidKeys();

// Session signing key (never written to .env.example; in-memory fallback when env is absent)
const sessionSigningKey =
  process.env.AUTH_SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

type AdminRole = 'Propietario' | 'Super Admin' | 'Operaciones' | 'Finanzas';
type PartnerRole = 'Conductor' | 'Comerciante';
type UserRole = AdminRole | PartnerRole;
type ApprovalStatus = 'pendiente' | 'aprobado' | 'rechazado';

interface StoredAuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  approvalStatus: ApprovalStatus;
  linkedOwnerId?: string;
  linkedOwnerName?: string;
  companyName?: string;
  companyCode?: string;
  rejectionReason?: string;
  createdAt: number;
}

interface StoredCompany {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

interface StoredPartnerRequest {
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
    tier: 'Moto Express' | 'Carro Confort' | 'SUV Ejecutiva';
  };
  merchantData?: {
    merchantName: string;
    category: 'Restaurantes' | 'Farmacia' | 'Supermercado';
    zone: string;
    prepTime: string;
    menuItems: Array<{
      name: string;
      priceUsd: number;
      description: string;
      imageUrl: string;
    }>;
  };
}

interface StoredSubscription {
  subscription: PushSubscription;
  preferences: {
    rides: boolean;
    delivery: boolean;
  };
  createdAt: number;
}

const subscriptions = new Map<string, StoredSubscription>();
const authUsersById = new Map<string, StoredAuthUser>();
const authUserIdByEmail = new Map<string, string>();
const partnerRequests = new Map<string, StoredPartnerRequest>();
const revokedTokenIds = new Set<string>();
let companyRecord: StoredCompany | null = null;

function sanitizeText(value: unknown, maxLen: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[\r\n<>]/g, ' ').trim().slice(0, maxLen) || fallback;
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().slice(0, 120);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hexHash] = parts;
  if (!salt || !hexHash) return false;
  const expectedBuf = Buffer.from(hexHash, 'hex');
  const actualBuf = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function signTokenPayload(payloadObj: { uid: string; jti: string; iat: number; exp: number }): string {
  const encoded = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSigningKey).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function issueSessionToken(userId: string): string {
  const now = Date.now();
  return signTokenPayload({
    uid: userId,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + 1000 * 60 * 60 * 12,
  });
}

function verifySessionToken(
  token: string
): { uid: string; jti: string; iat: number; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', sessionSigningKey)
    .update(encoded)
    .digest('base64url');
  if (!constantTimeStringEqual(sig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      uid?: string;
      jti?: string;
      iat?: number;
      exp?: number;
    };
    if (
      typeof parsed.uid !== 'string' ||
      typeof parsed.jti !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    if (parsed.exp <= Date.now()) return null;
    if (revokedTokenIds.has(parsed.jti)) return null;
    return {
      uid: parsed.uid,
      jti: parsed.jti,
      iat: Number(parsed.iat ?? 0),
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

function toPublicAuthUser(user: StoredAuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    approvalStatus: user.approvalStatus,
    linkedOwnerId: user.linkedOwnerId,
    linkedOwnerName: user.linkedOwnerName,
    companyName: user.companyName,
    companyCode: user.companyCode,
    rejectionReason: user.rejectionReason,
  };
}

function extractBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

function resolveAuthenticatedUser(req: express.Request): {
  user: StoredAuthUser;
  jti: string;
} | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  const verified = verifySessionToken(token);
  if (!verified) return null;
  const user = authUsersById.get(verified.uid);
  if (!user) return null;
  return { user, jti: verified.jti };
}

function isAdminRole(role: UserRole): role is AdminRole {
  return (
    role === 'Propietario' ||
    role === 'Super Admin' ||
    role === 'Operaciones' ||
    role === 'Finanzas'
  );
}

function requireAdminWithRoles(
  req: express.Request,
  res: express.Response,
  allowedRoles: AdminRole[]
): StoredAuthUser | null {
  const auth = resolveAuthenticatedUser(req);
  if (!auth) {
    res.status(401).json({ error: 'Sesión no autenticada o expirada.' });
    return null;
  }
  const { user } = auth;
  if (!user.active) {
    res.status(403).json({ error: 'Cuenta suspendida por el Propietario de la Empresa.' });
    return null;
  }
  if (user.approvalStatus !== 'aprobado') {
    res.status(403).json({ error: 'Cuenta pendiente o sin autorización de uso.' });
    return null;
  }
  if (!isAdminRole(user.role) || !allowedRoles.includes(user.role)) {
    res.status(403).json({ error: 'Tu nivel de usuario no tiene permisos para este módulo.' });
    return null;
  }
  return user;
}

function generateCompanyCode(companyName: string): string {
  const prefix = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'UBID';
  return `${prefix}-01`;
}

function isValidPushSubscription(sub: unknown): sub is PushSubscription {
  if (!sub || typeof sub !== 'object') return false;
  const candidate = sub as Record<string, unknown>;
  if (typeof candidate.endpoint !== 'string') return false;
  try {
    const parsed = new URL(candidate.endpoint);
    if (parsed.protocol !== 'https:') return false;
  } catch {
    return false;
  }
  const keys = candidate.keys as Record<string, unknown> | undefined;
  if (!keys || typeof keys !== 'object') return false;
  return (
    typeof keys.p256dh === 'string' &&
    keys.p256dh.length > 10 &&
    typeof keys.auth === 'string' &&
    keys.auth.length > 5
  );
}

async function dispatchPushToSubscribers(payload: {
  title: string;
  body: string;
  category: 'ride' | 'delivery';
  tag: string;
  url: string;
  dispatchId?: string;
  icon?: string;
}) {
  const serialized = JSON.stringify(payload);
  let deliveredCount = 0;
  let failedCount = 0;

  for (const [endpoint, record] of subscriptions.entries()) {
    if (payload.category === 'ride' && !record.preferences.rides) continue;
    if (payload.category === 'delivery' && !record.preferences.delivery) continue;

    try {
      await sendNotification(record.subscription, serialized, {
        TTL: 300,
        urgency: 'high',
      });
      deliveredCount += 1;
    } catch (err: unknown) {
      failedCount += 1;
      const statusCode =
        typeof err === 'object' && err !== null && 'statusCode' in err
          ? Number((err as { statusCode?: number }).statusCode)
          : 0;
      if (statusCode === 404 || statusCode === 410) {
        subscriptions.delete(endpoint);
      }
    }
  }

  return { deliveredCount, failedCount };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '128kb' }));

  // =========================================================================
  // AUTHENTICATION & COMPANY OWNER LINKING ROUTES
  // =========================================================================

  app.get('/api/auth/bootstrap-status', (_req, res) => {
    const envOwnerPasscode = process.env.OWNER_ACCESS_CODE?.trim() ?? '';
    res.json({
      ownerClaimed: Boolean(companyRecord),
      requiresPasscode: envOwnerPasscode.length > 0,
      companyName: companyRecord?.name ?? null,
      companyCode: companyRecord?.code ?? null,
      ownerEmail: companyRecord?.ownerEmail ?? null,
    });
  });

  app.post('/api/auth/bootstrap-owner', async (req, res) => {
    if (companyRecord) {
      res.status(409).json({
        error: 'La cuenta de Propietario de Empresa ya fue configurada. Inicia sesión con tus credenciales.',
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const envOwnerPasscode = process.env.OWNER_ACCESS_CODE?.trim() ?? '';
    if (envOwnerPasscode) {
      const providedCode = typeof body.accessCode === 'string' ? body.accessCode.trim() : '';
      if (!providedCode || !constantTimeStringEqual(providedCode, envOwnerPasscode)) {
        res.status(403).json({ error: 'Código maestro de empresa inválido.' });
        return;
      }
    }

    const name = sanitizeText(body.name, 80);
    const email = normalizeEmail(body.email);
    const companyName = sanitizeText(body.companyName, 80, 'UbiDely Operaciones');
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || !isValidEmail(email) || password.length < 6) {
      res.status(400).json({
        error: 'Ingresa nombre válido, correo válido y una contraseña de al menos 6 caracteres.',
      });
      return;
    }

    if (authUserIdByEmail.has(email)) {
      res.status(409).json({ error: 'Este correo ya está registrado.' });
      return;
    }

    const ownerId = `owner-${crypto.randomUUID().slice(0, 8)}`;
    const code = generateCompanyCode(companyName);
    const passwordHash = await hashPassword(password);

    const ownerUser: StoredAuthUser = {
      id: ownerId,
      name,
      email,
      passwordHash,
      role: 'Propietario',
      active: true,
      approvalStatus: 'aprobado',
      linkedOwnerId: ownerId,
      linkedOwnerName: name,
      companyName,
      companyCode: code,
      createdAt: Date.now(),
    };

    companyRecord = {
      id: `comp-${crypto.randomUUID().slice(0, 8)}`,
      name: companyName,
      code,
      ownerId,
      ownerName: name,
      ownerEmail: email,
    };

    authUsersById.set(ownerId, ownerUser);
    authUserIdByEmail.set(email, ownerId);

    const token = issueSessionToken(ownerId);
    res.status(201).json({
      token,
      user: toPublicAuthUser(ownerUser),
      company: companyRecord,
    });
  });

  app.post('/api/auth/register-partner', async (req, res) => {
    if (!companyRecord) {
      res.status(400).json({
        error: 'Primero debe existir una cuenta de Propietario de Empresa para vincular tu registro.',
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const role = body.role === 'Comerciante' ? 'Comerciante' : body.role === 'Conductor' ? 'Conductor' : null;
    if (!role) {
      res.status(400).json({ error: 'Tipo de registro inválido (Conductor o Comerciante).' });
      return;
    }

    const ownerRef = sanitizeText(body.ownerReference, 120).toLowerCase();
    const matchesOwnerEmail = ownerRef === companyRecord.ownerEmail.toLowerCase();
    const matchesCompanyCode = ownerRef === companyRecord.code.toLowerCase();

    if (!ownerRef || (!matchesOwnerEmail && !matchesCompanyCode)) {
      res.status(400).json({
        error: 'El correo del Propietario o código de empresa no coincide con ninguna empresa registrada.',
      });
      return;
    }

    const name = sanitizeText(body.name, 80);
    const email = normalizeEmail(body.email);
    const phone = sanitizeText(body.phone, 32, '+58 414-000-0000');
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || !isValidEmail(email) || password.length < 6) {
      res.status(400).json({
        error: 'Completa nombre, correo válido y contraseña mínima de 6 caracteres.',
      });
      return;
    }

    if (authUserIdByEmail.has(email)) {
      res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo.' });
      return;
    }

    let driverData: StoredPartnerRequest['driverData'];
    let merchantData: StoredPartnerRequest['merchantData'];

    if (role === 'Conductor') {
      const rawDriver = (body.driverData ?? {}) as Record<string, unknown>;
      const vehicle = sanitizeText(rawDriver.vehicle, 80);
      const plate = sanitizeText(rawDriver.plate, 20).toUpperCase();
      const rawTier = rawDriver.tier;
      const tier: 'Moto Express' | 'Carro Confort' | 'SUV Ejecutiva' =
        rawTier === 'Moto Express' || rawTier === 'SUV Ejecutiva' ? rawTier : 'Carro Confort';

      if (!vehicle || !plate) {
        res.status(400).json({ error: 'Debes indicar el vehículo y la placa para el registro de conductor.' });
        return;
      }
      driverData = { vehicle, plate, tier };
    } else {
      const rawMerch = (body.merchantData ?? {}) as Record<string, unknown>;
      const merchantName = sanitizeText(rawMerch.merchantName, 80);
      const zone = sanitizeText(rawMerch.zone, 60, 'Zona Central');
      const prepTime = sanitizeText(rawMerch.prepTime, 30, '20–30 min');
      const rawCat = rawMerch.category;
      const category: 'Restaurantes' | 'Farmacia' | 'Supermercado' =
        rawCat === 'Farmacia' || rawCat === 'Supermercado' ? rawCat : 'Restaurantes';

      const rawItems = Array.isArray(rawMerch.menuItems) ? rawMerch.menuItems.slice(0, 10) : [];
      const menuItems = rawItems
        .map((item) => {
          const obj = (item ?? {}) as Record<string, unknown>;
          const itemName = sanitizeText(obj.name, 80);
          const priceUsd = Math.max(0.5, Number(obj.priceUsd) || 0);
          if (!itemName || !Number.isFinite(priceUsd)) return null;
          const rawImg = typeof obj.imageUrl === 'string' ? obj.imageUrl.trim() : '';
          const safeImg =
            rawImg.startsWith('/src/assets/images/') || rawImg.startsWith('/assets/')
              ? rawImg
              : '/src/assets/images/dish_arepa_reina_1795349184183.jpg';
          return {
            name: itemName,
            priceUsd: Number(priceUsd.toFixed(2)),
            description: sanitizeText(
              obj.description,
              200,
              'Preparado al momento con despacho UbiDely.'
            ),
            imageUrl: safeImg,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (!merchantName || menuItems.length === 0) {
        res.status(400).json({
          error: 'Debes indicar el nombre del comercio y al menos un plato o producto en su menú.',
        });
        return;
      }

      merchantData = {
        merchantName,
        category,
        zone,
        prepTime,
        menuItems,
      };
    }

    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const reqId = `req-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = await hashPassword(password);

    const partnerUser: StoredAuthUser = {
      id: userId,
      name,
      email,
      passwordHash,
      role,
      active: true,
      approvalStatus: 'pendiente',
      linkedOwnerId: companyRecord.ownerId,
      linkedOwnerName: companyRecord.ownerName,
      companyName: companyRecord.name,
      companyCode: companyRecord.code,
      createdAt: Date.now(),
    };

    const partnerReq: StoredPartnerRequest = {
      id: reqId,
      userId,
      role,
      name,
      email,
      phone,
      linkedOwnerId: companyRecord.ownerId,
      companyCode: companyRecord.code,
      companyName: companyRecord.name,
      status: 'pendiente',
      createdAt: Date.now(),
      driverData,
      merchantData,
    };

    authUsersById.set(userId, partnerUser);
    authUserIdByEmail.set(email, userId);
    partnerRequests.set(reqId, partnerReq);

    // Notify company subscribers if Web Push is active
    void dispatchPushToSubscribers({
      title: `UbiDely · Nueva solicitud de ${role}`,
      body: `${name} se vinculó a ${companyRecord.name} y espera autorización del Propietario.`,
      category: role === 'Conductor' ? 'ride' : 'delivery',
      tag: `ubidely-partner-${reqId}`,
      url: '/',
      icon: '/pwa-192x192.png',
    });

    const token = issueSessionToken(userId);
    res.status(201).json({
      token,
      user: toPublicAuthUser(partnerUser),
      request: partnerReq,
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
      return;
    }

    const userId = authUserIdByEmail.get(email);
    const user = userId ? authUsersById.get(userId) : undefined;
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'Tu cuenta fue suspendida por el Propietario de la Empresa.' });
      return;
    }

    const token = issueSessionToken(user.id);
    res.json({
      token,
      user: toPublicAuthUser(user),
      company: companyRecord,
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const auth = resolveAuthenticatedUser(req);
    if (!auth) {
      res.status(401).json({ error: 'Sesión no válida.' });
      return;
    }
    res.json({
      user: toPublicAuthUser(auth.user),
      company: companyRecord,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const auth = resolveAuthenticatedUser(req);
    if (auth) {
      revokedTokenIds.add(auth.jti);
    }
    res.json({ ok: true });
  });

  // =========================================================================
  // ROLE-PROTECTED ADMINISTRATIVE ROUTES
  // =========================================================================

  app.get('/api/admin/overview', (req, res) => {
    const user = requireAdminWithRoles(req, res, [
      'Propietario',
      'Super Admin',
      'Operaciones',
      'Finanzas',
    ]);
    if (!user) return;

    const canReviewPartners = user.role === 'Propietario';
    const canManageUsers = user.role === 'Propietario' || user.role === 'Super Admin';

    const requests = canReviewPartners
      ? Array.from(partnerRequests.values())
          .filter((r) => r.linkedOwnerId === user.id)
          .sort((a, b) => b.createdAt - a.createdAt)
      : [];

    const admins = canManageUsers
      ? Array.from(authUsersById.values())
          .filter((u) => isAdminRole(u.role))
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as AdminRole,
            active: u.active,
          }))
      : [];

    res.json({
      partnerRequests: requests,
      adminUsers: admins,
      company: companyRecord,
    });
  });

  app.post('/api/admin/partners/:id/decision', (req, res) => {
    const owner = requireAdminWithRoles(req, res, ['Propietario']);
    if (!owner) return;

    const reqId = req.params.id;
    const partnerReq = partnerRequests.get(reqId);
    if (!partnerReq || partnerReq.linkedOwnerId !== owner.id) {
      res.status(404).json({ error: 'Solicitud de socio no encontrada para tu empresa.' });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const decision: ApprovalStatus | null =
      body.decision === 'aprobado'
        ? 'aprobado'
        : body.decision === 'rechazado'
        ? 'rechazado'
        : null;
    if (!decision) {
      res.status(400).json({ error: 'Decisión inválida. Usa aprobado o rechazado.' });
      return;
    }

    const reason = sanitizeText(body.reason, 180);
    partnerReq.status = decision;
    partnerReq.rejectionReason = decision === 'rechazado' ? reason || 'No cumple requisitos operativos.' : undefined;

    const linkedUser = authUsersById.get(partnerReq.userId);
    if (linkedUser) {
      linkedUser.approvalStatus = decision;
      linkedUser.rejectionReason = partnerReq.rejectionReason;
    }

    void dispatchPushToSubscribers({
      title:
        decision === 'aprobado'
          ? `UbiDely · ${partnerReq.role} autorizado`
          : `UbiDely · Solicitud revisada`,
      body:
        decision === 'aprobado'
          ? `${partnerReq.name} fue autorizado por el Propietario para operar en ${partnerReq.companyName}.`
          : `La solicitud de ${partnerReq.name} fue marcada como rechazada.`,
      category: partnerReq.role === 'Conductor' ? 'ride' : 'delivery',
      tag: `ubidely-decision-${partnerReq.id}`,
      url: '/',
      icon: '/pwa-192x192.png',
    });

    res.json({
      ok: true,
      request: partnerReq,
    });
  });

  app.post('/api/admin/users', async (req, res) => {
    const caller = requireAdminWithRoles(req, res, ['Propietario', 'Super Admin']);
    if (!caller) return;

    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = sanitizeText(body.name, 80);
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const requestedRole = body.role;

    const allowedCreateRoles: AdminRole[] = ['Super Admin', 'Operaciones', 'Finanzas'];
    if (
      typeof requestedRole !== 'string' ||
      !allowedCreateRoles.includes(requestedRole as AdminRole)
    ) {
      res.status(400).json({ error: 'Rol administrativo inválido.' });
      return;
    }

    if (!name || !isValidEmail(email) || password.length < 6) {
      res.status(400).json({
        error: 'Completa nombre, correo válido y contraseña de al menos 6 caracteres.',
      });
      return;
    }

    if (authUserIdByEmail.has(email)) {
      res.status(409).json({ error: 'Ya existe un usuario con ese correo.' });
      return;
    }

    const userId = `adm-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = await hashPassword(password);

    const newAdmin: StoredAuthUser = {
      id: userId,
      name,
      email,
      passwordHash,
      role: requestedRole as AdminRole,
      active: true,
      approvalStatus: 'aprobado',
      linkedOwnerId: companyRecord?.ownerId,
      linkedOwnerName: companyRecord?.ownerName,
      companyName: companyRecord?.name,
      companyCode: companyRecord?.code,
      createdAt: Date.now(),
    };

    authUsersById.set(userId, newAdmin);
    authUserIdByEmail.set(email, userId);

    res.status(201).json({
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        active: newAdmin.active,
      },
    });
  });

  app.patch('/api/admin/users/:id/toggle', (req, res) => {
    const caller = requireAdminWithRoles(req, res, ['Propietario', 'Super Admin']);
    if (!caller) return;

    const target = authUsersById.get(req.params.id);
    if (!target || !isAdminRole(target.role)) {
      res.status(404).json({ error: 'Usuario administrador no encontrado.' });
      return;
    }
    if (target.role === 'Propietario') {
      res.status(403).json({ error: 'No se puede suspender al Propietario de la Empresa.' });
      return;
    }
    if (target.id === caller.id) {
      res.status(400).json({ error: 'No puedes suspender tu propia sesión activa.' });
      return;
    }

    target.active = !target.active;
    res.json({
      user: {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        active: target.active,
      },
    });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const caller = requireAdminWithRoles(req, res, ['Propietario', 'Super Admin']);
    if (!caller) return;

    const target = authUsersById.get(req.params.id);
    if (!target || !isAdminRole(target.role)) {
      res.status(404).json({ error: 'Usuario administrador no encontrado.' });
      return;
    }
    if (target.role === 'Propietario') {
      res.status(403).json({ error: 'No se puede eliminar al Propietario de la Empresa.' });
      return;
    }
    if (target.id === caller.id) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta activa.' });
      return;
    }

    authUsersById.delete(target.id);
    authUserIdByEmail.delete(target.email);
    res.json({ ok: true });
  });

  // Authorization verification endpoints for operational & financial mutations
  app.post('/api/admin/authorize-module', (req, res) => {
    const moduleName = (req.body as Record<string, unknown> | undefined)?.module;
    let allowed: AdminRole[] = [];
    if (moduleName === 'operations') {
      allowed = ['Propietario', 'Super Admin', 'Operaciones'];
    } else if (moduleName === 'finance') {
      allowed = ['Propietario', 'Super Admin', 'Finanzas'];
    } else {
      res.status(400).json({ error: 'Módulo inválido.' });
      return;
    }

    const caller = requireAdminWithRoles(req, res, allowed);
    if (!caller) return;
    res.json({ ok: true, role: caller.role });
  });

  // =========================================================================
  // WEB PUSH API ROUTES
  // =========================================================================

  // Public VAPID key for browser PushManager.subscribe
  app.get('/api/push/vapid-public-key', (_req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // Status summary (no secrets)
  app.get('/api/push/status', (_req, res) => {
    res.json({
      subscribedCount: subscriptions.size,
      vapidConfigured: true,
    });
  });

  // Register or update a browser PushSubscription
  app.post('/api/push/subscribe', (req, res) => {
    const body = req.body as Record<string, unknown> | undefined;
    const subscription = body?.subscription;

    if (!isValidPushSubscription(subscription)) {
      res.status(400).json({ error: 'Suscripción Push inválida o endpoint no HTTPS.' });
      return;
    }

    const rawPrefs = (body?.preferences ?? {}) as Record<string, unknown>;
    const preferences = {
      rides: rawPrefs.rides !== false,
      delivery: rawPrefs.delivery !== false,
    };

    subscriptions.set(subscription.endpoint, {
      subscription,
      preferences,
      createdAt: Date.now(),
    });

    res.status(201).json({
      ok: true,
      subscribedCount: subscriptions.size,
    });
  });

  // Remove a browser PushSubscription
  app.post('/api/push/unsubscribe', (req, res) => {
    const endpoint = req.body?.endpoint;
    if (typeof endpoint !== 'string' || !endpoint) {
      res.status(400).json({ error: 'Endpoint requerido para cancelar suscripción.' });
      return;
    }
    subscriptions.delete(endpoint);
    res.json({ ok: true, subscribedCount: subscriptions.size });
  });

  // Dispatch Web Push notification immediately or after a short server-side delay
  app.post('/api/push/notify', async (req, res) => {
    const body = req.body as Record<string, unknown> | undefined;
    const title = sanitizeText(body?.title, 100, 'UbiDely · Actualización');
    const message = sanitizeText(
      body?.body,
      240,
      'Tu servicio ha cambiado de estado.'
    );
    const category = body?.category === 'delivery' ? 'delivery' : 'ride';
    const tag = sanitizeText(body?.tag, 60, `ubidely-${category}`);
    const dispatchId = sanitizeText(body?.dispatchId, 40, '');
    const rawUrl = typeof body?.url === 'string' ? body.url : '/';
    const url = rawUrl.startsWith('/') && !rawUrl.startsWith('//') ? rawUrl : '/';

    const rawDelay = Number(body?.delayMs ?? 0);
    const delayMs = Number.isFinite(rawDelay) ? Math.min(15000, Math.max(0, rawDelay)) : 0;

    const payload = {
      title,
      body: message,
      category,
      tag,
      url,
      dispatchId: dispatchId || undefined,
      icon: '/pwa-192x192.png',
    } as const;

    if (delayMs > 0) {
      setTimeout(() => {
        void dispatchPushToSubscribers(payload);
      }, delayMs);

      res.status(202).json({
        ok: true,
        scheduled: true,
        delayMs,
        subscribedCount: subscriptions.size,
      });
      return;
    }

    const result = await dispatchPushToSubscribers(payload);
    res.json({
      ok: true,
      scheduled: false,
      subscribedCount: subscriptions.size,
      ...result,
    });
  });

  const srcImagesDir = path.resolve(__dirname, 'src/assets/images');
  if (fs.existsSync(srcImagesDir)) {
    app.use('/src/assets/images', express.static(srcImagesDir));
  }

  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: hmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`UbiDely server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
