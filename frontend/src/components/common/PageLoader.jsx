/** tall: fills the screen, so the footer stays below the fold while a page loads (no jump when it arrives). */
export default function PageLoader({ tall = false }) {
  return (
    <div className={`flex items-center justify-center ${tall ? 'min-h-[100svh]' : 'min-h-[60vh]'}`}>
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
    </div>
  );
}
