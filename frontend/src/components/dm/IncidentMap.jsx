import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { sev, sst, SENSOR_LABEL } from "@/lib/dmUtils";
import { Map as MapIcon, Globe, Layers } from "lucide-react";

// Official Google Maps Tile Servers
const GOOGLE_MAP_TYPES = {
  dark: {
    label: "Dark Tactical",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    tileClass: "google-dark-tile",
  },
  roadmap: {
    label: "Roadmap",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    tileClass: "google-normal-tile",
  },
  satellite: {
    label: "Satellite",
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    tileClass: "google-normal-tile",
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    tileClass: "google-normal-tile",
  },
};

function MapResizer({ incidents, sensors, sos }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map, incidents, sensors, sos]);
  return null;
}

export default function IncidentMap({ incidents = [], sensors = [], sos = [] }) {
  const center = [28.6139, 77.2090];
  const [mapType, setMapType] = useState("dark");

  const currentTile = GOOGLE_MAP_TYPES[mapType] || GOOGLE_MAP_TYPES.dark;

  return (
    <div className="relative h-[500px] lg:h-[600px] w-full rounded-lg overflow-hidden border border-white/10 shadow-2xl" data-testid="incident-map-canvas">
      {/* Map Control Toolbar Header */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-[#0A0D14]/90 backdrop-blur-md p-1.5 rounded-lg border border-white/15 shadow-2xl">
        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider px-2 flex items-center gap-1">
          <MapIcon className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Google Maps</span>
        </div>
        <div className="h-4 w-px bg-white/20 mx-0.5" />
        {Object.entries(GOOGLE_MAP_TYPES).map(([typeKey, typeObj]) => (
          <button
            key={typeKey}
            onClick={() => setMapType(typeKey)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              mapType === typeKey
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            {typeObj.label}
          </button>
        ))}
      </div>

      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <MapResizer incidents={incidents} sensors={sensors} sos={sos} />
        <TileLayer
          key={mapType}
          attribution='&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>'
          url={currentTile.url}
          subdomains={currentTile.subdomains}
          className={currentTile.tileClass}
          maxZoom={20}
        />
        {incidents.map((i) => {
          const c = sev(i.severity).color;
          return (
            <CircleMarker key={`inc-${i.id}`} center={[i.lat, i.lng]} radius={13}
              pathOptions={{ color: c, fillColor: c, fillOpacity: 0.7, weight: 3 }}>
              <Tooltip direction="top" opacity={1}><span className="font-sans text-xs font-semibold">{i.type} · {sev(i.severity).label}</span></Tooltip>
              <Popup>
                <div className="font-sans text-xs p-1">
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
              <div className="font-sans text-xs p-1">
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

