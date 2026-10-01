import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { sst, SENSOR_LABEL, timeAgo } from "@/lib/dmUtils";
import { Button } from "@/components/ui/button";
import { Play, Pause, Radio, Activity } from "lucide-react";

export default function IoTFeed({ onData }) {
  const [sensors, setSensors] = useState([]);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    try { const { data } = await api.get("/sensors"); setSensors(data); onData?.(data); } catch {}
  }, [onData]);

  const tick = useCallback(async () => {
    try { const { data } = await api.post("/sensors/tick"); setSensors(data); onData?.(data); } catch {}
  }, [onData]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, [live, tick]);

  return (
    <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-5" data-testid="iot-sensor-feed-list">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          <h3 className="font-heading font-semibold text-lg tracking-wide text-white">IoT Sensor Telemetry</h3>
        </div>
        <Button data-testid="iot-sim-toggle-btn" size="sm" variant="outline"
          onClick={() => setLive((v) => !v)}
          className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 h-8">
          {live ? <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</> : <><Play className="w-3.5 h-3.5 mr-1.5" /> Resume</>}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sensors.map((s) => {
          const st = sst(s.status);
          return (
            <motion.div key={s.id} layout data-testid={`iot-sensor-${s.type}-card`}
              className="bg-[#0A0D14] border border-white/10 rounded-md p-3.5 hover:border-cyan-500/40 transition-all">
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{SENSOR_LABEL[s.type]}</div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">{s.location}</div>
                </div>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${st.bg}`}>{st.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <motion.div key={s.value} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
                  className="font-mono text-2xl font-semibold" style={{ color: st.color }}>
                  {s.value}<span className="text-sm text-slate-500 ml-1">{s.unit}</span>
                </motion.div>
                <div className="flex items-center gap-1 text-slate-600">
                  {live && <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />}
                  <span className="font-mono text-[9px]">{timeAgo(s.updated_at)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
