/*
 * Who can do what in the CRM.
 *  superowner = Fidelsya support: everything, on every account (hidden from the client).
 *  owner      = the client's owner: everything except touching Fidelsya; manages the team.
 *  management = senior people (CMO, GM): every power the owner has, ticked by default, but the owner
 *               holds the keys: can untick any of it, edit, reset or deactivate them.
 *  sales      = sales executive: only the permissions the owner ticks.
 *  site_visit = executive who shows customers the site: only the permissions the owner ticks.
 */
export const ROLES = {
  superowner: { label: 'Fidelsya (Super owner)', staff: false },
  owner: { label: 'Owner', staff: false },
  management: { label: 'Management', staff: true }, // "staff" here = has a permission list the owner controls
  sales: { label: 'Sales executive', staff: true },
  site_visit: { label: 'Site visit executive', staff: true },
};

/** The features the owner can switch on or off for each staff member. */
export const PERMISSIONS = [
  { id: 'leads.view_all', label: 'See all leads', hint: 'Without this they only see leads they created or were assigned' },
  { id: 'leads.create', label: 'Add leads' },
  { id: 'leads.edit', label: 'Edit leads and move them along the pipeline' },
  { id: 'leads.delete', label: 'Delete leads' },
  { id: 'leads.assign', label: 'Assign leads to team members' },
  { id: 'leads.import', label: 'Import leads from Excel' },
  { id: 'leads.export', label: 'Export leads to Excel' },
  { id: 'deals.close', label: 'Close deals (Won / Lost) and reopen them' },
  { id: 'attempts.log', label: 'Log calls, WhatsApp, visits and meetings' },
  { id: 'enquiries.view', label: 'See website enquiries' },
  { id: 'visits.log', label: 'Record site visits and customer feedback' },
  { id: 'visits.view_all', label: 'See all site visits', hint: 'Without this they only see their own visits' },
  { id: 'reports.view', label: 'See team reports' },
  // owner-level powers: only for Management accounts (CMO, GM)
  { id: 'team.manage', label: 'Manage sales and site visit staff', hint: 'Add them, change their details and permissions, reset passwords, see their work', group: 'management' },
  { id: 'activity.view', label: 'See the activity log', group: 'management' },
  { id: 'projects.manage', label: 'Add and edit projects, show them on the website', group: 'management' },
  { id: 'leads.restore', label: 'Restore deleted leads from the recycle bin', group: 'management' },
  { id: 'leads.handover', label: "Hand over one person's open leads to another", group: 'management' },
  { id: 'enquiries.delete', label: 'Delete website enquiries', group: 'management' },
  { id: 'visits.manage', label: "Edit and delete anyone's site visits", group: 'management' },
];
export const PERMISSION_IDS = PERMISSIONS.map((p) => p.id);
/** Owner-level powers: never given to sales / site visit executives. */
export const MANAGEMENT_PERMISSIONS = PERMISSIONS.filter((p) => p.group === 'management').map((p) => p.id);
/** The permissions a role can hold at all. */
export const allowedFor = (role) => (role === 'management' ? PERMISSION_IDS : PERMISSION_IDS.filter((id) => !MANAGEMENT_PERMISSIONS.includes(id)));

/** Ticked by default when the owner creates someone (the owner can change them). */
/** How a person is addressed in the CRM ("Good morning, Mr. Shashi"). Chosen, never guessed from the name. */
export const TITLES = ['', 'Mr.', 'Mrs.', 'Ms.', 'Dr.'];

// What a new team member gets ticked by default (the owner can untick any of it).
// Website enquiries are shown to everyone by default so no customer waits for a reply.
export const DEFAULT_PERMISSIONS = {
  sales: ['leads.create', 'leads.edit', 'attempts.log', 'deals.close', 'enquiries.view'],
  site_visit: ['visits.log', 'enquiries.view'],
  management: PERMISSION_IDS, // everything the owner can do; the owner can untick any of it
};

/** Owner or Fidelsya: every power, always (nobody can switch theirs off). */
export const isManager = (user) => user?.role === 'owner' || user?.role === 'superowner';

/** Does this user have this permission? Owner and Fidelsya have every permission. */
export function can(user, permission) {
  if (!user) return false;
  if (isManager(user)) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
