import { useState } from "react";
import { BookOpen, Clapperboard, Newspaper, Shuffle, Sparkles } from "lucide-react";
import { api } from "../services/api";

const ITEMS = [
  {
    type: "BOOK",
    label: "Random Book",
    description: "Select an unpublished book and create or reuse its draft.",
    icon: BookOpen,
  },
  {
    type: "GUIDELINE",
    label: "Random Guideline",
    description: "Select an unpublished marriage-guidance video.",
    icon: Clapperboard,
  },
  {
    type: "BLOG",
    label: "Random Blog",
    description: "Select an unpublished blog article.",
    icon: Newspaper,
  },
];

export default function RandomDraftPanel({
  showToast,
  onDraftReady,
  onRefresh,
}) {
  const [busyType, setBusyType] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const createDraft = async (type) => {
    setBusyType(type);

    try {
      const payload = await api.createRandomDraft({
        type,
        platform: "TELEGRAM",
      });

      const result = payload.data;
      setLastResult(result);

      await onRefresh?.();

      showToast(
        result.generated ? "AI draft generated" : "Existing draft selected",
        `${result.selectedSource.title || type} · Post #${result.post.id}`
      );

      onDraftReady?.(result.post.id);
    } catch (error) {
      showToast("Random draft failed", error.message, "error");
    } finally {
      setBusyType("");
    }
  };

  return (
    <section className="panel random-draft-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CONTENT ROTATION</p>
          <h2>Generate an unpublished random draft</h2>
          <p>
            Successfully published Telegram items are excluded automatically.
          </p>
        </div>
        <div className="random-heading-icon">
          <Shuffle size={22} />
        </div>
      </div>

      <div className="random-draft-grid">
        {ITEMS.map(({ type, label, description, icon: Icon }) => (
          <button
            type="button"
            className="random-draft-card"
            key={type}
            disabled={Boolean(busyType)}
            onClick={() => createDraft(type)}
          >
            <span className="random-draft-icon">
              <Icon size={22} />
            </span>
            <span>
              <strong>
                {busyType === type ? "Selecting..." : label}
              </strong>
              <small>{description}</small>
            </span>
            <Sparkles size={18} />
          </button>
        ))}
      </div>

      {lastResult && (
        <div className="random-result">
          <div>
            <span>
              {lastResult.generated ? "New AI draft" : "Existing unpublished post"}
            </span>
            <strong>
              {lastResult.selectedSource.title || "Untitled source"}
            </strong>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => onDraftReady?.(lastResult.post.id)}
          >
            Review post #{lastResult.post.id}
          </button>
        </div>
      )}
    </section>
  );
}
