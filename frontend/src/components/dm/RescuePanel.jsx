import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Truck, Loader2, Shield } from "lucide-react";

const TEAM_STATUS = {
  available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  deployed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function RescuePanel() {
  const [teams, setTeams] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [sos, setSos] = useState([]);
  const [targets, setTargets] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const [t, i, s] = await Promise.all([api.get("/teams"), api.get("/incidents"), api.get("/sos")]);
      setTeams(t.data); setIncidents(i.data); setSos(s.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const allocate = async (teamId) => {
    const target = targets[teamId];
    if (!target) { toast.error("Select a target first"); return; }
    setBusy(teamId);
    try {
      const [kind, id] = target.split(":");
      await api.post("/allocate", kind === "inc" ? { team_id: teamId, incident_id: id } : { team_id: teamId, sos_id: id });
      toast.success("Team deployed");
      await load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Allocation failed");
    } finally { setBusy(null); }
  };

  const recall = async (teamId) => {
    setBusy(teamId);
    try { await api.post(`/teams/${teamId}/recall`); toast.success("Team recalled"); await load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(null); }
  };

  return (
    <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-5" data-testid="rescue-team-allocator">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-violet-400" />
        <h3 className="font-heading font-semibold text-lg tracking-wide text-white">Rescue Team Dispatch</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams.map((t) => (
          <div key={t.id} data-testid={`team-card-${t.id}`} className="bg-[#0A0D14] border border-white/10 rounded-md p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-heading font-semibold text-white tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />{t.name}
                </div>
                <div className="text-xs text-slate-400 mt-1">{t.specialty} · {t.members} members</div>
                <div className="text-xs text-slate-500">Base: {t.base}</div>
              </div>
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase ${TEAM_STATUS[t.status] || ""}`}>{t.status}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {t.status === "available" ? (
                <>
                  <Select value={targets[t.id] || ""} onValueChange={(v) => setTargets({ ...targets, [t.id]: v })}>
                    <SelectTrigger data-testid={`allocate-target-${t.id}`} className="bg-[#121824] border-white/15 text-white h-8 text-xs flex-1"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                    <SelectContent className="bg-[#121824] border-white/10 text-white">
                      {incidents.filter((i) => i.status !== "resolved").map((i) => <SelectItem key={i.id} value={`inc:${i.id}`}>⚠ {i.type} — {i.location}</SelectItem>)}
                      {sos.filter((s) => s.status === "pending").map((s) => <SelectItem key={s.id} value={`sos:${s.id}`}>🆘 SOS — {s.name} ({s.location})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button data-testid={`deploy-btn-${t.id}`} size="sm" disabled={busy === t.id} onClick={() => allocate(t.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white h-8">
                    {busy === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Truck className="w-3.5 h-3.5 mr-1" />Deploy</>}
                  </Button>
                </>
              ) : (
                <Button data-testid={`recall-btn-${t.id}`} size="sm" variant="outline" disabled={busy === t.id} onClick={() => recall(t.id)}
                  className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 h-8 w-full">
                  {busy === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Recall Team"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
