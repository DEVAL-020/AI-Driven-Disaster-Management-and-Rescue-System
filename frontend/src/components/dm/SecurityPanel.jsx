import { useEffect, useState } from "react";
import api from "@/lib/api";
import { timeAgo } from "@/lib/dmUtils";
import { Lock, ShieldAlert, Info, AlertTriangle } from "lucide-react";

const LVL = {
  info: { icon: Info, color: "text-cyan-400", dot: "bg-cyan-400" },
  warning: { icon: AlertTriangle, color: "text-amber-400", dot: "bg-amber-400" },
  critical: { icon: ShieldAlert, color: "text-red-400", dot: "bg-red-400" },
};

export default function SecurityPanel() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => { try { const { data } = await api.get("/security/logs"); if (active) setLogs(data); } catch {} };
    load();
    const t = setInterval(load, 8000);
    return () => { active = false; clearInterval(t); };
  }, []);

  return (
    <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-5" data-testid="cybersecurity-log-panel">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-amber-400" />
        <h3 className="font-heading font-semibold text-lg tracking-wide text-white">Cybersecurity Event Log</h3>
      </div>
      <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 font-mono text-xs">
        {logs.map((l) => {
          const v = LVL[l.level] || LVL.info;
          return (
            <div key={l.id} className="flex items-start gap-2.5 bg-[#0A0D14] border border-white/10 rounded px-3 py-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${v.dot}`} />
              <div className="flex-1 min-w-0">
                <span className={`uppercase text-[9px] tracking-widest ${v.color}`}>{l.level}</span>
                <p className="text-slate-300 mt-0.5 break-words">{l.message}</p>
              </div>
              <span className="text-slate-600 shrink-0">{timeAgo(l.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
