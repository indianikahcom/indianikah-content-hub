import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function PromptSettings({ showToast }) {
  const [prompts, setPrompts] = useState([]);
  const [saving, setSaving] = useState("");
  const load = async () => {
    try { const payload = await api.getPrompts(); setPrompts(payload.data || []); }
    catch (e) { showToast("Could not load prompts", e.message, "error"); }
  };
  useEffect(() => { load(); }, []);
  const change = (key, content) => setPrompts(items => items.map(item => item.key === key ? { ...item, content } : item));
  const save = async (item) => {
    setSaving(item.key);
    try {
      const payload = await api.updatePrompt(item.key, item.content);
      setPrompts(items => items.map(p => p.key === item.key ? payload.data : p));
      showToast("Prompt saved", item.name);
    } catch (e) { showToast("Could not save prompt", e.message, "error"); }
    finally { setSaving(""); }
  };
  return <section className="prompt-settings">
    <div className="section-heading"><div><p className="eyebrow">AI CONTEXT</p><h2>Prompt Settings</h2><p>Edit the permanent IndiaNikah context and content-type instructions without changing code.</p></div></div>
    <div className="prompt-grid">{prompts.map(item => <article className="prompt-card" key={item.key}>
      <div className="prompt-card-head"><div><strong>{item.name}</strong><span>{item.key}{item.isSystem ? " · SYSTEM" : ""}</span></div><button className="primary-button" disabled={saving === item.key} onClick={() => save(item)}>{saving === item.key ? "Saving..." : "Save"}</button></div>
      <textarea value={item.content} onChange={e => change(item.key, e.target.value)} rows={item.isSystem ? 14 : 8} />
    </article>)}</div>
  </section>;
}
