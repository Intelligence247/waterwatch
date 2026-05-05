import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import type { Waterpoint, WaterpointStatus, WaterpointType } from '../lib/types';
import {
  Navigation,
  X,
  Droplets,
  MapPin,
  Filter,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ChevronDown,
} from 'lucide-react';

// Fix leaflet default marker icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const statusColors: Record<WaterpointStatus, string> = {
  functional: '#0f766e',
  faulty: '#dc2626',
  under_repair: '#d97706',
};

const statusLabels: Record<WaterpointStatus, string> = {
  functional: 'Functional',
  faulty: 'Faulty',
  under_repair: 'Under Repair',
};

const typeLabels: Record<WaterpointType, string> = {
  borehole: 'Borehole',
  well: 'Well',
  tap: 'Public Tap',
};

const statusIcons: Record<WaterpointStatus, typeof CheckCircle2> = {
  functional: CheckCircle2,
  faulty: AlertTriangle,
  under_repair: Wrench,
};

function createCustomIcon(status: WaterpointStatus) {
  const color = statusColors[status];
  return L.divIcon({
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg></div>`,
    className: 'custom-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function FlyToMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

const KWARA_CENTER: [number, number] = [8.4833, 4.5653];

export default function MapPage() {
  const [waterpoints, setWaterpoints] = useState<Waterpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<Waterpoint | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<WaterpointStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<WaterpointType | 'all'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const fetchWaterpoints = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('waterpoints').select('*').order('name');
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    if (filterType !== 'all') query = query.eq('type', filterType);
    const { data, error } = await query;
    if (!error && data) setWaterpoints(data as Waterpoint[]);
    setLoading(false);
  }, [filterStatus, filterType]);

  useEffect(() => {
    fetchWaterpoints();
  }, [fetchWaterpoints]);

  const handleMarkerClick = (point: Waterpoint) => {
    setSelectedPoint(point);
    setFlyTo({ lat: point.latitude, lng: point.longitude });
    setMobileDetailOpen(true);
  };

  const openGoogleMaps = (point: Waterpoint) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`,
      '_blank'
    );
  };

  const filteredPoints = waterpoints;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-700 text-sm tracking-tight text-slate-900 hidden sm:block">
            WaterWatch
          </span>
        </div>

        <div className="flex-1" />

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as WaterpointStatus | 'all')}
              className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="functional">Functional</option>
              <option value="faulty">Faulty</option>
              <option value="under_repair">Under Repair</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as WaterpointType | 'all')}
              className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="all">All Types</option>
              <option value="borehole">Borehole</option>
              <option value="well">Well</option>
              <option value="tap">Public Tap</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {sidebarOpen ? 'Hide' : 'Show'} List
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Sidebar - Waterpoint List */}
        {sidebarOpen && (
          <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0 hidden lg:block">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-heading font-700 text-sm text-slate-900 tracking-tight">
                Water Points ({filteredPoints.length})
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPoints.map((point) => {
                  const StatusIcon = statusIcons[point.status];
                  return (
                    <button
                      key={point.id}
                      onClick={() => handleMarkerClick(point)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                        selectedPoint?.id === point.id ? 'bg-teal-50/50 border-l-2 border-l-teal-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: statusColors[point.status] }}
                        />
                        <div className="min-w-0">
                          <p className="font-heading font-600 text-sm text-slate-900 truncate">
                            {point.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {point.community}, {point.lga}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-slate-400">{typeLabels[point.type]}</span>
                            <span className="text-slate-200">&middot;</span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: statusColors[point.status] }}>
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[point.status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          )}

          <MapContainer
            center={KWARA_CENTER}
            zoom={12}
            className="h-full w-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {flyTo && <FlyToMarker lat={flyTo.lat} lng={flyTo.lng} />}
            {filteredPoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={createCustomIcon(point.status)}
                eventHandlers={{
                  click: () => handleMarkerClick(point),
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-slate-900 text-sm">{point.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{point.community}, {point.lga}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-md border border-slate-200/60">
            <p className="text-xs font-semibold text-slate-900 mb-2">Status Legend</p>
            <div className="space-y-1.5">
              {(['functional', 'faulty', 'under_repair'] as WaterpointStatus[]).map((s) => {
                const Icon = statusIcons[s];
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {statusLabels[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail Card - Desktop */}
        {selectedPoint && (
          <div className="hidden lg:block w-96 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-700 text-lg text-slate-900 tracking-tight">
                  {selectedPoint.name}
                </h3>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{
                    color: statusColors[selectedPoint.status],
                    borderColor: statusColors[selectedPoint.status] + '40',
                    backgroundColor: statusColors[selectedPoint.status] + '10',
                  }}
                >
                  {(() => {
                    const Icon = statusIcons[selectedPoint.status];
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                  {statusLabels[selectedPoint.status]}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {typeLabels[selectedPoint.type]}
                </span>
              </div>

              {/* Photo */}
              {selectedPoint.photo_url ? (
                <div className="rounded-xl overflow-hidden mb-5 border border-slate-200/60">
                  <img
                    src={selectedPoint.photo_url}
                    alt={selectedPoint.name}
                    className="w-full aspect-video object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200/60 mb-5 flex items-center justify-center aspect-video">
                  <div className="text-center">
                    <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No photo available</p>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm text-slate-700">{selectedPoint.community}, {selectedPoint.lga}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Coordinates</p>
                  <p className="text-sm text-slate-700 font-mono">
                    {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}
                  </p>
                </div>
                {selectedPoint.description && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedPoint.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Last Updated</p>
                  <p className="text-sm text-slate-700">
                    {new Date(selectedPoint.updated_at).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Directions Button */}
              <button
                onClick={() => openGoogleMaps(selectedPoint)}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Navigation className="w-4 h-4" />
                Get Directions on Google Maps
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Detail Sheet */}
      {selectedPoint && mobileDetailOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-heading font-700 text-base text-slate-900 tracking-tight">
                {selectedPoint.name}
              </h3>
              <button
                onClick={() => setMobileDetailOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {/* Status Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{
                    color: statusColors[selectedPoint.status],
                    borderColor: statusColors[selectedPoint.status] + '40',
                    backgroundColor: statusColors[selectedPoint.status] + '10',
                  }}
                >
                  {(() => {
                    const Icon = statusIcons[selectedPoint.status];
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                  {statusLabels[selectedPoint.status]}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {typeLabels[selectedPoint.type]}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-5">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Location</p>
                  <p className="text-sm text-slate-700">{selectedPoint.community}, {selectedPoint.lga}</p>
                </div>
                {selectedPoint.description && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Description</p>
                    <p className="text-sm text-slate-600">{selectedPoint.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Coordinates</p>
                  <p className="text-sm text-slate-700 font-mono">
                    {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => openGoogleMaps(selectedPoint)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm transition-all"
              >
                <Navigation className="w-4 h-4" />
                Get Directions on Google Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
