let lastAlertTime = 0;
const COOLDOWN_MS = 6 * 60 * 1000; // 6 minutes — caps ~10 alerts/hour

export async function sendTelegramAlert(
  severity: 'fatal' | 'error' | 'warn',
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  if (Date.now() - lastAlertTime < COOLDOWN_MS) return;

  const ctx = context ? JSON.stringify(context).slice(0, 500) : '';
  const text = `[eCyPro PROD] ${severity.toUpperCase()}: ${message}${ctx ? `\n\n${ctx}` : ''}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.warn('[telegram-alert] non-2xx response', res.status);
      return;
    }
    lastAlertTime = Date.now();
  } catch (err) {
    console.warn('[telegram-alert] send failed', err);
  }
}
