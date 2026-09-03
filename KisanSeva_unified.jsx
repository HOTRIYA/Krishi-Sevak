import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Bell, ChevronDown, MapPin, TrendingUp, AlertTriangle, CheckCircle2,
  Users, Activity, FileText, Search, X, ArrowRight, Send, Clock,
  BarChart3, Plus, Download, RefreshCw, Wifi, WifiOff, Stethoscope,
  Megaphone, ChevronRight, ChevronLeft, Layers, ShieldAlert, Phone,
  FlaskConical, Edit3, Copy, PhoneOff, Radio, Mic, Cpu, MessageSquare,
  Sliders, ClipboardList, Settings as SettingsIcon, LogOut, Server,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* ============================================================
   Kisan Seva — unified prototype
   One shared design system, one shared dataset (cases, alerts,
   movements, experts), one login, and a role switcher across
   Farmer / Call Console / Authority / Expert / Surveillance /
   Admin. Actions in one role are reflected when you switch —
   e.g. accept a case as the Expert, then look at it on the
   Authority dashboard.
   ============================================================ */

const COLOR = {
  bg: "#FAF7EF", surface: "#FFFFFF", surfaceSunken: "#F3EFE4",
  border: "#E3DDCC", borderStrong: "#CFC6AC",
  text: "#20241F", textSecondary: "#5B5F53", textMuted: "#8A8C7E",
  forest: "#1E4837", forestDeep: "#12301F", forestTint: "#E7EFE6",
  clay: "#8A5A34", clayTint: "#F3E7DA",
  blue: "#2A5F8F", blueTint: "#E5EEF6",
  amber: "#B4791A", amberTint: "#FBF0DC",
  orange: "#B4551F", orangeTint: "#F8E7DA",
  red: "#A3352B", redTint: "#F7E2DF",
  green: "#3C7A47", greenTint: "#E6F0E5",
};

const RISK = {
  LOW: { label: "Low", fg: COLOR.green, bg: COLOR.greenTint },
  MEDIUM: { label: "Medium", fg: COLOR.amber, bg: COLOR.amberTint },
  HIGH: { label: "High", fg: COLOR.orange, bg: COLOR.orangeTint },
  CRITICAL: { label: "Critical", fg: COLOR.red, bg: COLOR.redTint },
};
const CASE_STATUS = {
  NEW: { label: "New", fg: COLOR.blue, bg: COLOR.blueTint },
  ASSIGNED: { label: "Assigned", fg: COLOR.blue, bg: COLOR.blueTint },
  IN_PROGRESS: { label: "In progress", fg: COLOR.amber, bg: COLOR.amberTint },
  CALLBACK_REQUIRED: { label: "Callback required", fg: COLOR.orange, bg: COLOR.orangeTint },
  REFERRED_TO_LAB: { label: "Referred to lab", fg: COLOR.clay, bg: COLOR.clayTint },
  RESOLVED: { label: "Resolved", fg: COLOR.green, bg: COLOR.greenTint },
  CLOSED: { label: "Closed", fg: COLOR.textMuted, bg: COLOR.surfaceSunken },
};
const PATTERN = {
  NORMAL: { label: "Normal", fg: COLOR.green, bg: COLOR.greenTint },
  WATCH: { label: "Watch", fg: COLOR.textSecondary, bg: COLOR.surfaceSunken },
  POTENTIAL_CLUSTER: { label: "Potential cluster", fg: COLOR.red, bg: COLOR.redTint },
  UNDER_REVIEW: { label: "Under review", fg: COLOR.amber, bg: COLOR.amberTint },
  VERIFIED: { label: "Verified", fg: COLOR.blue, bg: COLOR.blueTint },
  DISMISSED: { label: "Dismissed", fg: COLOR.textMuted, bg: COLOR.surfaceSunken },
};
const SOURCE_TONE = {
  "Farmer reported": { fg: COLOR.forest, bg: COLOR.forestTint },
  "AI extracted": { fg: COLOR.blue, bg: COLOR.blueTint },
  "Expert entered": { fg: COLOR.forestDeep, bg: COLOR.forestTint },
  "Lab verified": { fg: COLOR.green, bg: COLOR.greenTint },
};

/* ---------------- Shared primitives ---------------- */

function Badge({ fg, bg, dot, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, color: fg, background: bg, whiteSpace: "nowrap" }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: fg }} />}
      {children}
    </span>
  );
}
const RiskBadge = ({ level }) => { const r = RISK[level] || RISK.LOW; return <Badge fg={r.fg} bg={r.bg} dot>{r.label}</Badge>; };
const StatusBadge = ({ status }) => { const s = CASE_STATUS[status] || CASE_STATUS.NEW; return <Badge fg={s.fg} bg={s.bg}>{s.label}</Badge>; };
const PatternBadge = ({ status }) => { const s = PATTERN[status] || PATTERN.WATCH; return <Badge fg={s.fg} bg={s.bg} dot>{s.label}</Badge>; };
const SourceTag = ({ source }) => { const t = SOURCE_TONE[source] || SOURCE_TONE["Expert entered"]; return <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5, color: t.fg, background: t.bg, whiteSpace: "nowrap" }}>{source}</span>; };

function Card({ title, right, children, pad = 18, innerRef }) {
  return (
    <div ref={innerRef} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: pad, marginBottom: 14 }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
          <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: COLOR.text }}>{title}</h3>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "secondary", small, disabled, icon: Icon }) {
  const styles = {
    primary: { background: COLOR.forest, color: "#fff", border: `1px solid ${COLOR.forest}` },
    secondary: { background: COLOR.surface, color: COLOR.forest, border: `1px solid ${COLOR.borderStrong}` },
    ghost: { background: "transparent", color: COLOR.textSecondary, border: "1px solid transparent" },
    danger: { background: COLOR.surface, color: COLOR.red, border: `1px solid ${COLOR.red}55` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "6px 12px" : "9px 16px", borderRadius: 7, fontSize: small ? 12.5 : 13.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap" }}>
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </button>
  );
}

function Field({ label, value }) {
  return <div><div style={{ fontSize: 11, color: COLOR.textMuted }}>{label}</div><div style={{ fontSize: 14, fontWeight: 600, color: COLOR.text, marginTop: 2 }}>{value}</div></div>;
}
function EmptyState({ title, body }) {
  return (
    <div style={{ textAlign: "center", padding: "26px 10px", color: COLOR.textSecondary }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{body}</div>
    </div>
  );
}
function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(18,20,16,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={onClose}>
      <div style={{ background: COLOR.surface, borderRadius: 14, width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", padding: 26 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16.5, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLOR.textMuted }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function StatusDot({ status }) {
  const c = status === "Operational" ? COLOR.green : status === "Degraded" ? COLOR.amber : COLOR.red;
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }} />;
}
function BarList({ items, color = COLOR.forest, showPct, total }) {
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
            <span style={{ color: COLOR.text }}>{item.label}</span>
            <span style={{ color: COLOR.textSecondary, fontWeight: 600 }}>{item.count}{showPct && total ? ` (${((item.count / total) * 100).toFixed(1)}%)` : ""}</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: COLOR.surfaceSunken, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(item.count / max) * 100}%`, background: color, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function CustomTrendTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 3, color: COLOR.text }}>{d.date || d.d}</div>
      <div style={{ color: COLOR.text }}>{d.all || d.v} reports</div>
      {d.animal !== undefined && <div style={{ color: COLOR.textSecondary }}>{d.animal} animal · {d.crop} crop</div>}
    </div>
  );
}
function GlobalToast({ msg }) {
  if (!msg) return null;
  return <div style={{ position: "fixed", bottom: 20, right: 20, background: COLOR.forestDeep, color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 300, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>✓ {msg}</div>;
}

/* ---------------- Shared map data ---------------- */

const VILLAGES = [
  { name: "Chomu", x: 250, y: 62, r: 5, kind: "NORMAL" },
  { name: "Amer", x: 430, y: 84, r: 6, kind: "HIGH" },
  { name: "Phulera", x: 132, y: 168, r: 7, kind: "CLUSTER" },
  { name: "Bagru", x: 178, y: 300, r: 6, kind: "ELEVATED" },
  { name: "Sanganer", x: 352, y: 268, r: 10, kind: "CLUSTER" },
  { name: "Village A", x: 402, y: 224, r: 3.5, kind: "SATELLITE" },
  { name: "Village B", x: 456, y: 286, r: 3.5, kind: "SATELLITE" },
];
const VILLAGE_COLOR = { NORMAL: COLOR.textMuted, ELEVATED: COLOR.amber, HIGH: COLOR.orange, CLUSTER: COLOR.red, SATELLITE: COLOR.forest };

const SHARED_MAP_CENTER = [26.91, 75.64];
const SHARED_MAP_COORDS = {
  Chomu: [27.17, 75.72], Amer: [26.985, 75.85], Phulera: [26.87, 75.24],
  Bagru: [26.82, 75.55], Sanganer: [26.82, 75.77],
  "Village A": [26.84, 75.72], "Village B": [26.80, 75.84],
};
const SHARED_MAP_ZONES = [
  { name: "Sanganer high-risk zone", center: [26.82, 75.77], radius: 42, color: "#C83F35", type: "High reporting" },
  { name: "Phulera high-risk zone", center: [26.87, 75.24], radius: 34, color: "#C83F35", type: "High reporting" },
  { name: "Bagru medium-risk zone", center: [26.82, 75.55], radius: 31, color: "#D39A24", type: "Medium reporting" },
  { name: "Amer medium-risk zone", center: [26.985, 75.85], radius: 28, color: "#D39A24", type: "Medium reporting" },
  { name: "Chomu medium-risk zone", center: [27.17, 75.72], radius: 30, color: "#D39A24", type: "Medium reporting" },
  { name: "Kalwar crop reporting area", center: [27.07, 75.67], radius: 25, color: "#3279B4", type: "Crop-related reports" },
  { name: "Kukas crop reporting area", center: [27.03, 75.90], radius: 27, color: "#3279B4", type: "Crop-related reports" },
  { name: "Dudu crop reporting area", center: [26.73, 75.57], radius: 24, color: "#3279B4", type: "Crop-related reports" },
];

function SharedMapViewport({ selected }) {
  const map = useMap();
  useEffect(() => {
    const selectedCoords = SHARED_MAP_COORDS[selected];
    if (selectedCoords) map.flyTo(selectedCoords, 12, { duration: 0.6 });
  }, [map, selected]);
  return null;
}

function InteractiveMap({ height = 340, highlight, onSelectCluster }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 10 }}>
      <MapContainer center={SHARED_MAP_CENTER} zoom={10} scrollWheelZoom style={{ width: "100%", height }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <SharedMapViewport selected={highlight} />
        {SHARED_MAP_ZONES.map((zone) => <CircleMarker key={zone.name} center={zone.center} radius={zone.radius} pathOptions={{ color: zone.color, weight: 1.5, fillColor: zone.color, fillOpacity: 0.2 }}><Popup><strong>{zone.name}</strong><br />{zone.type}<br />Aggregated map area</Popup></CircleMarker>)}
        {VILLAGES.filter((v) => v.kind !== "SATELLITE").map((v) => <CircleMarker key={v.name} center={SHARED_MAP_COORDS[v.name]} radius={v.name === highlight ? 11 : v.kind === "CLUSTER" ? 9 : 7} pathOptions={{ color: "#fff", weight: 2, fillColor: VILLAGE_COLOR[v.kind], fillOpacity: 0.95 }} eventHandlers={{ click: () => v.kind === "CLUSTER" && onSelectCluster && onSelectCluster(v) }}><Popup><strong>{v.name}</strong><br />Area-level reporting data</Popup></CircleMarker>)}
      </MapContainer>
      <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 1000, background: "rgba(255,255,255,0.94)", border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 11.5, lineHeight: 1.5, color: COLOR.text }}>
        {["#C83F35|High reporting", "#D39A24|Medium reporting", "#3279B4|Crop-related reports"].map((item) => { const [color, label] = item.split("|"); return <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: color, opacity: 0.75 }} />{label}</div>; })}
      </div>
    </div>
  );
}

function MiniMap({ highlight }) {
  const villageA = VILLAGES.find((v) => v.name === "Village A");
  const villageB = VILLAGES.find((v) => v.name === "Village B");
  return <InteractiveMap height={300} highlight={highlight} />;
  return (
    <svg viewBox="0 0 640 340" style={{ width: "100%", height: "auto", display: "block", borderRadius: 10, background: COLOR.surfaceSunken }}>
      <path d="M 60 30 C 200 -2, 480 0, 580 56 C 622 128, 608 248, 556 306 C 452 348, 196 346, 92 304 C 30 244, 22 108, 60 30 Z" fill={COLOR.forestTint} opacity="0.4" stroke={COLOR.forest} strokeOpacity="0.25" strokeWidth="1.5" />
      <defs><marker id="uarrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill={COLOR.forest} /></marker></defs>
      <line x1={villageA.x} y1={villageA.y} x2={villageB.x} y2={villageB.y} stroke={COLOR.forest} strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#uarrow)" opacity="0.7" />
      {VILLAGES.filter((v) => v.kind !== "SATELLITE").map((v) => (
        <g key={v.name}>
          {v.name === highlight && <circle cx={v.x} cy={v.y} r={v.r + 8} fill="none" stroke={COLOR.red} strokeWidth="1.5" opacity="0.4" />}
          <circle cx={v.x} cy={v.y} r={v.r} fill={VILLAGE_COLOR[v.kind]} stroke="#fff" strokeWidth="2" />
          <text x={v.x} y={v.y - v.r - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLOR.text}>{v.name}</text>
        </g>
      ))}
      {[villageA, villageB].map((v) => <circle key={v.name} cx={v.x} cy={v.y} r={v.r} fill={COLOR.surface} stroke={COLOR.forest} strokeWidth="1.5" />)}
    </svg>
  );
}

function SurveillanceMap({ onSelectCluster }) {
  const villageA = VILLAGES.find((v) => v.name === "Village A");
  const villageB = VILLAGES.find((v) => v.name === "Village B");
  return <InteractiveMap height={330} onSelectCluster={onSelectCluster} />;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 640 360" style={{ width: "100%", height: "auto", display: "block", borderRadius: 10, background: COLOR.surfaceSunken }}>
        <path d="M 60 40 C 200 6, 480 8, 580 66 C 622 138, 608 258, 556 316 C 452 358, 196 356, 92 314 C 30 254, 22 118, 60 40 Z" fill={COLOR.forestTint} opacity="0.4" stroke={COLOR.forest} strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M20,110 Q320,80 620,120" stroke={COLOR.border} strokeWidth="1" fill="none" />
        <path d="M15,220 Q320,195 625,230" stroke={COLOR.border} strokeWidth="1" fill="none" />
        <defs><marker id="sarrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill={COLOR.forest} /></marker></defs>
        <line x1={villageA.x} y1={villageA.y} x2={villageB.x} y2={villageB.y} stroke={COLOR.forest} strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#sarrow)" opacity="0.75" />
        {VILLAGES.filter((v) => v.kind !== "SATELLITE").map((v) => (
          <g key={v.name} onClick={() => v.kind === "CLUSTER" && onSelectCluster && onSelectCluster(v)} style={{ cursor: v.kind === "CLUSTER" ? "pointer" : "default" }}>
            {v.kind === "CLUSTER" && <circle cx={v.x} cy={v.y} r={18} fill="none" stroke={COLOR.red} strokeWidth="1.5" opacity="0.35" />}
            <circle cx={v.x} cy={v.y} r={v.r} fill={VILLAGE_COLOR[v.kind]} stroke="#fff" strokeWidth="2" />
            <text x={v.x} y={v.y - v.r - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLOR.text}>{v.name}</text>
          </g>
        ))}
        {[villageA, villageB].map((v) => <circle key={v.name} cx={v.x} cy={v.y} r={v.r} fill={COLOR.surface} stroke={COLOR.forest} strokeWidth="1.5" />)}
      </svg>
      <div style={{ position: "absolute", left: 12, bottom: 12, background: "rgba(255,255,255,0.92)", border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 11.5, display: "flex", flexDirection: "column", gap: 4 }}>
        {[["Normal reports", COLOR.textMuted], ["Elevated reports", COLOR.amber], ["High-risk reports", COLOR.orange], ["Potential cluster", COLOR.red]].map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, color: COLOR.text }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} /> {label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLOR.text }}><ArrowRight size={11} color={COLOR.forest} /> Reported livestock movement</div>
      </div>
    </div>
  );
}

/* ============================================================
   SHARED DATA — one canonical dataset every role reads from
   ============================================================ */

const EXPERTS_DIR = [
  { name: "Dr. Sharma", role: "Veterinary Officer", specialization: "Livestock (Cattle & Buffalo)", district: "Jaipur", area: "Sanganer", phone: "•••• 2210", languages: ["Hindi", "English"], availability: "AVAILABLE", cases: 8, response: "12 min" },
  { name: "Dr. Khan", role: "Veterinary Officer", specialization: "Livestock", district: "Jaipur", area: "Bagru", phone: "•••• 6630", languages: ["Hindi", "English"], availability: "BUSY", cases: 6, response: "18 min" },
  { name: "Dr. Meena", role: "Veterinary Officer", specialization: "Livestock", district: "Jaipur", area: "Chomu", phone: "•••• 4471", languages: ["Hindi"], availability: "AVAILABLE", cases: 5, response: "9 min" },
  { name: "Dr. Verma", role: "Veterinary Officer", specialization: "Livestock", district: "Jaipur", area: "Amer", phone: "•••• 8823", languages: ["Hindi", "English"], availability: "OFFLINE", cases: 0, response: "—" },
];

const INITIAL_CASES = [
  {
    id: "PS-10482", source: "IVR", callState: "expert_connected", bucket: "active", status: "IN_PROGRESS", risk: "HIGH", autoAssigned: false,
    farmer: "Ramesh Choudhary", phone: "•••• 7231", animal: "Cow", affected: 1, duration: "2 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "31 Aug, 10:42 AM", expert: "Dr. Sharma",
    aiSummary: "Farmer reports a cow with reduced appetite and lethargy for approximately 2 days. The animal is reportedly drinking water normally. No mortality has been reported.",
    structured: { animal: { value: "Cow", source: "Farmer reported" }, symptoms: { value: "Reduced appetite, Lethargy", source: "AI extracted" }, duration: { value: "2 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Reduced appetite", "Lethargy", "Duration > 48 hours"],
    transcript: [
      { speaker: "ai", text: "Namaste. Please tell us what problem your animal is facing." },
      { speaker: "farmer", text: "Meri gai do din se kuch nahi kha rahi." },
      { speaker: "ai", text: "Kya gai paani pee rahi hai?" },
      { speaker: "farmer", text: "Haan, paani pee rahi hai." },
      { speaker: "ai", text: "Kya gai ko haal hi mein kahin bheja gaya hai?" },
      { speaker: "farmer", text: "Haan, use Gaon A se Gaon B bheja tha." },
    ], transcriptEdited: false,
    movement: { reported: true, previous: "Village A", current: "Village B", date: "30 Aug", source: "Farmer reported", connection: "3 similar reports recorded in the destination area" },
    cluster: { block: "Sanganer", relatedReports: 7, status: "UNDER_REVIEW" },
    history: [
      { time: "10:42", label: "Farmer reported case" }, { time: "10:43", label: "AI transcription completed" },
      { time: "10:44", label: "Case summary generated" }, { time: "10:45", label: "Risk assessed: HIGH" },
      { time: "10:46", label: "Assigned to Dr. Sharma" }, { time: "10:47", label: "Farmer contacted" },
    ],
    labReferral: null, expertAssessment: null, callback: null, resolution: null,
  },
  {
    id: "PS-10478", source: "IVR", callState: null, bucket: "active", status: "IN_PROGRESS", risk: "MEDIUM", autoAssigned: false,
    farmer: "Suresh Yadav", phone: "•••• 5502", animal: "Poultry", affected: 6, duration: "3 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "30 Aug, 3:15 PM", expert: "Dr. Sharma",
    aiSummary: "Farmer reports six poultry birds with respiratory signs for approximately 3 days.",
    structured: { animal: { value: "Poultry", source: "Farmer reported" }, symptoms: { value: "Respiratory signs", source: "AI extracted" }, duration: { value: "3 days", source: "Farmer reported" }, water: { value: "Reduced", source: "AI extracted" }, affected: { value: "6", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Respiratory signs", "Multiple animals affected"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Murgiyon ko saans lene mein thodi takleef hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "3:15", label: "Farmer reported case" }, { time: "3:17", label: "Risk assessed: MEDIUM" }, { time: "3:18", label: "Assigned to Dr. Sharma" }],
    labReferral: null, expertAssessment: null, callback: null, resolution: null,
  },
  {
    id: "PS-10483", source: "IVR", callState: "waiting_for_expert", bucket: "incoming", status: "NEW", risk: "CRITICAL", autoAssigned: false,
    farmer: "Caller (unverified)", phone: "Unknown", animal: "Buffalo", affected: 1, duration: "1 day",
    location: "Bagru", pin: "303007", district: "Jaipur", reportedAt: "Today, 5 min ago", expert: null,
    aiSummary: "Farmer reports a buffalo with high fever and breathing difficulty since yesterday.",
    structured: { animal: { value: "Buffalo", source: "AI extracted" }, symptoms: { value: "Fever, Breathing difficulty", source: "AI extracted" }, duration: { value: "1 day", source: "Farmer reported" }, water: { value: "Not yet asked", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Fever", "Breathing difficulty", "Rapid onset"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bhains ko bahut tez bukhar hai aur saans lene mein takleef ho rahi hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "Just now", label: "Farmer called" }, { time: "Just now", label: "Risk assessed: CRITICAL" }],
    labReferral: null, expertAssessment: null, callback: null, resolution: null,
  },
  {
    id: "PS-10484", source: "IVR", callState: "ai_collecting", bucket: "incoming", status: "NEW", risk: "MEDIUM", autoAssigned: false,
    farmer: "Sunita Devi", phone: "•••• 4410", animal: "Goat", affected: 1, duration: "3 days",
    location: "Chomu", pin: "303702", district: "Jaipur", reportedAt: "Today, 18 min ago", expert: null,
    aiSummary: "Farmer reports a goat with difficulty walking for approximately 3 days.",
    structured: { animal: { value: "Goat", source: "AI extracted" }, symptoms: { value: "Difficulty walking", source: "AI extracted" }, duration: { value: "3 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Single mild symptom"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bakri thodi langdi kar rahi hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "Today", label: "Farmer called" }, { time: "Today", label: "Risk assessed: MEDIUM" }],
    labReferral: null, expertAssessment: null, callback: null, resolution: null,
  },
  {
    id: "PS-10486", source: "IVR", callState: null, bucket: "incoming", status: "ASSIGNED", risk: "LOW", autoAssigned: true,
    farmer: "Mohan Lal", phone: "•••• 9081", animal: "Poultry", affected: 5, duration: "Today",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "Today, 41 min ago", expert: "Dr. Sharma",
    aiSummary: "Farmer reports mild lethargy among 5 poultry birds, first noticed today.",
    structured: { animal: { value: "Poultry", source: "AI extracted" }, symptoms: { value: "Mild lethargy", source: "AI extracted" }, duration: { value: "Today", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "5", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Single mild symptom", "Short duration"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Kuch murgiyan thodi sust lag rahi hain." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "Today", label: "Farmer called" }, { time: "Today", label: "Risk assessed: LOW" }, { time: "Today", label: "Auto-assigned to Dr. Sharma (nearest available)" }],
    labReferral: null, expertAssessment: null, callback: null, resolution: null,
  },
  {
    id: "PS-10487", source: "IVR", callState: null, bucket: "callback", status: "CALLBACK_REQUIRED", risk: "MEDIUM", autoAssigned: false,
    farmer: "Kamla Bai", phone: "•••• 3390", animal: "Goat", affected: 2, duration: "2 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "31 Aug, 11:05 AM", expert: "Dr. Sharma",
    aiSummary: "Farmer reports two goats with reduced appetite. Requested a callback at a more convenient time.",
    structured: { animal: { value: "Goat", source: "Farmer reported" }, symptoms: { value: "Reduced appetite", source: "AI extracted" }, duration: { value: "2 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "2", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Reduced appetite", "Multiple animals affected"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bakriyan kam khana kha rahi hain." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "11:05", label: "Farmer reported case" }, { time: "11:20", label: "Callback requested by farmer" }],
    labReferral: null, expertAssessment: null, callback: { requestedAt: "11:20 AM", preferred: "As soon as possible" }, resolution: null,
  },
  {
    id: "PS-10465", source: "IVR", callState: null, bucket: "lab", status: "REFERRED_TO_LAB", risk: "MEDIUM", autoAssigned: false,
    farmer: "Devi Lal", phone: "•••• 6621", animal: "Cow", affected: 1, duration: "5 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "29 Aug, 9:10 AM", expert: "Dr. Sharma",
    aiSummary: "Farmer reports a cow with persistent fever and reduced appetite for 5 days.",
    structured: { animal: { value: "Cow", source: "Farmer reported" }, symptoms: { value: "Fever, Reduced appetite", source: "AI extracted" }, duration: { value: "5 days", source: "Farmer reported" }, water: { value: "Reduced", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Persistent fever", "Duration > 4 days"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Gai ko lagataar bukhar hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "29 Aug", label: "Farmer reported case" }, { time: "29 Aug", label: "Expert contacted farmer" }, { time: "29 Aug", label: "Referred to lab" }],
    labReferral: { reason: "Suspected infectious condition", sample: "Blood", lab: "Jaipur Veterinary Diagnostic Centre", collectedAt: "29 Aug", stage: "RESULT_PENDING" },
    expertAssessment: { observations: "Elevated temperature on farmer description, appetite reduced 5 days.", assessment: "Requires laboratory confirmation before further treatment guidance.", action: "Blood sample referred to Jaipur Veterinary Diagnostic Centre.", savedAt: "29 Aug, 9:40 AM" },
    callback: null, resolution: null,
  },
  {
    id: "PS-10460", source: "IVR", callState: null, bucket: "lab", status: "REFERRED_TO_LAB", risk: "MEDIUM", autoAssigned: false,
    farmer: "Ganga Ram", phone: "•••• 1187", animal: "Buffalo", affected: 1, duration: "6 days",
    location: "Bagru", pin: "303007", district: "Jaipur", reportedAt: "25 Aug, 10:00 AM", expert: "Dr. Khan",
    aiSummary: "Farmer reports a buffalo with nasal discharge and mild fever for 6 days.",
    structured: { animal: { value: "Buffalo", source: "Farmer reported" }, symptoms: { value: "Nasal discharge, Mild fever", source: "AI extracted" }, duration: { value: "6 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Prolonged duration", "Respiratory-adjacent symptom"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bhains ki naak se paani aa raha hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "25 Aug", label: "Farmer reported case" }, { time: "25 Aug", label: "Referred to lab" }, { time: "27 Aug", label: "Sample collected" }, { time: "29 Aug", label: "Lab result received" }],
    labReferral: { reason: "Suspected respiratory infection", sample: "Nasal swab", lab: "Jaipur Veterinary Diagnostic Centre", collectedAt: "27 Aug", stage: "RESULT_RECEIVED", result: "Inconclusive", resultDate: "29 Aug" },
    expertAssessment: { observations: "Mild fever, nasal discharge noted by farmer.", assessment: "Sample sent given prolonged duration.", action: "Awaiting result before treatment recommendation.", savedAt: "25 Aug, 10:20 AM" },
    callback: null, resolution: null,
  },
  {
    id: "PS-10450", source: "IVR", callState: null, bucket: "resolved", status: "RESOLVED", risk: "LOW", autoAssigned: false,
    farmer: "Ram Lal", phone: "•••• 7740", animal: "Goat", affected: 1, duration: "4 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "28 Aug, 2:00 PM", expert: "Dr. Sharma",
    aiSummary: "Farmer reports a goat with mild lameness for 4 days.",
    structured: { animal: { value: "Goat", source: "Farmer reported" }, symptoms: { value: "Difficulty walking", source: "AI extracted" }, duration: { value: "4 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Single mild symptom"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bakri thodi langdi hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "28 Aug", label: "Farmer reported case" }, { time: "28 Aug", label: "Expert contacted farmer" }, { time: "28 Aug", label: "Case resolved" }],
    labReferral: null, expertAssessment: { observations: "Mild gait abnormality described, no swelling reported.", assessment: "Likely minor strain.", action: "Advised rest and monitoring.", savedAt: "28 Aug, 2:30 PM" }, callback: null,
    resolution: { type: "Farmer advised monitoring", notes: "Advised rest; farmer to report back if no improvement in 5 days.", resolvedAt: "28 Aug, 2:35 PM" },
  },
  {
    id: "PS-10441", source: "IVR", callState: null, bucket: "resolved", status: "RESOLVED", risk: "LOW", autoAssigned: false,
    farmer: "Geeta Devi", phone: "•••• 2298", animal: "Cow", affected: 1, duration: "1 day",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "26 Aug, 11:00 AM", expert: "Dr. Sharma",
    aiSummary: "Farmer reports a minor wound on a cow's leg.",
    structured: { animal: { value: "Cow", source: "Farmer reported" }, symptoms: { value: "Minor wound", source: "Farmer reported" }, duration: { value: "1 day", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Localized minor injury"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Gai ke pair mein choti si chot hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "26 Aug", label: "Farmer reported case" }, { time: "26 Aug", label: "Case resolved" }],
    labReferral: null, expertAssessment: { observations: "Superficial wound described, no signs of infection reported.", assessment: "Minor injury, unlikely to require in-person visit.", action: "Advised basic wound care.", savedAt: "26 Aug, 11:15 AM" }, callback: null,
    resolution: { type: "Resolved after consultation", notes: "Advised cleaning the wound and monitoring for swelling.", resolvedAt: "26 Aug, 11:20 AM" },
  },
  {
    id: "PS-10463", source: "IVR", callState: null, bucket: "resolved", status: "RESOLVED", risk: "MEDIUM", autoAssigned: false,
    farmer: "Ramesh Choudhary", phone: "•••• 7231", animal: "Buffalo", affected: 1, duration: "3 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "18 Aug, 9:00 AM", expert: "Dr. Khan",
    aiSummary: "Farmer reports a buffalo with fever for approximately 3 days.",
    structured: { animal: { value: "Buffalo", source: "Farmer reported" }, symptoms: { value: "Fever", source: "AI extracted" }, duration: { value: "3 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Fever", "Moderate duration"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bhains ko bukhar hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "18 Aug", label: "Farmer reported case" }, { time: "18 Aug", label: "Expert contacted farmer" }, { time: "19 Aug", label: "Case resolved" }],
    labReferral: null, expertAssessment: { observations: "Fever without other symptoms.", assessment: "Advised monitoring.", action: "Advised fluids and shade.", savedAt: "18 Aug, 9:30 AM" }, callback: null,
    resolution: { type: "Farmer advised monitoring", notes: "Fever resolved within two days per farmer follow-up.", resolvedAt: "19 Aug, 10:00 AM" },
  },
  {
    id: "PS-10421", source: "IVR", callState: null, bucket: "resolved", status: "RESOLVED", risk: "LOW", autoAssigned: false,
    farmer: "Ramesh Choudhary", phone: "•••• 7231", animal: "Goat", affected: 1, duration: "5 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "3 Aug, 3:00 PM", expert: "Dr. Meena",
    aiSummary: "Farmer reports a goat with lameness for approximately 5 days.",
    structured: { animal: { value: "Goat", source: "Farmer reported" }, symptoms: { value: "Difficulty walking", source: "AI extracted" }, duration: { value: "5 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Single mild symptom"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bakri langdi hai." }], transcriptEdited: false,
    movement: { reported: false }, cluster: null,
    history: [{ time: "3 Aug", label: "Farmer reported case" }, { time: "4 Aug", label: "Case resolved" }],
    labReferral: null, expertAssessment: { observations: "Mild lameness, no swelling.", assessment: "Likely minor strain.", action: "Advised rest.", savedAt: "3 Aug, 3:20 PM" }, callback: null,
    resolution: { type: "Farmer advised monitoring", notes: "Fully recovered per farmer follow-up.", resolvedAt: "8 Aug, 11:00 AM" },
  },
  {
    id: "PS-10479", source: "IVR", callState: null, bucket: "active", status: "IN_PROGRESS", risk: "MEDIUM", autoAssigned: false,
    farmer: "Kailash Nath", phone: "•••• 5561", animal: "Buffalo", affected: 1, duration: "4 days",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "27 Aug, 1:00 PM", expert: "Dr. Khan",
    aiSummary: "Farmer reports a buffalo with fever and weakness for 4 days, recently moved from Bagru.",
    structured: { animal: { value: "Buffalo", source: "Farmer reported" }, symptoms: { value: "Fever, Weakness", source: "AI extracted" }, duration: { value: "4 days", source: "Farmer reported" }, water: { value: "Reduced", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Fever", "Weakness", "Recent movement from an elevated area"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bhains ko bukhar aur kamzori hai." }], transcriptEdited: false,
    movement: { reported: true, previous: "Bagru", current: "Sanganer", date: "27 Aug", source: "Farmer reported", connection: "5 similar reports recorded in the destination area" },
    cluster: null,
    history: [{ time: "27 Aug", label: "Farmer reported case" }, { time: "27 Aug", label: "Risk assessed: MEDIUM" }, { time: "27 Aug", label: "Assigned to Dr. Khan" }],
    labReferral: null, expertAssessment: null, callback: null, resolution: null,
  },
  {
    id: "PS-10485", source: "IVR", callState: null, bucket: "incoming", status: "NEW", risk: "HIGH", autoAssigned: false,
    farmer: "Bhanwar Lal", phone: "•••• 3312", animal: "Cattle", affected: 2, duration: "Today",
    location: "Sanganer", pin: "302001", district: "Jaipur", reportedAt: "31 Aug, 1:20 PM", expert: null,
    aiSummary: "Farmer reports two cattle with fever, recently moved from Phulera.",
    structured: { animal: { value: "Cattle", source: "Farmer reported" }, symptoms: { value: "Fever", source: "AI extracted" }, duration: { value: "Today", source: "Farmer reported" }, water: { value: "Reduced", source: "AI extracted" }, affected: { value: "2", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Fever", "Multiple animals affected", "Recent movement from a flagged area"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Gaay ko bukhar hai, Phulera se laye the." }], transcriptEdited: false,
    movement: { reported: true, previous: "Phulera", current: "Sanganer", date: "31 Aug", source: "Farmer reported", connection: "27 similar reports recorded in the destination area" },
    cluster: { block: "Sanganer", relatedReports: 27, status: "UNDER_REVIEW" },
    history: [{ time: "1:20 PM", label: "Farmer reported case" }, { time: "1:22 PM", label: "Risk assessed: HIGH" }],
    labReferral: null, expertAssessment: null, callback: null, resolution: null,
  },
  {
    id: "PS-10455", source: "IVR", callState: null, bucket: "resolved", status: "RESOLVED", risk: "LOW", autoAssigned: false,
    farmer: "Omkar Singh", phone: "•••• 9910", animal: "Goat", affected: 1, duration: "2 days",
    location: "Chomu", pin: "303702", district: "Jaipur", reportedAt: "22 Aug, 10:00 AM", expert: "Dr. Meena",
    aiSummary: "Farmer reports a goat with mild diarrhea for 2 days, moved within Chomu.",
    structured: { animal: { value: "Goat", source: "Farmer reported" }, symptoms: { value: "Diarrhea", source: "AI extracted" }, duration: { value: "2 days", source: "Farmer reported" }, water: { value: "Normal", source: "AI extracted" }, affected: { value: "1", source: "Farmer reported" }, mortality: { value: "None reported", source: "Farmer reported" } },
    riskReasons: ["Single mild symptom"],
    transcript: [{ speaker: "ai", text: "Namaste. Aapke pashu ko kya samasya hai?" }, { speaker: "farmer", text: "Bakri ko dast hai." }], transcriptEdited: false,
    movement: { reported: true, previous: "Chomu", current: "Chomu", date: "22 Aug", source: "Farmer reported", connection: "No elevated reporting found in the destination area" },
    cluster: null,
    history: [{ time: "22 Aug", label: "Farmer reported case" }, { time: "23 Aug", label: "Case resolved" }],
    labReferral: null, expertAssessment: { observations: "Mild diarrhea, otherwise active.", assessment: "Likely dietary.", action: "Advised clean water and monitoring.", savedAt: "22 Aug, 10:20 AM" }, callback: null,
    resolution: { type: "Farmer advised monitoring", notes: "Resolved within a day.", resolvedAt: "23 Aug, 9:00 AM" },
  },
];

const INITIAL_ALERTS = [
  {
    id: "A-104", kind: "cluster", block: "Sanganer", priority: "CRITICAL", status: "UNDER_REVIEW",
    reports: 27, baseline: 8, symptoms: ["Reduced appetite", "Fever", "Lethargy"], animal: "Cattle",
    movementLinks: 3, firstReported: "28 Aug", latestReport: "31 Aug", timeWindow: "7 days",
    investigation: { officer: "Dr. Sharma", priority: "High", deadline: "3 Sep", stage: "In progress" },
    advisorySent: true, highlightVillage: "Sanganer", relatedCase: "PS-10482",
  },
  {
    id: "A-103", kind: "cluster", block: "Bagru", priority: "HIGH", status: "WATCH",
    reports: 19, baseline: 11, symptoms: ["Fever", "Weakness"], animal: "Buffalo",
    movementLinks: 1, firstReported: "29 Aug", latestReport: "31 Aug", timeWindow: "7 days",
    investigation: null, advisorySent: false, highlightVillage: "Bagru", relatedCase: "PS-10479",
  },
  {
    id: "A-105", kind: "cluster", block: "Phulera", priority: "CRITICAL", status: "POTENTIAL_CLUSTER",
    reports: 15, baseline: 6, symptoms: ["Fever", "Breathing difficulty"], animal: "Cow",
    movementLinks: 0, firstReported: "31 Aug", latestReport: "31 Aug", timeWindow: "7 days",
    investigation: null, advisorySent: false, highlightVillage: "Phulera", relatedCase: "PS-10485",
  },
  {
    id: "A-101", kind: "movement", block: "Sanganer (Village B)", priority: "HIGH", status: "WATCH",
    reports: 8, baseline: 3, symptoms: ["Reduced appetite"], animal: "Cattle",
    movementLinks: 1, firstReported: "30 Aug", latestReport: "31 Aug", timeWindow: "7 days",
    investigation: null, advisorySent: false, highlightVillage: "Village B", relatedCase: "PS-10482",
    note: "Flagged after a farmer-reported movement into an area with elevated reports.",
  },
  {
    id: "A-099", kind: "cluster", block: "Amer", priority: "HIGH", status: "VERIFIED",
    reports: 22, baseline: 9, symptoms: ["Fever", "Lameness"], animal: "Cattle",
    movementLinks: 2, firstReported: "22 Aug", latestReport: "25 Aug", timeWindow: "7 days",
    investigation: { officer: "Dr. Verma", priority: "High", deadline: "26 Aug", stage: "Completed" },
    verifiedBy: "District Authority", verifiedDate: "25 Aug",
    verificationNotes: "Field investigation confirmed unusual clustering; veterinary team dispatched for follow-up. No lab-confirmed diagnosis yet.",
    advisorySent: true, highlightVillage: "Amer", relatedCase: null,
  },
  {
    id: "A-102", kind: "cluster", block: "Chomu", priority: "MEDIUM", status: "DISMISSED",
    reports: 12, baseline: 10, symptoms: ["Diarrhea"], animal: "Goat",
    movementLinks: 0, firstReported: "26 Aug", latestReport: "28 Aug", timeWindow: "7 days",
    investigation: null, dismissReason: "Seasonal pattern", dismissedBy: "Authority Officer", dismissedDate: "29 Aug",
    advisorySent: false, highlightVillage: "Chomu", relatedCase: "PS-10455",
  },
];

const MOVEMENTS = [
  { id: "MV-0028", animal: "Cow", origin: "Village A", destination: "Village B", date: "30 Aug", source: "Farmer reported", caseId: "PS-10482", risk: "HIGH", destinationReports: 8, connected: true },
  { id: "MV-0025", animal: "Buffalo", origin: "Bagru", destination: "Sanganer", date: "27 Aug", source: "Farmer reported", caseId: "PS-10479", risk: "MEDIUM", destinationReports: 5, connected: true },
  { id: "MV-0031", animal: "Cattle", origin: "Phulera", destination: "Sanganer", date: "31 Aug", source: "Farmer reported", caseId: "PS-10485", risk: "HIGH", destinationReports: 27, connected: true },
  { id: "MV-0019", animal: "Goat", origin: "Chomu", destination: "Chomu", date: "22 Aug", source: "Farmer reported", caseId: "PS-10455", risk: "LOW", destinationReports: 2, connected: false },
];

const ADVISORIES_INIT = {
  Drafts: [{ id: "AD-12", title: "Fever & appetite advisory", area: "Phulera Block", animal: "Cattle", language: "Hindi", message: "" }],
  "Pending approval": [{ id: "AD-11", title: "Livestock health advisory", area: "Sanganer Block", animal: "Cattle", language: "Hindi", message: "Please monitor livestock for fever, reduced appetite or breathing difficulty and contact your local veterinary authority if symptoms appear.", from: "Dr. Sharma" }],
  Approved: [{ id: "AD-10", title: "Monsoon water advisory", area: "Jaipur District", animal: "All", language: "Hindi", message: "मानसून के मौसम में पशुओं के पीने के पानी की सफाई का विशेष ध्यान रखें।" }],
  Sent: [
    { id: "AD-09", title: "Livestock health advisory", area: "Sanganer Block", animal: "Cattle", language: "Hindi", message: "आपके क्षेत्र में पशुओं से संबंधित मामलों में वृद्धि देखी गई है। कृपया अपने पशुओं के स्वास्थ्य पर ध्यान दें और लक्षण दिखाई देने पर निकटतम पशु चिकित्सा अधिकारी से संपर्क करें।", recipients: 1284, delivered: 1201, pending: 48, failed: 35, date: "31 Aug" },
    { id: "AD-05", title: "Seasonal advisory", area: "Jaipur District", animal: "All", language: "Hindi", message: "मानसून के मौसम में पशुओं के पीने के पानी की सफाई का विशेष ध्यान रखें।", recipients: 2210, delivered: 2180, pending: 20, failed: 10, date: "27 Aug" },
  ],
  Archived: [{ id: "AD-01", title: "Winter advisory 2025", area: "Jaipur District", animal: "All", language: "Hindi", message: "सर्दियों में पशुओं को ठंड से बचाने के उपाय अपनाएं।" }],
};

const USERS = [
  { name: "Dr. Sharma", role: "Expert", location: "Sanganer", status: "Active", lastActive: "2 min ago" },
  { name: "Ramesh Choudhary", role: "Farmer", location: "Sanganer", status: "Active", lastActive: "1 hour ago" },
  { name: "Priya Meena", role: "Authority", location: "Jaipur District", status: "Active", lastActive: "10 min ago" },
  { name: "Dr. Khan", role: "Expert", location: "Bagru", status: "Active", lastActive: "25 min ago" },
  { name: "Suresh Yadav", role: "Farmer", location: "Sanganer", status: "Active", lastActive: "3 hours ago" },
  { name: "Dr. Verma", role: "Expert", location: "Amer", status: "Disabled", lastActive: "5 days ago" },
];
const AUDIT_LOG = [
  { time: "10:46", user: "Dr. Sharma", action: "Case updated", object: "PS-10482", result: "Success" },
  { time: "10:48", user: "Authority", action: "Alert reviewed", object: "A-104", result: "Under review" },
  { time: "11:02", user: "Admin", action: "Expert status changed", object: "Dr. Meena", result: "Success" },
  { time: "11:15", user: "Dr. Sharma", action: "Case resolved", object: "PS-10450", result: "Success" },
  { time: "11:30", user: "Admin", action: "Rule updated", object: "Fever + breathing difficulty", result: "Success" },
];
const SMS_LOG = [
  { message: "Livestock health advisory", group: "Sanganer farmers", date: "31 Aug", status: "Delivered" },
  { message: "Seasonal advisory", group: "Jaipur District", date: "27 Aug", status: "Delivered" },
  { message: "Callback reminder", group: "Kamla Bai", date: "31 Aug", status: "Pending" },
];
const RULES = [
  { name: "Fever + breathing difficulty", risk: "HIGH", action: "Priority expert review" },
  { name: "Multiple mortality reports + similar symptoms", risk: "CRITICAL", action: "Immediate authority escalation" },
  { name: "Reduced appetite + Lethargy, duration > 48h", risk: "HIGH", action: "Priority expert review" },
  { name: "Single mild symptom", risk: "LOW", action: "Routine expert review" },
];
const NOTIF_TYPES = ["Critical case alerts", "High-risk alerts", "Potential cluster alerts", "Lab result alerts", "Callback alerts", "Advisory delivery updates"];
const ADMIN_KPIS = [
  { label: "Total users", value: "1,842" }, { label: "Farmers", value: "1,690" },
  { label: "Experts", value: "38" }, { label: "Authorities", value: "12" },
  { label: "Active cases", value: "86" }, { label: "System calls today", value: "47" },
  { label: "Reports today", value: "58" },
];
const SYSTEM_HEALTH = [
  { name: "Frontend", status: "Operational", ms: 110 }, { name: "Backend API", status: "Operational", ms: 180 },
  { name: "Database", status: "Operational", ms: 40 }, { name: "IVR", status: "Operational", ms: 320 },
  { name: "STT", status: "Operational", ms: 410 }, { name: "TTS", status: "Operational", ms: 260 },
  { name: "SMS", status: "Degraded", ms: 1450 }, { name: "Maps", status: "Operational", ms: 150 },
  { name: "Notifications", status: "Operational", ms: 90 },
];

const TOP_ISSUES = [
  { label: "Reduced appetite", count: 182 }, { label: "Fever", count: 146 },
  { label: "Respiratory signs", count: 103 }, { label: "Diarrhea", count: 88 }, { label: "Lameness", count: 64 },
];
const ANIMAL_DIST = [
  { label: "Cattle", count: 512 }, { label: "Buffalo", count: 338 }, { label: "Goat", count: 241 },
  { label: "Poultry", count: 118 }, { label: "Sheep", count: 57 }, { label: "Other", count: 18 },
];
const TREND_DATA = [
  { day: "Mon", date: "25 Aug", all: 31, animal: 14, crop: 17 }, { day: "Tue", date: "26 Aug", all: 35, animal: 16, crop: 19 },
  { day: "Wed", date: "27 Aug", all: 33, animal: 15, crop: 18 }, { day: "Thu", date: "28 Aug", all: 39, animal: 18, crop: 21 },
  { day: "Fri", date: "29 Aug", all: 44, animal: 20, crop: 24 }, { day: "Sat", date: "30 Aug", all: 40, animal: 19, crop: 21 },
  { day: "Sun", date: "31 Aug", all: 42, animal: 19, crop: 23 },
];
const TREND_RANGES = {
  "7 days": TREND_DATA.map((d) => ({ d: d.date, v: d.all })),
  "30 days": [{ d: "Wk1", v: 210 }, { d: "Wk2", v: 228 }, { d: "Wk3", v: 244 }, { d: "Wk4", v: 264 }],
  "90 days": [{ d: "Jun", v: 780 }, { d: "Jul", v: 845 }, { d: "Aug", v: 912 }],
};
const RISK_TREND = [
  { wk: "Wk1", LOW: 140, MEDIUM: 60, HIGH: 18, CRITICAL: 4 }, { wk: "Wk2", LOW: 148, MEDIUM: 64, HIGH: 20, CRITICAL: 5 },
  { wk: "Wk3", LOW: 151, MEDIUM: 70, HIGH: 22, CRITICAL: 6 }, { wk: "Wk4", LOW: 155, MEDIUM: 74, HIGH: 26, CRITICAL: 8 },
];
const MORTALITY_TREND = [12, 10, 14, 11, 15, 13, 18];

/* ============================================================
   ROLE: FARMER (mobile-first PWA)
   ============================================================ */

const FARMER_NAME = "Ramesh Choudhary";
const FARMER_LANG = {
  en: { namaste: "Namaste 👋", greeting: "How can we help your livestock today?", reportCta: "Report a problem", reportSub: "Tell us about your animal's health problem.", myReports: "My reports", advisories: "Advisories", nearbyHelp: "Nearby help", urgent: "Need urgent veterinary help?", contactExpert: "Contact nearby expert" },
  hi: { namaste: "नमस्ते 👋", greeting: "आज हम आपके पशु की कैसे मदद कर सकते हैं?", reportCta: "समस्या दर्ज करें", reportSub: "अपने पशु की स्वास्थ्य समस्या बताएं।", myReports: "मेरी रिपोर्ट", advisories: "सूचनाएं", nearbyHelp: "नज़दीकी सहायता", urgent: "तुरंत पशु चिकित्सा सहायता चाहिए?", contactExpert: "नज़दीकी विशेषज्ञ से संपर्क करें" },
};
const ANIMALS = [
  { id: "Cow", icon: "🐄", label: "Cattle" }, { id: "Buffalo", icon: "🐃", label: "Buffalo" },
  { id: "Goat", icon: "🐐", label: "Goat" }, { id: "Sheep", icon: "🐑", label: "Sheep" },
  { id: "Poultry", icon: "🐔", label: "Poultry" }, { id: "Other", icon: "🐖", label: "Other" },
];
const SYMPTOMS = [
  { id: "Fever", icon: "🌡️", label: "Fever" }, { id: "Not eating", icon: "🍽️", label: "Not eating" },
  { id: "Not drinking", icon: "💧", label: "Not drinking" }, { id: "Weak / inactive", icon: "😴", label: "Weak / inactive" },
  { id: "Breathing problem", icon: "🫁", label: "Breathing problem" }, { id: "Diarrhea", icon: "💩", label: "Diarrhea" },
  { id: "Difficulty walking", icon: "🦵", label: "Difficulty walking" }, { id: "Bleeding", icon: "🩸", label: "Bleeding" },
  { id: "Swelling", icon: "🤒", label: "Swelling" }, { id: "Other", icon: "❓", label: "Other" },
];
const DURATIONS = ["Today", "1–2 days", "3–7 days", "More than a week", "Not sure"];
const AFFECTED_COUNTS = ["1", "2–5", "6–10", "More than 10", "Not sure"];
const MOVE_WHEN = ["Today", "1–3 days ago", "Within a week", "More than a week ago", "Not sure"];
const NEARBY = [
  { name: "Dr. Sharma — Veterinary Officer", area: "Sanganer", available: true },
  { name: "Veterinary Centre, Sanganer", area: "Govt. facility · 2.4 km", available: null },
];

function BigButton({ icon, title, subtitle, onClick, variant = "primary" }) {
  const isPrimary = variant === "primary";
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", border: isPrimary ? "none" : `1px solid ${COLOR.border}`, background: isPrimary ? COLOR.forest : COLOR.surface, color: isPrimary ? "#fff" : COLOR.text, borderRadius: 16, padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, minHeight: 64, boxSizing: "border-box" }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span><div style={{ fontSize: isPrimary ? 16 : 14.5, fontWeight: 700 }}>{title}</div>{subtitle && <div style={{ fontSize: 12.5, color: isPrimary ? "rgba(255,255,255,0.85)" : COLOR.textSecondary, marginTop: 2 }}>{subtitle}</div>}</span>
    </button>
  );
}
function OptionButton({ icon, label, sublabel, selected, onClick, compact }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: compact ? "12px 14px" : "16px", borderRadius: 14, cursor: "pointer", border: `1.5px solid ${selected ? COLOR.forest : COLOR.border}`, background: selected ? COLOR.forestTint : COLOR.surface, minHeight: 48, boxSizing: "border-box" }}>
      {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
      <span style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: COLOR.text }}>{label}</div>{sublabel && <div style={{ fontSize: 12, color: COLOR.textSecondary }}>{sublabel}</div>}</span>
      {selected && <span style={{ color: COLOR.forest, fontWeight: 700 }}>✓</span>}
    </button>
  );
}
function PrimaryBtn({ children, onClick, disabled, full = true }) {
  return <button onClick={onClick} disabled={disabled} style={{ width: full ? "100%" : "auto", padding: "14px 20px", borderRadius: 14, border: "none", background: disabled ? COLOR.borderStrong : COLOR.forest, color: "#fff", fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", minHeight: 50 }}>{children}</button>;
}
function GhostBtn({ children, onClick, full = true }) {
  return <button onClick={onClick} style={{ width: full ? "100%" : "auto", padding: "13px 20px", borderRadius: 14, border: `1.5px solid ${COLOR.border}`, background: COLOR.surface, color: COLOR.forest, fontSize: 14.5, fontWeight: 700, cursor: "pointer", minHeight: 48 }}>{children}</button>;
}
function ScreenHeader({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLOR.text, padding: 0, width: 28 }}>←</button>}
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: COLOR.text }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}
function ProgressDots({ step, total }) {
  return <div style={{ display: "flex", gap: 5, padding: "0 18px 12px" }}>{Array.from({ length: total }).map((_, i) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 3, background: i <= step ? COLOR.forest : COLOR.surfaceSunken }} />)}</div>;
}

function FarmerHome({ lang, onNavigate, connectivity, drafts }) {
  const t = FARMER_LANG[lang];
  return (
    <div style={{ padding: "8px 18px 90px" }}>
      <div style={{ marginTop: 10, marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLOR.text }}>{t.namaste}</div>
        <div style={{ fontSize: 14, color: COLOR.textSecondary, marginTop: 4 }}>{t.greeting}</div>
      </div>
      {drafts.length > 0 && (
        <div style={{ background: COLOR.amberTint, border: `1px solid ${COLOR.amber}33`, borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: COLOR.amber, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          ⚠ {drafts.length} report{drafts.length > 1 ? "s" : ""} waiting to sync
          <button onClick={() => onNavigate("myReports")} style={{ marginLeft: "auto", background: "none", border: "none", color: COLOR.amber, fontWeight: 700, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>View</button>
        </div>
      )}
      <div style={{ marginBottom: 14 }}><BigButton icon="🐄" title={t.reportCta.toUpperCase()} subtitle={t.reportSub} onClick={() => onNavigate("report")} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <BigButton icon="📋" title={t.myReports} variant="secondary" onClick={() => onNavigate("myReports")} />
        <BigButton icon="📢" title={t.advisories} variant="secondary" onClick={() => onNavigate("advisories")} />
      </div>
      <div style={{ marginBottom: 22 }}><BigButton icon="👨‍⚕️" title={t.nearbyHelp} variant="secondary" onClick={() => onNavigate("nearbyHelp")} /></div>
      <div style={{ background: COLOR.redTint, borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: COLOR.red, marginBottom: 10 }}>⚠ {t.urgent}</div>
        <GhostBtn onClick={() => onNavigate("nearbyHelp")}>📞 {t.contactExpert}</GhostBtn>
      </div>
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: connectivity === "online" ? COLOR.green : COLOR.amber, fontWeight: 600 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: connectivity === "online" ? COLOR.green : COLOR.amber, display: "inline-block" }} />
        {connectivity === "online" ? "Connected" : "Offline — reports will sync later"}
      </div>
    </div>
  );
}

const FARMER_STEP_TITLES = ["Animal", "Describe", "Symptoms", "Duration", "Affected", "Location", "Movement", "Review"];

function FarmerReportFlow({ onExit, onSubmitted, connectivity }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    animal: null, mode: null, description: "", transcriptConfirmed: false,
    symptoms: [], duration: null, affected: null, mortality: null, mortalityCount: "",
    locationMethod: null, pin: "", gpsDone: false, movement: null,
    moveFrom: "", moveTo: "", moveWhen: null,
  });
  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, FARMER_STEP_TITLES.length - 1));
  const back = () => (step === 0 ? onExit() : setStep((s) => s - 1));

  const canContinue = () => {
    if (step === 0) return !!data.animal;
    if (step === 1) return data.mode === "type" ? data.description.trim().length > 0 : data.transcriptConfirmed;
    if (step === 2) return true;
    if (step === 3) return !!data.duration;
    if (step === 4) return !!data.affected && !!data.mortality;
    if (step === 5) return data.gpsDone || data.pin.length >= 6;
    if (step === 6) return data.movement !== null;
    return true;
  };

  if (step === FARMER_STEP_TITLES.length - 1) {
    return <FarmerReviewStep data={data} onBack={back} onEdit={(i) => setStep(i)} onSubmit={() => onSubmitted(data)} connectivity={connectivity} />;
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="Report a problem" onBack={back} right={<button onClick={onExit} style={{ background: "none", border: "none", color: COLOR.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>} />
      <ProgressDots step={step} total={FARMER_STEP_TITLES.length - 1} />
      <div style={{ padding: "6px 18px" }}>
        {step === 0 && <FarmerStepAnimal data={data} set={set} />}
        {step === 1 && <FarmerStepDescribe data={data} set={set} />}
        {step === 2 && <FarmerStepSymptoms data={data} set={set} />}
        {step === 3 && <FarmerStepDuration data={data} set={set} />}
        {step === 4 && <FarmerStepAffected data={data} set={set} />}
        {step === 5 && <FarmerStepLocation data={data} set={set} />}
        {step === 6 && <FarmerStepMovement data={data} set={set} />}
      </div>
      <div style={{ position: "sticky", bottom: 0, background: COLOR.bg, padding: "12px 18px 18px", borderTop: `1px solid ${COLOR.border}` }}>
        <PrimaryBtn onClick={next} disabled={!canContinue()}>Continue</PrimaryBtn>
      </div>
    </div>
  );
}

function FarmerStepAnimal({ data, set }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 14px" }}>What are you reporting?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {ANIMALS.map((a) => <OptionButton key={a.id} icon={a.icon} label={a.label} selected={data.animal === a.id} onClick={() => set({ animal: a.id })} />)}
      </div>
    </div>
  );
}
function FarmerStepDescribe({ data, set }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => {
    if (recording) timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [recording]);
  const startRecording = () => { set({ mode: "voice" }); setSeconds(0); setRecording(true); };
  const stopRecording = () => {
    setRecording(false); setProcessing(true);
    setTimeout(() => { setProcessing(false); set({ description: "Meri gai do din se kuch nahi kha rahi aur thodi sust bhi hai." }); }, 1100);
  };
  if (data.mode === "voice" && (recording || processing || data.description)) {
    return (
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 14px" }}>Tell us what's wrong</h2>
        {recording && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🎙️</div>
            <div style={{ fontSize: 14, color: COLOR.textSecondary, marginBottom: 6 }}>Listening…</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>00:{String(seconds).padStart(2, "0")}</div>
            <div style={{ marginTop: 20 }}><GhostBtn full={false} onClick={stopRecording}>Stop</GhostBtn></div>
          </div>
        )}
        {processing && <div style={{ textAlign: "center", padding: "40px 0", color: COLOR.textSecondary, fontSize: 14 }}>Processing…</div>}
        {!recording && !processing && data.description && (
          <div>
            <div style={{ fontSize: 12.5, color: COLOR.textMuted, marginBottom: 6 }}>You said:</div>
            {data.transcriptConfirmed ? (
              <textarea value={data.description} onChange={(e) => set({ description: e.target.value })} rows={3} style={{ width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12, border: `1.5px solid ${COLOR.forest}`, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
            ) : (
              <div style={{ background: COLOR.surfaceSunken, borderRadius: 12, padding: 14, fontSize: 14.5, color: COLOR.text, fontStyle: "italic", marginBottom: 14 }}>"{data.description}"</div>
            )}
            {!data.transcriptConfirmed && (
              <div style={{ display: "flex", gap: 10 }}>
                <PrimaryBtn full={false} onClick={() => set({ transcriptConfirmed: true })}>✓ Looks correct</PrimaryBtn>
                <GhostBtn full={false} onClick={() => set({ transcriptConfirmed: true })}>✎ Edit</GhostBtn>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 14px" }}>What problem are you seeing?</h2>
      <div style={{ marginBottom: 12 }}><OptionButton icon="🎙️" label="Tell us in your own words" sublabel="Speak naturally, in your language" onClick={startRecording} /></div>
      <div style={{ textAlign: "center", color: COLOR.textMuted, fontSize: 12, margin: "10px 0" }}>or</div>
      <button onClick={() => set({ mode: "type" })} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${COLOR.border}`, background: COLOR.surface, cursor: "pointer", marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>✍️</span><span style={{ fontSize: 13.5, fontWeight: 600 }}>Type instead</span>
      </button>
      {data.mode === "type" && (
        <textarea autoFocus value={data.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. My cow has not been eating for two days." rows={4} style={{ width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12, border: `1.5px solid ${COLOR.border}`, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
      )}
    </div>
  );
}
function FarmerStepSymptoms({ data, set }) {
  const toggle = (id) => { const has = data.symptoms.includes(id); set({ symptoms: has ? data.symptoms.filter((s) => s !== id) : [...data.symptoms, id] }); };
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 6px" }}>Select symptoms</h2>
      <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 14 }}>Optional — helps us understand the problem faster.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{SYMPTOMS.map((s) => <OptionButton key={s.id} icon={s.icon} label={s.label} compact selected={data.symptoms.includes(s.id)} onClick={() => toggle(s.id)} />)}</div>
    </div>
  );
}
function FarmerStepDuration({ data, set }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 14px" }}>How long has this been happening?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{DURATIONS.map((d) => <OptionButton key={d} label={d} selected={data.duration === d} onClick={() => set({ duration: d })} />)}</div>
    </div>
  );
}
function FarmerStepAffected({ data, set }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 14px" }}>How many animals are affected?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>{AFFECTED_COUNTS.map((c) => <OptionButton key={c} label={c} selected={data.affected === c} onClick={() => set({ affected: c })} />)}</div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 14px" }}>Has any animal died?</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>{["Yes", "No", "Not sure"].map((v) => <div key={v} style={{ flex: 1 }}><OptionButton compact label={v} selected={data.mortality === v} onClick={() => set({ mortality: v, mortalityCount: v === "Yes" ? data.mortalityCount : "" })} /></div>)}</div>
      {data.mortality === "Yes" && <input value={data.mortalityCount} onChange={(e) => set({ mortalityCount: e.target.value })} placeholder="How many?" inputMode="numeric" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${COLOR.border}`, fontSize: 14 }} />}
      <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginTop: 10 }}>Recorded as "reported mortality" — this does not assume a cause.</div>
    </div>
  );
}
function FarmerStepLocation({ data, set }) {
  const [asking, setAsking] = useState(false);
  const [acquiring, setAcquiring] = useState(false);
  const share = () => setAsking(true);
  const grantPermission = () => { setAsking(false); setAcquiring(true); setTimeout(() => { setAcquiring(false); set({ locationMethod: "gps", gpsDone: true }); }, 1200); };
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 6px" }}>Where is the animal?</h2>
      <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 16 }}>Your location helps us connect you with the correct local veterinary authority.</div>
      {data.gpsDone ? (
        <div style={{ background: COLOR.greenTint, borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: COLOR.green }}>Location received</div><div style={{ fontSize: 12, color: COLOR.textSecondary }}>Approximate location captured</div></div>
        </div>
      ) : acquiring ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: COLOR.textSecondary, fontSize: 13.5 }}>📍 Getting your location…</div>
      ) : asking ? (
        <div style={{ background: COLOR.blueTint, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13.5, color: COLOR.text, marginBottom: 14 }}>Kisan Seva would like to use your location to find the right veterinary authority.</div>
          <div style={{ display: "flex", gap: 10 }}><PrimaryBtn full={false} onClick={grantPermission}>Allow</PrimaryBtn><GhostBtn full={false} onClick={() => setAsking(false)}>Not now</GhostBtn></div>
        </div>
      ) : (
        <><div style={{ marginBottom: 12 }}><PrimaryBtn onClick={share}>📍 Share location</PrimaryBtn></div><div style={{ textAlign: "center", color: COLOR.textMuted, fontSize: 12, margin: "10px 0" }}>or</div></>
      )}
      {!data.gpsDone && !acquiring && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 8 }}>That's okay. You can enter your PIN code instead.</div>
          <input value={data.pin} onChange={(e) => set({ pin: e.target.value.replace(/\D/g, "").slice(0, 6), locationMethod: "pin" })} placeholder="Enter PIN code" inputMode="numeric" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${COLOR.border}`, fontSize: 14 }} />
        </div>
      )}
      <div style={{ marginTop: 24, background: COLOR.surfaceSunken, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>📞 Don't have a smartphone?</div>
        <div style={{ fontSize: 12, color: COLOR.textSecondary }}>Call our helpline and follow the voice instructions: Call → Answer questions → Enter PIN → Get expert assistance.</div>
      </div>
    </div>
  );
}
function FarmerStepMovement({ data, set }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 14px" }}>Has this animal been moved or sent somewhere else recently?</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>{["Yes", "No", "Not sure"].map((v) => <div key={v} style={{ flex: 1 }}><OptionButton compact label={v} selected={data.movement === v} onClick={() => set({ movement: v })} /></div>)}</div>
      {data.movement === "Yes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 6 }}>Where was it moved from?</div><input value={data.moveFrom} onChange={(e) => set({ moveFrom: e.target.value })} placeholder="Village / locality" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${COLOR.border}`, fontSize: 14 }} /></div>
          <div><div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 6 }}>Where is it now?</div><input value={data.moveTo} onChange={(e) => set({ moveTo: e.target.value })} placeholder="Village / locality" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${COLOR.border}`, fontSize: 14 }} /></div>
          <div>
            <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 8 }}>When was it moved?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{MOVE_WHEN.map((w) => <OptionButton key={w} compact label={w} selected={data.moveWhen === w} onClick={() => set({ moveWhen: w })} />)}</div>
          </div>
          <div style={{ fontSize: 11.5, color: COLOR.textMuted }}>Movement information can help veterinary authorities understand whether similar reports are connected across areas. This is recorded as farmer-reported movement, not automatic tracking.</div>
        </div>
      )}
    </div>
  );
}
function FarmerReviewStep({ data, onBack, onEdit, onSubmit, connectivity }) {
  const animal = ANIMALS.find((a) => a.id === data.animal);
  const symptomLabels = data.symptoms;
  return (
    <div style={{ paddingBottom: 110 }}>
      <ScreenHeader title="Review report" onBack={onBack} />
      <div style={{ padding: "6px 18px" }}>
        <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <FarmerRowKV label="Animal" value={`${animal?.icon} ${animal?.label}`} onEdit={() => onEdit(0)} />
          <FarmerRowKV label="Symptoms" value={symptomLabels.length ? symptomLabels.join(", ") : "Not specified"} onEdit={() => onEdit(2)} />
          <FarmerRowKV label="Duration" value={data.duration || "—"} onEdit={() => onEdit(3)} />
          <FarmerRowKV label="Affected" value={`${data.affected || "—"} animal(s)`} onEdit={() => onEdit(4)} />
          <FarmerRowKV label="Mortality" value={data.mortality === "Yes" ? `Reported — ${data.mortalityCount || "?"}` : data.mortality === "No" ? "None reported" : "Not sure"} onEdit={() => onEdit(4)} />
          <FarmerRowKV label="Location" value={data.gpsDone ? "GPS location shared" : data.pin ? `PIN ${data.pin}` : "—"} onEdit={() => onEdit(5)} />
          <FarmerRowKV label="Livestock movement" value={data.movement === "Yes" ? `Yes — ${data.moveFrom || "?"} → ${data.moveTo || "?"}` : data.movement || "—"} onEdit={() => onEdit(6)} last />
        </div>
        <div style={{ background: COLOR.surfaceSunken, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.textMuted, marginBottom: 6 }}>AI SUMMARY</div>
          <div style={{ fontSize: 13.5, color: COLOR.text, lineHeight: 1.6, marginBottom: 8, fontStyle: "italic" }}>
            "Farmer reports a{animal?.label === "Other" ? "n" : ""} {animal?.label?.toLowerCase()} with {symptomLabels.length ? symptomLabels.join(", ").toLowerCase() : "a health problem"}{data.duration ? `, duration ${data.duration.toLowerCase()}` : ""}."
          </div>
          <div style={{ fontSize: 11, color: COLOR.textMuted }}>AI-generated summary — may require expert verification.</div>
        </div>
      </div>
      <div style={{ position: "sticky", bottom: 0, background: COLOR.bg, padding: "12px 18px 18px", borderTop: `1px solid ${COLOR.border}` }}>
        <PrimaryBtn onClick={onSubmit}>Submit report</PrimaryBtn>
        {connectivity !== "online" && <div style={{ fontSize: 11.5, color: COLOR.amber, marginTop: 8, textAlign: "center" }}>⚠ You're offline — this will be saved on your device and synced later.</div>}
      </div>
    </div>
  );
}
function FarmerRowKV({ label, value, onEdit, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}>
      <div><div style={{ fontSize: 11, color: COLOR.textMuted }}>{label}</div><div style={{ fontSize: 13.5, color: COLOR.text, marginTop: 2 }}>{value}</div></div>
      <button onClick={onEdit} style={{ background: "none", border: "none", color: COLOR.forest, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Edit</button>
    </div>
  );
}

function FarmerSubmissionResult({ result, onDone, onViewCase }) {
  const [calling, setCalling] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { let iv; if (calling) iv = setInterval(() => setSeconds((s) => s + 1), 1000); return () => clearInterval(iv); }, [calling]);

  if (result.offline) {
    return (
      <div style={{ padding: "40px 18px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>💾</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Saved on device</div>
        <div style={{ fontSize: 13.5, color: COLOR.textSecondary, marginBottom: 24 }}>Will sync when internet returns. Your information hasn't been lost.</div>
        <PrimaryBtn onClick={onDone}>Back to home</PrimaryBtn>
      </div>
    );
  }
  if (calling) {
    return (
      <div style={{ padding: "50px 18px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: COLOR.greenTint, color: COLOR.green, fontWeight: 700, fontSize: 13, padding: "6px 14px", borderRadius: 20, marginBottom: 20 }}>● Call in progress</div>
        <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginBottom: 28 }}>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{result.expertName}</div>
        <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 30 }}>{result.expertArea}</div>
        <GhostBtn full={false} onClick={() => setCalling(false)}>End call</GhostBtn>
      </div>
    );
  }
  return (
    <div style={{ padding: "36px 18px", textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>✓</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Report received</div>
      <div style={{ fontSize: 13.5, color: COLOR.textSecondary, marginBottom: 18 }}>Your case has been created successfully.</div>
      <div style={{ background: COLOR.surfaceSunken, borderRadius: 12, padding: "10px 16px", display: "inline-block", fontSize: 14, fontWeight: 700, marginBottom: 26 }}>Case ID: {result.caseId}</div>
      {result.available ? (
        <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 14, padding: 18, textAlign: "left" }}>
          <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 10 }}>An appropriate veterinary expert is available.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 26 }}>👨‍⚕️</span>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>{result.expertName}</div><div style={{ fontSize: 12, color: COLOR.textSecondary }}>{result.expertArea} · <span style={{ color: COLOR.green, fontWeight: 600 }}>Available</span></div></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><PrimaryBtn onClick={() => setCalling(true)}>📞 Connect now</PrimaryBtn><GhostBtn onClick={onViewCase}>View case</GhostBtn></div>
        </div>
      ) : (
        <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 14, padding: 18, textAlign: "left" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>No expert is currently available</div>
          <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 16 }}>You don't need to repeat your report — it's already saved to your case.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><PrimaryBtn onClick={onDone}>Request callback</PrimaryBtn><GhostBtn onClick={onViewCase}>View case</GhostBtn></div>
        </div>
      )}
      <div style={{ marginTop: 20 }}><button onClick={onDone} style={{ background: "none", border: "none", color: COLOR.textMuted, fontSize: 12.5, cursor: "pointer" }}>Back to home</button></div>
    </div>
  );
}

function FarmerMyReports({ myCases, drafts, onBack, onOpenCase }) {
  return (
    <div style={{ paddingBottom: 90 }}>
      <ScreenHeader title="My reports" onBack={onBack} />
      <div style={{ padding: "6px 18px" }}>
        {drafts.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.textMuted, margin: "10px 0 8px" }}>SAVED — WAITING TO SYNC</div>
            {drafts.map((d, i) => (
              <div key={i} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 14, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{d.animalLabel}</div><div style={{ fontSize: 12, color: COLOR.textSecondary }}>{d.symptomLabels || "Health problem reported"}</div></div>
                <Badge fg={COLOR.amber} bg={COLOR.amberTint}>Waiting for connection</Badge>
              </div>
            ))}
          </>
        )}
        <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.textMuted, margin: "14px 0 8px" }}>SUBMITTED</div>
        {myCases.length === 0 ? <div style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: 13, padding: "30px 0" }}>No reports yet.</div> : myCases.map((r) => (
          <button key={r.id} onClick={() => onOpenCase(r)} style={{ width: "100%", textAlign: "left", border: `1px solid ${COLOR.border}`, background: COLOR.surface, borderRadius: 12, padding: 14, marginBottom: 10, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 12.5, color: COLOR.textMuted, fontWeight: 600 }}>#{r.id}</div>
              <RiskBadge level={r.risk} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{r.animal} · {r.structured.symptoms.value}</div>
            <div style={{ marginTop: 6 }}><StatusBadge status={r.status} /></div>
          </button>
        ))}
      </div>
    </div>
  );
}
function FarmerCaseDetail({ report, onBack }) {
  return (
    <div style={{ paddingBottom: 90 }}>
      <ScreenHeader title={`Case #${report.id}`} onBack={onBack} />
      <div style={{ padding: "6px 18px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><RiskBadge level={report.risk} /><StatusBadge status={report.status} /></div>
        <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <FarmerRowStatic label="Animal" value={report.animal} />
          <FarmerRowStatic label="Reported problem" value={report.structured.symptoms.value} />
          <FarmerRowStatic label="Expert" value={report.expert || "Being assigned"} last />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Timeline</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {report.history.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: COLOR.forest, marginTop: 4 }} />
                {i < report.history.length - 1 && <div style={{ width: 1.5, flex: 1, background: COLOR.border, minHeight: 22 }} />}
              </div>
              <div style={{ fontSize: 13, color: COLOR.text, paddingBottom: 16 }}>{step.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function FarmerRowStatic({ label, value, last }) {
  return <div style={{ padding: "10px 0", borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}><div style={{ fontSize: 11, color: COLOR.textMuted }}>{label}</div><div style={{ fontSize: 13.5, color: COLOR.text, marginTop: 2 }}>{value}</div></div>;
}
function FarmerAdvisories({ onBack, advisories }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ paddingBottom: 90 }}>
      <ScreenHeader title="Advisories" onBack={onBack} />
      <div style={{ padding: "6px 18px" }}>
        {advisories.Sent.map((a, i) => (
          <div key={i} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: COLOR.textMuted, marginBottom: 10 }}>{a.area} · {a.date}</div>
            {open === i ? <div style={{ fontSize: 13.5, color: COLOR.text, lineHeight: 1.7 }}>{a.message}</div> : <button onClick={() => setOpen(i)} style={{ background: "none", border: "none", color: COLOR.forest, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>Read →</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
function FarmerNearbyHelp({ onBack }) {
  return (
    <div style={{ paddingBottom: 90 }}>
      <ScreenHeader title="Nearby veterinary help" onBack={onBack} />
      <div style={{ padding: "6px 18px" }}>
        {NEARBY.map((n, i) => (
          <div key={i} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 14, padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{n.name}</div>
              <div style={{ fontSize: 12, color: COLOR.textSecondary, marginTop: 2 }}>{n.area} {n.available !== null && <span style={{ color: n.available ? COLOR.green : COLOR.textMuted, fontWeight: 600 }}>· {n.available ? "Available" : "Unavailable"}</span>}</div>
            </div>
            <GhostBtn full={false}>{n.available !== null ? "Call" : "Directions"}</GhostBtn>
          </div>
        ))}
      </div>
    </div>
  );
}
function FarmerBottomNav({ active, onNavigate }) {
  const items = [{ id: "home", icon: "🏠", label: "Home" }, { id: "myReports", icon: "📋", label: "Reports" }, { id: "advisories", icon: "📢", label: "Advisories" }, { id: "nearbyHelp", icon: "👨‍⚕️", label: "Help" }];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: COLOR.surface, borderTop: `1px solid ${COLOR.border}`, display: "flex", padding: "8px 6px" }}>
      {items.map((it) => (
        <button key={it.id} onClick={() => onNavigate(it.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: active === it.id ? COLOR.forest : COLOR.textMuted }}>
          <span style={{ fontSize: 18 }}>{it.icon}</span><span style={{ fontSize: 10.5, fontWeight: active === it.id ? 700 : 500 }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function FarmerRole({ cases, addCase, updateCase, advisories }) {
  const [lang, setLang] = useState("en");
  const [connectivity, setConnectivity] = useState("online");
  const [screen, setScreen] = useState("home");
  const [openCaseId, setOpenCaseId] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [drafts, setDrafts] = useState([]);

  const myCases = cases.filter((c) => c.farmer === FARMER_NAME).sort((a, b) => (a.id < b.id ? 1 : -1));

  const handleSubmit = (data) => {
    const animal = ANIMALS.find((a) => a.id === data.animal);
    const symptomLabels = data.symptoms.join(", ");
    if (connectivity !== "online") {
      setDrafts((d) => [...d, { animalLabel: `${animal?.icon} ${animal?.label}`, symptomLabels }]);
      setSubmission({ offline: true });
      setScreen("result");
      return;
    }
    const caseId = `PS-${10490 + cases.filter((c) => c.source === "PWA").length}`;
    const available = Math.random() > 0.3;
    const risk = data.symptoms.length >= 2 || data.duration === "More than a week" ? "HIGH" : data.symptoms.length === 1 ? "MEDIUM" : "LOW";
    const newCase = {
      id: caseId, source: "PWA", callState: null, bucket: "incoming", status: "NEW", risk, autoAssigned: false,
      farmer: FARMER_NAME, phone: "•••• 7231", animal: animal?.label, affected: data.affected || "1", duration: data.duration || "Not sure",
      location: data.gpsDone ? "Sanganer" : `PIN ${data.pin}`, pin: data.pin || "302001", district: "Jaipur", reportedAt: "Just now", expert: null,
      aiSummary: `Farmer reports a${animal?.label === "Other" ? "n" : ""} ${animal?.label?.toLowerCase()} with ${symptomLabels || "a health problem"}${data.duration ? `, duration ${data.duration.toLowerCase()}` : ""}.`,
      structured: {
        animal: { value: animal?.label, source: "Farmer reported" }, symptoms: { value: symptomLabels || "Not specified", source: "Farmer reported" },
        duration: { value: data.duration || "Not sure", source: "Farmer reported" }, water: { value: "Not asked", source: "Farmer reported" },
        affected: { value: data.affected || "1", source: "Farmer reported" },
        mortality: { value: data.mortality === "Yes" ? `Reported — ${data.mortalityCount || "unspecified"}` : data.mortality === "No" ? "None reported" : "Not sure", source: "Farmer reported" },
      },
      riskReasons: data.symptoms.length ? data.symptoms : ["Single mild symptom"],
      transcript: data.mode === "voice" ? [{ speaker: "farmer", text: data.description }] : [],
      transcriptEdited: false,
      movement: data.movement === "Yes" ? { reported: true, previous: data.moveFrom || "Unspecified", current: data.moveTo || "Unspecified", date: "Today", source: "Farmer reported", connection: "Not yet analyzed" } : { reported: false },
      cluster: null,
      history: [{ time: "Just now", label: "Farmer submitted report via PWA" }, { time: "Just now", label: "AI summary generated" }, { time: "Just now", label: `Risk assessed: ${risk}` }, { time: "Just now", label: available ? "Expert assigned — Dr. Sharma" : "Callback requested" }],
      labReferral: null, expertAssessment: null, callback: available ? null : { requestedAt: "Just now", preferred: "As soon as possible" }, resolution: null,
    };
    addCase(newCase);
    setSubmission({ offline: false, caseId, available, expertName: "Dr. Sharma — Veterinary Officer", expertArea: "Sanganer" });
    setScreen("result");
  };

  const nav = (id) => { setScreen(id); setOpenCaseId(null); };
  const openCase = myCases.find((c) => c.id === openCaseId);

  return (
    <div style={{ minHeight: "100%", background: "#EDE7D6", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "28px 12px" }}>
      <div style={{ width: 390, maxWidth: "100%", background: COLOR.bg, borderRadius: 30, border: "8px solid #2A2C26", boxShadow: "0 20px 50px rgba(0,0,0,0.25)", overflow: "hidden", position: "relative", height: 760, maxHeight: "88vh" }}>
        <div style={{ background: COLOR.surface, borderBottom: `1px solid ${COLOR.border}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: COLOR.forest, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>K</div>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>Kisan Seva</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))} style={{ background: "none", border: "none", fontSize: 11.5, fontWeight: 700, color: COLOR.forest, cursor: "pointer" }}>{lang === "en" ? "हिन्दी" : "English"}</button>
            <button onClick={() => setConnectivity((c) => (c === "online" ? "offline" : "online"))} title="Demo: toggle connectivity" style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer" }}>{connectivity === "online" ? "🟢" : "⚠️"}</button>
          </div>
        </div>
        <div style={{ height: "calc(100% - 45px)", overflowY: "auto", position: "relative" }}>
          {screen === "home" && <FarmerHome lang={lang} onNavigate={nav} connectivity={connectivity} drafts={drafts} />}
          {screen === "report" && <FarmerReportFlow onExit={() => nav("home")} onSubmitted={handleSubmit} connectivity={connectivity} />}
          {screen === "result" && submission && <FarmerSubmissionResult result={submission} onDone={() => nav("home")} onViewCase={() => { setOpenCaseId(myCases[0]?.id); setScreen("caseDetail"); }} />}
          {screen === "myReports" && <FarmerMyReports myCases={myCases} drafts={drafts} onBack={() => nav("home")} onOpenCase={(r) => { setOpenCaseId(r.id); setScreen("caseDetail"); }} />}
          {screen === "caseDetail" && openCase && <FarmerCaseDetail report={openCase} onBack={() => nav("myReports")} />}
          {screen === "advisories" && <FarmerAdvisories onBack={() => nav("home")} advisories={advisories} />}
          {screen === "nearbyHelp" && <FarmerNearbyHelp onBack={() => nav("home")} />}
          {["home", "myReports", "advisories", "nearbyHelp"].includes(screen) && <FarmerBottomNav active={screen} onNavigate={nav} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROLE: CALL CONSOLE (phone/IVR + AI voice workflow)
   ============================================================ */

const AREA_EXPERT = { Sanganer: "Dr. Sharma", Bagru: "Dr. Khan", Chomu: "Dr. Meena", Amer: "Dr. Verma" };

function CallStateChip({ state }) {
  const map = {
    ai_collecting: { label: "AI collecting information", fg: COLOR.blue, bg: COLOR.blueTint, icon: "◌" },
    waiting_for_expert: { label: "Waiting for expert", fg: COLOR.amber, bg: COLOR.amberTint, icon: "⏳" },
    expert_connected: { label: "Expert connected", fg: COLOR.green, bg: COLOR.greenTint, icon: "●" },
  };
  const s = map[state] || map.ai_collecting;
  return <span style={{ fontSize: 12, fontWeight: 600, color: s.fg, background: s.bg, padding: "4px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}><span>{s.icon}</span>{s.label}</span>;
}

function LiveCallsPage({ calls, onOpen }) {
  const [filter, setFilter] = useState("all");
  const filters = [{ id: "all", label: "All" }, { id: "ai_collecting", label: "AI conversation" }, { id: "waiting_for_expert", label: "Waiting for expert" }, { id: "expert_connected", label: "Connected" }];
  const visible = calls.filter((c) => filter === "all" || c.callState === filter);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, margin: 0, fontWeight: 700, color: COLOR.text }}>Live calls</h1>
        <span style={{ fontSize: 13, color: COLOR.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR.green, display: "inline-block" }} />{calls.length} active</span>
      </div>
      <p style={{ fontSize: 13, color: COLOR.textSecondary, margin: "4px 0 18px" }}>Calls currently in progress through the phone/IVR line — AI conversation, transcription and routing state, not the telephony network itself.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f.id ? COLOR.forest : COLOR.border}`, background: filter === f.id ? COLOR.forest : COLOR.surface, color: filter === f.id ? "#fff" : COLOR.textSecondary }}>{f.label}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {visible.map((c) => (
          <div key={c.id} onClick={() => onOpen(c.id)} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 16, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div><div style={{ fontSize: 12, color: COLOR.textMuted, fontWeight: 600 }}>CALL #{c.id}</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{c.farmer}</div></div>
              <RiskBadge level={c.risk} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 6, fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 12 }}>
              <div><span style={{ color: COLOR.textMuted }}>Location · </span>{c.location}</div>
              <div><span style={{ color: COLOR.textMuted }}>Animal · </span>{c.animal}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><CallStateChip state={c.callState} /><span style={{ fontSize: 12.5, fontWeight: 600, color: COLOR.forest }}>Open →</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CallConsoleDetail({ call, onBack, onUpdate, showToast }) {
  const [summaryAccepted, setSummaryAccepted] = useState(false);
  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLOR.forest, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}>← Back to live calls</button>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Call #{call.id}</h1><CallStateChip state={call.callState} /></div>
          <div style={{ fontSize: 13, color: COLOR.textSecondary, marginTop: 4 }}>{call.farmer} · {call.location}</div>
        </div>
        <RiskBadge level={call.risk} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 20 }}>
        <div>
          {call.transcript.length > 0 && (
            <Card title="Conversation">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {call.transcript.map((turn, i) => (
                  <div key={i} style={{ alignSelf: turn.speaker === "ai" ? "flex-start" : "flex-end", maxWidth: "85%", background: turn.speaker === "ai" ? COLOR.surfaceSunken : COLOR.forestTint, borderRadius: 10, padding: "9px 12px" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: COLOR.textMuted, marginBottom: 2, textTransform: "uppercase" }}>{turn.speaker === "ai" ? "AI" : "Farmer"}</div>
                    <div style={{ fontSize: 13.5, color: COLOR.text }}>{turn.text}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card title="AI-extracted information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
              {Object.entries(call.structured).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: COLOR.textMuted, marginBottom: 2, textTransform: "capitalize" }}>{k}</div>
                  <div style={{ fontSize: 14, color: COLOR.text, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{v.value}<SourceTag source={v.source} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="AI-generated case summary" pad={18}>
            <div style={{ fontSize: 14, color: COLOR.text, lineHeight: 1.6, marginBottom: 10 }}>{call.aiSummary}</div>
            <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 12 }}>AI-generated summary — verify important information with the farmer/expert.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" small>Edit summary</Button>
              <Button variant={summaryAccepted ? "secondary" : "primary"} small onClick={() => setSummaryAccepted(true)} disabled={summaryAccepted}>{summaryAccepted ? "✓ Accepted" : "Accept"}</Button>
            </div>
          </Card>
          {call.movement.reported && (
            <Card title="Livestock movement">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>{call.movement.previous}<ArrowRight size={14} color={COLOR.forest} />{call.movement.current}</div>
              <div style={{ fontSize: 11.5, color: COLOR.textMuted }}>Farmer-reported movement — not automatic GPS tracking.</div>
            </Card>
          )}
        </div>
        <div>
          <Card title="Risk assessment">
            <RiskBadge level={call.risk} />
            <div style={{ margin: "10px 0" }}>{call.riskReasons.map((f, i) => <div key={i} style={{ fontSize: 13, color: COLOR.text, marginBottom: 4 }}>✓ {f}</div>)}</div>
            <div style={{ fontSize: 11.5, color: COLOR.textMuted }}>Risk level generated from configured triage rules. Veterinary assessment required.</div>
          </Card>
          <Card title="Expert routing">
            {call.expert ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{call.expert}</div>
                <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 12 }}>{call.location}</div>
                <Button variant="primary" small disabled={call.callState === "expert_connected"}>{call.callState === "expert_connected" ? "✓ Connected" : "Connect farmer"}</Button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 12 }}>Finding appropriate expert…</div>
                <Button variant="primary" small onClick={() => { const expert = AREA_EXPERT[call.location] || "Dr. Sharma"; onUpdate(call.id, { expert, status: "ASSIGNED", callState: "expert_connected", history: [...call.history, { time: "now", label: `Routed to ${expert}` }] }); showToast(`Routed to ${expert}`); }}>Route to nearest expert</Button>
              </>
            )}
          </Card>
          <Card title="Call timeline">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{call.history.map((t, i) => <div key={i} style={{ display: "flex", gap: 10 }}><div style={{ fontSize: 11.5, color: COLOR.textMuted, width: 60, flexShrink: 0 }}>{t.time}</div><div style={{ fontSize: 12.5, color: COLOR.text }}>{t.label}</div></div>)}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CallConsoleRole({ cases, updateCase, showToast }) {
  const [selectedId, setSelectedId] = useState(null);
  const calls = cases.filter((c) => c.callState);
  const selected = calls.find((c) => c.id === selectedId);
  return (
    <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>
      {selected ? <CallConsoleDetail call={selected} onBack={() => setSelectedId(null)} onUpdate={updateCase} showToast={showToast} /> : <LiveCallsPage calls={calls} onOpen={setSelectedId} />}
    </div>
  );
}

/* ============================================================
   ROLE: AUTHORITY DASHBOARD
   ============================================================ */

const AUTHORITY_KPIS = [
  { icon: FileText, label: "Total reports", value: "1,284", delta: "↑ 12.4% vs previous period", tone: "blue" },
  { icon: Activity, label: "Active cases", value: "86", delta: "21 high priority", tone: "amber" },
  { icon: AlertTriangle, label: "High / critical", value: "14", delta: "Needs attention", tone: "orange" },
  { icon: Layers, label: "Potential clusters", value: "3", delta: "1 new today", tone: "red" },
  { icon: CheckCircle2, label: "Resolved", value: "1,102", delta: "86% resolution rate", tone: "green" },
];
const TONE_MAP = {
  blue: { fg: COLOR.blue, bg: COLOR.blueTint }, amber: { fg: COLOR.amber, bg: COLOR.amberTint },
  orange: { fg: COLOR.orange, bg: COLOR.orangeTint }, red: { fg: COLOR.red, bg: COLOR.redTint },
  green: { fg: COLOR.green, bg: COLOR.greenTint }, clay: { fg: COLOR.clay, bg: COLOR.clayTint },
};

function AuthorityKPIRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 20 }}>
      {AUTHORITY_KPIS.map((kpi) => {
        const tone = TONE_MAP[kpi.tone];
        return (
          <div key={kpi.label} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: tone.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><kpi.icon size={14} color={tone.fg} /></div>
            <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ fontSize: 12.5, color: COLOR.textSecondary, margin: "3px 0 6px" }}>{kpi.label}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: tone.fg }}>{kpi.delta}</div>
          </div>
        );
      })}
    </div>
  );
}

function AuthorityClusterPanel({ alert, onReview, onViewCases }) {
  if (!alert) return null;
  return (
    <Card title="Potential cluster" right={<PatternBadge status={alert.status} />}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 14 }}>
        <Field label="Block" value={alert.block} /><Field label="Reports" value={alert.reports} />
        <Field label="Animal" value={alert.animal} /><Field label="Historical baseline" value={`${alert.baseline}/week`} />
        <Field label="First reported" value={alert.firstReported} /><Field label="Latest report" value={alert.latestReport} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: COLOR.textMuted, marginBottom: 4 }}>Common symptoms</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{alert.symptoms.map((s) => <Badge key={s} fg={COLOR.textSecondary} bg={COLOR.surfaceSunken}>{s}</Badge>)}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: COLOR.red }}>+{(((alert.reports - alert.baseline) / alert.baseline) * 100).toFixed(0)}%</span>
        <span style={{ fontSize: 12, color: COLOR.textMuted }}>change vs. baseline</span>
      </div>
      <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 14 }}>Potential / unusual reporting pattern detected — requires veterinary/authority verification.</div>
      <div style={{ display: "flex", gap: 8 }}><Button variant="secondary" small onClick={onViewCases}>View cases</Button><Button variant="primary" small onClick={onReview}>Review alert</Button></div>
    </Card>
  );
}

function AuthorityAlertsPanel({ alerts, onReview }) {
  const top = alerts.slice(0, 3);
  return (
    <Card title="Active alerts" right={<span style={{ fontSize: 12.5, color: COLOR.forest, fontWeight: 600 }}>{alerts.length} total</span>}>
      {top.length === 0 ? <EmptyState title="No active alerts" body="Reporting patterns are currently within expected levels." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {top.map((a) => (
            <div key={a.id} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 9, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{a.kind === "cluster" ? <AlertTriangle size={14} color={COLOR.red} /> : <Radio size={14} color={COLOR.orange} />}<span style={{ fontSize: 13, fontWeight: 700 }}>{a.kind === "cluster" ? "Potential cluster" : "Movement-linked pattern"}</span></div>
                <RiskBadge level={a.priority} />
              </div>
              <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 4 }}>Block: {a.block} · {a.reports} related reports</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: COLOR.red, marginBottom: 10 }}>↑ {(((a.reports - a.baseline) / a.baseline) * 100).toFixed(0)}% above baseline</div>
              <Button variant="secondary" small onClick={() => onReview(a)}>Review</Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const AUTH_STEPS = ["Detected", "Under review", "Investigation", "Verified / Dismissed", "Response"];
function authStepIndex(a) { if (a.status === "VERIFIED" || a.status === "DISMISSED") return 3; if (a.investigation) return 2; if (a.status === "UNDER_REVIEW") return 1; return 0; }

function AuthorityAlertModal({ alert, onClose, onResolve, onSendAdvisory }) {
  const [confirming, setConfirming] = useState(null);
  const [reason, setReason] = useState("");
  return (
    <Modal title={`Alert #${alert.id}`} onClose={onClose} width={620}>
      <div style={{ fontSize: 13, color: COLOR.textSecondary, marginBottom: 4 }}>Potential unusual reporting pattern</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}><PatternBadge status={alert.status} /><span style={{ fontSize: 13, color: COLOR.textMuted }}>Area: {alert.block}</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 14 }}>
        <Field label="Reports" value={alert.reports} /><Field label="Baseline" value={`${alert.baseline}/week`} />
        <Field label="Increase" value={`+${(((alert.reports - alert.baseline) / alert.baseline) * 100).toFixed(0)}%`} /><Field label="Affected animal" value={alert.animal} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: COLOR.textMuted, marginBottom: 4 }}>Common symptoms</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{alert.symptoms.map((s) => <Badge key={s} fg={COLOR.textSecondary} bg={COLOR.surfaceSunken}>{s}</Badge>)}</div>
      </div>
      <div style={{ background: COLOR.surfaceSunken, borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13, fontStyle: "italic" }}>"An unusual increase in similar reports has been observed."</div>
      <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 18 }}>This alert indicates an unusual reporting pattern and does not confirm an outbreak. Veterinary/authority verification is required.</div>
      {confirming ? (
        <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 9, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{confirming === "dismiss" ? "Dismiss this alert?" : "Confirm verification"}</div>
          {confirming === "dismiss" ? (
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13, marginBottom: 12 }}>
              <option value="">Select a reason…</option>{["Duplicate reports", "Seasonal pattern", "Data quality issue", "Already investigated", "Other"].map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Verification notes…" rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13, marginBottom: 12, fontFamily: "inherit" }} />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" small disabled={!reason} onClick={() => onResolve(alert.id, confirming === "dismiss" ? "DISMISSED" : "VERIFIED", reason)}>{confirming === "dismiss" ? "Confirm dismissal" : "Confirm verification"}</Button>
            <Button variant="ghost" small onClick={() => { setConfirming(null); setReason(""); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" small onClick={() => onResolve(alert.id, "UNDER_REVIEW", "assigned")}>Assign for investigation</Button>
          <Button variant="secondary" small onClick={() => onResolve(alert.id, "UNDER_REVIEW", "marked")}>Mark under review</Button>
          <Button variant="ghost" small onClick={() => setConfirming("dismiss")}>Dismiss</Button>
          <Button variant="ghost" small onClick={() => setConfirming("verify")}>Verify / confirm</Button>
          <Button variant="primary" small icon={Megaphone} onClick={onSendAdvisory}>Send advisory</Button>
        </div>
      )}
    </Modal>
  );
}

function AuthorityAdvisoryModal({ onClose, onSend }) {
  const [sent, setSent] = useState(false);
  const [sms, setSms] = useState(true);
  if (sent) {
    return (
      <Modal title="Advisory sent" onClose={onClose}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLOR.green, fontWeight: 700, fontSize: 14, marginBottom: 14 }}><CheckCircle2 size={18} /> Advisory sent</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}><Field label="Recipients" value="1,284" /><Field label="Delivered" value="1,201" /><Field label="Pending" value="48" /></div>
        <Button variant="primary" onClick={onClose}>Done</Button>
      </Modal>
    );
  }
  return (
    <Modal title="Send advisory" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 14 }}><Field label="Area" value="Sanganer Block" /><Field label="Language" value="Hindi" /></div>
      <Field label="Audience" value="Registered farmers in affected area" />
      <div style={{ margin: "14px 0" }}>
        <div style={{ fontSize: 11, color: COLOR.textMuted, marginBottom: 6 }}>Message</div>
        <div style={{ background: COLOR.surfaceSunken, borderRadius: 8, padding: 12, fontSize: 14, lineHeight: 1.7 }}>आपके क्षेत्र में पशुओं से संबंधित मामलों में वृद्धि देखी गई है। कृपया अपने पशुओं के स्वास्थ्य पर ध्यान दें और लक्षण दिखाई देने पर निकटतम पशु चिकित्सा अधिकारी से संपर्क करें।</div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 18 }}><input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} /> Deliver via SMS</label>
      <div style={{ display: "flex", gap: 8 }}><Button variant="secondary">Preview</Button><Button variant="primary" icon={Send} onClick={() => { setSent(true); onSend && onSend(); }}>Send advisory</Button></div>
    </Modal>
  );
}

function AuthorityTrendsCard() {
  const [metric, setMetric] = useState("all");
  return (
    <Card title="Reporting trends" right={<div style={{ display: "flex", gap: 4 }}>{[["all", "All"], ["animal", "Animal"], ["crop", "Crop"]].map(([id, label]) => <button key={id} onClick={() => setMetric(id)} style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 16, border: `1px solid ${metric === id ? COLOR.forest : COLOR.border}`, background: metric === id ? COLOR.forestTint : "transparent", color: metric === id ? COLOR.forest : COLOR.textMuted, cursor: "pointer" }}>{label}</button>)}</div>}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: COLOR.textMuted }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: COLOR.textMuted }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<CustomTrendTooltip />} />
          <Line type="monotone" dataKey={metric} stroke={COLOR.forest} strokeWidth={2.5} dot={{ r: 3, fill: COLOR.forest }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function AuthorityCasesTable({ cases, casesRef, showToast }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const filtered = cases.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [c.id, c.animal, c.location, c.structured.symptoms.value, c.expert || ""].join(" ").toLowerCase().includes(q);
    const matchesRisk = riskFilter === "All" || c.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });
  return (
    <Card innerRef={casesRef} title="Recent cases" right={<Button variant="secondary" small icon={Download} onClick={() => showToast("Report export started")}>Export report</Button>}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <Search size={14} color={COLOR.textMuted} style={{ position: "absolute", left: 10, top: 10 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cases…" style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13 }}>{["All", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((r) => <option key={r} value={r}>{r === "All" ? "Risk: all" : RISK[r].label}</option>)}</select>
      </div>
      {filtered.length === 0 ? <EmptyState title="No matching cases" body="Try adjusting your search or filters." /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `1px solid ${COLOR.border}` }}>{["Case", "Animal", "Issue", "Location", "Risk", "Expert", "Status"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted, fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                  <td style={{ padding: "10px", fontWeight: 600, color: COLOR.forest }}>#{c.id}</td>
                  <td style={{ padding: "10px" }}>{c.animal}</td>
                  <td style={{ padding: "10px" }}>{c.structured.symptoms.value}</td>
                  <td style={{ padding: "10px", color: COLOR.textSecondary }}>{c.location}</td>
                  <td style={{ padding: "10px" }}><RiskBadge level={c.risk} /></td>
                  <td style={{ padding: "10px", color: COLOR.textSecondary }}>{c.expert || "Unassigned"}</td>
                  <td style={{ padding: "10px" }}><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AuthorityRole({ cases, alerts, updateAlert, advisories, showToast }) {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [reviewAlert, setReviewAlert] = useState(null);
  const [advisoryOpen, setAdvisoryOpen] = useState(false);
  const casesRef = useRef(null);

  const handleResolve = (id, status, note) => {
    updateAlert(id, { status });
    setReviewAlert(null);
    showToast(status === "DISMISSED" ? "Alert dismissed" : status === "VERIFIED" ? "Alert verified" : "Alert updated");
  };
  const scrollToCases = () => { setSelectedCluster(null); casesRef.current && casesRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const selectedAlert = selectedCluster ? alerts.find((a) => a.highlightVillage === selectedCluster.name) : null;

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Overview</h1>
          <p style={{ fontSize: 13, color: COLOR.textSecondary, margin: "4px 0 0" }}>What's happening, where, how serious, and what needs action.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="primary" icon={AlertTriangle} onClick={() => alerts[0] && setReviewAlert(alerts[0])}>Review alerts</Button>
          <Button variant="ghost" icon={Megaphone} onClick={() => setAdvisoryOpen(true)}>Create advisory</Button>
        </div>
      </div>

      <AuthorityKPIRow />

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16, marginBottom: 16, alignItems: "start" }}>
        <div>
          <Card title="Surveillance map" right={<span style={{ fontSize: 11.5, color: COLOR.textMuted }}>Rajasthan / Jaipur</span>}>
            <SurveillanceMap onSelectCluster={setSelectedCluster} />
            <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginTop: 10 }}>Click the Sanganer marker to open the potential-cluster detail panel.</div>
          </Card>
          {selectedAlert && <AuthorityClusterPanel alert={selectedAlert} onReview={() => setReviewAlert(selectedAlert)} onViewCases={scrollToCases} />}
        </div>
        <AuthorityAlertsPanel alerts={alerts} onReview={setReviewAlert} />
      </div>

      <div style={{ marginBottom: 16 }}><AuthorityTrendsCard /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="Top reported issues"><BarList items={TOP_ISSUES} color={COLOR.forest} /></Card>
        <Card title="Animal category distribution"><BarList items={ANIMAL_DIST} color={COLOR.clay} /></Card>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Card title="Livestock movement" right={<span style={{ fontSize: 11.5, color: COLOR.textMuted }}>Farmer-reported movement</span>}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
            {[["Reported movements", "42"], ["From high-risk areas", "8"], ["Potentially connected areas", "5"]].map(([label, value]) => (
              <div key={label} style={{ background: COLOR.surfaceSunken, borderRadius: 9, padding: 14 }}><div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div><div style={{ fontSize: 12, color: COLOR.textSecondary, marginTop: 2 }}>{label}</div></div>
            ))}
          </div>
          <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 9, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>Village A <ArrowRight size={14} color={COLOR.forest} /> Village B</div>
            <div style={{ fontSize: 12.5, color: COLOR.textSecondary }}>Cattle · Farmer reported · 30 Aug · Case #PS-10482</div>
          </div>
        </Card>
      </div>

      <AuthorityCasesTable cases={cases} casesRef={casesRef} showToast={showToast} />

      {reviewAlert && <AuthorityAlertModal alert={reviewAlert} onClose={() => setReviewAlert(null)} onResolve={handleResolve} onSendAdvisory={() => { setReviewAlert(null); setAdvisoryOpen(true); }} />}
      {advisoryOpen && <AuthorityAdvisoryModal onClose={() => setAdvisoryOpen(false)} onSend={() => showToast("Advisory sent")} />}
    </div>
  );
}

/* ============================================================
   ROLE: EXPERT WORKSPACE (logged in as Dr. Sharma)
   ============================================================ */

const LOGGED_IN_EXPERT = "Dr. Sharma";
const EXPERT_KPIS = [
  { icon: FileText, label: "New cases", value: 8, delta: "3 high priority", tone: "blue" },
  { icon: Activity, label: "In progress", value: 14, delta: "", tone: "amber" },
  { icon: Phone, label: "Callbacks", value: 3, delta: "", tone: "orange" },
  { icon: FlaskConical, label: "Lab referrals", value: 2, delta: "", tone: "clay" },
  { icon: CheckCircle2, label: "Resolved today", value: 11, delta: "", tone: "green" },
];

function ExpertSidebar({ nav, setNav }) {
  const items = [
    { id: "overview", label: "Overview" }, { id: "incoming", label: "Incoming" }, { id: "cases", label: "My cases" },
    { id: "callbacks", label: "Callbacks" }, { id: "lab", label: "Lab referrals" }, { id: "history", label: "Case history" },
    { id: "advisories", label: "Advisories" }, { id: "profile", label: "Profile" },
  ];
  return (
    <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${COLOR.border}`, padding: "16px 10px" }}>
      {items.map((it) => (
        <button key={it.id} onClick={() => setNav(it.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: nav === it.id ? 700 : 500, background: nav === it.id ? COLOR.forestTint : "transparent", color: nav === it.id ? COLOR.forest : COLOR.textSecondary, marginBottom: 2 }}>{it.label}</button>
      ))}
      <div style={{ marginTop: 16, padding: "10px 12px", fontSize: 11.5, color: COLOR.textMuted, borderTop: `1px solid ${COLOR.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR.green, display: "inline-block" }} /> Online</div>
        Last synced: 2 min ago
      </div>
    </div>
  );
}

function ExpertHeader({ availability, setAvailability }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [confirmOffline, setConfirmOffline] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const AVAIL = { AVAILABLE: { label: "Available", fg: COLOR.green }, BUSY: { label: "Busy", fg: COLOR.amber }, OFFLINE: { label: "Offline", fg: COLOR.textMuted }, ON_LEAVE: { label: "On leave", fg: COLOR.orange } };
  const choose = (val) => { setOpenMenu(false); if (val === "OFFLINE" && availability !== "OFFLINE") { setConfirmOffline(true); return; } setAvailability(val); };
  return (
    <div style={{ borderBottom: `1px solid ${COLOR.border}`, padding: "16px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
      <div><div style={{ fontSize: 17, fontWeight: 700 }}>{greeting}, {LOGGED_IN_EXPERT}</div><div style={{ fontSize: 12.5, color: COLOR.textSecondary }}>Veterinary Officer · Sanganer</div></div>
      <div style={{ position: "relative" }}>
        <button onClick={() => setOpenMenu((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 7, border: `1px solid ${COLOR.border}`, background: COLOR.surface, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: AVAIL[availability].fg, display: "inline-block" }} />{AVAIL[availability].label}<ChevronDown size={13} color={COLOR.textMuted} />
        </button>
        {openMenu && (
          <div style={{ position: "absolute", top: "110%", right: 0, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 9, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20, minWidth: 150 }}>
            {Object.entries(AVAIL).map(([k, v]) => <button key={k} onClick={() => choose(k)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: v.fg, display: "inline-block" }} /> {v.label}</button>)}
          </div>
        )}
      </div>
      {confirmOffline && (
        <Modal title="Go offline?" onClose={() => setConfirmOffline(false)} width={420}>
          <div style={{ fontSize: 13.5, color: COLOR.textSecondary, marginBottom: 18 }}>Changing to Offline may prevent new cases from being routed to you.</div>
          <div style={{ display: "flex", gap: 8 }}><Button variant="primary" small onClick={() => { setAvailability("OFFLINE"); setConfirmOffline(false); }}>Go offline</Button><Button variant="ghost" small onClick={() => setConfirmOffline(false)}>Cancel</Button></div>
        </Modal>
      )}
    </div>
  );
}

function ExpertCaseRow({ c, onOpen, rightSlot }) {
  return (
    <div onClick={() => onOpen(c)} style={{ display: "flex", alignItems: "center", gap: 14, border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 13, cursor: "pointer", marginBottom: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}><span style={{ fontSize: 12.5, fontWeight: 700, color: COLOR.forest }}>#{c.id}</span><RiskBadge level={c.risk} /></div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.animal} · {c.structured.symptoms.value}</div>
        <div style={{ fontSize: 12, color: COLOR.textSecondary, marginTop: 2 }}>{c.location} · {c.reportedAt}</div>
      </div>
      {rightSlot || <StatusBadge status={c.status} />}
      <ChevronRight size={16} color={COLOR.textMuted} />
    </div>
  );
}

function ExpertOverview({ cases, onOpen, onAccept }) {
  const [sort, setSort] = useState("newest");
  const incoming = cases.filter((c) => c.bucket === "incoming" && (c.expert === null || c.expert === LOGGED_IN_EXPERT));
  const urgent = cases.filter((c) => ["HIGH", "CRITICAL"].includes(c.risk) && ["incoming", "active"].includes(c.bucket) && (c.expert === null || c.expert === LOGGED_IN_EXPERT));
  const sortedIncoming = [...incoming].sort((a, b) => sort === "risk" ? Object.keys(RISK).indexOf(b.risk) - Object.keys(RISK).indexOf(a.risk) : 0);
  const clusterCase = cases.find((c) => c.cluster && (c.expert === LOGGED_IN_EXPERT || c.expert === null));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
        {EXPERT_KPIS.map((k) => { const t = TONE_MAP[k.tone]; return (
          <div key={k.label} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 15 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><k.icon size={13} color={t.fg} /></div>
            <div style={{ fontSize: 21, fontWeight: 700 }}>{k.value}</div><div style={{ fontSize: 12, color: COLOR.textSecondary, marginTop: 2 }}>{k.label}</div>
            {k.delta && <div style={{ fontSize: 11, fontWeight: 600, color: t.fg, marginTop: 4 }}>{k.delta}</div>}
          </div>
        ); })}
      </div>
      {clusterCase && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: COLOR.redTint, border: `1px solid ${COLOR.red}22`, borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
          <AlertTriangle size={16} color={COLOR.red} />
          <div style={{ flex: 1, fontSize: 12.5 }}><strong>Potential reporting cluster nearby</strong> — {clusterCase.cluster.block} Block, {clusterCase.cluster.relatedReports} related reports. Status: under authority review.</div>
          <Button variant="secondary" small onClick={() => onOpen(clusterCase)}>View case</Button>
        </div>
      )}
      <Card title="⚠ Needs attention">
        {urgent.length === 0 ? <EmptyState title="Nothing urgent" body="No high or critical cases right now." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {urgent.map((c) => (
              <div key={c.id} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ fontSize: 13, fontWeight: 700, color: COLOR.forest }}>#{c.id}</div><RiskBadge level={c.risk} /></div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{c.animal} · {c.structured.symptoms.value}</div>
                <div style={{ fontSize: 12, color: COLOR.textSecondary, marginBottom: 8 }}>{c.location} · {c.reportedAt}</div>
                <div style={{ fontSize: 12.5, background: COLOR.surfaceSunken, borderRadius: 8, padding: 10, marginBottom: 10, fontStyle: "italic" }}>{c.aiSummary}</div>
                <div style={{ display: "flex", gap: 8 }}><Button variant="primary" small onClick={() => onOpen(c)}>Open case</Button><Button variant="ghost" small icon={Phone} onClick={() => onOpen(c)}>Contact farmer</Button></div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title="Incoming cases" right={<div style={{ display: "flex", gap: 4 }}>{[["newest", "Newest"], ["risk", "Highest risk"]].map(([id, label]) => <button key={id} onClick={() => setSort(id)} style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 14, border: `1px solid ${sort === id ? COLOR.forest : COLOR.border}`, background: sort === id ? COLOR.forestTint : "transparent", color: sort === id ? COLOR.forest : COLOR.textMuted, cursor: "pointer" }}>{label}</button>)}</div>}>
        {sortedIncoming.length === 0 ? <EmptyState title="You're all caught up" body="No incoming cases right now." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedIncoming.map((c) => <ExpertCaseRow key={c.id} c={c} onOpen={onOpen} rightSlot={c.autoAssigned ? <Badge fg={COLOR.blue} bg={COLOR.blueTint}>Assigned to you</Badge> : <Button variant="primary" small onClick={(e) => { e.stopPropagation(); onAccept(c.id); }}>Accept</Button>} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function ExpertCaseListPage({ title, cases, onOpen, emptyTitle, emptyBody, rightSlotFor }) {
  return (
    <Card title={title}>
      {cases.length === 0 ? <EmptyState title={emptyTitle} body={emptyBody} /> : <div>{cases.map((c) => <ExpertCaseRow key={c.id} c={c} onOpen={onOpen} rightSlot={rightSlotFor ? rightSlotFor(c) : undefined} />)}</div>}
    </Card>
  );
}

function ContactFarmerPanel({ caseObj, onOutcome }) {
  const [state, setState] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { let iv; if (state === "connected") iv = setInterval(() => setSeconds((s) => s + 1), 1000); return () => clearInterval(iv); }, [state]);
  useEffect(() => { if (state === "calling") { const t = setTimeout(() => setState("connected"), 1400); return () => clearTimeout(t); } }, [state]);
  if (state === "idle") return <Button variant="primary" icon={Phone} onClick={() => { setSeconds(0); setState("calling"); }}>Contact farmer</Button>;
  if (state === "calling") return <div style={{ fontSize: 13.5, color: COLOR.textSecondary }}>Calling {caseObj.farmer}…</div>;
  if (state === "connected") {
    return (
      <div style={{ background: COLOR.forestTint, borderRadius: 10, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR.forest, display: "inline-block" }} /><span style={{ fontSize: 13, fontWeight: 700, color: COLOR.forest }}>Connected — {caseObj.farmer}</span></div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, fontVariantNumeric: "tabular-nums" }}>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div>
        <Button variant="danger" small icon={PhoneOff} onClick={() => setState("outcome")}>End call</Button>
      </div>
    );
  }
  return (
    <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Call outcome</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{["Farmer reached", "No answer", "Requested callback", "Wrong number", "Other"].map((o) => <button key={o} onClick={() => { onOutcome(o); setState("idle"); }} style={{ fontSize: 12, padding: "6px 11px", borderRadius: 16, border: `1px solid ${COLOR.border}`, background: COLOR.surfaceSunken, cursor: "pointer" }}>{o}</button>)}</div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder }) {
  return <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>{label}</div><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13 }} /></div>;
}
function LabReferralModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState("Suspected infectious condition");
  const [sample, setSample] = useState("Blood");
  const [lab, setLab] = useState("Jaipur Veterinary Diagnostic Centre");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Modal title="Refer to lab" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LabeledInput label="Reason" value={reason} onChange={setReason} />
        <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Sample type</div><select value={sample} onChange={(e) => setSample(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13 }}>{["Blood", "Nasal swab", "Tissue", "Fecal", "Other"].map((s) => <option key={s}>{s}</option>)}</select></div>
        <LabeledInput label="Collection date" value={date} onChange={setDate} placeholder="e.g. 1 Sep" />
        <LabeledInput label="Lab" value={lab} onChange={setLab} />
        <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Notes</div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13, fontFamily: "inherit" }} /></div>
        <Button variant="primary" onClick={() => onSubmit({ reason, sample, lab, collectedAt: date || "Pending", notes })}>Submit referral</Button>
      </div>
    </Modal>
  );
}
function ResolveModal({ onClose, onSubmit }) {
  const [type, setType] = useState("Resolved after consultation");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  return (
    <Modal title="Resolve case" onClose={onClose}>
      {!confirming ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Resolution</div><select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13 }}>{["Resolved after consultation", "Referred for field visit", "Referred to laboratory", "Farmer advised monitoring", "Other"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Notes</div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13, fontFamily: "inherit" }} /></div>
          <Button variant="primary" onClick={() => setConfirming(true)}>Continue</Button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13.5, marginBottom: 16 }}>Are you sure you want to mark this case as resolved?</div>
          <div style={{ display: "flex", gap: 8 }}><Button variant="primary" small onClick={() => onSubmit({ type, notes })}>Confirm resolution</Button><Button variant="ghost" small onClick={() => setConfirming(false)}>Back</Button></div>
        </div>
      )}
    </Modal>
  );
}

function ExpertCaseDetail({ c, onBack, onAccept, onUpdate, showToast }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState(c.transcript.map((t) => t.text).join("\n"));
  const [showRule, setShowRule] = useState(false);
  const [assessment, setAssessment] = useState(c.expertAssessment || { observations: "", assessment: "", action: "" });
  const [savedNote, setSavedNote] = useState(c.expertAssessment ? `Saved ${c.expertAssessment.savedAt}` : "");
  const [labModal, setLabModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(false);
  const [statusMenu, setStatusMenu] = useState(false);

  const saveAssessment = () => { onUpdate(c.id, { expertAssessment: { ...assessment, savedAt: "just now" } }); setSavedNote("Saved just now"); showToast("Assessment saved"); };
  const handleCallOutcome = (outcome) => {
    const entry = { time: "now", label: `Call outcome: ${outcome}` };
    const patch = { history: [...c.history, entry] };
    if (outcome === "Requested callback") { patch.bucket = "callback"; patch.status = "CALLBACK_REQUIRED"; patch.callback = { requestedAt: "just now", preferred: "As soon as possible" }; }
    else if (outcome === "Farmer reached" && c.bucket !== "active") { patch.bucket = "active"; patch.status = "IN_PROGRESS"; }
    onUpdate(c.id, patch);
    showToast("Call outcome saved");
  };
  const submitLabReferral = (data) => { onUpdate(c.id, { bucket: "lab", status: "REFERRED_TO_LAB", labReferral: { ...data, stage: "RESULT_PENDING" }, history: [...c.history, { time: "now", label: "Referred to lab" }] }); setLabModal(false); showToast("Referred to lab"); };
  const submitResolve = (data) => { onUpdate(c.id, { bucket: "resolved", status: "RESOLVED", resolution: { ...data, resolvedAt: "just now" }, history: [...c.history, { time: "now", label: "Case resolved" }] }); setResolveModal(false); showToast("Case resolved"); };

  return (
    <div style={{ maxWidth: 980 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLOR.forest, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}><ChevronLeft size={15} /> Back</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Case #{c.id}</h1><RiskBadge level={c.risk} /><StatusBadge status={c.status} /></div>
          <div style={{ fontSize: 13, color: COLOR.textSecondary, marginTop: 4 }}>{c.farmer} · {c.location} · Reported {c.reportedAt}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {c.status === "NEW" ? <Button variant="primary" icon={CheckCircle2} onClick={() => onAccept(c.id)}>Accept case</Button> : (
            <>
              <Button variant="secondary" icon={FlaskConical} onClick={() => setLabModal(true)}>Refer to lab</Button>
              <div style={{ position: "relative" }}>
                <Button variant="secondary" icon={ChevronDown} onClick={() => setStatusMenu((s) => !s)}>Update status</Button>
                {statusMenu && (
                  <div style={{ position: "absolute", top: "110%", right: 0, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 9, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20, minWidth: 170 }}>
                    {["IN_PROGRESS", "CALLBACK_REQUIRED", "CLOSED"].map((s) => <button key={s} onClick={() => { onUpdate(c.id, { status: s, bucket: s === "CALLBACK_REQUIRED" ? "callback" : s === "CLOSED" ? "resolved" : "active" }); setStatusMenu(false); showToast("Status updated"); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5 }}>{CASE_STATUS[s].label}</button>)}
                  </div>
                )}
              </div>
              <Button variant="primary" icon={CheckCircle2} onClick={() => setResolveModal(true)}>Resolve case</Button>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <div>
          <Card title="Case overview">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 20px" }}>
              <Field label="Farmer" value={c.farmer} /><Field label="Phone" value={c.phone} /><Field label="Animal" value={c.animal} />
              <Field label="Affected" value={c.affected} /><Field label="Duration" value={c.duration} /><Field label="Location" value={`${c.location} (${c.pin})`} />
            </div>
          </Card>
          <Card title="AI-generated case summary" right={<span style={{ fontSize: 11, color: COLOR.textMuted }}>⚠ Verify with the farmer</span>}>
            <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{c.aiSummary}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" small onClick={() => setShowTranscript((s) => !s)}>{showTranscript ? "Hide transcript" : "View full transcript"}</Button>
              <Button variant="ghost" small onClick={() => showToast("Playing recording…")}>Play recording</Button>
            </div>
            {showTranscript && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${COLOR.border}`, paddingTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: COLOR.textMuted }}>Language: Hindi {editingTranscript && <span style={{ color: COLOR.amber, fontWeight: 700 }}>· editing</span>}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button variant="ghost" small icon={Copy} onClick={() => showToast("Copied")}>Copy</Button>
                    <Button variant="ghost" small icon={Download} onClick={() => showToast("Downloading…")}>Export</Button>
                    <Button variant="ghost" small icon={Edit3} onClick={() => setEditingTranscript((e) => !e)}>{editingTranscript ? "Cancel" : "Edit"}</Button>
                  </div>
                </div>
                {editingTranscript ? (
                  <>
                    <textarea value={transcriptDraft} onChange={(e) => setTranscriptDraft(e.target.value)} rows={5} style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13, fontFamily: "inherit", marginBottom: 8 }} />
                    <Button variant="primary" small onClick={() => { onUpdate(c.id, { transcriptEdited: true }); setEditingTranscript(false); showToast("Transcript updated — marked as edited by expert"); }}>Save edit</Button>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {c.transcript.length === 0 ? <div style={{ fontSize: 12.5, color: COLOR.textMuted }}>No transcript available for this case.</div> : c.transcript.map((t, i) => (
                      <div key={i} style={{ alignSelf: t.speaker === "ai" ? "flex-start" : "flex-end", maxWidth: "85%", background: t.speaker === "ai" ? COLOR.surfaceSunken : COLOR.forestTint, borderRadius: 8, padding: "7px 11px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: COLOR.textMuted, textTransform: "uppercase" }}>{t.speaker === "ai" ? "AI" : "Farmer"}</div>
                        <div style={{ fontSize: 13 }}>{t.text}</div>
                      </div>
                    ))}
                    {c.transcriptEdited && <div style={{ fontSize: 10.5, color: COLOR.amber, fontWeight: 600 }}>Edited by expert — original preserved</div>}
                  </div>
                )}
              </div>
            )}
          </Card>
          <Card title="Structured information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
              {Object.entries(c.structured).map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 11, color: COLOR.textMuted, textTransform: "capitalize" }}>{k}</div><div style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>{v.value} <SourceTag source={v.source} /></div></div>
              ))}
            </div>
          </Card>
          {c.movement.reported && (
            <Card title="Livestock movement">
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{c.movement.previous} <ArrowRight size={14} color={COLOR.forest} /> {c.movement.current}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 8 }}><Field label="Reported date" value={c.movement.date} /><Field label="Source" value={<SourceTag source="Farmer reported" />} /></div>
              <div style={{ fontSize: 12, color: COLOR.textSecondary, marginBottom: 4 }}>{c.movement.connection}</div>
              <div style={{ fontSize: 11, color: COLOR.textMuted }}>Farmer-reported movement — not automatic GPS tracking.</div>
            </Card>
          )}
          <Card title="Expert assessment" right={savedNote && <span style={{ fontSize: 11, color: COLOR.textMuted }}>{savedNote}</span>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["observations", "Observations"], ["assessment", "Assessment"], ["action", "Recommended action"]].map(([key, label]) => (
                <div key={key}><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 4 }}>{label}</div><textarea value={assessment[key]} onChange={(e) => setAssessment((a) => ({ ...a, [key]: e.target.value }))} rows={2} style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} /></div>
              ))}
              <Button variant="primary" small onClick={saveAssessment}>Save assessment</Button>
            </div>
          </Card>
          {c.labReferral && (
            <Card title="Lab referral">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 12 }}><Field label="Sample" value={c.labReferral.sample} /><Field label="Lab" value={c.labReferral.lab} /><Field label="Reason" value={c.labReferral.reason} /><Field label="Collected" value={c.labReferral.collectedAt} /></div>
              {c.labReferral.stage === "RESULT_PENDING" ? <Badge fg={COLOR.clay} bg={COLOR.clayTint}>Result pending</Badge> : (
                <div style={{ borderTop: `1px solid ${COLOR.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Lab result</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 10 }}><Field label="Result" value={c.labReferral.result} /><Field label="Date" value={c.labReferral.resultDate} /></div>
                  <div style={{ display: "flex", gap: 8 }}><Button variant="ghost" small onClick={() => showToast("Opening report.pdf")}>View result</Button><Button variant="ghost" small onClick={() => showToast("Note added")}>Add clinical note</Button></div>
                </div>
              )}
            </Card>
          )}
        </div>
        <div>
          <Card title="Contact">
            <ContactFarmerPanel caseObj={c} onOutcome={handleCallOutcome} />
            {c.callback && <div style={{ marginTop: 12, fontSize: 12, color: COLOR.orange, background: COLOR.orangeTint, borderRadius: 8, padding: 10 }}>Callback requested at {c.callback.requestedAt} · {c.callback.preferred}</div>}
          </Card>
          <Card title="Risk assessment">
            <RiskBadge level={c.risk} />
            <div style={{ margin: "10px 0" }}>{c.riskReasons.map((r, i) => <div key={i} style={{ fontSize: 12.5, marginBottom: 4 }}>✓ {r}</div>)}</div>
            <div style={{ fontSize: 11, color: COLOR.textMuted, marginBottom: 8 }}>Generated using configured triage rules. Veterinary assessment required.</div>
            <Button variant="ghost" small onClick={() => setShowRule((s) => !s)}>{showRule ? "Hide rule" : "View rule details"}</Button>
            {showRule && <div style={{ marginTop: 8, background: COLOR.surfaceSunken, borderRadius: 8, padding: 10, fontSize: 11.5, fontFamily: "monospace", color: COLOR.textSecondary }}>IF symptom_count ≥ 2 AND duration &gt; 48h<br />THEN risk = {c.risk}</div>}
          </Card>
          {c.cluster && (
            <Card title="Local cluster context">
              <div style={{ fontSize: 12.5, marginBottom: 8 }}>This case is associated with <strong>{c.cluster.relatedReports} similar reports</strong> in {c.cluster.block} Block.</div>
              <Badge fg={COLOR.amber} bg={COLOR.amberTint}>Under authority review</Badge>
              <div style={{ fontSize: 10.5, color: COLOR.textMuted, marginTop: 8 }}>Potential reporting pattern — not a confirmed outbreak.</div>
            </Card>
          )}
          <Card title="Case timeline">
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{c.history.map((h, i) => <div key={i} style={{ display: "flex", gap: 10 }}><div style={{ fontSize: 11, color: COLOR.textMuted, width: 42, flexShrink: 0 }}>{h.time}</div><div style={{ fontSize: 12 }}>{h.label}</div></div>)}</div>
          </Card>
          {c.resolution && <Card title="Resolution"><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{c.resolution.type}</div><div style={{ fontSize: 12.5, color: COLOR.textSecondary }}>{c.resolution.notes}</div></Card>}
        </div>
      </div>
      {labModal && <LabReferralModal onClose={() => setLabModal(false)} onSubmit={submitLabReferral} />}
      {resolveModal && <ResolveModal onClose={() => setResolveModal(false)} onSubmit={submitResolve} />}
    </div>
  );
}

function ExpertAdvisoriesPage({ advisories, setAdvisories, showToast }) {
  const [area, setArea] = useState("Sanganer Block");
  const [message, setMessage] = useState("");
  const myDrafts = advisories["Pending approval"].filter((d) => d.from === LOGGED_IN_EXPERT);
  const save = () => {
    if (!message.trim()) return;
    setAdvisories((prev) => ({ ...prev, "Pending approval": [{ id: `AD-${Math.floor(Math.random() * 90 + 10)}`, title: "Draft advisory", area, animal: "Cattle", language: "Hindi", message, from: LOGGED_IN_EXPERT }, ...prev["Pending approval"]] }));
    setMessage("");
    showToast("Draft saved — awaiting authority approval");
  };
  return (
    <div>
      <Card title="Draft advisory">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <LabeledInput label="Target area" value={area} onChange={setArea} />
          <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Message</div><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Please monitor livestock for…" style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13, fontFamily: "inherit" }} /></div>
          <Button variant="primary" icon={Megaphone} onClick={save}>Save draft</Button>
        </div>
      </Card>
      <Card title="My drafts">
        {myDrafts.length === 0 ? <EmptyState title="No drafts yet" body="Advisories you draft will appear here." /> : myDrafts.map((d) => (
          <div key={d.id} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 13, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12.5, fontWeight: 700 }}>{d.area}</span><Badge fg={COLOR.amber} bg={COLOR.amberTint}>Awaiting authority approval</Badge></div>
            <div style={{ fontSize: 12.5, color: COLOR.textSecondary }}>{d.message}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ExpertProfilePage({ availability }) {
  const AVAIL_LABEL = { AVAILABLE: "Available", BUSY: "Busy", OFFLINE: "Offline", ON_LEAVE: "On leave" };
  return (
    <Card title="Profile">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
        <Field label="Name" value={LOGGED_IN_EXPERT} /><Field label="Role" value="Veterinary Officer" />
        <Field label="Specialization" value="Livestock (Cattle & Buffalo)" /><Field label="District" value="Jaipur" />
        <Field label="Block" value="Sanganer" /><Field label="Phone" value="•••• 2210" />
        <Field label="Languages" value="Hindi / English" /><Field label="Availability" value={AVAIL_LABEL[availability]} />
      </div>
    </Card>
  );
}

function ExpertRole({ cases, updateCase, advisories, setAdvisories, showToast }) {
  const [nav, setNav] = useState("overview");
  const [openId, setOpenId] = useState(null);
  const [availability, setAvailability] = useState("AVAILABLE");

  const openCase = (c) => setOpenId(c.id);
  const closeCase = () => setOpenId(null);
  const acceptCase = (id) => { updateCase(id, { bucket: "active", status: "IN_PROGRESS", expert: LOGGED_IN_EXPERT }); setOpenId(id); showToast("Case accepted"); };
  const current = cases.find((c) => c.id === openId);
  const mine = (c) => c.expert === LOGGED_IN_EXPERT;
  const byBucket = (b) => cases.filter((c) => c.bucket === b && mine(c));

  return (
    <div style={{ display: "flex" }}>
      <ExpertSidebar nav={nav} setNav={(n) => { setNav(n); setOpenId(null); }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <ExpertHeader availability={availability} setAvailability={setAvailability} />
        <div style={{ padding: 24, maxWidth: 1120, margin: "0 auto" }}>
          {current ? (
            <ExpertCaseDetail c={current} onBack={closeCase} onAccept={acceptCase} onUpdate={updateCase} showToast={showToast} />
          ) : (
            <>
              {nav === "overview" && <ExpertOverview cases={cases} onOpen={openCase} onAccept={acceptCase} />}
              {nav === "incoming" && <ExpertCaseListPage title="Incoming cases" cases={cases.filter((c) => c.bucket === "incoming" && (c.expert === null || c.expert === LOGGED_IN_EXPERT))} onOpen={openCase} emptyTitle="You're all caught up" emptyBody="No incoming cases right now." rightSlotFor={(c) => c.autoAssigned ? <Badge fg={COLOR.blue} bg={COLOR.blueTint}>Assigned to you</Badge> : <Button variant="primary" small onClick={(e) => { e.stopPropagation(); acceptCase(c.id); }}>Accept</Button>} />}
              {nav === "cases" && <ExpertCaseListPage title="My cases" cases={byBucket("active")} onOpen={openCase} emptyTitle="No active cases" emptyBody="All assigned cases are currently resolved." />}
              {nav === "callbacks" && <ExpertCaseListPage title="Callbacks" cases={byBucket("callback")} onOpen={openCase} emptyTitle="No pending callbacks" emptyBody="You're all caught up." />}
              {nav === "lab" && <ExpertCaseListPage title="Lab referrals" cases={byBucket("lab")} onOpen={openCase} emptyTitle="No pending laboratory referrals" emptyBody="Nothing referred right now." rightSlotFor={(c) => <Badge fg={c.labReferral.stage === "RESULT_RECEIVED" ? COLOR.green : COLOR.clay} bg={c.labReferral.stage === "RESULT_RECEIVED" ? COLOR.greenTint : COLOR.clayTint}>{c.labReferral.stage === "RESULT_RECEIVED" ? "Result received" : "Result pending"}</Badge>} />}
              {nav === "history" && <ExpertCaseListPage title="Case history" cases={byBucket("resolved")} onOpen={openCase} emptyTitle="No resolved cases yet" emptyBody="Resolved cases will appear here." />}
              {nav === "advisories" && <ExpertAdvisoriesPage advisories={advisories} setAdvisories={setAdvisories} showToast={showToast} />}
              {nav === "profile" && <ExpertProfilePage availability={availability} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROLE: SURVEILLANCE (Alerts / Clusters / Movement / Analytics / Advisories)
   ============================================================ */

const SURV_STEPS = ["Detected", "Under review", "Investigation", "Verified / Dismissed", "Response"];
function survStepIndex(a) { if (a.status === "VERIFIED" || a.status === "DISMISSED") return 3; if (a.investigation) return 2; if (a.status === "UNDER_REVIEW") return 1; return 0; }

function SurvAlertsPage({ alerts, onUpdate, showToast, openId, setOpenId }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = alerts.filter((a) => {
    if (filter === "Critical" && a.priority !== "CRITICAL") return false;
    if (filter === "High" && a.priority !== "HIGH") return false;
    if (filter === "Potential Clusters" && a.kind !== "cluster") return false;
    if (filter === "Movement" && a.kind !== "movement") return false;
    if (filter === "Resolved" && !["VERIFIED", "DISMISSED"].includes(a.status)) return false;
    const q = search.trim().toLowerCase();
    return !q || `${a.id} ${a.block} ${a.animal}`.toLowerCase().includes(q);
  });
  const open = alerts.find((a) => a.id === openId);
  if (open) return <SurvAlertDetail alert={open} onBack={() => setOpenId(null)} onUpdate={onUpdate} showToast={showToast} />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Alerts</h1>
        <Button variant="secondary" small icon={Download} onClick={() => showToast("Export started")}>Export</Button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {["All", "Critical", "High", "Potential Clusters", "Movement", "Resolved"].map((f) => <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 20, border: `1px solid ${filter === f ? COLOR.forest : COLOR.border}`, background: filter === f ? COLOR.forest : COLOR.surface, color: filter === f ? "#fff" : COLOR.textSecondary, cursor: "pointer" }}>{f}</button>)}
      </div>
      <div style={{ position: "relative", maxWidth: 300, marginBottom: 16 }}>
        <Search size={14} color={COLOR.textMuted} style={{ position: "absolute", left: 10, top: 10 }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts…" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 30px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13 }} />
      </div>
      {filtered.length === 0 ? <EmptyState title="No matching alerts" body="Try a different filter or search term." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((a) => (
            <div key={a.id} onClick={() => setOpenId(a.id)} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{a.kind === "cluster" ? <AlertTriangle size={15} color={COLOR.red} /> : <Radio size={15} color={COLOR.orange} />}<span style={{ fontSize: 14, fontWeight: 700 }}>{a.kind === "cluster" ? "Potential reporting cluster" : "Movement-linked pattern"}</span><span style={{ fontSize: 12, color: COLOR.textMuted }}>#{a.id}</span></div>
                <div style={{ display: "flex", gap: 6 }}><RiskBadge level={a.priority} /><PatternBadge status={a.status} /></div>
              </div>
              <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 6 }}>{a.block} · {a.reports} related reports · ↑ {(((a.reports - a.baseline) / a.baseline) * 100).toFixed(0)}% above baseline</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{a.symptoms.map((s) => <Badge key={s} fg={COLOR.textSecondary} bg={COLOR.surfaceSunken}>{s}</Badge>)}{a.advisorySent && <Badge fg={COLOR.forest} bg={COLOR.forestTint}>📢 Advisory sent</Badge>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SurvAlertDetail({ alert: a, onBack, onUpdate, showToast }) {
  const [confirming, setConfirming] = useState(null);
  const [reason, setReason] = useState("");
  const [investigating, setInvestigating] = useState(false);
  const [officer, setOfficer] = useState("Dr. Sharma");
  const [deadline, setDeadline] = useState("");
  const resolve = (status, extra) => { onUpdate(a.id, { status, ...extra }); setConfirming(null); setReason(""); showToast(status === "DISMISSED" ? "Alert dismissed" : "Alert verified"); };
  const assignInvestigation = () => { onUpdate(a.id, { investigation: { officer, priority: a.priority === "CRITICAL" ? "Urgent" : "High", deadline: deadline || "TBD", stage: "Assigned" }, status: "UNDER_REVIEW" }); setInvestigating(false); showToast("Investigation assigned"); };
  return (
    <div style={{ maxWidth: 940 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLOR.forest, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}><ChevronLeft size={15} /> Back to alerts</button>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: COLOR.textMuted }}>Alert #{a.id}</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 6px" }}>{a.kind === "cluster" ? "Potential reporting cluster" : "Movement-linked reporting pattern"}</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}><RiskBadge level={a.priority} /><PatternBadge status={a.status} /><span style={{ fontSize: 12.5, color: COLOR.textMuted }}>Area: {a.block}</span></div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", margin: "22px 0" }}>
        {SURV_STEPS.map((s, i) => { const idx = survStepIndex(a); return (
          <React.Fragment key={s}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: i <= idx ? COLOR.forest : COLOR.surfaceSunken, color: i <= idx ? "#fff" : COLOR.textMuted, fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i < idx ? "✓" : i + 1}</div>
              <span style={{ fontSize: 10, textAlign: "center", color: i <= idx ? COLOR.text : COLOR.textMuted, maxWidth: 76 }}>{s}</span>
            </div>
            {i < SURV_STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < idx ? COLOR.forest : COLOR.border, marginBottom: 16 }} />}
          </React.Fragment>
        ); })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div>
          <Card title="Map"><MiniMap highlight={a.highlightVillage} /></Card>
          <Card title="Why was this flagged?">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, fontSize: 13 }}>
              <div>• Similar reports increased {(((a.reports - a.baseline) / a.baseline) * 100).toFixed(0)}% above the historical baseline</div>
              <div>• Reports are geographically concentrated in {a.block}</div>
              <div>• Reports occurred within a {a.timeWindow} window</div>
              {a.movementLinks > 0 && <div>• {a.movementLinks} farmer-reported livestock movement{a.movementLinks > 1 ? "s" : ""} linked to the area</div>}
            </div>
            <div style={{ fontSize: 11.5, color: COLOR.textMuted, background: COLOR.surfaceSunken, borderRadius: 8, padding: 10 }}>Analytics indicate an unusual reporting pattern. This does not confirm an outbreak — veterinary/authority verification is required.</div>
          </Card>
          {a.relatedCase && (
            <Card title="Related case">
              <div style={{ fontSize: 13, marginBottom: 10 }}>This pattern is linked to case <strong style={{ color: COLOR.forest }}>#{a.relatedCase}</strong>, visible in the Expert and Authority views.</div>
            </Card>
          )}
          {a.status === "VERIFIED" && <Card title="Verification"><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 10 }}><Field label="Verified by" value={a.verifiedBy} /><Field label="Date" value={a.verifiedDate} /></div><div style={{ fontSize: 12.5, color: COLOR.textSecondary }}>{a.verificationNotes}</div></Card>}
          {a.status === "DISMISSED" && <Card title="Dismissal"><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}><Field label="Reason" value={a.dismissReason} /><Field label="Dismissed by" value={a.dismissedBy} /></div></Card>}
        </div>
        <div>
          <Card title="Summary">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
              <Field label="Reports" value={a.reports} /><Field label="Baseline" value={`${a.baseline}/week`} />
              <Field label="Animal" value={a.animal} /><Field label="Movement links" value={a.movementLinks} />
              <Field label="First reported" value={a.firstReported} /><Field label="Latest report" value={a.latestReport} />
            </div>
            <div style={{ marginTop: 12 }}><div style={{ fontSize: 11, color: COLOR.textMuted, marginBottom: 4 }}>Common symptoms</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{a.symptoms.map((s) => <Badge key={s} fg={COLOR.textSecondary} bg={COLOR.surfaceSunken}>{s}</Badge>)}</div></div>
          </Card>
          <Card title="Investigation">
            {a.investigation ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}><Field label="Officer" value={a.investigation.officer} /><Field label="Priority" value={a.investigation.priority} /><Field label="Deadline" value={a.investigation.deadline} /><Field label="Stage" value={a.investigation.stage} /></div>
            ) : investigating ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 4 }}>Officer</div><input value={officer} onChange={(e) => setOfficer(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13 }} /></div>
                <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 4 }}>Deadline</div><input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="e.g. 3 Sep" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13 }} /></div>
                <Button variant="primary" small onClick={assignInvestigation}>Assign</Button>
              </div>
            ) : <div style={{ fontSize: 12.5, color: COLOR.textSecondary }}>Not yet assigned. <button onClick={() => setInvestigating(true)} style={{ background: "none", border: "none", color: COLOR.forest, fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>Assign investigation →</button></div>}
          </Card>
          <Card title="Actions">
            {confirming ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{confirming === "dismiss" ? "Dismiss this alert?" : "Confirm verification"}</div>
                {confirming === "dismiss" ? (
                  <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13, marginBottom: 10 }}><option value="">Select a reason…</option>{["Duplicate reports", "Seasonal pattern", "Data quality issue", "Already investigated", "Other"].map((o) => <option key={o}>{o}</option>)}</select>
                ) : <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Verification notes…" style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13, fontFamily: "inherit", marginBottom: 10 }} />}
                <div style={{ display: "flex", gap: 8 }}><Button variant="primary" small disabled={!reason} onClick={() => resolve(confirming === "dismiss" ? "DISMISSED" : "VERIFIED", confirming === "dismiss" ? { dismissReason: reason, dismissedBy: "You" } : { verifiedBy: "You", verifiedDate: "today", verificationNotes: reason })}>Confirm</Button><Button variant="ghost" small onClick={() => setConfirming(null)}>Cancel</Button></div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Button variant="ghost" small onClick={() => setConfirming("dismiss")}>Dismiss</Button>
                <Button variant="secondary" small onClick={() => setConfirming("verify")}>Verify / confirm</Button>
                <Button variant="primary" small icon={Megaphone} onClick={() => { onUpdate(a.id, { advisorySent: true }); showToast("Advisory queued — see Advisories"); }}>Send advisory</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SurvClustersPage({ alerts, onOpenAlert }) {
  const [advanced, setAdvanced] = useState(false);
  const clusters = alerts.filter((a) => a.kind === "cluster");
  const stats = { total: clusters.length, new: clusters.filter((c) => c.status === "POTENTIAL_CLUSTER").length, underReview: clusters.filter((c) => c.status === "UNDER_REVIEW").length, resolved: clusters.filter((c) => ["VERIFIED", "DISMISSED"].includes(c.status)).length };
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Cluster analysis</h1>
      <Card title="Controls">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 10 }}><Field label="Distance" value="10 km" /><Field label="Time window" value="7 days" /><Field label="Minimum reports" value="5" /><Field label="Animal" value="All" /></div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: COLOR.textSecondary }}>Reports are grouped when similar cases occur close together within the selected geographic and time range.</div>
        <button onClick={() => setAdvanced((a) => !a)} style={{ marginTop: 8, background: "none", border: "none", color: COLOR.forest, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>{advanced ? "Hide" : "Advanced analysis"}</button>
        {advanced && <div style={{ marginTop: 10, background: COLOR.surfaceSunken, borderRadius: 8, padding: 12, fontSize: 12, fontFamily: "monospace", color: COLOR.textSecondary }}>Method: DBSCAN<br />eps: 10 km<br />min_samples: 5</div>}
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 14 }}>
        {[["Potential clusters", stats.total, COLOR.red], ["New", stats.new, COLOR.orange], ["Under review", stats.underReview, COLOR.amber], ["Resolved", stats.resolved, COLOR.green]].map(([label, value, c]) => (
          <div key={label} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 15 }}><div style={{ fontSize: 22, fontWeight: 700, color: c }}>{value}</div><div style={{ fontSize: 12, color: COLOR.textSecondary, marginTop: 2 }}>{label}</div></div>
        ))}
      </div>
      <Card title="Clusters">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clusters.map((c) => (
            <div key={c.id} onClick={() => onOpenAlert(c.id)} style={{ display: "flex", alignItems: "center", gap: 14, border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 13, cursor: "pointer" }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.block} <span style={{ color: COLOR.textMuted, fontWeight: 500 }}>#{c.id}</span></div><div style={{ fontSize: 12, color: COLOR.textSecondary }}>{c.reports} reports · {c.animal}</div></div>
              <RiskBadge level={c.priority} /><PatternBadge status={c.status} /><ChevronRight size={16} color={COLOR.textMuted} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SurvMovementPage() {
  const [openId, setOpenId] = useState(null);
  const open = MOVEMENTS.find((m) => m.id === openId);
  const stats = { reported: 42, fromHighRisk: 8, connected: 5, recent: 12 };
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Livestock movement</h1>
      <div style={{ fontSize: 13, color: COLOR.textSecondary, marginBottom: 16, maxWidth: 620 }}>Farmer-reported animal movements that may help identify connected reporting areas — not automatic GPS tracking.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 16 }}>
        {[["Reported movements", stats.reported], ["From high-risk areas", stats.fromHighRisk], ["Potentially connected areas", stats.connected], ["Recent movements", stats.recent]].map(([l, v]) => (
          <div key={l} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 15 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 12, color: COLOR.textSecondary, marginTop: 2 }}>{l}</div></div>
        ))}
      </div>
      {open ? (
        <Card title={`Movement #${open.id}`} right={<button onClick={() => setOpenId(null)} style={{ background: "none", border: "none", color: COLOR.forest, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Close</button>}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
            <MiniMap highlight={open.destination} />
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: 12 }}>
                <Field label="Animal" value={open.animal} /><Field label="Movement date" value={open.date} /><Field label="Origin" value={open.origin} /><Field label="Destination" value={open.destination} />
                <Field label="Source" value={open.source} /><Field label="Associated case" value={`#${open.caseId}`} /><Field label="Destination reports" value={open.destinationReports} /><Field label="Potential connection" value={open.connected ? "Yes" : "No"} />
              </div>
              <div style={{ fontSize: 12, color: COLOR.textSecondary, background: COLOR.surfaceSunken, borderRadius: 8, padding: 10 }}>{open.connected ? "Similar livestock-health reports have been recorded in the destination area — a potentially connected reporting pattern, not proof of transmission." : "No elevated reporting pattern found in the destination area."}</div>
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Reported movements">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `1px solid ${COLOR.border}` }}>{["ID", "Animal", "Origin", "Destination", "Date", "Case", "Risk"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>{h}</th>)}</tr></thead>
              <tbody>{MOVEMENTS.map((m) => (
                <tr key={m.id} onClick={() => setOpenId(m.id)} style={{ borderBottom: `1px solid ${COLOR.border}`, cursor: "pointer" }}>
                  <td style={{ padding: "10px", fontWeight: 600, color: COLOR.forest }}>{m.id}</td><td style={{ padding: "10px" }}>{m.animal}</td><td style={{ padding: "10px" }}>{m.origin}</td>
                  <td style={{ padding: "10px", display: "flex", alignItems: "center", gap: 5 }}><ArrowRight size={11} color={COLOR.forest} />{m.destination}</td>
                  <td style={{ padding: "10px", color: COLOR.textSecondary }}>{m.date}</td><td style={{ padding: "10px", color: COLOR.forest }}>#{m.caseId}</td><td style={{ padding: "10px" }}><RiskBadge level={m.risk} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SurvAnalyticsPage() {
  const [range, setRange] = useState("7 days");
  const totalReports = 1284;
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 16px" }}>Analytics</h1>
      <Card title="Reporting trend" right={<div style={{ display: "flex", gap: 4 }}>{Object.keys(TREND_RANGES).map((r) => <button key={r} onClick={() => setRange(r)} style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 14, border: `1px solid ${range === r ? COLOR.forest : COLOR.border}`, background: range === r ? COLOR.forestTint : "transparent", color: range === r ? COLOR.forest : COLOR.textMuted, cursor: "pointer" }}>{r}</button>)}</div>}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={TREND_RANGES[range]} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} vertical={false} />
            <XAxis dataKey="d" tick={{ fontSize: 11, fill: COLOR.textMuted }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: COLOR.textMuted }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<CustomTrendTooltip />} />
            <Line type="monotone" dataKey="v" stroke={COLOR.forest} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Animal category distribution"><BarList items={ANIMAL_DIST} color={COLOR.clay} /></Card>
        <Card title="Symptom analysis"><BarList items={TOP_ISSUES} showPct total={totalReports} /></Card>
      </div>
      <Card title="Risk trend">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={RISK_TREND} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} vertical={false} />
            <XAxis dataKey="wk" tick={{ fontSize: 11, fill: COLOR.textMuted }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: COLOR.textMuted }} axisLine={false} tickLine={false} width={30} />
            <Tooltip />
            <Line type="monotone" dataKey="LOW" stroke={RISK.LOW.fg} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="MEDIUM" stroke={RISK.MEDIUM.fg} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="HIGH" stroke={RISK.HIGH.fg} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="CRITICAL" stroke={RISK.CRITICAL.fg} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>{Object.entries(RISK).map(([k, v]) => <span key={k} style={{ fontSize: 11, color: COLOR.textSecondary, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: v.fg, display: "inline-block" }} />{v.label}</span>)}</div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Mortality analytics">
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}><span style={{ fontSize: 26, fontWeight: 700 }}>18</span><span style={{ fontSize: 12.5, fontWeight: 600, color: COLOR.red }}>↑ 28% vs previous period</span></div>
          <ResponsiveContainer width="100%" height={90}><LineChart data={MORTALITY_TREND.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}><Line type="monotone" dataKey="v" stroke={COLOR.orange} strokeWidth={2} dot={false} /><YAxis hide domain={["dataMin-2", "dataMax+2"]} /></LineChart></ResponsiveContainer>
          <div style={{ fontSize: 11, color: COLOR.textMuted, marginTop: 6 }}>Reported mortality — not attributed to a specific cause unless verified.</div>
        </Card>
        <Card title="Historical baseline">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 10 }}><Field label="Normal weekly avg" value="8" /><Field label="Current (Sanganer)" value="27" /><Field label="Change" value="+237%" /></div>
          <div style={{ fontSize: 11.5, color: COLOR.textMuted }}>Current reports are compared with historical reporting patterns for the selected area. This alone does not prove an outbreak.</div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Response performance">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Field label="Avg. assignment time" value="7 min" /><Field label="Avg. expert response" value="14 min" /><Field label="Avg. resolution time" value="1.8 days" /><Field label="Resolved" value="86%" /><Field label="High-risk pending" value="6" /><Field label="Lab referrals pending" value="2" /></div>
        </Card>
        <Card title="Alert performance">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Field label="Potential clusters" value="12" /><Field label="Reviewed" value="9" /><Field label="Verified" value="3" /><Field label="Dismissed" value="6" /></div>
        </Card>
      </div>
      <Card title="Data quality">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 14 }}><Field label="Complete reports" value="92%" /><Field label="Missing location" value="4%" /><Field label="Missing symptom details" value="3%" /><Field label="Possible duplicates" value="1%" /></div>
      </Card>
    </div>
  );
}

function SurvAdvisoriesPage({ advisories, setAdvisories, showToast }) {
  const [tab, setTab] = useState("Pending approval");
  const [createOpen, setCreateOpen] = useState(false);
  const submitAdvisory = (draft, sendNow) => {
    if (sendNow) {
      setAdvisories((prev) => ({ ...prev, Sent: [{ ...draft, id: `AD-${Math.floor(Math.random() * 90 + 10)}`, recipients: 1284, delivered: 1201, pending: 48, failed: 35, date: "today" }, ...prev.Sent] }));
      showToast("Advisory sent"); setTab("Sent");
    } else {
      setAdvisories((prev) => ({ ...prev, "Pending approval": [{ ...draft, id: `AD-${Math.floor(Math.random() * 90 + 10)}` }, ...prev["Pending approval"]] }));
      showToast("Submitted for approval"); setTab("Pending approval");
    }
    setCreateOpen(false);
  };
  const tabs = Object.keys(advisories);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Advisory center</h1>
        <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>Create advisory</Button>
      </div>
      <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${COLOR.border}`, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 4px", marginRight: 18, background: "none", border: "none", borderBottom: tab === t ? `2px solid ${COLOR.forest}` : "2px solid transparent", color: tab === t ? COLOR.forest : COLOR.textSecondary, fontWeight: tab === t ? 700 : 500, fontSize: 13.5, cursor: "pointer" }}>{t} ({advisories[t].length})</button>)}
      </div>
      {advisories[tab].length === 0 ? <EmptyState title="Nothing here" body="No advisories in this stage." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {advisories[tab].map((ad) => (
            <Card key={ad.id} pad={16}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{ad.title}</div><Badge fg={COLOR.textSecondary} bg={COLOR.surfaceSunken}>{ad.language}</Badge></div>
              <div style={{ fontSize: 12, color: COLOR.textMuted, marginBottom: 8 }}>{ad.area} · {ad.animal}</div>
              {ad.message && <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{ad.message}</div>}
              {ad.recipients && <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, background: COLOR.surfaceSunken, borderRadius: 8, padding: 10 }}><Field label="Recipients" value={ad.recipients} /><Field label="Delivered" value={ad.delivered} /><Field label="Pending" value={ad.pending} /><Field label="Failed" value={ad.failed} /></div>}
            </Card>
          ))}
        </div>
      )}
      {createOpen && <CreateAdvisoryModal onClose={() => setCreateOpen(false)} onSubmit={submitAdvisory} />}
    </div>
  );
}

function CreateAdvisoryModal({ onClose, onSubmit }) {
  const [step, setStep] = useState("form");
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("Sanganer Block");
  const [animal, setAnimal] = useState("Cattle");
  const [language, setLanguage] = useState("Hindi");
  const [message, setMessage] = useState("");
  const [sms, setSms] = useState(true);
  if (step === "preview") {
    return (
      <Modal title="Preview advisory" onClose={onClose}>
        <div style={{ background: COLOR.surfaceSunken, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.forest, marginBottom: 6 }}>📱 Kisan Seva</div>
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>{message}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 16 }}><Field label="Target" value={area} /><Field label="Language" value={language} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => setStep("form")}>Edit</Button>
          <Button variant="secondary" onClick={() => onSubmit({ title, area, animal, language, message }, false)}>Submit for approval</Button>
          <Button variant="primary" icon={Send} onClick={() => onSubmit({ title, area, animal, language, message }, true)}>Approve &amp; send</Button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="Create advisory" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LabeledInput label="Title" value={title} onChange={setTitle} placeholder="Livestock health advisory" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <LabeledInput label="Target area" value={area} onChange={setArea} />
          <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Animal category</div><select value={animal} onChange={(e) => setAnimal(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13 }}>{["Cattle", "Buffalo", "Goat", "Sheep", "Poultry", "All"].map((a) => <option key={a}>{a}</option>)}</select></div>
        </div>
        <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Language</div><select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13 }}>{["Hindi", "English"].map((l) => <option key={l}>{l}</option>)}</select></div>
        <div><div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Message</div><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13, fontFamily: "inherit" }} /></div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} /> Deliver via SMS</label>
        <Button variant="primary" disabled={!message.trim()} onClick={() => setStep("preview")}>Preview</Button>
      </div>
    </Modal>
  );
}

function SurveillanceRole({ alerts, updateAlert, advisories, setAdvisories, showToast }) {
  const [nav, setNav] = useState("alerts");
  const [openAlertId, setOpenAlertId] = useState(null);
  const items = [
    { id: "alerts", label: "Alerts", icon: AlertTriangle }, { id: "clusters", label: "Clusters", icon: Layers },
    { id: "movement", label: "Livestock movement", icon: ArrowRight }, { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "advisories", label: "Advisories", icon: Megaphone },
  ];
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${COLOR.border}`, padding: "16px 10px" }}>
        {items.map((it) => <button key={it.id} onClick={() => setNav(it.id)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: nav === it.id ? 700 : 500, background: nav === it.id ? COLOR.forestTint : "transparent", color: nav === it.id ? COLOR.forest : COLOR.textSecondary, marginBottom: 2 }}><it.icon size={14} /> {it.label}</button>)}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: 24, maxWidth: 1180, margin: "0 auto" }}>
        {nav === "alerts" && <SurvAlertsPage alerts={alerts} onUpdate={updateAlert} showToast={showToast} openId={openAlertId} setOpenId={setOpenAlertId} />}
        {nav === "clusters" && <SurvClustersPage alerts={alerts} onOpenAlert={(id) => { setOpenAlertId(id); setNav("alerts"); }} />}
        {nav === "movement" && <SurvMovementPage />}
        {nav === "analytics" && <SurvAnalyticsPage />}
        {nav === "advisories" && <SurvAdvisoriesPage advisories={advisories} setAdvisories={setAdvisories} showToast={showToast} />}
      </div>
    </div>
  );
}

/* ============================================================
   ROLE: ADMIN CONSOLE
   ============================================================ */

function AdminOverview() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 16 }}>
        {ADMIN_KPIS.map((k) => <div key={k.label} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 15 }}><div style={{ fontSize: 20, fontWeight: 700 }}>{k.value}</div><div style={{ fontSize: 11.5, color: COLOR.textSecondary, marginTop: 2 }}>{k.label}</div></div>)}
      </div>
      <Card title="System health">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
          {SYSTEM_HEALTH.map((s) => (
            <div key={s.name} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 9, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span><StatusDot status={s.status} /></div>
              <div style={{ fontSize: 11.5, color: s.status === "Degraded" ? COLOR.amber : COLOR.textSecondary }}>{s.status} · {s.ms} ms</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminUsersPage({ showToast }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [confirmDisable, setConfirmDisable] = useState(null);
  const roles = ["All", ...new Set(USERS.map((u) => u.role))];
  const filtered = USERS.filter((u) => (roleFilter === "All" || u.role === roleFilter) && u.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Users</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" style={{ flex: "1 1 200px", padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13 }} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13 }}>{roles.map((r) => <option key={r}>{r}</option>)}</select>
      </div>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `1px solid ${COLOR.border}` }}>{["Name", "Role", "Location", "Status", "Last active", "Actions"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.name} style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <td style={{ padding: "9px 10px", fontWeight: 600 }}>{u.name}</td><td style={{ padding: "9px 10px" }}>{u.role}</td>
                <td style={{ padding: "9px 10px", color: COLOR.textSecondary }}>{u.location}</td>
                <td style={{ padding: "9px 10px" }}><Badge fg={u.status === "Active" ? COLOR.green : COLOR.textMuted} bg={u.status === "Active" ? COLOR.greenTint : COLOR.surfaceSunken}>{u.status}</Badge></td>
                <td style={{ padding: "9px 10px", color: COLOR.textSecondary }}>{u.lastActive}</td>
                <td style={{ padding: "9px 10px", display: "flex", gap: 6 }}>
                  <Button variant="ghost" small onClick={() => showToast(`Viewing ${u.name}`)}>View</Button>
                  <Button variant="ghost" small onClick={() => showToast(`Editing ${u.name}`)}>Edit</Button>
                  <Button variant="danger" small onClick={() => setConfirmDisable(u.name)}>{u.status === "Active" ? "Disable" : "Enable"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {confirmDisable && (
        <Modal title={`Change status for ${confirmDisable}?`} onClose={() => setConfirmDisable(null)} width={400}>
          <div style={{ fontSize: 13.5, color: COLOR.textSecondary, marginBottom: 18 }}>This will change what {confirmDisable} can access. This action can be reversed later.</div>
          <div style={{ display: "flex", gap: 8 }}><Button variant="danger" small onClick={() => { showToast("Status updated"); setConfirmDisable(null); }}>Confirm</Button><Button variant="ghost" small onClick={() => setConfirmDisable(null)}>Cancel</Button></div>
        </Modal>
      )}
    </div>
  );
}

function AdminExpertsPage() {
  const stats = { total: EXPERTS_DIR.length, available: EXPERTS_DIR.filter((e) => e.availability === "AVAILABLE").length, busy: EXPERTS_DIR.filter((e) => e.availability === "BUSY").length, offline: EXPERTS_DIR.filter((e) => e.availability === "OFFLINE").length };
  const AVAIL_COLOR = { AVAILABLE: COLOR.green, BUSY: COLOR.amber, OFFLINE: COLOR.textMuted };
  const AVAIL_LABEL = { AVAILABLE: "Available", BUSY: "Busy", OFFLINE: "Offline" };
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Expert network</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 16 }}>
        {[["Total experts", stats.total], ["Available", stats.available], ["Busy", stats.busy], ["Offline", stats.offline]].map(([l, v]) => <div key={l} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 15 }}><div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 11.5, color: COLOR.textSecondary }}>{l}</div></div>)}
      </div>
      <Card title="Experts">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `1px solid ${COLOR.border}` }}>{["Name", "Specialization", "Area", "Availability", "Cases", "Response time"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>{h}</th>)}</tr></thead>
          <tbody>
            {EXPERTS_DIR.map((e) => (
              <tr key={e.name} style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <td style={{ padding: "9px 10px", fontWeight: 600 }}>{e.name}</td><td style={{ padding: "9px 10px" }}>{e.specialization}</td><td style={{ padding: "9px 10px" }}>{e.area}</td>
                <td style={{ padding: "9px 10px" }}><Badge fg={AVAIL_COLOR[e.availability]} bg={COLOR.surfaceSunken} dot>{AVAIL_LABEL[e.availability]}</Badge></td>
                <td style={{ padding: "9px 10px" }}>{e.cases}</td><td style={{ padding: "9px 10px", color: COLOR.textSecondary }}>{e.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Routing example">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, fontSize: 13 }}>
          <Field label="PIN" value="302001" /><ChevronRight size={14} color={COLOR.textMuted} /><Field label="Mapped area" value="Sanganer" /><ChevronRight size={14} color={COLOR.textMuted} />
          <Field label="Expert pool" value="4" /><ChevronRight size={14} color={COLOR.textMuted} /><Field label="Available" value="2" /><Field label="Primary" value="Dr. Sharma" /><Field label="Fallback" value="Dr. Meena" />
        </div>
      </Card>
    </div>
  );
}

function AdminJurisdictionsPage() {
  const [open, setOpen] = useState({ Jaipur: true, Sanganer: false });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Jurisdictions</h1>
      <Card title="Rajasthan">
        <div style={{ paddingLeft: 4 }}>
          <button onClick={() => toggle("Jaipur")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, padding: "6px 0" }}><ChevronRight size={13} style={{ transform: open.Jaipur ? "rotate(90deg)" : "none" }} /> Jaipur (District)</button>
          {open.Jaipur && (
            <div style={{ paddingLeft: 20 }}>
              {["Sanganer", "Bagru", "Chomu", "Amer", "Phulera"].map((block) => (
                <div key={block}>
                  <button onClick={() => block === "Sanganer" && toggle("Sanganer")} style={{ background: "none", border: "none", cursor: block === "Sanganer" ? "pointer" : "default", display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "5px 0" }}>
                    {block === "Sanganer" && <ChevronRight size={12} style={{ transform: open.Sanganer ? "rotate(90deg)" : "none" }} />} {block} (Block)
                  </button>
                  {block === "Sanganer" && open.Sanganer && <div style={{ paddingLeft: 20, fontSize: 12.5, color: COLOR.textSecondary }}><div style={{ padding: "3px 0" }}>Village A</div><div style={{ padding: "3px 0" }}>Village B</div></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminRulesPage({ showToast }) {
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Risk rules</h1><Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>Add rule</Button></div>
      <Card>
        {RULES.map((r) => (
          <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLOR.border}`, gap: 10 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 12, color: COLOR.textSecondary }}>Action: {r.action}</div></div>
            <RiskBadge level={r.risk} /><Button variant="ghost" small onClick={() => showToast("Editing rule")}>Edit</Button><Button variant="ghost" small onClick={() => showToast("Rule disabled")}>Disable</Button>
          </div>
        ))}
      </Card>
      {adding && (
        <Modal title="Add rule" onClose={() => setAdding(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <LabeledInput label="Rule name" placeholder="e.g. Fever + reduced appetite" value="" onChange={() => {}} />
            <div style={{ background: COLOR.surfaceSunken, borderRadius: 8, padding: 12, fontSize: 12.5 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>IF</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}><select style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLOR.border}`, fontSize: 12.5 }}><option>Symptom = Fever</option></select><span style={{ color: COLOR.textMuted, alignSelf: "center" }}>AND</span><select style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLOR.border}`, fontSize: 12.5 }}><option>Duration &gt; 48h</option></select></div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>THEN</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><select style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLOR.border}`, fontSize: 12.5 }}><option>Risk = High</option></select><select style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLOR.border}`, fontSize: 12.5 }}><option>Priority expert review</option></select></div>
            </div>
            <Button variant="primary" onClick={() => { showToast("Rule saved"); setAdding(false); }}>Save rule</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminIvrAiPage({ showToast }) {
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>IVR &amp; AI services</h1>
      <Card title="IVR settings">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><StatusDot status="Operational" /><span style={{ fontSize: 13, fontWeight: 600 }}>Helpline active</span></div>
        <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 10 }}>Supported languages: Hindi, English</div>
        <div style={{ fontSize: 12, color: COLOR.textMuted, marginBottom: 12 }}>Question flow: Language → Category → Symptoms → Duration → Affected animals → Mortality → Location/PIN → Livestock movement → Expert routing</div>
        <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 4 }}>Example question</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>"Has this animal been moved or sent somewhere else recently?"</div>
          <div style={{ fontSize: 12, color: COLOR.textSecondary }}>Input type: Yes / No / Not sure · Required: Yes</div>
        </div>
      </Card>
      <Card title="AI services">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {[["Speech-to-text", Mic], ["Case summarization", Cpu], ["Text-to-speech", Radio]].map(([name, Icon]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><Icon size={14} color={COLOR.textSecondary} />{name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><StatusDot status="Operational" /><span style={{ fontSize: 12, color: COLOR.textMuted }}>••••••••</span><Button variant="ghost" small onClick={() => showToast("Configuration is managed securely, not shown here")}>Configure</Button></div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 12 }}>Full API keys and secrets are never displayed in the interface.</div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Summary template fields</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{["Animal", "Symptoms", "Duration", "Affected animals", "Mortality", "Location", "Movement", "Additional notes"].map((f) => <Badge key={f} fg={COLOR.textSecondary} bg={COLOR.surfaceSunken}>{f}</Badge>)}</div>
      </Card>
    </div>
  );
}

function AdminNotificationsPage({ showToast }) {
  const [prefs, setPrefs] = useState(() => Object.fromEntries(NOTIF_TYPES.map((t) => [t, { sms: true, pwa: true, dashboard: true, freq: "Immediate" }])));
  const toggle = (t, ch) => setPrefs((p) => ({ ...p, [t]: { ...p[t], [ch]: !p[t][ch] } }));
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Notification settings</h1>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `1px solid ${COLOR.border}` }}><th style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>Alert type</th>{["SMS", "PWA", "Dashboard"].map((c) => <th key={c} style={{ padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>{c}</th>)}<th style={{ padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>Frequency</th></tr></thead>
          <tbody>
            {NOTIF_TYPES.map((t) => (
              <tr key={t} style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <td style={{ padding: "9px 10px" }}>{t}</td>
                {["sms", "pwa", "dashboard"].map((ch) => <td key={ch} style={{ padding: "9px 10px", textAlign: "center" }}><input type="checkbox" checked={prefs[t][ch]} onChange={() => toggle(t, ch)} /></td>)}
                <td style={{ padding: "9px 10px" }}><select value={prefs[t].freq} onChange={(e) => setPrefs((p) => ({ ...p, [t]: { ...p[t], freq: e.target.value } }))} style={{ padding: "5px 7px", borderRadius: 6, border: `1px solid ${COLOR.border}`, fontSize: 12 }}>{["Immediate", "Digest", "Disabled"].map((f) => <option key={f}>{f}</option>)}</select></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14 }}><Button variant="primary" small onClick={() => showToast("Notification preferences saved")}>Save preferences</Button></div>
      </Card>
    </div>
  );
}

function AdminSmsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>SMS delivery</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 16 }}>
        {[["Sent", "3,494"], ["Delivered", "3,381"], ["Pending", "68"], ["Failed", "45"]].map(([l, v]) => <div key={l} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 15 }}><div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 11.5, color: COLOR.textSecondary }}>{l}</div></div>)}
      </div>
      <Card title="Recent messages">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `1px solid ${COLOR.border}` }}>{["Message", "Recipient group", "Date", "Status"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>{h}</th>)}</tr></thead>
          <tbody>{SMS_LOG.map((s, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${COLOR.border}` }}><td style={{ padding: "9px 10px" }}>{s.message}</td><td style={{ padding: "9px 10px", color: COLOR.textSecondary }}>{s.group}</td><td style={{ padding: "9px 10px", color: COLOR.textSecondary }}>{s.date}</td><td style={{ padding: "9px 10px" }}><Badge fg={s.status === "Delivered" ? COLOR.green : COLOR.amber} bg={s.status === "Delivered" ? COLOR.greenTint : COLOR.amberTint}>{s.status}</Badge></td></tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

function AdminAuditPage() {
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Audit logs</h1>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `1px solid ${COLOR.border}` }}>{["Time", "User", "Action", "Object", "Result"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLOR.textMuted }}>{h}</th>)}</tr></thead>
          <tbody>{AUDIT_LOG.map((a, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${COLOR.border}` }}><td style={{ padding: "9px 10px", color: COLOR.textSecondary }}>{a.time}</td><td style={{ padding: "9px 10px", fontWeight: 600 }}>{a.user}</td><td style={{ padding: "9px 10px" }}>{a.action}</td><td style={{ padding: "9px 10px", color: COLOR.forest }}>{a.object}</td><td style={{ padding: "9px 10px" }}>{a.result}</td></tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

function AdminSettingsPage({ a11y, setA11y }) {
  return (
    <div>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Settings</h1>
      <Card title="Profile">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}><Field label="Name" value="System Administrator" /><Field label="Role" value="Admin" /><Field label="District" value="Jaipur" /><Field label="Language" value="English" /></div>
      </Card>
      <Card title="Accessibility">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["Text size", "textLarge", "Normal", "Large"], ["Contrast", "highContrast", "Normal", "High"], ["Motion", "reducedMotion", "Normal", "Reduced"]].map(([label, key, offLabel, onLabel]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <div style={{ display: "flex", gap: 6 }}>{[offLabel, onLabel].map((opt, i) => <button key={opt} onClick={() => setA11y((s) => ({ ...s, [key]: i === 1 }))} style={{ padding: "6px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1px solid ${(i === 1) === a11y[key] ? COLOR.forest : COLOR.border}`, background: (i === 1) === a11y[key] ? COLOR.forestTint : COLOR.surface, color: (i === 1) === a11y[key] ? COLOR.forest : COLOR.textMuted, cursor: "pointer" }}>{opt}</button>)}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLOR.textMuted, marginTop: 12 }}>Text size and contrast apply live across the whole app, not just this console.</div>
      </Card>
      <Card title="Privacy &amp; security">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 13 }}>Call recording</span><Badge fg={COLOR.green} bg={COLOR.greenTint}>Enabled</Badge></div>
        <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 14 }}>Call recording is subject to applicable consent, privacy and regulatory requirements.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>{["Case data", "Call recordings", "Transcripts", "Audit logs"].map((c) => <div key={c} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: 10 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{c}</div><div style={{ fontSize: 11, color: COLOR.textMuted }}>Retention: Configured</div></div>)}</div>
      </Card>
    </div>
  );
}

const ADMIN_NAV = [
  { id: "overview", label: "Overview", icon: Activity }, { id: "users", label: "Users", icon: Users },
  { id: "experts", label: "Experts", icon: ShieldAlert }, { id: "jurisdictions", label: "Jurisdictions", icon: MapPin },
  { id: "rules", label: "Rules", icon: Sliders }, { id: "ivrai", label: "IVR & AI services", icon: Mic },
  { id: "notifications", label: "Notifications", icon: Bell }, { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "audit", label: "Audit logs", icon: ClipboardList }, { id: "settings", label: "Settings", icon: SettingsIcon },
];

function AdminRole({ a11y, setA11y, showToast }) {
  const [nav, setNav] = useState("overview");
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${COLOR.border}`, padding: "16px 10px" }}>
        {ADMIN_NAV.map((it) => <button key={it.id} onClick={() => setNav(it.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: nav === it.id ? 700 : 500, background: nav === it.id ? COLOR.forestTint : "transparent", color: nav === it.id ? COLOR.forest : COLOR.textSecondary, marginBottom: 2 }}><it.icon size={13} /> {it.label}</button>)}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: 24, maxWidth: 1120, margin: "0 auto" }}>
        {nav === "overview" && <AdminOverview />}
        {nav === "users" && <AdminUsersPage showToast={showToast} />}
        {nav === "experts" && <AdminExpertsPage />}
        {nav === "jurisdictions" && <AdminJurisdictionsPage />}
        {nav === "rules" && <AdminRulesPage showToast={showToast} />}
        {nav === "ivrai" && <AdminIvrAiPage showToast={showToast} />}
        {nav === "notifications" && <AdminNotificationsPage showToast={showToast} />}
        {nav === "sms" && <AdminSmsPage />}
        {nav === "audit" && <AdminAuditPage />}
        {nav === "settings" && <AdminSettingsPage a11y={a11y} setA11y={setA11y} />}
      </div>
    </div>
  );
}


/* ============================================================
   ROLE: PUBLIC DASHBOARD (no login required, read-only, aggregated)
   ============================================================ */

const PUBLIC_BLOCKS = ["Sanganer", "Bagru", "Chomu", "Amer", "Phulera"];

const PUBLIC_MAP_CENTER = [26.91, 75.64];
const PUBLIC_MAP_ZOOM = 10;
const PUBLIC_MAP_COORDS = {
  Chomu: [27.17, 75.72], Amer: [26.985, 75.85], Phulera: [26.87, 75.24],
  Bagru: [26.82, 75.55], Sanganer: [26.82, 75.77],
  "Village A": [26.84, 75.72], "Village B": [26.80, 75.84],
};
const PUBLIC_MAP_ZONES = [
  { name: "Sanganer high-risk zone", center: [26.82, 75.77], radius: 42, color: "#C83F35", type: "High reporting" },
  { name: "Phulera high-risk zone", center: [26.87, 75.24], radius: 34, color: "#C83F35", type: "High reporting" },
  { name: "Bagru medium-risk zone", center: [26.82, 75.55], radius: 31, color: "#D39A24", type: "Medium reporting" },
  { name: "Amer medium-risk zone", center: [26.985, 75.85], radius: 28, color: "#D39A24", type: "Medium reporting" },
  { name: "Chomu medium-risk zone", center: [27.17, 75.72], radius: 30, color: "#D39A24", type: "Medium reporting" },
  { name: "Kalwar crop reporting area", center: [27.07, 75.67], radius: 25, color: "#3279B4", type: "Crop-related reports" },
  { name: "Kukas crop reporting area", center: [27.03, 75.90], radius: 27, color: "#3279B4", type: "Crop-related reports" },
  { name: "Dudu crop reporting area", center: [26.73, 75.57], radius: 24, color: "#3279B4", type: "Crop-related reports" },
];

function PublicMapViewport({ selected }) {
  const map = useMap();
  useEffect(() => {
    const selectedCoords = PUBLIC_MAP_COORDS[selected];
    if (selectedCoords) map.flyTo(selectedCoords, 12, { duration: 0.6 });
  }, [map, selected]);
  return null;
}

function PublicMap({ selected, onSelect }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 10 }}>
      <MapContainer center={PUBLIC_MAP_CENTER} zoom={PUBLIC_MAP_ZOOM} scrollWheelZoom style={{ width: "100%", height: 360 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PublicMapViewport selected={selected} />
        {PUBLIC_MAP_ZONES.map((zone) => (
          <CircleMarker
            key={zone.name}
            center={zone.center}
            radius={zone.radius}
            pathOptions={{ color: zone.color, weight: 1.5, fillColor: zone.color, fillOpacity: 0.2 }}
          >
            <Popup>
              <strong>{zone.name}</strong>
              <br />{zone.type}
              <br />Aggregated map area
            </Popup>
          </CircleMarker>
        ))}
        {VILLAGES.filter((v) => v.kind !== "SATELLITE").map((v) => {
          const coords = PUBLIC_MAP_COORDS[v.name];
          const isSelected = v.name === selected;
          return (
            <CircleMarker
              key={v.name}
              center={coords}
              radius={isSelected ? 11 : 8}
              pathOptions={{ color: "#fff", weight: 2, fillColor: VILLAGE_COLOR[v.kind], fillOpacity: 0.9 }}
              eventHandlers={{ click: () => onSelect(v.name) }}
            >
              <Popup>
                <strong>{v.name}</strong>
                <br />Area-level reporting data
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 1000, background: "rgba(255,255,255,0.94)", border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 11.5, lineHeight: 1.5, color: COLOR.text }}>
        {["#C83F35|High reporting", "#D39A24|Medium reporting", "#3279B4|Crop-related reports"].map((item) => {
          const [color, label] = item.split("|");
          return <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: color, opacity: 0.75 }} />{label}</div>;
        })}
      </div>
    </div>
  );
}

function computeAreaStats(cases, alerts, block) {
  const blockCases = cases.filter((c) => c.location && c.location.startsWith(block));
  const total = blockCases.length;
  const resolved = blockCases.filter((c) => c.status === "RESOLVED").length;
  const active = blockCases.filter((c) => !["RESOLVED", "CLOSED"].includes(c.status)).length;
  const blockAlerts = alerts.filter((a) => a.block && a.block.startsWith(block));
  const potentialClusters = blockAlerts.filter((a) => !["DISMISSED"].includes(a.status)).length;
  const animalCounts = {};
  blockCases.forEach((c) => { animalCounts[c.animal] = (animalCounts[c.animal] || 0) + 1; });
  const topAnimal = Object.entries(animalCounts).sort((a, b) => b[1] - a[1])[0];
  return { total, resolved, active, potentialClusters, topAnimal: topAnimal ? topAnimal[0] : "—", blockAlerts };
}

function PublicHeader({ onSignInClick }) {
  return (
    <div style={{ borderBottom: `1px solid ${COLOR.border}`, background: COLOR.surface, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: COLOR.forest, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>K</div>
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>Kisan Seva</span>
        <Badge fg={COLOR.blue} bg={COLOR.blueTint}>Public Dashboard</Badge>
      </div>
      <Button variant="secondary" small onClick={onSignInClick}>Authority login</Button>
    </div>
  );
}

function PublicRole({ cases, alerts, advisories }) {
  const [block, setBlock] = useState("Sanganer");
  const [range, setRange] = useState("7 days");
  const [openAdvisory, setOpenAdvisory] = useState(null);
  const [helpQuery, setHelpQuery] = useState("");
  const stats = computeAreaStats(cases, alerts, block);
  const totalAnimalReports = ANIMAL_DIST.reduce((s, a) => s + a.count, 0);

  const insights = [
    `${stats.total} reports have been recorded for ${block} in the current dataset.`,
    `${ANIMAL_DIST[0].label} accounts for the largest share of reports across the district.`,
    `${alerts.filter((a) => !["DISMISSED"].includes(a.status) && a.kind === "cluster").length} area(s) currently show an unusual reporting pattern.`,
    `Recent livestock movement reports connect Sanganer with neighboring blocks.`,
  ];

  return (
    <div>
      <div style={{ padding: "28px 24px 10px", maxWidth: 1180, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>Livestock Health at a Glance</h1>
        <p style={{ fontSize: 14, color: COLOR.textSecondary, maxWidth: 620, margin: "0 0 20px" }}>Explore aggregated livestock health reports, trends and advisories across your area. This view is read-only and does not show private farmer information.</p>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 22 }}>
          <span style={{ fontSize: 12.5, color: COLOR.textMuted }}>Rajasthan → Jaipur →</span>
          <select value={block} onChange={(e) => setBlock(e.target.value)} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${COLOR.border}`, fontSize: 13, fontWeight: 600 }}>
            {PUBLIC_BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
          {[["Reported cases", stats.total], ["Resolved cases", stats.resolved], ["Active cases", stats.active], ["Potential clusters", stats.potentialClusters]].map(([l, v]) => (
            <div key={l} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 12, color: COLOR.textSecondary, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        <Card title="Area map" right={<span style={{ fontSize: 11.5, color: COLOR.textMuted }}>Village / block-level only</span>}>
          <PublicMap selected={block} onSelect={setBlock} />
          <div style={{ marginTop: 14, border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{block}</div>
              <div style={{ fontSize: 12, color: COLOR.textSecondary }}>{stats.total} reported cases · Top animal: {stats.topAnimal} · {stats.potentialClusters} potential cluster(s)</div>
            </div>
            <Badge fg={COLOR.blue} bg={COLOR.blueTint}>{advisories.Sent.length} recent advisories</Badge>
          </div>
        </Card>

        <Card title="Livestock health reports over time" right={<div style={{ display: "flex", gap: 4 }}>{Object.keys(TREND_RANGES).map((r) => <button key={r} onClick={() => setRange(r)} style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 14, border: `1px solid ${range === r ? COLOR.forest : COLOR.border}`, background: range === r ? COLOR.forestTint : "transparent", color: range === r ? COLOR.forest : COLOR.textMuted, cursor: "pointer" }}>{r}</button>)}</div>}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={TREND_RANGES[range]} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: COLOR.textMuted }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLOR.textMuted }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTrendTooltip />} />
              <Line type="monotone" dataKey="v" stroke={COLOR.forest} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: COLOR.textMuted, marginTop: 8 }}>Number of reports — not disease incidence.</div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Animal-wise reports"><BarList items={ANIMAL_DIST} color={COLOR.clay} showPct total={totalAnimalReports} /></Card>
          <Card title="Frequently reported symptoms"><BarList items={TOP_ISSUES} color={COLOR.forest} /></Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Reported mortality">
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}><span style={{ fontSize: 26, fontWeight: 700 }}>18</span><span style={{ fontSize: 12.5, fontWeight: 600, color: COLOR.red }}>↑ 28% vs previous period</span></div>
            <div style={{ fontSize: 11.5, color: COLOR.textMuted }}>Reports involving mortality — not attributed to a specific cause unless verified.</div>
          </Card>
          <Card title="Areas requiring attention">
            {stats.blockAlerts.filter((a) => a.status !== "DISMISSED").length === 0 ? <EmptyState title="No unusual patterns nearby" body="Reporting is within expected levels." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.filter((a) => a.kind === "cluster" && a.status !== "DISMISSED").slice(0, 3).map((a) => (
                  <div key={a.id} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 9, padding: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{a.block}</span><Badge fg={COLOR.amber} bg={COLOR.amberTint}>{a.status === "POTENTIAL_CLUSTER" ? "Needs verification" : "Monitoring"}</Badge></div>
                    <div style={{ fontSize: 12, color: COLOR.textSecondary }}>{a.reports} reports · historical average {a.baseline}/week</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="Reported livestock movement connections" right={<span style={{ fontSize: 11.5, color: COLOR.textMuted }}>Farmer-reported</span>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOVEMENTS.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${COLOR.border}`, borderRadius: 9, padding: 11, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>{m.origin} <ArrowRight size={13} color={COLOR.forest} /> {m.destination}</div>
                <div style={{ fontSize: 12, color: COLOR.textSecondary }}>{m.animal} · {m.destinationReports} associated reports</div>
                <Badge fg={m.connected ? COLOR.amber : COLOR.textMuted} bg={m.connected ? COLOR.amberTint : COLOR.surfaceSunken}>{m.connected ? "Potential connection" : "No connection found"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Latest livestock health advisories">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {advisories.Sent.map((a) => (
              <div key={a.id} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: COLOR.textMuted, marginBottom: 8 }}>{a.area} · {a.date || "Recent"}</div>
                <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 10 }}>{a.message.length > 90 ? a.message.slice(0, 90) + "…" : a.message}</div>
                <button onClick={() => setOpenAdvisory(a)} style={{ background: "none", border: "none", color: COLOR.forest, fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0 }}>Read advisory →</button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Find veterinary help">
          <input value={helpQuery} onChange={(e) => setHelpQuery(e.target.value)} placeholder="Enter PIN code or district/block" style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13, marginBottom: 14 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {EXPERTS_DIR.filter((e) => e.availability !== "OFFLINE").map((e) => (
              <div key={e.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${COLOR.border}`, borderRadius: 9, padding: 11 }}>
                <div><div style={{ fontSize: 13, fontWeight: 700 }}>{e.name}</div><div style={{ fontSize: 11.5, color: COLOR.textSecondary }}>{e.role} · {e.area}</div></div>
                <Badge fg={e.availability === "AVAILABLE" ? COLOR.green : COLOR.amber} bg={e.availability === "AVAILABLE" ? COLOR.greenTint : COLOR.amberTint} dot>{e.availability === "AVAILABLE" ? "Available" : "Busy"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Key insights">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{insights.map((t, i) => <div key={i} style={{ fontSize: 13, color: COLOR.text, display: "flex", gap: 8 }}><span style={{ color: COLOR.forest }}>•</span>{t}</div>)}</div>
        </Card>

        <div style={{ background: COLOR.surfaceSunken, borderRadius: 10, padding: 14, fontSize: 12, color: COLOR.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
          Public data is aggregated and intended for awareness and welfare purposes. Reported cases and potential clusters do not necessarily represent confirmed disease outbreaks.
          <div style={{ marginTop: 6, color: COLOR.textMuted }}>Source: Farmer-reported, AI-structured. Verification: not all reports are authority-verified. Last updated: a few minutes ago.</div>
        </div>
      </div>
      {openAdvisory && <PublicAdvisoryModal advisory={openAdvisory} onClose={() => setOpenAdvisory(null)} />}
    </div>
  );
}

/* ============================================================
   LOGIN + ROLE SWITCHER SHELL
   ============================================================ */

const ROLES = [
  { id: "farmer", label: "Farmer", sub: "Report a problem, track cases", icon: "🐄" },
  { id: "call", label: "Call Console", sub: "Live IVR calls & AI extraction", icon: "📞" },
  { id: "authority", label: "Authority", sub: "District surveillance dashboard", icon: "🏛️" },
  { id: "expert", label: "Expert", sub: "Veterinary case workspace", icon: "🩺" },
  { id: "surveillance", label: "Surveillance", sub: "Alerts, clusters & analytics", icon: "📊" },
  { id: "admin", label: "Admin", sub: "Users, rules & system config", icon: "⚙️" },
];

// Real SHA-256 hashing in the browser via Web Crypto — genuine hashing, not
// a fake spinner. A production system would still need HTTPS transport and
// server-side salted hashing on top of this; there is no backend here.
async function hashPassword(pw) {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder().encode(pw);
    const buf = await window.crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return null;
}

function LoginScreen({ onSignIn, onViewPublic, showToast }) {
  const [step, setStep] = useState("role"); // 'role' | 'credentials'
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | hashing | signing
  const [hashPreview, setHashPreview] = useState("");

  const chooseRole = (r) => { setRole(r); setStep("credentials"); };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setPhase("hashing");
    const hash = await hashPassword(password);
    setHashPreview(hash ? hash.slice(0, 16) + "…" : "");
    setPhase("signing");
    setTimeout(() => onSignIn(role.id), 500);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLOR.bg, display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif" }}>
      <div style={{ flex: 1, background: COLOR.forest, color: "#fff", padding: 48, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 320 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>K</div>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Kisan Seva</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.25, margin: "0 0 14px", maxWidth: 380 }}>From farmer reports to early warning.</h1>
        <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.8)", maxWidth: 380, lineHeight: 1.6 }}>Helping veterinary teams respond faster to livestock health risks — while turning every report into useful public-health intelligence.</p>
        <div style={{ marginTop: 30 }}>
          <button onClick={onViewPublic} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            👁 View public dashboard — no login required
          </button>
        </div>
      </div>

      <div style={{ flex: 1.2, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {step === "role" ? (
            <>
              <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Sign in</h2>
              <div style={{ fontSize: 12.5, color: COLOR.textSecondary, marginBottom: 16 }}>Choose your role to continue.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                {ROLES.map((r) => (
                  <button key={r.id} onClick={() => chooseRole(r)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", borderRadius: 10, border: `1px solid ${COLOR.border}`, background: COLOR.surface, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <span><div style={{ fontSize: 12.5, fontWeight: 700, color: COLOR.text }}>{r.label}</div><div style={{ fontSize: 10.5, color: COLOR.textMuted }}>{r.sub}</div></span>
                  </button>
                ))}
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: COLOR.clay, background: COLOR.clayTint, padding: "3px 9px", borderRadius: 16 }}>DEMO MODE</div>
              <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginTop: 6 }}>You can switch between roles after signing in.</div>
            </>
          ) : (
            <form onSubmit={submit}>
              <button type="button" onClick={() => { setStep("role"); setPhase("idle"); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLOR.forest, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}>← Change role</button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: 24 }}>{role.icon}</span>
                <div><div style={{ fontSize: 17, fontWeight: 700 }}>Sign in as {role.label}</div><div style={{ fontSize: 11.5, color: COLOR.textMuted }}>{role.sub}</div></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Email</div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${role.id}@Kisan Seva.gov.in`} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13.5 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: COLOR.textMuted, marginBottom: 5 }}>Password</div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13.5 }} />
                </div>
              </div>
              <div style={{ fontSize: 10.5, color: COLOR.textMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 5 }}>
                🔒 Password is hashed (SHA-256) in your browser before it's used — a real deployment would also add HTTPS and server-side salted hashing.
              </div>
              <Button variant="primary" disabled={phase !== "idle"}>{phase === "hashing" ? "Encrypting…" : phase === "signing" ? "Signing in…" : "Sign in"}</Button>
              {hashPreview && phase === "signing" && <div style={{ fontSize: 10.5, color: COLOR.textMuted, marginTop: 8, fontFamily: "monospace" }}>hash: {hashPreview}</div>}
              <div style={{ textAlign: "center", margin: "12px 0 0" }}>
                <button type="button" onClick={() => showToast("OTP would be sent to the registered number")} style={{ background: "none", border: "none", color: COLOR.forest, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Login with OTP</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleSwitcherBar({ activeRole, setActiveRole, onSignOut }) {
  return (
    <div style={{ borderBottom: `1px solid ${COLOR.border}`, background: COLOR.surface, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: COLOR.forest, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>K</div>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>Kisan Seva</span>
        <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700, color: COLOR.clay, background: COLOR.clayTint, padding: "2px 7px", borderRadius: 12, marginLeft: 4 }}>DEMO</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => setActiveRole(r.id)} title={r.sub} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: activeRole === r.id ? 700 : 500, background: activeRole === r.id ? COLOR.forestTint : "transparent", color: activeRole === r.id ? COLOR.forest : COLOR.textSecondary }}>
            <span>{r.icon}</span>{r.label}
          </button>
        ))}
        <button onClick={() => setActiveRole("public")} title="Public, read-only dashboard" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 7, border: `1px dashed ${activeRole === "public" ? COLOR.forest : COLOR.border}`, cursor: "pointer", fontSize: 12.5, fontWeight: activeRole === "public" ? 700 : 500, background: activeRole === "public" ? COLOR.forestTint : "transparent", color: activeRole === "public" ? COLOR.forest : COLOR.textSecondary }}>
          <span>👁</span>Public
        </button>
      </div>
      <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${COLOR.border}`, borderRadius: 7, padding: "6px 11px", cursor: "pointer", fontSize: 12, color: COLOR.textSecondary }}><LogOut size={12} /> Sign out</button>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [publicMode, setPublicMode] = useState(false);
  const [activeRole, setActiveRole] = useState("authority");
  const [toast, setToast] = useState("");
  const [a11y, setA11y] = useState({ textLarge: false, highContrast: false, reducedMotion: false });

  const [cases, setCases] = useState(INITIAL_CASES);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [advisories, setAdvisories] = useState(ADVISORIES_INIT);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const addCase = (c) => setCases((prev) => [c, ...prev]);
  const updateCase = (id, patch) => setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const updateAlert = (id, patch) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const signIn = (role) => { setAuthed(true); setPublicMode(false); setActiveRole(role); };
  const signOut = () => { setAuthed(false); setActiveRole("authority"); };

  const wrapperStyle = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif",
    background: COLOR.bg, minHeight: "100vh", color: a11y.highContrast ? "#0A0C09" : COLOR.text,
    fontSize: a11y.textLarge ? "15px" : "13px",
    filter: a11y.highContrast ? "contrast(1.2) saturate(1.05)" : "none",
  };

  if (!authed && publicMode) {
    return (
      <div style={wrapperStyle}>
        <PublicHeader onSignInClick={() => setPublicMode(false)} />
        <PublicRole cases={cases} alerts={alerts} advisories={advisories} />
        <GlobalToast msg={toast} />
      </div>
    );
  }

  if (!authed) return <LoginScreen onSignIn={signIn} onViewPublic={() => setPublicMode(true)} showToast={showToast} />;

  return (
    <div style={wrapperStyle}>
      <RoleSwitcherBar activeRole={activeRole} setActiveRole={setActiveRole} onSignOut={signOut} />

      {activeRole === "public" && <PublicRole cases={cases} alerts={alerts} advisories={advisories} />}
      {activeRole === "farmer" && <FarmerRole cases={cases} addCase={addCase} updateCase={updateCase} advisories={advisories} />}
      {activeRole === "call" && <CallConsoleRole cases={cases} updateCase={updateCase} showToast={showToast} />}
      {activeRole === "authority" && <AuthorityRole cases={cases} alerts={alerts} updateAlert={updateAlert} advisories={advisories} showToast={showToast} />}
      {activeRole === "expert" && <ExpertRole cases={cases} updateCase={updateCase} advisories={advisories} setAdvisories={setAdvisories} showToast={showToast} />}
      {activeRole === "surveillance" && <SurveillanceRole alerts={alerts} updateAlert={updateAlert} advisories={advisories} setAdvisories={setAdvisories} showToast={showToast} />}
      {activeRole === "admin" && <AdminRole a11y={a11y} setA11y={setA11y} showToast={showToast} />}

      <GlobalToast msg={toast} />
    </div>
  );
}
