import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
  Flame, CheckCircle2, Truck, AlertOctagon, ArrowLeft,
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
    <div data-testid={testid} className="bg-[#121824]/90 border border-white/10 rounded-lg p-4 flex items-center gap-3.5 shadow-lg transition-all hover:border-blue-500/30">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center bg-white/5 ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <div className="font-heading font-bold text-2xl text-slate-900 dark:text-white leading-none">{value}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = user?.role || "citizen";
  const tabs = TABS[role] || TABS.citizen;

  // Preserve active working tab across page reloads via URL search params & localStorage
  const urlTab = searchParams.get("tab");
  const storedTab = localStorage.getItem("sentinel_active_tab");
  const defaultTab = tabs.find((t) => t.id === urlTab)?.id || tabs.find((t) => t.id === storedTab)?.id || tabs[0].id;

  const [tab, setTabState] = useState(defaultTab);

  const setTab = (newTabId) => {
    setTabState(newTabId);
    localStorage.setItem("sentinel_active_tab", newTabId);
    setSearchParams({ tab: newTabId }, { replace: true });
  };

  useEffect(() => {
    if (!searchParams.get("tab") && tab) {
      setSearchParams({ tab }, { replace: true });
    }
  }, [tab, searchParams, setSearchParams]);

  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [sos, setSos] = useState([]);

  const loadStats = useCallback(async () => {
    try { const { data } = await api.get("/stats"); setStats(data); } catch {}
  }, []);

  useEffect(() => { loadStats(); const t = setInterval(loadStats, 6000); return () => clearInterval(t); }, [loadStats]);

  const doLogout = async () => {
    localStorage.removeItem("sentinel_active_tab");
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

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
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0D14]/85 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono uppercase tracking-wider transition-all"
              title="Return to Home Page"
              data-testid="dashboard-back-home-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3" data-testid="navbar-brand-logo">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-blue-600 flex items-center justify-center shrink-0"><ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
              <div>
                <div className="font-heading font-bold text-base sm:text-lg tracking-wider uppercase leading-none">Sentinel<span className="text-blue-500">AI</span></div>
                <div className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest ${ROLE_META[role].color}`}>{ROLE_META[role].label}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs sm:text-sm text-white leading-none">{user?.name}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">{user?.email}</div>
            </div>
            <Button data-testid="logout-btn" onClick={doLogout} variant="outline" size="sm" className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-white transition-all text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /><span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-3.5 sm:px-6 py-3.5 sm:py-5 space-y-4 sm:space-y-5">
        <NetworkBanner />

        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar" data-testid="role-switcher-tabs">
          {tabs.map((t) => (
            <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-heading uppercase tracking-wide text-xs sm:text-sm whitespace-nowrap transition-all border ${
                tab === t.id ? "bg-blue-600 text-white border-blue-500" : "bg-[#121824]/90 text-slate-300 border-white/10 hover:border-blue-500/40 hover:bg-[#1a2336]"
              }`}>
              <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === "overview" && (
            <div className="space-y-4 sm:space-y-5">
              <div className={`grid grid-cols-2 ${role === "citizen" ? "sm:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-6"} gap-2.5 sm:gap-3`}>
                {statCards.map((s) => <StatCard key={s.label} {...s} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <div className="lg:col-span-2 bg-[#121824]/90 border border-white/10 rounded-lg p-1.5 sm:p-2">
                  <IncidentMap incidents={incidents} sensors={sensors} sos={sos} />
                </div>
                <div className="space-y-4 sm:space-y-5">
                  <IoTFeed onData={setSensors} />
                </div>
              </div>
            </div>
          )}
          {tab === "ai" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <AIPanel role={role} onIncidents={setIncidents} />
              <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-1.5 sm:p-2 h-[400px] sm:h-[500px] lg:h-[640px]">
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
