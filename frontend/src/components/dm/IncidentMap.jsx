import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import { sev, sst, SENSOR_LABEL } from "@/lib/dmUtils";

export default function IncidentMap({ incidents = [], sensors = [], sos = [] }) {
  const center = [28.6139, 77.2090];

  return (
    <div className="h-[420px] lg:h-full w-full rounded-lg overflow-hidden border border-white/10" data-testid="incident-map-canvas">
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {incidents.map((i) => {
          const c = sev(i.severity).color;
          return (
            <CircleMarker key={`inc-${i.id}`} center={[i.lat, i.lng]} radius={11}
              pathOptions={{ color: c, fillColor: c, fillOpacity: 0.55, weight: 2 }}>
              <Tooltip direction="top" opacity={1}><span className="font-mono text-xs">{i.type} · {sev(i.severity).label}</span></Tooltip>
              <Popup>
                <div className="font-sans text-xs">
                  <div className="font-bold text-sm">{i.type}</div>
                  <div className="text-slate-400">{i.location}</div>
                  <div className="mt-1">Severity: <b style={{ color: c }}>{sev(i.severity).label}</b></div>
                  <div>Status: {i.status}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {sensors.map((s) => {
          const c = sst(s.status).color;
          return (
            <CircleMarker key={`sen-${s.id}`} center={[s.lat, s.lng]} radius={6}
              pathOptions={{ color: c, fillColor: c, fillOpacity: 0.9, weight: 1, dashArray: "2" }}>
              <Tooltip direction="top"><span className="font-mono text-xs">{SENSOR_LABEL[s.type]}: {s.value}{s.unit}</span></Tooltip>
            </CircleMarker>
          );
        })}
        {sos.filter((s) => s.status !== "resolved").map((s) => (
          <CircleMarker key={`sos-${s.id}`} center={[s.lat, s.lng]} radius={8}
            pathOptions={{ color: "#06B6D4", fillColor: "#06B6D4", fillOpacity: 0.7, weight: 2 }}>
            <Tooltip direction="top"><span className="font-mono text-xs">SOS · {s.emergency_type}</span></Tooltip>
            <Popup>
              <div className="font-sans text-xs">
                <div className="font-bold text-sm text-cyan-600">SOS · {s.emergency_type}</div>
                <div>{s.name} ({s.people_count} people)</div>
                <div className="text-slate-400">{s.location}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
