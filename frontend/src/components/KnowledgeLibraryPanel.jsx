import { useEffect, useMemo, useState } from "react";
import { BookOpen, Boxes, CheckCircle2, Database, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { api } from "../services/api";
import StatusBadge from "./StatusBadge";

const TYPES = ["QURAN","HADITH","DUA","ISLAMIC_ARTICLE","MARRIAGE_GUIDE","MARRIAGE_TIP","FAMILY_LIFE","BOOK","BLOG","NEWS","STATISTICS","MANUAL"];
const emptyItem = { type: "QURAN", title: "", content: "", summary: "", language: "en", category: "", subcategory: "", references: "", tags: "", status: "DRAFT" };
const emptyPack = { key: "", name: "", description: "", instructions: "", contentTypes: [], languages: ["en"], tags: [], maxItems: 8, maxCharacters: 12000, isActive: true };

function parseMaybeJson(value, fallback) {
  if (!value?.trim()) return fallback;
  try { return JSON.parse(value); } catch { return value.split(",").map((v) => v.trim()).filter(Boolean); }
}

export default function KnowledgeLibraryPanel({ showToast }) {
  const [tab, setTab] = useState("items");
  const [items, setItems] = useState([]);
  const [packs, setPacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: "", type: "", status: "", page: 1, limit: 50 });
  const [itemForm, setItemForm] = useState(emptyItem);
  const [packForm, setPackForm] = useState(emptyPack);
  const [query, setQuery] = useState("");
  const [packKey, setPackKey] = useState("");
  const [contextResult, setContextResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const [itemPayload, packPayload, statPayload] = await Promise.all([
        api.getKnowledge(filters), api.getKnowledgePacks(), api.getKnowledgeStats(),
      ]);
      setItems(itemPayload.data || []);
      setPacks(packPayload.data || []);
      setStats(statPayload.data || null);
    } catch (error) { showToast("Knowledge Library could not load", error.message, "error"); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(); }, []);
  const approved = useMemo(() => items.filter((item) => item.status === "APPROVED"), [items]);

  const createItem = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      await api.createKnowledge({
        ...itemForm,
        summary: itemForm.summary || null,
        category: itemForm.category || null,
        subcategory: itemForm.subcategory || null,
        references: parseMaybeJson(itemForm.references, null),
        tags: parseMaybeJson(itemForm.tags, []),
      });
      setItemForm(emptyItem); await load(); showToast("Knowledge item created");
    } catch (error) { showToast("Could not create knowledge item", error.message, "error"); }
    finally { setBusy(false); }
  };

  const changeStatus = async (item, status) => {
    try { await api.updateKnowledgeStatus(item.id, status); await load(); showToast(`Knowledge moved to ${status}`); }
    catch (error) { showToast("Could not update knowledge", error.message, "error"); }
  };

  const createPack = async (event) => {
    event.preventDefault(); setBusy(true);
    try { await api.createKnowledgePack(packForm); setPackForm(emptyPack); await load(); showToast("Knowledge pack created"); }
    catch (error) { showToast("Could not create pack", error.message, "error"); }
    finally { setBusy(false); }
  };

  const addToPack = async (packId, knowledgeItemId) => {
    try { await api.addKnowledgePackItem(packId, { knowledgeItemId, priority: 100 }); await load(); showToast("Item added to pack"); }
    catch (error) { showToast("Could not add item", error.message, "error"); }
  };

  const removeFromPack = async (packId, knowledgeItemId) => {
    try { await api.removeKnowledgePackItem(packId, knowledgeItemId); await load(); showToast("Item removed from pack"); }
    catch (error) { showToast("Could not remove item", error.message, "error"); }
  };

  const testContext = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const payload = await api.buildKnowledgeContext({ query, packKey: packKey || undefined, maxItems: 8 }); setContextResult(payload.data); }
    catch (error) { showToast("Context test failed", error.message, "error"); }
    finally { setBusy(false); }
  };

  return <section className="page-section knowledge-library">
    <div className="knowledge-hero panel">
      <div><p className="eyebrow">Domain intelligence</p><h2>IndiaNikah Knowledge Library</h2><p>Curate approved Quran, Hadith, marriage guidance and brand context used by AI generation.</p></div>
      <button className="button button-secondary" onClick={load} disabled={busy}><RefreshCw size={17} className={busy ? "spin" : ""}/> Refresh</button>
    </div>

    <div className="metrics-grid knowledge-metrics">
      <article className="metric-card"><div className="metric-icon"><Database size={20}/></div><div><p>Total items</p><strong>{stats?.total ?? 0}</strong><span>Across all knowledge types</span></div></article>
      <article className="metric-card"><div className="metric-icon"><CheckCircle2 size={20}/></div><div><p>Approved</p><strong>{stats?.approved ?? 0}</strong><span>Eligible for AI context</span></div></article>
      <article className="metric-card"><div className="metric-icon"><Boxes size={20}/></div><div><p>Active packs</p><strong>{stats?.activePacks ?? 0}</strong><span>Reusable context bundles</span></div></article>
    </div>

    <div className="knowledge-tabs">
      {[['items','Knowledge Items'],['packs','Knowledge Packs'],['context','Context Tester']].map(([id,label]) => <button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}
    </div>

    {tab === "items" && <div className="knowledge-two-column">
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">Library catalogue</p><h2>{items.length} items loaded</h2></div></div>
        <form className="filter-bar knowledge-filter" onSubmit={(e)=>{e.preventDefault();load();}}>
          <div className="search-field"><Search size={17}/><input placeholder="Search title or content" value={filters.search} onChange={(e)=>setFilters({...filters,search:e.target.value})}/></div>
          <select value={filters.type} onChange={(e)=>setFilters({...filters,type:e.target.value})}><option value="">All types</option>{TYPES.map((type)=><option key={type}>{type}</option>)}</select>
          <select value={filters.status} onChange={(e)=>setFilters({...filters,status:e.target.value})}><option value="">All statuses</option>{["DRAFT","PENDING_APPROVAL","APPROVED","REJECTED","ARCHIVED"].map((s)=><option key={s}>{s}</option>)}</select>
          <button className="button button-secondary">Apply</button>
        </form>
        <div className="knowledge-list">{items.map((item)=><article className="knowledge-item" key={item.id}>
          <div><div className="knowledge-item-head"><strong>{item.title}</strong><StatusBadge status={item.status}/></div><span>{item.type} · {item.language} · {item.category || 'General'}</span><p>{item.summary || item.content.slice(0,180)}{(item.summary||item.content).length>180?'…':''}</p></div>
          <div className="knowledge-actions">
            {item.status === 'DRAFT' && <button className="text-button" onClick={()=>changeStatus(item,'PENDING_APPROVAL')}>Submit</button>}
            {item.status === 'PENDING_APPROVAL' && <button className="text-button" onClick={()=>changeStatus(item,'APPROVED')}>Approve</button>}
            {item.status === 'APPROVED' && packs.length ? <select defaultValue="" onChange={(e)=>{ if(e.target.value) addToPack(e.target.value,item.id); e.target.value=''; }}><option value="">Add to pack…</option>{packs.map((pack)=><option value={pack.id} key={pack.id}>{pack.name}</option>)}</select> : null}
          </div>
        </article>)}</div>
      </section>

      <section className="panel knowledge-editor">
        <div className="panel-heading"><div><p className="eyebrow">Curate context</p><h2>Add knowledge item</h2></div><BookOpen size={22}/></div>
        <form className="form-stack" onSubmit={createItem}>
          <label>Type<select value={itemForm.type} onChange={(e)=>setItemForm({...itemForm,type:e.target.value})}>{TYPES.map((t)=><option key={t}>{t}</option>)}</select></label>
          <label>Title<input required value={itemForm.title} onChange={(e)=>setItemForm({...itemForm,title:e.target.value})}/></label>
          <div className="form-row"><label>Language<input value={itemForm.language} onChange={(e)=>setItemForm({...itemForm,language:e.target.value})}/></label><label>Category<input value={itemForm.category} onChange={(e)=>setItemForm({...itemForm,category:e.target.value})}/></label></div>
          <label>Content<textarea required rows={10} value={itemForm.content} onChange={(e)=>setItemForm({...itemForm,content:e.target.value})}/></label>
          <label>Summary<textarea rows={3} value={itemForm.summary} onChange={(e)=>setItemForm({...itemForm,summary:e.target.value})}/></label>
          <label>References (JSON or comma-separated)<textarea rows={3} value={itemForm.references} onChange={(e)=>setItemForm({...itemForm,references:e.target.value})}/></label>
          <label>Tags (comma-separated)<input value={itemForm.tags} onChange={(e)=>setItemForm({...itemForm,tags:e.target.value})}/></label>
          <button className="button button-primary" disabled={busy}><Plus size={17}/> Save as draft</button>
        </form>
      </section>
    </div>}

    {tab === "packs" && <div className="knowledge-two-column">
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Reusable context</p><h2>Knowledge packs</h2></div></div>
        <div className="pack-grid">{packs.map((pack)=><article className="pack-card" key={pack.id}><div className="pack-card-head"><div><strong>{pack.name}</strong><span>{pack.key}</span></div><StatusBadge status={pack.isActive?'APPROVED':'ARCHIVED'}/></div><p>{pack.description || 'No description'}</p><small>{pack.items.length} pinned items · Max {pack.maxItems} results</small><div className="pack-items">{pack.items.map((entry)=><div key={entry.id}><span>{entry.knowledgeItem.title}</span><button onClick={()=>removeFromPack(pack.id,entry.knowledgeItemId)} title="Remove"><Trash2 size={15}/></button></div>)}</div></article>)}</div>
      </section>
      <section className="panel knowledge-editor"><div className="panel-heading"><div><p className="eyebrow">New bundle</p><h2>Create knowledge pack</h2></div></div>
        <form className="form-stack" onSubmit={createPack}>
          <label>Key<input required placeholder="MARRIAGE_GUIDANCE" value={packForm.key} onChange={(e)=>setPackForm({...packForm,key:e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g,'_')})}/></label>
          <label>Name<input required value={packForm.name} onChange={(e)=>setPackForm({...packForm,name:e.target.value})}/></label>
          <label>Description<textarea rows={3} value={packForm.description} onChange={(e)=>setPackForm({...packForm,description:e.target.value})}/></label>
          <label>AI instructions<textarea rows={5} value={packForm.instructions} onChange={(e)=>setPackForm({...packForm,instructions:e.target.value})}/></label>
          <label>Content types<select multiple value={packForm.contentTypes} onChange={(e)=>setPackForm({...packForm,contentTypes:Array.from(e.target.selectedOptions,v=>v.value)})}>{TYPES.map((t)=><option key={t}>{t}</option>)}</select></label>
          <div className="form-row"><label>Max items<input type="number" min="1" max="20" value={packForm.maxItems} onChange={(e)=>setPackForm({...packForm,maxItems:Number(e.target.value)})}/></label><label>Character limit<input type="number" min="1000" max="40000" value={packForm.maxCharacters} onChange={(e)=>setPackForm({...packForm,maxCharacters:Number(e.target.value)})}/></label></div>
          <button className="button button-primary" disabled={busy}><Plus size={17}/> Create pack</button>
        </form>
      </section>
    </div>}

    {tab === "context" && <section className="panel context-tester"><div className="panel-heading"><div><p className="eyebrow">RAG preview</p><h2>Test the exact context sent to AI</h2></div></div>
      <form className="context-query" onSubmit={testContext}><input required placeholder="e.g. Write a post about choosing a spouse with good character" value={query} onChange={(e)=>setQuery(e.target.value)}/><select value={packKey} onChange={(e)=>setPackKey(e.target.value)}><option value="">Search all approved knowledge</option>{packs.map((p)=><option key={p.key} value={p.key}>{p.name}</option>)}</select><button className="button button-primary" disabled={busy}><Search size={17}/> Build context</button></form>
      {contextResult && <div className="context-result"><div className="context-summary"><strong>{contextResult.items.length} items selected</strong><span>{contextResult.characters} characters · {contextResult.availableCandidates} candidates</span></div><div className="context-columns"><div>{contextResult.items.map((item)=><article className="knowledge-item" key={item.id}><strong>{item.title}</strong><span>{item.type} · score {item.relevanceScore.toFixed(1)}</span></article>)}</div><pre>{contextResult.context}</pre></div></div>}
    </section>}
  </section>;
}
