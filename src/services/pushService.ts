export interface PushPreferences {
  rides: boolean;
  delivery: boolean;
}

export interface PushStatusSummary {
  supported: boolean;
  pushManagerSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  endpoint: string | null;
  mode: 'push-api' | 'local-sw' | 'unavailable';
  detail: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return registration;
}

export async function inspectPushStatus(): Promise<PushStatusSummary> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      supported: false,
      pushManagerSupported: false,
      permission: 'unsupported',
      subscribed: false,
      endpoint: null,
      mode: 'unavailable',
      detail: 'Este navegador no admite notificaciones web.',
    };
  }

  const permission = Notification.permission;
  const swSupported = 'serviceWorker' in navigator;
  const pushSupported = 'PushManager' in window;

  if (!swSupported) {
    return {
      supported: true,
      pushManagerSupported: false,
      permission,
      subscribed: permission === 'granted',
      endpoint: null,
      mode: permission === 'granted' ? 'local-sw' : 'unavailable',
      detail: 'Service Worker no disponible; usando notificaciones locales.',
    };
  }

  try {
    const registration = await registerPushServiceWorker();
    if (registration && pushSupported) {
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        return {
          supported: true,
          pushManagerSupported: true,
          permission,
          subscribed: true,
          endpoint: existingSub.endpoint,
          mode: 'push-api',
          detail: 'Push API activo en segundo plano (VAPID).',
        };
      }
    }
  } catch {
    // Continúa con el estado actual de permisos
  }

  return {
    supported: true,
    pushManagerSupported: pushSupported,
    permission,
    subscribed: false,
    endpoint: null,
    mode: permission === 'granted' ? 'local-sw' : 'unavailable',
    detail:
      permission === 'denied'
        ? 'Permiso bloqueado en la configuración del navegador.'
        : 'Listo para activar alertas en segundo plano.',
  };
}

export async function subscribeUserToPush(
  preferences: PushPreferences
): Promise<PushStatusSummary> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return inspectPushStatus();
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      supported: true,
      pushManagerSupported: 'PushManager' in window,
      permission,
      subscribed: false,
      endpoint: null,
      mode: 'unavailable',
      detail:
        permission === 'denied'
          ? 'Permiso denegado. Habilita las notificaciones en el candado de la barra de direcciones.'
          : 'Permiso pendiente de aprobación.',
    };
  }

  try {
    const registration = await registerPushServiceWorker();
    if (registration && 'PushManager' in window) {
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const keyRes = await fetch('/api/push/vapid-public-key');
        if (!keyRes.ok) {
          throw new Error('No se pudo obtener la clave pública VAPID.');
        }
        const { publicKey } = (await keyRes.json()) as { publicKey: string };
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          preferences,
        }),
      });

      if (!saveRes.ok) {
        throw new Error('No se pudo registrar la suscripción en el servidor.');
      }

      return {
        supported: true,
        pushManagerSupported: true,
        permission: 'granted',
        subscribed: true,
        endpoint: subscription.endpoint,
        mode: 'push-api',
        detail: 'Suscripción Web Push VAPID activa incluso fuera de la app.',
      };
    }
  } catch {
    // En iframes o contextos restringidos, usar notificación vía Service Worker o Notification API
    return {
      supported: true,
      pushManagerSupported: 'PushManager' in window,
      permission: 'granted',
      subscribed: true,
      endpoint: null,
      mode: 'local-sw',
      detail:
        'Notificaciones activas en modo navegador local (abre en pestaña dedicada para Push en segundo plano completo).',
    };
  }

  return {
    supported: true,
    pushManagerSupported: false,
    permission: 'granted',
    subscribed: true,
    endpoint: null,
    mode: 'local-sw',
    detail: 'Notificaciones del navegador activadas.',
  };
}

export async function unsubscribeUserFromPush(): Promise<PushStatusSummary> {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager?.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    }
  } catch {
    // Ignorar errores de red al limpiar suscripción
  }

  return {
    supported: typeof window !== 'undefined' && 'Notification' in window,
    pushManagerSupported: typeof window !== 'undefined' && 'PushManager' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    subscribed: false,
    endpoint: null,
    mode: 'unavailable',
    detail: 'Suscripción de alertas pausada.',
  };
}

export async function triggerStatusPushAlert(params: {
  title: string;
  body: string;
  category: 'ride' | 'delivery';
  tag: string;
  dispatchId?: string;
  delayMs?: number;
  preferences: PushPreferences;
  localMode?: boolean;
}): Promise<{ ok: boolean; scheduled?: boolean; deliveredCount?: number }> {
  if (params.category === 'ride' && !params.preferences.rides) {
    return { ok: false };
  }
  if (params.category === 'delivery' && !params.preferences.delivery) {
    return { ok: false };
  }

  try {
    const res = await fetch('/api/push/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        category: params.category,
        tag: params.tag,
        dispatchId: params.dispatchId,
        delayMs: params.delayMs ?? 0,
        url: '/',
      }),
    });

    const data = (await res.json()) as {
      ok: boolean;
      scheduled?: boolean;
      deliveredCount?: number;
    };

    // Si estamos en modo local-sw (por ejemplo dentro de un iframe sin PushManager)
    // y el servidor no entregó a suscripciones VAPID remotas, mostrar notificación vía SW/Notification API
    if (
      params.localMode &&
      (!data.deliveredCount || data.deliveredCount === 0) &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      const fireLocal = async () => {
        try {
          const reg = await navigator.serviceWorker?.getRegistration('/sw.js');
          if (reg) {
            await reg.showNotification(params.title, {
              body: params.body,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: params.tag,
              data: { url: '/', category: params.category, dispatchId: params.dispatchId },
            });
            return;
          }
        } catch {
          // fallback a Notification constructor
        }
        new Notification(params.title, {
          body: params.body,
          icon: '/pwa-192x192.png',
          tag: params.tag,
        });
      };

      if (params.delayMs && params.delayMs > 0) {
        setTimeout(() => {
          void fireLocal();
        }, params.delayMs);
      } else {
        await fireLocal();
      }
    }

    return data;
  } catch {
    return { ok: false };
  }
}
