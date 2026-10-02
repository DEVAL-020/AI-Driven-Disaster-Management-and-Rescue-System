import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import { sev, sst, SENSOR_LABEL } from "@/lib/dmUtils";
import { Layers, Map as MapIcon, Globe } from "lucide-react";

// Official Google Maps Tile Servers
const GOOGLE_MAP_TYPES = {
  roadmap: {
    label: "Google Roadmap",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  satellite: {
    label: "Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  terrain: {
    label: "Google Terrain",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  dark: {
    label: "Google Dark Mode",
    url: "https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  }
};

export default function IncidentMap({ incidents = [], sensors = [], sos = [] }) {
  const center = [28.6139, 77.2090];
  const [mapType, setMapType] = useState("roadmap");

  const currentTile = GOOGLE_MAP_TYPES[mapType];

  return (
    <div className="relative h-[420px] lg:h-full w-full rounded-lg overflow-hidden border border-white/10 shadow-xl" data-testid="incident-map-canvas">
      {/* Map Control Toolbar Header */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-[#0A0D14]/90 backdrop-blur-md p-1.5 rounded-lg border border-white/15 shadow-2xl">
        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest px-2 flex items-center gap-1">
          <MapIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Google Maps</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <button
          onClick={() => setMapType("roadmap")}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
            mapType === "roadmap"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          Roadmap
        </button>
        <button
          onClick={() => setMapType("satellite")}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
            mapType === "satellite"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapType("terrain")}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
            mapType === "terrain"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          Terrain
        </button>
      </div>

      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          key={mapType}
          attribution='&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>'
          url={currentTile.url}
          maxZoom={20}
          subdomains={currentTile.subdomains}
        />
        {incidents.map((i) => {
          const c = sev(i.severity).color;
          return (
            <CircleMarker key={`inc-${i.id}`} center={[i.lat, i.lng]} radius={12}
              pathOptions={{ color: c, fillColor: c, fillOpacity: 0.65, weight: 3 }}>
              <Tooltip direction="top" opacity={1}><span className="font-sans text-xs font-medium">{i.type} · {sev(i.severity).label}</span></Tooltip>
              <Popup>
                <div className="font-sans text-xs">
                  <div className="font-bold text-sm text-white">{i.type}</div>
                  <div className="text-slate-300 mt-0.5">{i.location}</div>
                  <div className="mt-1.5">Severity: <b style={{ color: c }}>{sev(i.severity).label}</b></div>
                  <div className="capitalize text-slate-300">Status: {i.status}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {sensors.map((s) => {
          const c = sst(s.status).color;
          return (
            <CircleMarker key={`sen-${s.id}`} center={[s.lat, s.lng]} radius={7}
              pathOptions={{ color: c, fillColor: c, fillOpacity: 0.95, weight: 2 }}>
              <Tooltip direction="top"><span className="font-sans text-xs">{SENSOR_LABEL[s.type]}: {s.value}{s.unit}</span></Tooltip>
            </CircleMarker>
          );
        })}
        {sos.filter((s) => s.status !== "resolved").map((s) => (
          <CircleMarker key={`sos-${s.id}`} center={[s.lat, s.lng]} radius={9}
            pathOptions={{ color: "#06B6D4", fillColor: "#06B6D4", fillOpacity: 0.8, weight: 2.5 }}>
            <Tooltip direction="top"><span className="font-sans text-xs font-semibold">SOS · {s.emergency_type}</span></Tooltip>
            <Popup>
              <div className="font-sans text-xs">
                <div className="font-bold text-sm text-cyan-400">SOS · {s.emergency_type}</div>
                <div className="text-slate-200 mt-0.5">{s.name} ({s.people_count} people)</div>
                <div className="text-slate-400">{s.location}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

