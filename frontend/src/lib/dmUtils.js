export const SEVERITY = {
  low: { label: "LOW", color: "#10B981", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  moderate: { label: "MODERATE", color: "#F59E0B", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  high: { label: "HIGH", color: "#F97316", bg: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  critical: { label: "CRITICAL", color: "#EF4444", bg: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export const RISK = {
  LOW: "text-emerald-400", MODERATE: "text-amber-400", HIGH: "text-orange-400", CRITICAL: "text-red-400",
};

export const SENSOR_STATUS = {
  normal: { color: "#10B981", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "NORMAL" },
  warning: { color: "#F59E0B", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "WARNING" },
  critical: { color: "#EF4444", bg: "bg-red-500/15 text-red-400 border-red-500/30", label: "CRITICAL" },
};

export const SENSOR_LABEL = {
  seismic: "Seismic", water_level: "Water Level", temperature: "Temperature",
  air_quality: "Air Quality", wind_speed: "Wind Speed",
};

export function sev(s) { return SEVERITY[s] || SEVERITY.moderate; }
export function sst(s) { return SENSOR_STATUS[s] || SENSOR_STATUS.normal; }

export function timeAgo(iso) {
  if (!iso) return "—";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
