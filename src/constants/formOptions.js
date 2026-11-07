export const ORGANIZATION_TYPES = [
  { value: 'village-association', label: 'Village Level Business Association' },
  { value: 'urban-association', label: 'Urban Level Business Association' },
  { value: 'client', label: 'Client' },
];

export const ID_PROOF_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'voter', label: 'Voter ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving', label: 'Driving Licence' },
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
].map((s) => ({ value: s, label: s }));

/** Application status lifecycle, in order. */
export const APPLICATION_STAGES = [
  { key: 'submitted', label: 'Application Submitted' },
  { key: 'verification', label: 'Document Verification' },
  { key: 'review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
];
