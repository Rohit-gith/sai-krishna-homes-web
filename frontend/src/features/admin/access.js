import { useAuthStore } from './store/useAuthStore';

/*
 * Who may do what in the admin panel. Mirrors backend/src/permissions.js: the server enforces it,
 * this only decides which buttons and pages to show so people never hit a "not allowed" wall.
 */
export const ROLE_LABEL = {
  superowner: 'Fidelsya (Super owner)',
  owner: 'Owner',
  management: 'Management',
  sales: 'Sales executive',
  site_visit: 'Site visit executive',
};

/** Same labels as the server's permission list (used where the team list isn't loaded, e.g. for staff). */
export const PERMISSION_LABEL = {
  'leads.view_all': 'See all leads',
  'leads.create': 'Add leads',
  'leads.edit': 'Edit leads and move them along the pipeline',
  'leads.delete': 'Delete leads',
  'leads.assign': 'Assign leads to team members',
  'leads.import': 'Import leads from Excel',
  'leads.export': 'Export leads to Excel',
  'deals.close': 'Close deals (Won / Lost) and reopen them',
  'attempts.log': 'Log calls, WhatsApp, visits and meetings',
  'enquiries.view': 'See website enquiries',
  'visits.log': 'Record site visits and customer feedback',
  'visits.view_all': 'See all site visits',
  'reports.view': 'See team reports',
  'team.manage': 'Manage sales and site visit staff',
  'activity.view': 'See the activity log',
  'projects.manage': 'Add and edit projects, show them on the website',
  'leads.restore': 'Restore deleted leads from the recycle bin',
  'leads.handover': "Hand over one person's open leads to another",
  'enquiries.delete': 'Delete website enquiries',
  'visits.manage': "Edit and delete anyone's site visits",
};

/** Owner or Fidelsya: every power, always. Management (CMO, GM) get theirs as permissions the owner can untick. */
export const isManager = (user) => user?.role === 'owner' || user?.role === 'superowner';

export const can = (user, permission) =>
  !!user &&
  (isManager(user) || (Array.isArray(user.permissions) && user.permissions.includes(permission)));

/** How someone is addressed. Chosen by the person / owner, never guessed from the name. */
export const TITLES = [
  ['', 'None'],
  ['Mr.', 'Mr.'],
  ['Mrs.', 'Mrs.'],
  ['Ms.', 'Ms.'],
  ['Dr.', 'Dr.'],
];
/** "Mr. Shashi" (title + first name) for greetings; just "Shashi" when no title is set. */
export const greetName = (u) =>
  [
    u?.title,
    String(u?.name || '')
      .trim()
      .split(/\s+/)[0],
  ]
    .filter(Boolean)
    .join(' ');
/** "Mr. Shashi Sekhar Garabadu" */
export const fullName = (u) => [u?.title, u?.name].filter(Boolean).join(' ');

/** Does this person work with leads at all? (site-visit executives usually don't) */
export const hasLeadAccess = (user) =>
  isManager(user) ||
  // seeing website enquiries alone does not open the leads pages
  (user?.permissions || []).some((p) => /^(leads|attempts|deals)\./.test(p));

/** Where to land after login: the first page this person can use. */
export const homeFor = (user) =>
  hasLeadAccess(user)
    ? '/admin'
    : can(user, 'visits.log') || can(user, 'visits.view_all')
      ? '/admin/visits'
      : can(user, 'reports.view')
        ? '/admin/reports'
        : can(user, 'enquiries.view')
          ? '/admin/enquiries'
          : '/admin/account';

/** const allowed = useCan(); allowed('leads.delete') */
export function useCan() {
  const user = useAuthStore((s) => s.user);
  return (permission) => can(user, permission);
}

export function useIsManager() {
  return isManager(useAuthStore((s) => s.user));
}
