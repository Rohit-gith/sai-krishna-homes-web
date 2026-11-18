import { z } from 'zod';

const required = (msg) => z.string().trim().min(1, msg);

export const serviceSchema = z
  .object({
    previousRegNo: z.string().trim().optional(),
    organizationType: required('Please select organization type'),
    service: required('Please select a service'),
    query: z.string().trim().optional(),
  })
  .refine((d) => d.service !== 'other-services' || (d.query && d.query.length >= 10), {
    path: ['query'],
    message: 'Please describe your requirement (min 10 characters)',
  });

export const vendorSchema = z.object({
  fullName: required('Full name is required').min(3, 'Name looks too short'),
  organizationName: z.string().trim().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  address: required('Address is required').min(8, 'Please enter full address'),
  district: required('District is required'),
  state: required('Please select state'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
});

export const documentSchema = z.object({
  idProofType: required('Please select ID proof type'),
  idProofNumber: required('ID number is required').min(6, 'ID number looks too short'),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Enter a valid PAN (e.g. ABCDE1234F)')
    .or(z.literal('')),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, 'Enter a valid 15-character GSTIN')
    .or(z.literal('')),
});

/** Uploads are stored as file meta; these keys are mandatory. */
export const REQUIRED_UPLOADS = [
  { key: 'idProof', label: 'ID Proof' },
  { key: 'addressProof', label: 'Address Proof' },
  { key: 'photo', label: 'Passport-size Photo' },
];
