import { AnimatePresence, motion } from 'framer-motion';
import { Layers, User, FileText, UploadCloud, ClipboardCheck, RotateCcw } from 'lucide-react';
import Stepper from '@/components/ui/Stepper';
import StepServiceDetails from './StepServiceDetails';
import StepVendorDetails from './StepVendorDetails';
import StepDocumentDetails from './StepDocumentDetails';
import StepUploadDocuments from './StepUploadDocuments';
import ReviewSubmit from './ReviewSubmit';
import RegistrationSuccess from './RegistrationSuccess';
import { useRegistrationStore } from '../store/useRegistrationStore';

const STEPS = [
  { label: 'Service', title: 'Service Details', subtitle: 'Tell us which service you need.', icon: Layers, Component: StepServiceDetails },
  { label: 'Vendor', title: 'Vendor Details', subtitle: 'Your personal and contact information.', icon: User, Component: StepVendorDetails },
  { label: 'Documents', title: 'Document Details', subtitle: 'ID and business registration details.', icon: FileText, Component: StepDocumentDetails },
  { label: 'Upload', title: 'Upload Documents', subtitle: 'Upload clear scans or photos.', icon: UploadCloud, Component: StepUploadDocuments },
  { label: 'Review', title: 'Review & Submit', subtitle: 'Check everything before submitting.', icon: ClipboardCheck, Component: ReviewSubmit },
];

export default function RegistrationWizard() {
  const currentStep = useRegistrationStore((s) => s.currentStep);
  const result = useRegistrationStore((s) => s.result);
  const reset = useRegistrationStore((s) => s.reset);

  if (result) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
        <RegistrationSuccess />
      </div>
    );
  }

  const step = STEPS[Math.min(currentStep, STEPS.length - 1)];
  const { Component } = step;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
      <Stepper steps={STEPS} current={currentStep} />

      <div className="mt-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Step {currentStep + 1} of {STEPS.length}
          </p>
          <h2 className="mt-1 text-2xl font-bold">{step.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{step.subtitle}</p>
        </div>
        {currentStep > 0 && (
          <button
            type="button"
            onClick={() => window.confirm('Clear the form and start again?') && reset()}
            className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start over
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="mt-8"
        >
          <Component />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
