import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { leadId, uid } from '../utils';

/*
 * Front-end CRM. No backend yet, so everything lives in this browser's localStorage
 * (key "skh_crm"). Data is NOT shared between devices/browsers until a real API replaces this.
 */

const now = () => new Date().toISOString();
const daysAgo = (d, h = 11) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};
const daysAhead = (d) => daysAgo(-d, 10);

function demoLead(n, f) {
  const created = f.created ?? daysAgo(10);
  return {
    id: leadId(n),
    name: f.name,
    phone: f.phone,
    email: f.email ?? '',
    project: f.project,
    config: f.config,
    source: f.source,
    budget: f.budget,
    dealValue: f.dealValue ?? 0,
    status: f.status,
    nextFollowUp: f.nextFollowUp ?? null,
    notes: f.notes ?? '',
    demo: true,
    closed: f.closed ?? null,
    attempts: f.attempts ?? [],
    history: [{ id: uid(), at: created, text: 'Lead created' }],
    createdAt: created,
    updatedAt: f.updated ?? created,
  };
}

const attempt = (d, type, outcome, note) => ({ id: uid(), at: daysAgo(d, 12), type, outcome, note });

/** Clearly-marked sample data so the dashboard isn't empty on first open. */
function seed() {
  const leads = [
    demoLead(1, { name: 'Sample: Ananya Mohanty', phone: '9000000001', project: 'Panchawati Residency', config: '3 BHK', source: 'Website', budget: 7500000, dealValue: 7200000, status: 'won', created: daysAgo(28), updated: daysAgo(3), closed: { result: 'won', at: daysAgo(3), value: 7200000, unit: 'Tower B · 304', note: 'Booking amount received' }, attempts: [attempt(26, 'Call', 'interested', 'Wants east-facing 3 BHK'), attempt(20, 'Site visit', 'interested', 'Visited with family'), attempt(5, 'Meeting', 'connected', 'Final price agreed')] }),
    demoLead(2, { name: 'Sample: Rakesh Sahu', phone: '9000000002', project: 'Sai Krishna Residency', config: '2 BHK', source: 'Walk-in', budget: 4200000, dealValue: 4100000, status: 'negotiation', created: daysAgo(14), updated: daysAgo(1), nextFollowUp: daysAhead(0), attempts: [attempt(13, 'Site visit', 'interested', 'Liked Type-1 tower'), attempt(1, 'Call', 'callback', 'Discussing with bank')] }),
    demoLead(3, { name: 'Sample: Priyanka Das', phone: '9000000003', project: 'Panchawati Residency', config: '2 BHK', source: 'Facebook', budget: 5500000, dealValue: 5300000, status: 'visit', created: daysAgo(9), updated: daysAgo(2), nextFollowUp: daysAhead(2), attempts: [attempt(8, 'Call', 'connected', 'Visit fixed for Sunday')] }),
    demoLead(4, { name: 'Sample: Sanjay Behera', phone: '9000000004', project: 'Sai Krishna Residency', config: '1 BHK', source: 'Referral', budget: 2800000, status: 'contacted', created: daysAgo(6), updated: daysAgo(4), nextFollowUp: daysAgo(1), attempts: [attempt(4, 'WhatsApp', 'no-answer', 'Sent brochure')] }),
    demoLead(5, { name: 'Sample: Neha Pradhan', phone: '9000000005', project: 'Panchawati Residency', config: '3 BHK', source: 'Website', budget: 8000000, status: 'new', created: daysAgo(0, 9), nextFollowUp: daysAhead(0) }),
    demoLead(6, { name: 'Sample: Amit Nayak', phone: '9000000006', project: 'Sai Krishna Residency', config: '2 BHK', source: 'Phone call', budget: 4000000, status: 'lost', created: daysAgo(30), updated: daysAgo(12), closed: { result: 'lost', at: daysAgo(12), reason: 'Budget mismatch', note: 'Looking under ₹35 L' }, attempts: [attempt(29, 'Call', 'interested', ''), attempt(15, 'Call', 'not-interested', 'Budget too low')] }),
    demoLead(7, { name: 'Sample: Ritika Jena', phone: '9000000007', project: 'Sai Krishna Residency', config: 'Studio', source: 'Instagram', budget: 2200000, status: 'new', created: daysAgo(1) }),
    demoLead(8, { name: 'Sample: Deepak Rout', phone: '9000000008', project: 'Panchawati Residency', config: '2 BHK', source: 'WhatsApp', budget: 5600000, dealValue: 5450000, status: 'won', created: daysAgo(40), updated: daysAgo(18), closed: { result: 'won', at: daysAgo(18), value: 5450000, unit: 'Tower A · 102', note: '' }, attempts: [attempt(38, 'WhatsApp', 'interested', ''), attempt(30, 'Site visit', 'interested', '')] }),
  ];
  return { leads, nextNo: leads.length + 1, enquiries: [] };
}

const touch = (lead, text) => ({
  ...lead,
  updatedAt: now(),
  history: [{ id: uid(), at: now(), text }, ...lead.history],
});

export const useCrmStore = create(
  persist(
    (set, get) => ({
      ...seed(),

      addLead: (data) => {
        const id = leadId(get().nextNo);
        const created = now();
        const lead = {
          id,
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: (data.email || '').trim(),
          project: data.project || '',
          config: data.config || '',
          source: data.source || 'Other',
          budget: Number(data.budget) || 0,
          dealValue: Number(data.dealValue) || 0,
          status: 'new',
          nextFollowUp: data.nextFollowUp || null,
          notes: (data.notes || '').trim(),
          demo: false,
          closed: null,
          attempts: [],
          history: [{ id: uid(), at: created, text: `Lead created (${data.source || 'Other'})` }],
          createdAt: created,
          updatedAt: created,
        };
        set((s) => ({ leads: [lead, ...s.leads], nextNo: s.nextNo + 1 }));
        return id;
      },

      updateLead: (id, patch, note = 'Details updated') =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? touch({ ...l, ...patch }, note) : l)) })),

      /** Move an OPEN lead along the pipeline (never to won/lost: use commitDeal). */
      setStatus: (ids, status) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            ids.includes(l.id) && !l.closed && l.status !== status
              ? touch({ ...l, status }, `Status: ${l.status} → ${status}`)
              : l,
          ),
        })),

      /** Close a deal as won or lost. Locks the lead until reopened. */
      commitDeal: (id, closed) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id
              ? touch(
                  {
                    ...l,
                    status: closed.result,
                    dealValue: closed.result === 'won' ? Number(closed.value) || l.dealValue : l.dealValue,
                    closed: { ...closed, at: now() },
                    nextFollowUp: null,
                  },
                  closed.result === 'won' ? `Deal WON and committed` : `Deal LOST and committed (${closed.reason})`,
                )
              : l,
          ),
        })),

      reopenDeal: (id) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? touch({ ...l, status: 'negotiation', closed: null }, 'Deal reopened') : l,
          ),
        })),

      addAttempt: (id, a) =>
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== id) return l;
            const next = touch(
              { ...l, attempts: [{ id: uid(), at: now(), ...a }, ...l.attempts], nextFollowUp: a.nextFollowUp || l.nextFollowUp },
              `Attempt logged: ${a.type} · ${a.outcome}`,
            );
            // First successful contact moves a fresh lead forward automatically.
            if (next.status === 'new' && a.outcome !== 'no-answer') next.status = 'contacted';
            return next;
          }),
        })),

      /**
       * Bulk import (Excel). Each draft: { name, phone, project, config, priceMin, priceMax, createdAt, notes, status, sheet }.
       * Newest first, one state update so hundreds of rows stay fast.
       */
      importLeads: (drafts) => {
        const start = get().nextNo;
        const stamp = now();
        const created = drafts.map((d, i) => {
          const at = d.createdAt || stamp;
          return {
            id: leadId(start + i),
            name: d.name,
            phone: d.phone,
            email: '',
            project: d.project || '',
            config: d.config || '',
            source: 'Excel import',
            budget: 0,
            dealValue: 0,
            priceMin: d.priceMin || 0,
            priceMax: d.priceMax || 0,
            status: d.status || 'new',
            nextFollowUp: null,
            notes: d.notes || '',
            demo: false,
            closed: null,
            attempts: [],
            history: [{ id: uid(), at: stamp, text: `Imported from Excel${d.sheet ? ` (sheet "${d.sheet}")` : ''}` }],
            createdAt: at,
            updatedAt: stamp,
          };
        });
        created.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        set((s) => ({ leads: [...created, ...s.leads], nextNo: s.nextNo + drafts.length }));
        return created.length;
      },

      deleteLeads: (ids) => set((s) => ({ leads: s.leads.filter((l) => !ids.includes(l.id)) })),

      /** Website forms land here (same browser only until there is a backend). */
      captureEnquiry: (e) => {
        const enquiry = { id: uid(), at: now(), read: false, ...e };
        set((s) => ({ enquiries: [enquiry, ...s.enquiries] }));
      },
      markEnquiry: (id, patch) => set((s) => ({ enquiries: s.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEnquiry: (id) => set((s) => ({ enquiries: s.enquiries.filter((e) => e.id !== id) })),

      clearDemo: () => set((s) => ({ leads: s.leads.filter((l) => !l.demo) })),
      resetAll: () => set({ ...seed() }),
    }),
    { name: 'skh_crm', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
