const STATUS_CLASS = {
  NEW: "badge badge-blue",
  PROCESSING: "badge badge-amber",
  PROCESSED: "badge badge-green",
  REJECTED: "badge badge-red",
  ARCHIVED: "badge badge-gray",
  DRAFT: "badge badge-blue",
  PENDING_APPROVAL: "badge badge-amber",
  APPROVED: "badge badge-green",
};

export default function StatusBadge({ status }) {
  return <span className={STATUS_CLASS[status] || "badge badge-gray"}>{status || "UNKNOWN"}</span>;
}
