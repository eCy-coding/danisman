/**
 * Notification Service (formerly EmailService)
 * P12/2 — security-hardener: removed VITE_TELEGRAM_BOT_TOKEN /
 * VITE_TELEGRAM_CHAT_ID from FE bundle; submissions now POST to
 * `${VITE_API_URL}/contact` where the backend validates, rate-limits, and
 * forwards to Telegram via its server-only credentials.
 *
 * P11/4 — i18n migration: user-facing messages resolve via i18next
 * (namespace: contact.notifications.*). i18n.t() is used directly (not the
 * React hook) because this module runs outside the component tree. Fallback
 * to the bundled default values keeps the service safe if i18next is not
 * yet initialised (SSR-style boot path or unit tests).
 */
import i18n from 'i18next';
import { Logger } from '@/lib/logger';

function tn(key: string, fallback: string): string {
  if (i18n.isInitialized) {
    const out = i18n.t(`contact:${key}`, { defaultValue: fallback });
    return typeof out === 'string' ? out : fallback;
  }
  return fallback;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

/**
 * Send contact form data via backend `/api/contact` proxy.
 * Backend handles Telegram forwarding + validation + rate limiting.
 */
export async function sendContactEmail(data: ContactFormData): Promise<EmailResponse> {
  try {
    if (!data.name || !data.email || !data.message) {
      return {
        success: false,
        message: tn('notifications.requiredFields', 'Lütfen tüm zorunlu alanları doldurun.'),
      };
    }

    if (!API_URL) {
      Logger.warn('VITE_API_URL missing — falling back to Demo Mode');
      Logger.debug('[contact demo] would POST', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        success: true,
        message: tn(
          'notifications.demoMode',
          'Demo Modu: Mesaj simüle edildi (VITE_API_URL .env dosyasına ekleyin).',
        ),
      };
    }

    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company ?? '',
        phone: data.phone ?? '',
        message: data.message,
        kind: 'contact',
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      Logger.error('Backend /api/contact failed', { status: response.status, body });
      throw new Error(`HTTP ${response.status}`);
    }

    const result = (await response.json().catch(() => ({}))) as { ok?: boolean };
    if (result.ok === false) {
      throw new Error('Backend rejected submission');
    }

    return {
      success: true,
      message: tn(
        'notifications.success',
        'Mesajınız başarıyla iletildi. En kısa sürede size dönüş yapacağız.',
      ),
    };
  } catch (error) {
    Logger.error('Notification error', error);
    return {
      success: false,
      message: tn(
        'notifications.genericError',
        'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      ),
    };
  }
}

export function initEmailService(): void {
  // No init needed — backend proxy is stateless from FE perspective.
}

export interface BookingData {
  name: string;
  email: string;
  company: string;
  serviceInterest: string;
  budget: string;
}

export async function submitBooking(data: BookingData): Promise<EmailResponse> {
  try {
    if (!API_URL) {
      Logger.warn('VITE_API_URL missing — falling back to Demo Mode');
      Logger.debug('[booking demo] would POST', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        success: true,
        message: tn('notifications.bookingDemoMode', 'Demo Modu — rezervasyon simüle edildi.'),
      };
    }

    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company,
        serviceInterest: data.serviceInterest,
        budget: data.budget,
        kind: 'booking',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      success: true,
      message: tn('notifications.bookingReceived', 'Rezervasyon talebiniz alındı.'),
    };
  } catch (error) {
    Logger.error('Booking notification error', error);
    return {
      success: false,
      message: tn(
        'notifications.bookingError',
        'Rezervasyon gönderilirken bir hata oluştu.',
      ),
    };
  }
}
