import { getDb } from './db.js';
import { logIp } from './security.js';

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
  PASSWORD_RESET: 'password_reset', // someone else set a new password (owner / Fidelsya / script)
  USER_UPDATED: 'user_updated', // name, phone, role or permissions changed
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  LEAD_ASSIGNED: 'lead_assigned',
  LEADS_EXPORTED: 'leads_exported',
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_PUBLISHED: 'project_published', // shown on the website
  PROJECT_UNPUBLISHED: 'project_unpublished', // taken off the website
  LEADS_DELETED: 'leads_deleted', // moved to the recycle bin
  LEADS_RESTORED: 'leads_restored',
  LEADS_PURGED: 'leads_purged', // removed for good (Fidelsya only)
  LEADS_HANDED_OVER: 'leads_handed_over', // all open leads of one person given to another
  ENQUIRY_RECEIVED: 'enquiry_received', // a visitor filled a form on the website
  ENQUIRY_DELETED: 'enquiry_deleted',
  ENQUIRY_CONVERTED: 'enquiry_converted', // turned into a lead
  // the day-to-day work on leads and visits, so the owner sees everything in one place
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_STATUS_CHANGED: 'lead_status_changed',
  ATTEMPT_LOGGED: 'attempt_logged',
  DEAL_WON: 'deal_won',
  DEAL_LOST: 'deal_lost',
  DEAL_REOPENED: 'deal_reopened',
  LEADS_IMPORTED: 'leads_imported',
  VISIT_RECORDED: 'visit_recorded',
  VISIT_UPDATED: 'visit_updated',
  VISIT_DELETED: 'visit_deleted',
};

/** The browser's own ID (made once per browser by the CRM, sent as X-Device-Id), so two devices on one WiFi still look different. */
export const deviceIdOf = (req) => {
  const id = String(req?.get?.('x-device-id') || '').toLowerCase();
  return /^[a-f0-9]{12}$/.test(id) ? id : '';
};

export async function logActivity(type, { email = '', name = '', req, by, note, target, changes, ref, newDevice } = {}) {
  try {
    const db = await getDb();
    await db.collection('activity').insertOne({
      at: new Date().toISOString(),
      type,
      email: String(email || '').toLowerCase(),
      name: name || '',
      ip: req ? await logIp(req) : 'server',
      device: req ? String(req.get('user-agent') || '').slice(0, 300) : 'command line',
      ...(deviceIdOf(req) ? { deviceId: deviceIdOf(req) } : {}),
      ...(newDevice ? { newDevice: true } : {}), // first login ever from this browser
      ...(by ? { by } : {}),
      ...(note ? { note } : {}),
      ...(target ? { target } : {}), // the account the action was done to: { email, name, role }
      ...(changes ? { changes } : {}), // what changed, e.g. { permissions: { added: [], removed: [] } }
      ...(ref ? { ref } : {}), // the record it is about, e.g. { kind: 'lead', id: 'SKH-0001' }, for a link
    });
  } catch (e) {
    console.error('activity log failed:', e.message);
  }
}
