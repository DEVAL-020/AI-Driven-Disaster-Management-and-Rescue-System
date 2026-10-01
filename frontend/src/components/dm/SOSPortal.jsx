import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { timeAgo } from "@/lib/dmUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Siren, Loader2, Send, Phone, Users, MapPin } from "lucide-react";

const SOS_STATUS = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  dispatched: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function SOSPortal({ role, onSos }) {
  const [reports, setReports] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const isCitizen = role === "citizen";
  const [form, setForm] = useState({
    name: "", phone: "", emergency_type: "Medical", location: "",
    lat: "28.61", lng: "77.20", people_count: 1, message: "",
  });

  const load = useCallback(async () => {
    try { const { data } = await api.get("/sos"); setReports(data); onSos?.(data); } catch {}
  }, [onSos]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/sos", {
        ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng), people_count: parseInt(form.people_count) || 1,
      });
      toast.success("SOS transmitted — rescue teams notified");
      setForm({ ...form, message: "" });
      await load();
    } catch (e2) {
      toast.error(formatApiError(e2.response?.data?.detail) || "Failed to send SOS");
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (id, status) => {
    try { await api.patch(`/sos/${id}/status`, { status }); await load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {isCitizen && (
        <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-5" data-testid="victim-sos-form">
          <div className="flex items-center gap-2 mb-4">
            <Siren className="w-5 h-5 text-red-400" />
            <h3 className="font-heading font-semibold text-lg tracking-wide text-white">Emergency SOS Request</h3>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-400">Your Name</Label><Input data-testid="sos-name-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" /></div>
              <div><Label className="text-xs text-slate-400">Phone</Label><Input data-testid="sos-phone-input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Emergency</Label>
                <Select value={form.emergency_type} onValueChange={(v) => setForm({ ...form, emergency_type: v })}>
                  <SelectTrigger data-testid="sos-type-select" className="bg-[#0A0D14] border-white/15 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#121824] border-white/10 text-white">
                    {["Medical", "Trapped", "Fire", "Flood", "Collapse", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-slate-400">People</Label><Input data-testid="sos-people-input" type="number" min={1} value={form.people_count} onChange={(e) => setForm({ ...form, people_count: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" /></div>
            </div>
            <div><Label className="text-xs text-slate-400">Location</Label><Input data-testid="sos-location-input" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" placeholder="Describe where you are" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-400">Latitude</Label><Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" /></div>
              <div><Label className="text-xs text-slate-400">Longitude</Label><Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" /></div>
            </div>
            <div><Label className="text-xs text-slate-400">Message</Label><Textarea data-testid="sos-message-input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-[#0A0D14] border-white/15 text-white mt-1" rows={2} placeholder="Additional details..." /></div>
            <Button data-testid="sos-submit-btn" type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-500 text-white h-11">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Transmit SOS</>}
            </Button>
          </form>
        </div>
      )}

      <div className={`bg-[#121824]/90 border border-white/10 rounded-lg p-5 ${isCitizen ? "" : "lg:col-span-2"}`} data-testid="sos-reports-list">
        <h3 className="font-heading font-semibold text-lg tracking-wide text-white mb-4">
          {isCitizen ? "My SOS Reports" : "Incoming SOS Reports"}
        </h3>
        <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
          {reports.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">No SOS reports.</p>}
          {reports.map((r) => (
            <div key={r.id} data-testid={`sos-row-${r.id}`} className="bg-[#0A0D14] border border-white/10 rounded-md p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-white">{r.emergency_type}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase ${SOS_STATUS[r.status] || ""}`}>{r.status}</span>
                    {r.assigned_team && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400">{r.assigned_team}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.name} · {r.people_count}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</span>
                  </div>
                  {r.message && <div className="text-xs text-slate-500 mt-1">{r.message}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[9px] text-slate-500">{timeAgo(r.created_at)}</div>
                  {!isCitizen && r.status !== "resolved" && (
                    <Button size="sm" onClick={() => setStatus(r.id, "resolved")}
                      className="mt-2 h-7 text-xs bg-emerald-600/90 hover:bg-emerald-500 text-white" data-testid={`sos-resolve-${r.id}`}>Resolve</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
