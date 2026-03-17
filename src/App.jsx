import { useState, useEffect, useRef } from "react";

// ─── AFFILIATE LINKS ───────────────────────────────────────────────
const affiliate = {
  ebay: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q + " trading card")}`,
  tcg: (q) => `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(q)}`,
  stockx: (q) => `https://stockx.com/search?s=${encodeURIComponent(q)}`,
};

// ─── SAMPLE DATA ───────────────────────────────────────────────────
const SEED_COLLECTION = [
  { id: 1, name: "Charizard Holo", set: "Pokémon Base Set", condition: "LP", grade: "Raw", buyPrice: 45, currentValue: 120, category: "pokemon", qty: 1, notes: "Garage sale find", date: "2025-01-10" },
  { id: 2, name: "LeBron James Rookie", set: "2003 Topps Chrome", condition: "NM", grade: "PSA 9", buyPrice: 80, currentValue: 210, category: "sports", qty: 1, notes: "eBay purchase", date: "2025-02-14" },
  { id: 3, name: "Luka Doncic Prizm Silver", set: "2018 Panini Prizm", condition: "NM", grade: "Raw", buyPrice: 35, currentValue: 55, category: "sports", qty: 2, notes: "", date: "2025-03-01" },
  { id: 4, name: "Pikachu VMAX", set: "Pokémon Vivid Voltage", condition: "M", grade: "PSA 10", buyPrice: 20, currentValue: 18, category: "pokemon", qty: 1, notes: "Price dipped", date: "2025-03-10" },
];

const SEED_SOLD = [
  { id: 1, name: "Giannis Rookie PSA 9", buyPrice: 40, sellPrice: 95, date: "2025-02-01", platform: "eBay" },
  { id: 2, name: "Charizard V", buyPrice: 15, sellPrice: 28, date: "2025-02-20", platform: "TCGplayer" },
];

const SEED_WANTLIST = [
  { id: 1, name: "Wembanyama Rookie Prizm", targetPrice: 80, category: "sports", priority: "high" },
  { id: 2, name: "Pikachu Illustrator", targetPrice: 500, category: "pokemon", priority: "low" },
];

const CONDITIONS = ["M", "NM", "LP", "MP", "HP"];
const GRADES = ["Raw", "PSA 10", "PSA 9", "PSA 8", "PSA 7", "BGS 10", "BGS 9.5", "SGC 10"];
const CATEGORIES = ["pokemon", "sports", "magic", "yugioh", "other"];
const CAT_LABELS = { pokemon: "Pokémon", sports: "Sports", magic: "Magic", yugioh: "Yu-Gi-Oh", other: "Other" };
const CAT_COLORS = { pokemon: "#FFCB05", sports: "#1d4ed8", magic: "#9B2335", yugioh: "#6B4C9A", other: "#6B7280" };

const fmt = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── COMPONENTS ────────────────────────────────────────────────────

function AffiliateLinks({ name }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
      {[
        { label: "Find on eBay", url: affiliate.ebay(name), color: "#E53238" },
        { label: "TCGplayer", url: affiliate.tcg(name), color: "#1d4ed8" },
        { label: "StockX", url: affiliate.stockx(name), color: "#00c853" },
      ].map(b => (
        <a key={b.label} href={b.url} target="_blank" rel="noopener noreferrer" style={{
          fontSize: "0.7rem", padding: "4px 12px", borderRadius: "20px",
          background: b.color + "15", color: b.color,
          border: `1px solid ${b.color}33`, textDecoration: "none",
          fontWeight: "700", letterSpacing: "0.3px", fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          {b.label} ↗
        </a>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#12121e", borderRadius: "12px", padding: "16px", border: "1px solid #1e1e30", flex: 1, minWidth: "120px" }}>
      <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>{label}</div>
      <div style={{ fontSize: "clamp(1rem, 2.5vw, 1.3rem)", fontWeight: "700", color: color || "#e2e2ee", fontFamily: "'Space Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.65rem", color: "#444", marginTop: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>{sub}</div>}
    </div>
  );
}

// ─── PORTFOLIO CHART ───────────────────────────────────────────────
function PortfolioChart({ collection }) {
  const categories = CATEGORIES.filter(c => collection.some(x => x.category === c));
  const data = categories.map(c => ({
    cat: c,
    value: collection.filter(x => x.category === c).reduce((s, x) => s + x.currentValue * x.qty, 0),
  }));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const segments = data.map(d => {
    const pct = (d.value / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });

  const r = 70, cx = 90, cy = 90;
  const toRad = (deg) => (deg - 90) * Math.PI / 180;
  const arc = (pct, start) => {
    if (pct >= 99.9) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
    const startRad = toRad(start * 3.6);
    const endRad = toRad((start + pct) * 3.6);
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = pct > 50 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  return (
    <div style={{ background: "#12121e", borderRadius: "12px", padding: "20px", border: "1px solid #1e1e30" }}>
      <div style={{ fontSize: "0.7rem", color: "#555", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", marginBottom: "16px" }}>Portfolio Breakdown</div>
      <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {segments.map((s, i) => (
            <path key={i} d={arc(s.pct, s.start)} fill={CAT_COLORS[s.cat]} opacity="0.85" />
          ))}
          <circle cx={cx} cy={cy} r="40" fill="#12121e" />
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e2ee" fontSize="11" fontFamily="'Space Mono', monospace">{fmt(total)}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#555" fontSize="8" fontFamily="'Barlow Condensed', sans-serif">TOTAL</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {segments.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: CAT_COLORS[s.cat], flexShrink: 0 }} />
              <div style={{ fontSize: "0.8rem", color: "#ccc", fontFamily: "'Barlow Condensed', sans-serif" }}>{CAT_LABELS[s.cat]}</div>
              <div style={{ fontSize: "0.75rem", color: "#555", fontFamily: "'Space Mono', monospace", marginLeft: "auto", paddingLeft: "12px" }}>{s.pct.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COLLECTION VIEW ───────────────────────────────────────────────
function CollectionView({ collection, setCollection }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("gain");
  const [aiData, setAiData] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", set: "", condition: "NM", grade: "Raw", buyPrice: "", currentValue: "", category: "sports", qty: 1, notes: "" });

  const totalInvested = collection.reduce((s, c) => s + c.buyPrice * c.qty, 0);
  const totalValue = collection.reduce((s, c) => s + c.currentValue * c.qty, 0);
  const totalGain = totalValue - totalInvested;
  const gainPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : 0;
  const bestCard = [...collection].sort((a, b) => (b.currentValue - b.buyPrice) - (a.currentValue - a.buyPrice))[0];

  const filtered = collection
    .filter(c => filter === "all" || c.category === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.set || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "gain") return (b.currentValue - b.buyPrice) * b.qty - (a.currentValue - a.buyPrice) * a.qty;
      if (sort === "value") return b.currentValue * b.qty - a.currentValue * a.qty;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "newest") return new Date(b.date) - new Date(a.date);
      return 0;
    });

  const getAI = async (card) => {
    setLoadingId(card.id);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a trading card market expert. Respond ONLY in JSON:
{"verdict":"hold"|"sell"|"buy more","reasoning":"2 sentences max","priceRange":{"low":number,"high":number},"trend":"rising"|"falling"|"stable","tip":"under 15 words","similarCards":["card1","card2","card3"]}`,
          messages: [{ role: "user", content: `Analyze: "${card.name}" from "${card.set}", condition: ${card.condition}, grade: ${card.grade}. Paid $${card.buyPrice}, current value $${card.currentValue}. Verdict?` }]
        })
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
      setAiData(p => ({ ...p, [card.id]: parsed }));
    } catch {
      setAiData(p => ({ ...p, [card.id]: { verdict: "hold", reasoning: "Check eBay sold listings for current market prices.", trend: "stable", tip: "Compare recent sold listings on eBay.", priceRange: { low: card.currentValue * 0.85, high: card.currentValue * 1.15 }, similarCards: [] } }));
    }
    setLoadingId(null);
  };

  const addCard = () => {
    if (!form.name || !form.buyPrice || !form.currentValue) return;
    setCollection([{ id: Date.now(), ...form, buyPrice: parseFloat(form.buyPrice), currentValue: parseFloat(form.currentValue), qty: parseInt(form.qty), date: new Date().toISOString().split("T")[0] }, ...collection]);
    setForm({ name: "", set: "", condition: "NM", grade: "Raw", buyPrice: "", currentValue: "", category: "sports", qty: 1, notes: "" });
    setShowAdd(false);
  };

  const verdictColors = { hold: "#FFB800", sell: "#FF5C5C", "buy more": "#00C896" };
  const trendIcons = { rising: "↑", falling: "↓", stable: "→" };
  const trendColors = { rising: "#00C896", falling: "#FF5C5C", stable: "#888" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Stats */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <StatCard label="Collection Value" value={fmt(totalValue)} sub={`${collection.length} cards`} />
        <StatCard label="Total Invested" value={fmt(totalInvested)} sub="cost basis" />
        <StatCard label="Total Gain" value={fmt(totalGain)} sub={gainPct + "% return"} color={totalGain >= 0 ? "#00C896" : "#FF5C5C"} />
        <StatCard label="Best Card" value={bestCard ? fmt(bestCard.currentValue - bestCard.buyPrice) : "$0"} sub={bestCard?.name?.split(" ").slice(0, 2).join(" ") || "—"} color="#1d4ed8" />
      </div>

      {/* Chart */}
      <PortfolioChart collection={collection} />

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards..." style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e30", borderRadius: "8px", color: "#e2e2ee", padding: "7px 12px", fontFamily: "inherit", fontSize: "0.8rem", minWidth: "150px" }} />
        {["all", ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", background: filter === cat ? (CAT_COLORS[cat] || "#1d4ed8") + "33" : "rgba(255,255,255,0.04)", color: filter === cat ? (CAT_COLORS[cat] || "#1d4ed8") : "#666", fontSize: "0.72rem", fontWeight: "700", fontFamily: "inherit" }}>
            {cat === "all" ? "All" : CAT_LABELS[cat]}
          </button>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ marginLeft: "auto", background: "#12121e", border: "1px solid #1e1e30", borderRadius: "8px", color: "#888", padding: "6px 10px", fontFamily: "inherit", fontSize: "0.75rem" }}>
          <option value="gain">Top Gainers</option>
          <option value="value">Highest Value</option>
          <option value="name">Name A-Z</option>
          <option value="newest">Newest First</option>
        </select>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
          + Add Card
        </button>
      </div>

      {/* Add Card Form */}
      {showAdd && (
        <div style={{ background: "#12121e", borderRadius: "14px", border: "1px solid #1d4ed8", padding: "20px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1d4ed8", marginBottom: "16px", letterSpacing: "1px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>Add New Card</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            {[
              { key: "name", label: "Card Name *", placeholder: "e.g. Charizard Holo" },
              { key: "set", label: "Set / Year", placeholder: "e.g. Base Set 1999" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Condition</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Grade</label>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>What You Paid ($) *</label>
              <input type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} placeholder="0.00" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Current Value ($) *</label>
              <input type="number" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} placeholder="0.00" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Qty</label>
              <input type="number" min="1" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Where you found it..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={addCard} style={{ padding: "10px 24px", borderRadius: "8px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>Add to Collection</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", color: "#888", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Card List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {filtered.map(card => {
          const gain = (card.currentValue - card.buyPrice) * card.qty;
          const gainPctCard = card.buyPrice > 0 ? ((card.currentValue - card.buyPrice) / card.buyPrice * 100).toFixed(0) : 0;
          const isOpen = expanded === card.id;
          const ai = aiData[card.id];

          return (
            <div key={card.id} style={{ background: "#12121e", borderRadius: "12px", border: `1px solid ${isOpen ? "#1d4ed833" : "#1e1e30"}`, overflow: "hidden" }}>
              <div onClick={() => setExpanded(isOpen ? null : card.id)} style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "center", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CAT_COLORS[card.category] || "#888", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: "700", fontSize: "0.875rem", color: "#e2e2ee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "1px", fontFamily: "'Barlow Condensed', sans-serif" }}>{card.set} · {card.grade} · x{card.qty}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.875rem", color: "#e2e2ee" }}>{fmt(card.currentValue * card.qty)}</div>
                  <div style={{ fontSize: "0.7rem", color: gain >= 0 ? "#00C896" : "#FF5C5C", fontFamily: "'Space Mono', monospace" }}>{gain >= 0 ? "+" : ""}{fmt(gain)} ({gainPctCard}%)</div>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid #1a1a28", padding: "14px 16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
                    {[
                      { label: "Paid", value: fmt(card.buyPrice) },
                      { label: "Value Now", value: fmt(card.currentValue) },
                      { label: "Profit/Card", value: fmt(card.currentValue - card.buyPrice) },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px 12px" }}>
                        <div style={{ fontSize: "0.6rem", color: "#444", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>{s.label}</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.85rem", color: "#e2e2ee" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {card.notes && <div style={{ fontSize: "0.75rem", color: "#444", marginBottom: "12px", fontStyle: "italic" }}>📝 {card.notes}</div>}

                  {!ai && (
                    <button onClick={() => getAI(card)} disabled={loadingId === card.id} style={{ padding: "8px 16px", borderRadius: "8px", background: "rgba(29,78,216,0.15)", color: "#1d4ed8", border: "1px solid rgba(29,78,216,0.3)", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px" }}>
                      {loadingId === card.id ? "🤖 Analyzing..." : "🤖 Get AI Analysis"}
                    </button>
                  )}

                  {ai && (
                    <div style={{ background: "rgba(29,78,216,0.06)", borderRadius: "10px", border: "1px solid rgba(29,78,216,0.2)", padding: "12px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", background: (verdictColors[ai.verdict] || "#888") + "22", color: verdictColors[ai.verdict] || "#888", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Barlow Condensed', sans-serif" }}>{ai.verdict}</span>
                        <span style={{ fontSize: "0.8rem", color: trendColors[ai.trend] }}>{trendIcons[ai.trend]} {ai.trend}</span>
                        {ai.priceRange && <span style={{ fontSize: "0.7rem", color: "#444", marginLeft: "auto", fontFamily: "'Space Mono', monospace" }}>{fmt(ai.priceRange.low)} – {fmt(ai.priceRange.high)}</span>}
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#aaa", lineHeight: 1.5, marginBottom: "6px" }}>{ai.reasoning}</p>
                      {ai.tip && <div style={{ fontSize: "0.72rem", color: "#1d4ed8", fontStyle: "italic" }}>💡 {ai.tip}</div>}
                      {ai.similarCards?.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif" }}>Similar cards to watch</div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {ai.similarCards.map((c, i) => (
                              <a key={i} href={affiliate.ebay(c)} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", padding: "3px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid #2a2a3e", textDecoration: "none" }}>{c} ↗</a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <AffiliateLinks name={card.name} />

                  <button onClick={() => setCollection(collection.filter(c => c.id !== card.id))} style={{ marginTop: "12px", padding: "5px 12px", borderRadius: "6px", background: "rgba(255,92,92,0.08)", color: "#FF5C5C", border: "1px solid rgba(255,92,92,0.15)", fontSize: "0.7rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                    Remove Card
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🃏</div>
            <div style={{ fontSize: "0.875rem" }}>No cards yet. Add your first card!</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CARD PRICE SEARCH ─────────────────────────────────────────────
function CardSearch() {
  const [form, setForm] = useState({ name: "", player: "", year: "", set: "", grade: "", condition: "", category: "all" });
  const [searched, setSearched] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  const buildQuery = () => {
    const parts = [form.name, form.player, form.year, form.set, form.grade, form.condition]
      .filter(Boolean).join(" ");
    return parts;
  };

  const handlePhotoScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    setSearched(false);

    // Show preview using object URL (works with HEIC)
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Convert to base64 for API — aggressive compression for mobile
    const base64 = await new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Keep it small — 800px is plenty for AI to read text
        const maxSize = 800;
        let w = img.width;
        let h = img.height;
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
      };
      img.onerror = () => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(",")[1]);
        r.readAsDataURL(file);
      };
      img.src = objectUrl;
    });

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: `You are the world's best trading card identification expert with 30 years of experience. You can identify ANY trading card from ANY angle or photo quality. You NEVER say you can't identify a card — you always make your best determination based on ALL visual clues available.

CRITICAL RULES:
- ALWAYS commit to a specific answer — never leave fields blank if you can make a reasonable guess
- ALWAYS set confidence to "high" if you can read the player name, year, or set name clearly
- ALWAYS set confidence to "medium" if you can identify the sport, brand, or character even if some details are unclear
- Only set confidence to "low" if the image is completely unreadable or not a trading card at all
- For sports cards: read the jersey number, team colors, uniform style, and logo to identify the player and team even if the name is hard to read
- For Pokémon: identify by the artwork, colors, and card layout — you know every Pokémon
- For the year: look at the card design, set logo, and any visible copyright text
- For the set: identify from the set logo, card back design, foil pattern, and border style
- For parallels: Prizm cards have rainbow/chrome shine, Holo cards have holographic patterns, Refractors have a refractive shine
- For condition: NM means near perfect, LP means light wear on corners/edges, MP means noticeable wear
- For estimated value: give a specific dollar range based on your knowledge of the current market — never say Unknown

Respond ONLY in valid JSON with NO extra text:
{
  "name": "specific card name — never generic",
  "player": "full player or character name",
  "year": "4 digit year — make your best guess from card design if not visible",
  "set": "specific set name",
  "cardNumber": "card number if visible or null",
  "brand": "Panini|Topps|Upper Deck|Pokemon Company|Fleer|Donruss|Score|Bowman|Leaf",
  "parallel": "Base|Prizm|Holo|Refractor|Silver|Gold|Rainbow|Chrome|Mosaic|Optic|null",
  "category": "pokemon|sports|magic|yugioh|other",
  "sport": "basketball|football|baseball|soccer|hockey|other|null",
  "condition": "M|NM|LP|MP|HP",
  "estimatedValue": "specific range like $15-25 or $100-150",
  "confidence": "high|medium|low",
  "notes": "key identifying detail that confirms this identification under 15 words"
}`,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
              { type: "text", text: "Identify this trading card completely. FIRST read any text visible on the card or slab label — player name, year, set name, card number, grade. Then use visual clues — jersey numbers, team colors, card design, logos, foil patterns. If this is a graded slab, read the label text carefully as it contains all the key information. Commit to your best answer for every field with HIGH confidence if you can read any text on the card or label." }
            ]
          }]
        })
      });
      const data = await res.json();
      const rawText = data.content?.[0]?.text || "";
      
      // Try multiple JSON extraction methods
      let parsed = null;
      
      // Method 1: direct parse
      try { parsed = JSON.parse(rawText); } catch {}
      
      // Method 2: strip markdown fences
      if (!parsed) {
        try { parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim()); } catch {}
      }
      
      // Method 3: extract JSON object from text
      if (!parsed) {
        try {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        } catch {}
      }

      if (parsed) {
        setScanResult(parsed);
        setForm({
          name: [parsed.parallel !== "Base" ? parsed.parallel : null, parsed.name].filter(Boolean).join(" ") || "",
          player: parsed.player || "",
          year: parsed.year || "",
          set: [parsed.brand, parsed.set].filter(Boolean).join(" ") || "",
          grade: parsed.grade || "",
          condition: parsed.condition || "",
          category: parsed.category || "other",
        });
      } else {
        // Show raw response for debugging
        setScanResult({ 
          name: "Parse error — tap Scan Another and retry", 
          confidence: "low", 
          notes: rawText.slice(0, 100) 
        });
      }
    } catch (err) {
      setScanResult({ 
        name: "Could not identify", 
        confidence: "low", 
        notes: err?.message || "Try a clearer photo in better lighting" 
      });
    }
    setScanning(false);
  };

  const buildEbayUrl = (sold) => {
    const q = encodeURIComponent(buildQuery() + " trading card");
    const base = `https://www.ebay.com/sch/i.html?_nkw=${q}&_sacat=0`;
    return sold ? base + "&LH_Complete=1&LH_Sold=1" : base;
  };

  const buildTCGUrl = () => {
    const q = encodeURIComponent(buildQuery());
    return `https://www.tcgplayer.com/search/all/product?q=${q}`;
  };

  const build130pointUrl = () => {
    const q = encodeURIComponent(buildQuery());
    return `https://130point.com/sales/?query=${q}`;
  };

  const buildPSAUrl = () => {
    const q = encodeURIComponent(buildQuery());
    return `https://www.psacard.com/auctionprices/search?q=${q}`;
  };

  const hasQuery = buildQuery().trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => setScanMode(false)} style={{ padding: "8px 20px", borderRadius: "8px", background: !scanMode ? "#1d4ed8" : "rgba(255,255,255,0.05)", border: "none", color: !scanMode ? "white" : "#666", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
          🔎 Manual Search
        </button>
        <button onClick={() => setScanMode(true)} style={{ padding: "8px 20px", borderRadius: "8px", background: scanMode ? "#1d4ed8" : "rgba(255,255,255,0.05)", border: "none", color: scanMode ? "white" : "#666", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
          📸 Scan Card Photo
        </button>
      </div>

      {/* PHOTO SCAN MODE */}
      {scanMode && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "0.75rem", color: "#444", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px" }}>
            Take a photo of any card — AI will identify it and fill in all the details automatically
          </div>

          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{ background: "#12121e", borderRadius: "14px", border: `2px dashed ${scanning ? "#1d4ed8" : "#2a2a3e"}`, padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", cursor: "pointer", transition: "all 0.2s" }}
          >
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoScan} style={{ display: "none" }} />

            {previewUrl ? (
              <img src={previewUrl} alt="Card" style={{ maxHeight: "200px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }} />
            ) : (
              <>
                <div style={{ fontSize: "3rem" }}>📸</div>
                <div style={{ fontWeight: "700", color: "#e2e2ee", fontSize: "0.9rem" }}>Tap to take a photo or upload</div>
                <div style={{ fontSize: "0.75rem", color: "#444", fontFamily: "'Barlow Condensed', sans-serif" }}>Works with any trading card — Pokémon, sports, Magic, Yu-Gi-Oh</div>
              </>
            )}

            {scanning && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1d4ed8", fontSize: "0.85rem", fontWeight: "700" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid #1d4ed8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                Identifying card...
              </div>
            )}
          </div>

          {/* Scan result */}
          {scanResult && !scanning && (
            <div style={{ background: "#12121e", borderRadius: "14px", border: `1px solid ${scanResult.confidence === "high" ? "#00C89633" : scanResult.confidence === "medium" ? "#FFB80033" : "#FF5C5C33"}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1a1a28", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ fontWeight: "700", color: "#e2e2ee", fontSize: "0.9rem" }}>
                  {scanResult.player ? `${scanResult.player} — ` : ""}{scanResult.name}
                </div>
                <span style={{ fontSize: "0.65rem", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px", background: scanResult.confidence === "high" ? "rgba(0,200,150,0.15)" : scanResult.confidence === "medium" ? "rgba(255,184,0,0.15)" : "rgba(255,92,92,0.15)", color: scanResult.confidence === "high" ? "#00C896" : scanResult.confidence === "medium" ? "#FFB800" : "#FF5C5C" }}>
                  {scanResult.confidence?.toUpperCase()} CONFIDENCE
                </span>
              </div>
              <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                {[
                  { label: "Year", value: scanResult.year },
                  { label: "Set", value: scanResult.set },
                  { label: "Brand", value: scanResult.brand },
                  { label: "Parallel", value: scanResult.parallel || "Base" },
                  { label: "Card #", value: scanResult.cardNumber || "—" },
                  { label: "Condition", value: scanResult.condition },
                  { label: "Category", value: CAT_LABELS[scanResult.category] || scanResult.category },
                  { label: "Est. Value", value: scanResult.estimatedValue },
                ].map((s, i) => s.value && (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px 12px" }}>
                    <div style={{ fontSize: "0.6rem", color: "#444", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>{s.label}</div>
                    <div style={{ fontSize: "0.82rem", color: "#e2e2ee", fontWeight: "500" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {scanResult.notes && (
                <div style={{ padding: "0 18px 14px", fontSize: "0.75rem", color: "#555", fontStyle: "italic" }}>💡 {scanResult.notes}</div>
              )}
              {scanResult.confidence === "low" && (
                <div style={{ margin: "0 18px 14px", background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)", borderRadius: "8px", padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#FFB800", fontWeight: "700", marginBottom: "4px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px" }}>TRY THESE FOR BETTER RESULTS</div>
                  <div style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>
                    • Lay card flat on a plain white or dark surface<br/>
                    • Make sure the full card is in frame<br/>
                    • Avoid glare — don't shoot directly under a light<br/>
                    • Get close enough so text is readable<br/>
                    • Clean the card surface if dusty
                  </div>
                </div>
              )}
              <div style={{ padding: "0 18px 16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => { setScanMode(false); setSearched(true); }} style={{ padding: "8px 18px", borderRadius: "8px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                  Search This Card →
                </button>
                <button onClick={() => { setPreviewUrl(null); setScanResult(null); fileRef.current.click(); }} style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", color: "#888", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL SEARCH MODE */}
      {!scanMode && (
        <>
          <div style={{ fontSize: "0.75rem", color: "#444", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px" }}>
            Search by any combination — name, player, year, set, grade. Opens real sold listings.
          </div>

      {/* Search Form */}
      <div style={{ background: "#12121e", borderRadius: "14px", border: "1px solid #1e1e30", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          {[
            { key: "name", label: "Card Name", placeholder: "e.g. Charizard, Prizm" },
            { key: "player", label: "Player / Character", placeholder: "e.g. LeBron James" },
            { key: "year", label: "Year", placeholder: "e.g. 2018, 2003" },
            { key: "set", label: "Set", placeholder: "e.g. Topps Chrome, Base Set" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>{f.label}</label>
              <input
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>Grade</label>
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
              <option value="">Any Grade</option>
              {["PSA 10", "PSA 9", "PSA 8", "PSA 7", "BGS 10", "BGS 9.5", "SGC 10", "Raw"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
        </div>

        {/* Search preview */}
        {hasQuery && (
          <div style={{ background: "rgba(29,78,216,0.08)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "0.65rem", color: "#555", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px", textTransform: "uppercase", flexShrink: 0 }}>Searching for:</div>
            <div style={{ fontSize: "0.8rem", color: "#1d4ed8", fontWeight: "700", fontFamily: "'Space Mono', monospace" }}>"{buildQuery()}"</div>
          </div>
        )}

        <button onClick={() => setSearched(true)} disabled={!hasQuery} style={{ padding: "10px 24px", borderRadius: "8px", background: hasQuery ? "#1d4ed8" : "#1e1e30", border: "none", color: hasQuery ? "white" : "#444", fontSize: "0.875rem", fontWeight: "700", cursor: hasQuery ? "pointer" : "default", fontFamily: "inherit" }}>
          Find This Card →
        </button>
      </div>

      {/* Results — price source buttons */}
      {searched && hasQuery && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "0.7rem", color: "#444", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "2px", textTransform: "uppercase" }}>Check prices on these platforms:</div>

          {[
            {
              label: "eBay — Sold Listings (Most Accurate)",
              sub: "See what this card actually sold for recently",
              url: buildEbayUrl(true),
              color: "#E53238",
              tag: "BEST FOR REAL PRICES",
            },
            {
              label: "eBay — Active Listings",
              sub: "See what people are currently asking",
              url: buildEbayUrl(false),
              color: "#E53238",
              tag: "CURRENT ASKING PRICE",
            },
            {
              label: "TCGplayer Market Price",
              sub: "Best for Pokémon, Magic, and Yu-Gi-Oh",
              url: buildTCGUrl(),
              color: "#1d4ed8",
              tag: "GREAT FOR POKEMON",
            },
            {
              label: "130point — Graded Sales",
              sub: "PSA and BGS graded card sales history",
              url: build130pointUrl(),
              color: "#00C896",
              tag: "GRADED CARDS",
            },
            {
              label: "PSA Auction Prices",
              sub: "Official PSA auction price history",
              url: buildPSAUrl(),
              color: "#FFB800",
              tag: "PSA CERTIFIED",
            },
          ].map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "#12121e", borderRadius: "12px", border: `1px solid ${s.color}22`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", transition: "all 0.15s", cursor: "pointer" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "0.875rem", color: "#e2e2ee", marginBottom: "2px" }}>{s.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#555", fontFamily: "'Barlow Condensed', sans-serif" }}>{s.sub}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", background: s.color + "18", color: s.color, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{s.tag}</span>
                  <span style={{ color: s.color, fontSize: "1rem" }}>↗</span>
                </div>
              </div>
            </a>
          ))}

          <div style={{ background: "rgba(29,78,216,0.06)", borderRadius: "10px", border: "1px solid rgba(29,78,216,0.15)", padding: "12px 16px", marginTop: "4px" }}>
            <div style={{ fontSize: "0.7rem", color: "#1d4ed8", fontWeight: "700", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px", marginBottom: "4px" }}>💡 PRO TIP</div>
            <div style={{ fontSize: "0.78rem", color: "#666", lineHeight: 1.5 }}>Always check eBay <strong style={{ color: "#aaa" }}>sold listings</strong> first — that's the real market price. Active listings can be inflated. What a card sold for last week is what it's actually worth today.</div>
          </div>
        </div>
      )}

      {/* Quick searches */}
      {!searched && (
        <div>
          <div style={{ fontSize: "0.65rem", color: "#333", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", fontFamily: "'Barlow Condensed', sans-serif" }}>Quick searches</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { name: "Charizard", year: "1999", set: "Base Set", grade: "PSA 10" },
              { name: "Prizm", player: "LeBron James", year: "2012" },
              { name: "Rookie", player: "Wembanyama", year: "2023" },
              { name: "Pikachu", set: "Base Set", grade: "PSA 9" },
              { name: "Prizm Silver", player: "Luka Doncic", year: "2018" },
            ].map((s, i) => (
              <button key={i} onClick={() => { setForm({ ...form, ...s }); setSearched(false); }} style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(29,78,216,0.1)", color: "#1d4ed8", fontSize: "0.72rem", fontWeight: "700", border: "1px solid rgba(29,78,216,0.2)", cursor: "pointer", fontFamily: "inherit" }}>
                {[s.player, s.name, s.year, s.grade].filter(Boolean).join(" · ")}
              </button>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ─── FLIP FINDER ───────────────────────────────────────────────────
function FlipFinder() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a card flipping expert. Respond ONLY in JSON:
{"card":"full name","category":"pokemon|sports|magic|yugioh|other","buyLow":number,"buyHigh":number,"sellLow":number,"sellHigh":number,"profitEstimate":number,"difficulty":"easy|medium|hard","hotRightNow":boolean,"whereToFind":["place1","place2"],"whereToSell":["platform1","platform2"],"reason":"2 sentences why this is or isn't a good flip","warning":"one risk under 15 words or null","similarFlips":["card1","card2"]}`,
          messages: [{ role: "user", content: `Is "${query}" a good card to flip right now? Give me the full flip analysis.` }]
        })
      });
      const data = await res.json();
      setResult(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch {
      setResult({ card: query, buyLow: 0, buyHigh: 0, sellLow: 0, sellHigh: 0, profitEstimate: 0, difficulty: "medium", hotRightNow: false, whereToFind: ["eBay", "Local card shop"], whereToSell: ["eBay", "TCGplayer"], reason: "Could not load analysis. Check eBay sold listings manually.", warning: null, similarFlips: [] });
    }
    setLoading(false);
  };

  const POPULAR = ["Charizard ex", "Wembanyama Rookie", "Black Lotus", "Luka Doncic Prizm", "Pikachu VMAX", "Patrick Mahomes Prizm"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div style={{ fontSize: "0.75rem", color: "#444", marginBottom: "8px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px" }}>Type any card name to find out if it's worth flipping for profit</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="e.g. Charizard Base Set, LeBron Rookie..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e30", borderRadius: "10px", color: "#e2e2ee", padding: "12px 16px", fontFamily: "inherit", fontSize: "0.9rem" }} />
          <button onClick={analyze} disabled={loading} style={{ padding: "12px 24px", borderRadius: "10px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.875rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {loading ? "Analyzing..." : "Analyze →"}
          </button>
        </div>
      </div>

      {!result && (
        <div>
          <div style={{ fontSize: "0.65rem", color: "#333", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", fontFamily: "'Barlow Condensed', sans-serif" }}>Popular searches</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {POPULAR.map(s => (
              <button key={s} onClick={() => setQuery(s)} style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(29,78,216,0.1)", color: "#1d4ed8", fontSize: "0.75rem", fontWeight: "700", border: "1px solid rgba(29,78,216,0.2)", cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div style={{ background: "#12121e", borderRadius: "14px", border: "1px solid #1e1e30", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a28", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1rem", color: "#e2e2ee" }}>{result.card}</div>
              <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>{CAT_LABELS[result.category] || result.category}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {result.hotRightNow && <span style={{ fontSize: "0.65rem", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", background: "rgba(255,92,92,0.15)", color: "#FF5C5C", letterSpacing: "1px", fontFamily: "'Barlow Condensed', sans-serif" }}>🔥 HOT</span>}
              <span style={{ fontSize: "0.65rem", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", letterSpacing: "1px", fontFamily: "'Barlow Condensed', sans-serif", background: result.difficulty === "easy" ? "rgba(0,200,150,0.15)" : result.difficulty === "medium" ? "rgba(255,184,0,0.15)" : "rgba(255,92,92,0.15)", color: result.difficulty === "easy" ? "#00C896" : result.difficulty === "medium" ? "#FFB800" : "#FF5C5C" }}>{result.difficulty?.toUpperCase()} FLIP</span>
            </div>
          </div>

          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "Buy Range", value: `${fmt(result.buyLow)} – ${fmt(result.buyHigh)}` },
                { label: "Sell Range", value: `${fmt(result.sellLow)} – ${fmt(result.sellHigh)}` },
                { label: "Est. Profit", value: fmt(result.profitEstimate), color: result.profitEstimate >= 0 ? "#00C896" : "#FF5C5C" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "0.6rem", color: "#444", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", fontFamily: "'Barlow Condensed', sans-serif" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", fontWeight: "700", color: s.color || "#e2e2ee" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: "0.82rem", color: "#aaa", lineHeight: 1.6, marginBottom: "14px" }}>{result.reason}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              {[
                { label: "Where to find it", items: result.whereToFind },
                { label: "Where to sell it", items: result.whereToSell },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif" }}>{s.label}</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {s.items?.map((p, j) => <span key={j} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid #2a2a3e" }}>{p}</span>)}
                  </div>
                </div>
              ))}
            </div>

            {result.warning && (
              <div style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.75rem", color: "#FFB800" }}>
                ⚠️ {result.warning}
              </div>
            )}

            {result.similarFlips?.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif" }}>Similar cards worth flipping</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {result.similarFlips.map((c, i) => (
                    <button key={i} onClick={() => { setQuery(c); setResult(null); }} style={{ fontSize: "0.72rem", padding: "4px 12px", borderRadius: "20px", background: "rgba(29,78,216,0.1)", color: "#1d4ed8", border: "1px solid rgba(29,78,216,0.2)", cursor: "pointer", fontFamily: "inherit" }}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            <AffiliateLinks name={result.card} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WANT LIST ─────────────────────────────────────────────────────
function WantList({ wantList, setWantList }) {
  const [form, setForm] = useState({ name: "", targetPrice: "", category: "sports", priority: "medium" });
  const [showAdd, setShowAdd] = useState(false);

  const add = () => {
    if (!form.name) return;
    setWantList([{ id: Date.now(), ...form, targetPrice: parseFloat(form.targetPrice) || 0 }, ...wantList]);
    setForm({ name: "", targetPrice: "", category: "sports", priority: "medium" });
    setShowAdd(false);
  };

  const priorityColors = { high: "#FF5C5C", medium: "#FFB800", low: "#00C896" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.75rem", color: "#444", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px" }}>Cards you're hunting — get notified when prices drop</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
      </div>

      {showAdd && (
        <div style={{ background: "#12121e", borderRadius: "12px", border: "1px solid #1d4ed833", padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Card Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wembanyama Prizm Rookie" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Target Price ($)</label>
              <input type="number" value={form.targetPrice} onChange={e => setForm({ ...form, targetPrice: e.target.value })} placeholder="0.00" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={add} style={{ padding: "8px 20px", borderRadius: "8px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>Add to Want List</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", color: "#888", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {wantList.map(item => (
          <div key={item.id} style={{ background: "#12121e", borderRadius: "10px", border: "1px solid #1e1e30", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: priorityColors[item.priority], flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.875rem", color: "#e2e2ee" }}>{item.name}</div>
                <div style={{ fontSize: "0.7rem", color: "#555", fontFamily: "'Barlow Condensed', sans-serif" }}>{CAT_LABELS[item.category]} · Target: {item.targetPrice > 0 ? fmt(item.targetPrice) : "Any price"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <a href={affiliate.ebay(item.name)} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(229,50,56,0.1)", color: "#E53238", border: "1px solid rgba(229,50,56,0.2)", textDecoration: "none", fontWeight: "700", fontFamily: "'Barlow Condensed', sans-serif" }}>Find on eBay ↗</a>
              <button onClick={() => setWantList(wantList.filter(w => w.id !== item.id))} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "1rem", padding: "0 4px" }}>×</button>
            </div>
          </div>
        ))}
        {wantList.length === 0 && <div style={{ textAlign: "center", padding: "30px", color: "#333", fontSize: "0.875rem" }}>No cards on your want list yet.</div>}
      </div>
    </div>
  );
}

// ─── SOLD TRACKER ──────────────────────────────────────────────────
function SoldTracker({ sold, setSold }) {
  const [form, setForm] = useState({ name: "", buyPrice: "", sellPrice: "", platform: "eBay", date: new Date().toISOString().split("T")[0] });
  const [showAdd, setShowAdd] = useState(false);

  const add = () => {
    if (!form.name || !form.buyPrice || !form.sellPrice) return;
    setSold([{ id: Date.now(), ...form, buyPrice: parseFloat(form.buyPrice), sellPrice: parseFloat(form.sellPrice) }, ...sold]);
    setForm({ name: "", buyPrice: "", sellPrice: "", platform: "eBay", date: new Date().toISOString().split("T")[0] });
    setShowAdd(false);
  };

  const totalProfit = sold.reduce((s, c) => s + (c.sellPrice - c.buyPrice), 0);
  const totalSales = sold.reduce((s, c) => s + c.sellPrice, 0);
  const winRate = sold.length > 0 ? (sold.filter(c => c.sellPrice > c.buyPrice).length / sold.length * 100).toFixed(0) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <StatCard label="Total Profit" value={fmt(totalProfit)} sub={`${sold.length} flips`} color={totalProfit >= 0 ? "#00C896" : "#FF5C5C"} />
        <StatCard label="Total Sales" value={fmt(totalSales)} sub="gross revenue" />
        <StatCard label="Win Rate" value={winRate + "%"} sub="profitable flips" color="#1d4ed8" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.75rem", color: "#444", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px" }}>Every card you've sold and the profit you made</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>+ Log Sale</button>
      </div>

      {showAdd && (
        <div style={{ background: "#12121e", borderRadius: "12px", border: "1px solid #1d4ed833", padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Card Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Card you sold" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
            {[
              { key: "buyPrice", label: "What You Paid ($) *" },
              { key: "sellPrice", label: "What You Sold For ($) *" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>{f.label}</label>
                <input type="number" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder="0.00" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Platform</label>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }}>
                {["eBay", "TCGplayer", "StockX", "GOAT", "Facebook", "Local"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "#555", display: "block", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Date Sold</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", borderRadius: "8px", color: "#e2e2ee", padding: "8px 12px", fontFamily: "inherit", fontSize: "0.8rem" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={add} style={{ padding: "8px 20px", borderRadius: "8px", background: "#1d4ed8", border: "none", color: "white", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>Log Sale</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3e", color: "#888", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {sold.map(item => {
          const profit = item.sellPrice - item.buyPrice;
          const pct = item.buyPrice > 0 ? ((profit / item.buyPrice) * 100).toFixed(0) : 0;
          return (
            <div key={item.id} style={{ background: "#12121e", borderRadius: "10px", border: "1px solid #1e1e30", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.875rem", color: "#e2e2ee" }}>{item.name}</div>
                <div style={{ fontSize: "0.7rem", color: "#555", fontFamily: "'Barlow Condensed', sans-serif", marginTop: "2px" }}>{item.platform} · {item.date} · Paid {fmt(item.buyPrice)} → Sold {fmt(item.sellPrice)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.9rem", color: profit >= 0 ? "#00C896" : "#FF5C5C", fontWeight: "700" }}>{profit >= 0 ? "+" : ""}{fmt(profit)}</div>
                <div style={{ fontSize: "0.7rem", color: "#555", fontFamily: "'Space Mono', monospace" }}>{pct}% {profit >= 0 ? "gain" : "loss"}</div>
              </div>
            </div>
          );
        })}
        {sold.length === 0 && <div style={{ textAlign: "center", padding: "30px", color: "#333", fontSize: "0.875rem" }}>No sales logged yet. Start flipping!</div>}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function TheSlabPulls() {
  const [tab, setTab] = useState("collection");
  const [collection, setCollection] = useState(SEED_COLLECTION);
  const [sold, setSold] = useState(SEED_SOLD);
  const [wantList, setWantList] = useState(SEED_WANTLIST);

  const TABS = [
    { id: "collection", label: "My Collection", icon: "🃏" },
    { id: "search", label: "Card Search", icon: "🔎" },
    { id: "flip", label: "Flip Finder", icon: "💡" },
    { id: "want", label: "Want List", icon: "⭐" },
    { id: "sold", label: "Sold / Profits", icon: "💸" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", color: "#e2e2ee", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&family=Black+Ops+One&family=Barlow+Condensed:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #1e1e30; }
        input, select { outline: none; } input:focus, select:focus { border-color: rgba(29,78,216,0.5) !important; }
        a:hover { opacity: 0.8; }
        button:active { transform: scale(0.98); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a28", padding: "14px 20px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Black Ops One', sans-serif", fontSize: "clamp(1rem, 3vw, 1.4rem)", letterSpacing: "2px", color: "white" }}>
              THE SLAB <span style={{ color: "#1d4ed8" }}>PULLS</span>
            </div>
            <div style={{ fontSize: "0.6rem", color: "#333", letterSpacing: "3px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>Cards · Sneakers · Sports · Gaming</div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 14px", borderRadius: "8px", background: tab === t.id ? "#1d4ed8" : "rgba(255,255,255,0.05)", color: tab === t.id ? "white" : "#666", fontSize: "0.75rem", fontWeight: "700", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        {tab === "collection" && <CollectionView collection={collection} setCollection={setCollection} />}
        {tab === "search" && <CardSearch />}
        {tab === "flip" && <FlipFinder />}
        {tab === "want" && <WantList wantList={wantList} setWantList={setWantList} />}
        {tab === "sold" && <SoldTracker sold={sold} setSold={setSold} />}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1a1a28", padding: "16px 20px", textAlign: "center", marginTop: "40px" }}>
        <div style={{ fontSize: "0.7rem", color: "#333", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "2px" }}>
          THE SLAB PULLS · @TheSlabPulls · Cards · Sneakers · Sports · Gaming
        </div>
      </div>
    </div>
  );
}
