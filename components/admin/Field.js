// Same tiny wrapper as the private `Field` in app/admin/page.js — duplicated
// here (not exported from that file) so the Reports components can use it
// without touching that already-huge file.
export default function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}{hint ? <span className="field-hint-inline">{hint}</span> : null}</label>
      {children}
    </div>
  );
}
