import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div className={`toast toast-${toast.type || "success"}`}>
      <Icon size={20} />
      <div>
        <strong>{toast.title}</strong>
        {toast.message ? <p>{toast.message}</p> : null}
      </div>
      <button onClick={onClose} aria-label="Close notification">
        <X size={18} />
      </button>
    </div>
  );
}
