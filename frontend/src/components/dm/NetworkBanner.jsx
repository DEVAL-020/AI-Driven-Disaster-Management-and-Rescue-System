import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Activity, Wifi, Gauge, Network, Lock, ShieldCheck } from "lucide-react";

export default function NetworkBanner() {
  const [s, setS] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try { const { data } = await api.get("/network/stats"); if (active) setS(data); } catch {}
    };
    load();
    const t = setInterval(load, 4000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const metrics = s ? [
    { icon: Wifi, label: "Ping", value: `${s.ping_ms} ms`, ok: s.ping_ms < 40 },
    { icon: Activity, label: "Packet Loss", value: `${s.packet_loss_pct}%`, ok: s.packet_loss_pct < 2 },
    { icon: Gauge, label: "Bandwidth", value: `${s.bandwidth_mbps} Mbps`, ok: true },
    { icon: Network, label: "Mesh Nodes", value: `${s.mesh_nodes_online}/${s.mesh_nodes_total}`, ok: s.mesh_nodes_online > 50 },
    { icon: Lock, label: "Encryption", value: s.encryption, ok: true },
    { icon: ShieldCheck, label: "DDoS", value: s.ddos_mitigation, ok: true },
  ] : [];

  return (
    <div className="bg-[#121824]/90 border border-white/10 rounded-lg px-4 py-3" data-testid="network-topology-status">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Network Mesh · {s?.protocol || "MQTT/TLS"}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2.5">
            <m.icon className={`w-4 h-4 shrink-0 ${m.ok ? "text-cyan-400" : "text-amber-400"}`} />
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{m.label}</div>
              <div className="font-mono text-xs text-white truncate">{m.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
