import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import NetworkBanner from "@/components/dm/NetworkBanner";
import IncidentMap from "@/components/dm/IncidentMap";
import IoTFeed from "@/components/dm/IoTFeed";
import AIPanel from "@/components/dm/AIPanel";
import SOSPortal from "@/components/dm/SOSPortal";
import RescuePanel from "@/components/dm/RescuePanel";
import SecurityPanel from "@/components/dm/SecurityPanel";
import AIChat from "@/components/dm/AIChat";
import {
  ShieldAlert, LogOut, LayoutDashboard, Radio, BrainCircuit, Shield, Siren, Lock,
  Flame, CheckCircle2, Truck, AlertOctagon,
} from "lucide-react";

const ROLE_META = {
  admin: { label: "Command Control", color: "text-blue-400" },
  rescue_team: { label: "Tactical Dispatch", color: "text-violet-400" },
  citizen: { label: "Citizen SOS Portal", color: "text-cyan-400" },
};

const TABS = {
  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "ai", label: "AI Analysis", icon: BrainCircuit },
    { id: "iot", label: "IoT Sensors", icon: Radio },
    { id: "rescue", label: "Rescue Ops", icon: Shield },
    { id: "sos", label: "SOS Reports", icon: Siren },
    { id: "security", label: "Security", icon: Lock },
  ],
  rescue_team: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "ai", label: "AI Analysis", icon: BrainCircuit },
    { id: "iot", label: "IoT Sensors", icon: Radio },
    { id: "rescue", label: "Rescue Ops", icon: Shield },
    { id: "sos", label: "SOS Reports", icon: Siren },
  ],
  citizen: [
    { id: "sos", label: "My SOS", icon: Siren },
    { id: "overview", label: "Live Map", icon: LayoutDashboard },
    { id: "iot", label: "Sensors", icon: Radio },
  ],
};

function StatCard({ icon: Icon, label, value, color, testid }) {
  return (
    <div data-testid={testid} className="bg-[#121824]/90 border border-white/10 rounded-lg p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center bg-white/5 ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <div className="font-heading font-bold text-2xl text-white leading-none">{value}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "citizen";
  const tabs = TABS[role] || TABS.citizen;
  const [tab, setTab] = useState(tabs[0].id);

  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [sos, setSos] = useState([]);

  const loadStats = useCallback(async () => {
    try { const { data } = await api.get("/stats"); setStats(data); } catch {}
  }, []);

  useEffect(() => { loadStats(); const t = setInterval(loadStats, 6000); return () => clearInterval(t); }, [loadStats]);

  const doLogout = async () => { await logout(); navigate("/login"); };

  const statCards = role === "citizen" ? [
    { icon: AlertOctagon, label: "Active Incidents", value: stats?.active_incidents ?? "—", color: "text-red-400", testid: "active-incidents-counter" },
    { icon: Siren, label: "Pending SOS", value: stats?.pending_sos ?? "—", color: "text-amber-400", testid: "stat-pending-sos" },
    { icon: Truck, label: "Teams Deployed", value: stats?.teams_deployed ?? "—", color: "text-blue-400", testid: "stat-teams-deployed" },
  ] : [
    { icon: AlertOctagon, label: "Active Incidents", value: stats?.active_incidents ?? "—", color: "text-red-400", testid: "active-incidents-counter" },
    { icon: Flame, label: "Critical Sensors", value: stats?.critical_sensors ?? "—", color: "text-orange-400", testid: "stat-critical-sensors" },
    { icon: Siren, label: "Pending SOS", value: stats?.pending_sos ?? "—", color: "text-amber-400", testid: "stat-pending-sos" },
    { icon: Shield, label: "Teams Available", value: stats?.teams_available ?? "—", color: "text-emerald-400", testid: "stat-teams-available" },
    { icon: Truck, label: "Teams Deployed", value: stats?.teams_deployed ?? "—", color: "text-blue-400", testid: "stat-teams-deployed" },
    { icon: CheckCircle2, label: "Resolved", value: stats?.resolved_incidents ?? "—", color: "text-slate-300", testid: "stat-resolved" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0D14]/85 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3" data-testid="navbar-brand-logo">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-white" /></div>
            <div>
              <div className="font-heading font-bold text-lg tracking-wider uppercase leading-none">Sentinel<span className="text-blue-500">AI</span></div>
              <div className={`font-mono text-[9px] uppercase tracking-widest ${ROLE_META[role].color}`}>{ROLE_META[role].label}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm text-white leading-none">{user?.name}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">{user?.email}</div>
            </div>
            <Button data-testid="logout-btn" onClick={doLogout} variant="outline" size="sm" className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10">
              <LogOut className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        <NetworkBanner />

        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="role-switcher-tabs">
          {tabs.map((t) => (
            <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-heading uppercase tracking-wide text-sm whitespace-nowrap transition-all border ${
                tab === t.id ? "bg-blue-600 text-white border-blue-500" : "bg-[#121824]/90 text-slate-300 border-white/10 hover:border-blue-500/40 hover:bg-[#1a2336]"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === "overview" && (
            <div className="space-y-5">
              <div className={`grid grid-cols-2 ${role === "citizen" ? "md:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-6"} gap-3`}>
                {statCards.map((s) => <StatCard key={s.label} {...s} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-[#121824]/90 border border-white/10 rounded-lg p-2">
                  <IncidentMap incidents={incidents} sensors={sensors} sos={sos} />
                </div>
                <div className="space-y-5">
                  <IoTFeed onData={setSensors} />
                </div>
              </div>
            </div>
          )}
          {tab === "ai" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AIPanel role={role} onIncidents={setIncidents} />
              <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-2 h-[640px]">
                <IncidentMap incidents={incidents} sensors={sensors} sos={sos} />
              </div>
            </div>
          )}
          {tab === "iot" && <IoTFeed onData={setSensors} />}
          {tab === "rescue" && <RescuePanel />}
          {tab === "sos" && <SOSPortal role={role} onSos={setSos} />}
          {tab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SecurityPanel />
              <NetworkInfo />
            </div>
          )}
        </motion.div>
      </main>

      <AIChat />
    </div>
  );
}

function NetworkInfo() {
  const items = [
    ["Transport Protocol", "MQTT over TLS 1.3"],
    ["Payload Encryption", "AES-256-GCM"],
    ["Key Exchange", "RSA-2048 / ECDHE"],
    ["Network Topology", "Self-healing Mesh (64 nodes)"],
    ["Edge Compute", "Fog gateways + Cloud sync"],
    ["Threat Defense", "DDoS mitigation · WAF · Rate limiting"],
    ["Auth", "JWT (httpOnly) · Role-based access"],
  ];
  return (
    <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-5">
      <h3 className="font-heading font-semibold text-lg tracking-wide text-white mb-4">Network & Security Architecture</h3>
      <div className="space-y-2.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{k}</span>
            <span className="font-mono text-xs text-slate-200">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
