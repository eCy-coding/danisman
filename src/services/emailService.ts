/* eslint-disable no-console */
/**
 * Notification Service (formerly EmailService)
 * Uses Telegram Bot API for instant notifications instead of EmailJS
 */

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

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
 * Send contact form data via Telegram Bot API
 */
export async function sendContactEmail(data: ContactFormData): Promise<EmailResponse> {
  try {
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return {
        success: false,
        message: 'Lütfen tüm zorunlu alanları doldurun.',
      };
    }

    // Format Message for Telegram
    const text = `
📬 *New EcyPro Lead*
👤 *Name:* ${data.name}
📧 *Email:* ${data.email}
🏢 *Company:* ${data.company || 'N/A'}
📱 *Phone:* ${data.phone || 'N/A'}

📝 *Message:*
${data.message}
    `;

    // Check configuration
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('⚠️ Telegram Keys Missing! Falling back to Demo Mode.');
      console.log('Would send:', text);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Demo Modu: Mesaj simüle edildi (Telegram anahtarlarını .env dosyasına ekleyin).',
      };
    }

    // Send to Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return {
        success: true,
        message: 'Mesajınız başarıyla iletildi. En kısa sürede size dönüş yapacağız.',
      };
    } else {
      console.error('Telegram Error:', result);
      throw new Error(result.description || 'Telegram API Error');
    }
  } catch (error) {
    console.error('Notification error:', error);
    return {
      success: false,
      message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    };
  }
}

export function initEmailService(): void {
  // No init needed for Telegram fetch
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
    const text = `
🎯 *New Booking Request*
👤 *Name:* ${data.name}
📧 *Email:* ${data.email}
🏢 *Company:* ${data.company}
🔧 *Service:* ${data.serviceInterest}
💰 *Budget:* ${data.budget}
    `;

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('⚠️ Telegram Keys Missing! Falling back to Demo Mode.');
      console.log('Would send:', text);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Demo Modu' };
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return { success: true, message: 'Booking received' };
    } else {
      throw new Error(result.description || 'Telegram API Error');
    }
  } catch (error) {
    console.error('Booking notification error:', error);
    return { success: false, message: 'Error' };
  }
}
