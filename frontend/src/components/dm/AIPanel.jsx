import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { sev, RISK, timeAgo } from "@/lib/dmUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BrainCircuit, Loader2, Plus, Sparkles, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";

export default function AIPanel({ role, onIncidents }) {
  const [incidents, setIncidents] = useState([]);
  const [analyzing, setAnalyzing] = useState(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const canManage = role === "admin" || role === "rescue_team";
  const [form, setForm] = useState({
    type: "Flood", location: "", lat: "28.61", lng: "77.20", severity: "moderate", description: "",
  });

  const load = useCallback(async () => {
    try { const { data } = await api.get("/incidents"); setIncidents(data); onIncidents?.(data); } catch {}
  }, [onIncidents]);

  useEffect(() => { load(); }, [load]);

  const analyze = async (id) => {
    setAnalyzing(id);
    try {
      await api.post(`/incidents/${id}/analyze`);
      toast.success("AI assessment complete");
      await load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "AI analysis failed");
    } finally {
      setAnalyzing(null);
    }
  };

  const createIncident = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/incidents", {
        ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng),
      });
      toast.success("Incident logged");
      setOpen(false);
      setForm({ ...form, location: "", description: "" });
      await load();
    } catch (e2) {
      toast.error(formatApiError(e2.response?.data?.detail) || "Failed to create incident");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    try { await api.delete(`/incidents/${id}`); toast.success("Incident removed"); await load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const updateStatus = async (id, status) => {
    try { await api.patch(`/incidents/${id}/status`, { status }); await load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-5" data-testid="ai-prediction-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-blue-400" />
          <h3 className="font-heading font-semibold text-lg tracking-wide text-white">AI Prediction & Risk Analysis</h3>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-incident-btn" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white h-8">
                <Plus className="w-4 h-4 mr-1" /> Log Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121824] border-white/10 text-white">
              <DialogHeader><DialogTitle className="font-heading uppercase tracking-wide">Log New Incident</DialogTitle></DialogHeader>
              <form onSubmit={createIncident} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-400">Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger data-testid="incident-type-select" className="bg-[#0A0D14] border-white/15 text-white mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#121824] border-white/10 text-white">
                        {["Flood", "Wildfire", "Earthquake", "Cyclone", "Landslide", "Industrial Hazard"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Severity</Label>
                    <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                      <SelectTrigger data-testid="incident-severity-select" className="bg-[#0A0D14] border-white/15 text-white mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#121824] border-white/10 text-white">
                        {["low", "moderate", "high", "critical"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Location</Label>
                  <Input data-testid="incident-location-input" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" placeholder="e.g. Riverside District" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-slate-400">Latitude</Label><Input required value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" /></div>
                  <div><Label className="text-xs text-slate-400">Longitude</Label><Input required value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" /></div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Description</Label>
                  <Textarea data-testid="incident-desc-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" rows={2} />
                </div>
                <Button data-testid="submit-incident-btn" type="submit" disabled={creating} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Incident"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {incidents.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">No incidents logged.</p>}
        {incidents.map((i) => {
          const s = sev(i.severity);
          const a = i.ai_analysis;
          return (
            <div key={i.id} data-testid={`incident-row-${i.id}`} className="bg-[#0A0D14] border border-white/10 rounded-md p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-white tracking-wide">{i.type}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase ${s.bg}`}>{s.label}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/15 text-slate-400 uppercase">{i.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{i.location}</div>
                  {i.description && <div className="text-xs text-slate-500 mt-1">{i.description}</div>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button data-testid={`analyze-btn-${i.id}`} size="sm" disabled={analyzing === i.id}
                    onClick={() => analyze(i.id)}
                    className="bg-blue-600/90 hover:bg-blue-500 text-white h-7 text-xs">
                    {analyzing === i.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3 mr-1" /> {a ? "Re-run" : "Analyze"}</>}
                  </Button>
                  {canManage && (
                    <div className="flex gap-1.5">
                      {i.status !== "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(i.id, "resolved")}
                          className="h-7 text-xs border-white/15 bg-white/5 text-emerald-400 hover:bg-white/10 px-2" data-testid={`resolve-btn-${i.id}`}>
                          <CheckCircle2 className="w-3 h-3" />
                        </Button>
                      )}
                      {role === "admin" && (
                        <Button size="sm" variant="outline" onClick={() => remove(i.id)}
                          className="h-7 text-xs border-white/15 bg-white/5 text-red-400 hover:bg-white/10 px-2" data-testid={`delete-btn-${i.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {a && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t border-white/10" data-testid={`ai-analysis-${i.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-blue-400">AI Assessment</span>
                        <span className={`font-mono text-xs font-semibold ${RISK[a.risk_level] || "text-slate-300"}`}>{a.risk_level}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-400">{timeAgo(a.generated_at)}</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                        <span>SEVERITY SCORE</span><span>{a.severity_score}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${a.severity_score}%`, backgroundColor: a.severity_score > 70 ? "#EF4444" : a.severity_score > 40 ? "#F59E0B" : "#10B981" }} />
                      </div>
                    </div>
                    {a.alert_message && (
                      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-red-200">{a.alert_message}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">Predicted spread: </span><span className="text-slate-300">{a.predicted_spread}</span></div>
                      <div><span className="text-slate-500">Population at risk: </span><span className="text-slate-300">{a.population_at_risk}</span></div>
                    </div>
                    {a.recommended_actions?.length > 0 && (
                      <div className="mt-2">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">Recommended Actions</div>
                        <ul className="space-y-1">
                          {a.recommended_actions.map((act, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex gap-2"><span className="text-blue-400">›</span>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {a.resources_needed?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.resources_needed.map((r, idx) => (
                          <span key={idx} className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">{r}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
