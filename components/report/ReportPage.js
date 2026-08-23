// Shared 1920×1080 page shell — KEDA logo + page number in the footer,
// exactly the small-print identity mark spec §4 asks for on every page.
export default function ReportPage({ pageNumber, className = '', children }) {
  return (
    <section className={`report-page ${className}`}>
      {children}
      <div className="report-footer">
        <img src="/keda-black.png" alt="KEDA" className="report-footer-logo" />
        <span className="report-page-num">{pageNumber} / 6</span>
      </div>
    </section>
  );
}
