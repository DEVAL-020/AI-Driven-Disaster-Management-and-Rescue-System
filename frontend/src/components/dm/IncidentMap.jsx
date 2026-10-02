import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { sev, sst, SENSOR_LABEL } from "@/lib/dmUtils";
import { Map as MapIcon, Plus, Minus, Maximize2 } from "lucide-react";

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

const gecGandhinagarCenter = [23.2591, 72.6537];

const PAN_INDIA_FALLBACK_INCIDENTS = [
  { id: "inc-gec-1", type: "Command Center HQ", location: "Government Engineering College, Sector 28, Gandhinagar", lat: 23.2591, lng: 72.6537, severity: "low", description: "SentinelAI Emergency Command & Rescue Operations Hub.", status: "active" },
  { id: "inc-guj-1", type: "Cyclone Warning", location: "Mandvi Coastal Belt, Kachchh, Gujarat", lat: 22.830, lng: 69.350, severity: "high", description: "Storm surge warning along Mandvi coast.", status: "active" },
  { id: "inc-guj-2", type: "Industrial Gas Leak", location: "Hazira Complex, Surat, Gujarat", lat: 21.170, lng: 72.720, severity: "critical", description: "Chemical containment in progress.", status: "responding" },
  { id: "inc-guj-3", type: "Urban Flood", location: "Sabarmati Riverfront, Ahmedabad, Gujarat", lat: 23.022, lng: 72.571, severity: "moderate", description: "Discharge water monitoring.", status: "active" },
  { id: "inc-dl-1", type: "Flood", location: "Yamuna Riverbank, East Delhi", lat: 28.6692, lng: 77.2300, severity: "high", description: "Rising water levels breaching embankment.", status: "active" },
  { id: "inc-uk-1", type: "Earthquake", location: "Himalayan Fault Zone, Uttarakhand", lat: 30.310, lng: 78.030, severity: "moderate", description: "4.6 magnitude tremor logged.", status: "active" },
  { id: "inc-jk-1", type: "Landslide", location: "Jammu-Srinagar Highway, J&K", lat: 33.730, lng: 75.150, severity: "high", description: "Highway blocked by debris.", status: "responding" },
  { id: "inc-rj-1", type: "Heatwave", location: "Thar Sector, Jaisalmer, Rajasthan", lat: 26.915, lng: 70.908, severity: "moderate", description: "Severe heatwave advisory.", status: "active" },
  { id: "inc-mh-1", type: "Monsoon Inundation", location: "Marine Drive, Mumbai, Maharashtra", lat: 18.940, lng: 72.820, severity: "high", description: "High tide urban flooding.", status: "responding" },
  { id: "inc-kl-1", type: "Wildfire", location: "Western Ghats, Wayanad Border, Kerala", lat: 11.660, lng: 76.620, severity: "critical", description: "Fast spreading forest fire.", status: "responding" },
  { id: "inc-wb-1", type: "Cyclone", location: "Sundarbans Coastal Belt, West Bengal", lat: 21.940, lng: 88.900, severity: "high", description: "Severe storm surge warning.", status: "active" },
  { id: "inc-as-1", type: "Flood", location: "Brahmaputra Basin, Guwahati, Assam", lat: 26.140, lng: 91.730, severity: "critical", description: "River swelling above danger level.", status: "active" },
  { id: "inc-or-1", type: "Cyclone Warning", location: "Paradip Coast, Odisha", lat: 20.270, lng: 86.670, severity: "high", description: "Bay of Bengal storm advisory.", status: "active" },
];

const PAN_INDIA_FALLBACK_SENSORS = [
  { id: "sen-gec-1", type: "air_quality", location: "GEC Campus Sensor - Sector 28, Gandhinagar", lat: 23.2591, lng: 72.6537, unit: "AQI", value: 62.0, status: "normal" },
  { id: "sen-guj-1", type: "seismic", location: "Kachchh Fault Line - Bhuj, Gujarat", lat: 23.250, lng: 69.670, unit: "Richter", value: 3.8, status: "warning" },
  { id: "sen-guj-2", type: "temperature", location: "Gir Forest Sector - Junagadh, Gujarat", lat: 21.124, lng: 70.528, unit: "°C", value: 41.5, status: "normal" },
  { id: "sen-guj-3", type: "air_quality", location: "Hazira Industrial Grid - Surat, Gujarat", lat: 21.170, lng: 72.831, unit: "AQI", value: 285.0, status: "critical" },
  { id: "sen-guj-4", type: "water_level", location: "Ukai Dam Spillway - Tapi, Gujarat", lat: 21.252, lng: 73.578, unit: "m", value: 104.2, status: "normal" },
  { id: "sen-guj-5", type: "water_level", location: "Sabarmati Basin - Ahmedabad, Gujarat", lat: 23.022, lng: 72.571, unit: "m", value: 8.4, status: "normal" },
  { id: "sen-dl-1", type: "seismic", location: "Himalayan Fault Zone - North", lat: 28.6139, lng: 77.2090, unit: "Richter", value: 2.1, status: "normal" },
  { id: "sen-dl-2", type: "water_level", location: "Yamuna Dam Spillway - Delhi", lat: 28.6692, lng: 77.2300, unit: "m", value: 205.8, status: "warning" },
  { id: "sen-mh-1", type: "wind_speed", location: "Arabian Sea Coastal Delta - Mumbai", lat: 18.960, lng: 72.820, unit: "km/h", value: 68.4, status: "warning" },
  { id: "sen-wb-1", type: "water_level", location: "Sundarbans Tidal Basin - Bengal", lat: 21.940, lng: 88.900, unit: "m", value: 5.4, status: "critical" },
  { id: "sen-tn-1", type: "wind_speed", location: "Coromandel Station - Chennai, TN", lat: 13.080, lng: 80.270, unit: "km/h", value: 45.2, status: "normal" },
  { id: "sen-ka-1", type: "temperature", location: "Western Ghats - Coorg, Karnataka", lat: 12.330, lng: 75.800, unit: "°C", value: 34.2, status: "normal" },
  { id: "sen-mp-1", type: "seismic", location: "Narmada Rift Zone - Jabalpur, MP", lat: 23.181, lng: 79.986, unit: "Richter", value: 1.9, status: "normal" },
  { id: "sen-up-1", type: "air_quality", location: "Industrial Corridor - Kanpur, UP", lat: 26.449, lng: 80.331, unit: "AQI", value: 310.0, status: "critical" },
  { id: "sen-pb-1", type: "water_level", location: "Bhakra Dam Spillway - Punjab", lat: 31.410, lng: 76.430, unit: "m", value: 512.0, status: "normal" },
];

function MapInitializer() {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (!fittedRef.current) {
        // Focus initially on Government Engineering College, Sector 28, Gandhinagar
        map.setView(gecGandhinagarCenter, 15);
        fittedRef.current = true;
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function IncidentMap({ incidents = [], sensors = [], sos = [] }) {
  const indiaCenter = [21.5937, 78.9629];
  const [mapType, setMapType] = useState("satellite");
  const [mapInstance, setMapInstance] = useState(null);

  // Combine active server points with Pan-India fallback points to guarantee all states (incl. Gujarat & GEC Gandhinagar) have markers
  const activeIncidents = incidents.length > 0 ? incidents : PAN_INDIA_FALLBACK_INCIDENTS;
  const activeSensors = sensors.length > 0 ? sensors : PAN_INDIA_FALLBACK_SENSORS;

  const currentTile = GOOGLE_MAP_TYPES[mapType] || GOOGLE_MAP_TYPES.dark;

  const resetGecGandhinagar = () => {
    if (mapInstance) {
      mapInstance.setView(gecGandhinagarCenter, 15);
    }
  };

  const resetPanIndia = () => {
    if (mapInstance) {
      mapInstance.setView(indiaCenter, 5);
    }
  };

  const fitAllMarkers = () => {
    if (!mapInstance) return;
    const points = [
      ...activeIncidents.map((i) => [i.lat, i.lng]),
      ...activeSensors.map((s) => [s.lat, s.lng]),
      ...sos.filter((s) => s.status !== "resolved").map((s) => [s.lat, s.lng]),
    ].filter((p) => p[0] != null && p[1] != null);

    if (points.length > 0) {
      mapInstance.fitBounds(points, { padding: [40, 40], maxZoom: 6 });
    }
  };

  return (
    <div className="relative h-[500px] lg:h-[600px] w-full rounded-lg overflow-hidden border border-white/10 shadow-2xl" data-testid="incident-map-canvas">
      {/* Zoom Controls Overlay (Top Left) */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 bg-[#0A0D14]/90 backdrop-blur-md p-1.5 rounded-lg border border-white/15 shadow-2xl">
        <button
          onClick={() => mapInstance?.zoomIn()}
          className="w-8 h-8 rounded bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstance?.zoomOut()}
          className="w-8 h-8 rounded bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={fitAllMarkers}
          className="w-8 h-8 rounded bg-white/5 hover:bg-white/15 text-blue-400 flex items-center justify-center transition-all active:scale-95 border border-white/10"
          title="Fit All Emergency Markers"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Layer Control Toolbar Header (Top Right) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-[#0A0D14]/90 backdrop-blur-md p-1.5 rounded-lg border border-white/15 shadow-2xl">
        <button
          onClick={resetGecGandhinagar}
          className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow flex items-center gap-1"
          title="Focus on Government Engineering College, Gandhinagar"
        >
          <span>📍 GEC Gandhinagar</span>
        </button>
        <button
          onClick={resetPanIndia}
          className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all shadow flex items-center gap-1"
          title="Zoom to Pan-India view"
        >
          <span>🇮🇳 Pan-India</span>
        </button>
        <div className="h-4 w-px bg-white/20 mx-0.5" />
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

      <MapContainer ref={setMapInstance} center={gecGandhinagarCenter} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <MapInitializer />
        <TileLayer
          key={mapType}
          attribution='&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>'
          url={currentTile.url}
          subdomains={currentTile.subdomains}
          className={currentTile.tileClass}
          maxZoom={20}
        />
        {activeIncidents.map((i) => {
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
        {activeSensors.map((s) => {
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
