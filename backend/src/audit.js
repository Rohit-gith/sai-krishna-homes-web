import { getDb } from './db.js';
import { clientIp } from './security.js';

/*
 * Security activity log: every admin login (successful or not), logout, account creation and
 * password change, with time, who, IP address and browser. Stored in the "activity" collection.
 * Logging must never break the request it describes, so failures are only printed.
 */
export const ACTIVITY = {
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGIN_BLOCKED: 'login_blocked',
  LOGOUT: 'logout',
  ADMIN_CREATED: 'admin_created',
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET: 'password_reset', // reset by Fidelsya with the create-admin script
};

export async function logActivity(type, { email = '', name = '', req, by, note } = {}) {
  try {
    const db = await getDb();
    await db.collection('activity').insertOne({
      at: new Date().toISOString(),
      type,
      email: String(email || '').toLowerCase(),
      name: name || '',
      ip: req ? clientIp(req) : 'server',
      device: req ? String(req.get('user-agent') || '').slice(0, 300) : 'command line',
      ...(by ? { by } : {}),
      ...(note ? { note } : {}),
    });
  } catch (e) {
    console.error('activity log failed:', e.message);
  }
}
