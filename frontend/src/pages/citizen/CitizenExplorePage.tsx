import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import type { Waterpoint, WaterpointStatus, WaterpointType } from '../../lib/types';
import { ApiError } from '../../lib/apiClient';
import { createWaterpoint, listWaterpoints } from '../../lib/waterpointsApi';
import { createFaultReport } from '../../lib/faultReportsApi';
import {
  Navigation,
  X,
  Filter,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ChevronDown,
  Plus,
  Send,
  Locate,
} from 'lucide-react';

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

function createReportIcon() {
  return L.divIcon({
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: #dc2626; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01"/></svg></div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function createNewPointIcon() {
  return L.divIcon({
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: #0891b2; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      animation: pulse 1.5s infinite;
    "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function MapClickHandler({ onMapClick, mode }: { onMapClick: (lat: number, lng: number) => void; mode: string }) {
  useMapEvents({
    click(e) {
      if (mode !== 'view') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function FlyToMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

const KWARA_CENTER: [number, number] = [8.4833, 4.5653];

type MapMode = 'view' | 'report' | 'add-point';

export default function CitizenExplorePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [waterpoints, setWaterpoints] = useState<Waterpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<Waterpoint | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<WaterpointStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<WaterpointType | 'all'>('all');

  // Map interaction mode
  const [mapMode, setMapMode] = useState<MapMode>('view');
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);

  // Report form
  const [reportForm, setReportForm] = useState({ description: '', waterpointId: '' });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Add waterpoint form
  const [wpForm, setWpForm] = useState({ name: '', type: 'borehole' as WaterpointType, community: '', lga: '', description: '' });
  const [wpSubmitting, setWpSubmitting] = useState(false);
  const [wpSuccess, setWpSuccess] = useState(false);

  const fetchWaterpoints = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listWaterpoints({
        ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
        ...(filterType !== 'all' ? { type: filterType } : {}),
        limit: 100,
      });
      setWaterpoints(result.items);
    } catch {
      setWaterpoints([]);
      toast('error', 'Failed to load water points from backend.');
    }
    setLoading(false);
  }, [filterStatus, filterType, toast]);

  useEffect(() => { fetchWaterpoints(); }, [fetchWaterpoints]);

  const handleMarkerClick = (point: Waterpoint) => {
    setSelectedPoint(point);
    setFlyTo({ lat: point.latitude, lng: point.longitude });
  };

  const openGoogleMaps = (point: Waterpoint) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`, '_blank');
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickedLatLng({ lat, lng });
  };

  const cancelMode = () => {
    setMapMode('view');
    setClickedLatLng(null);
    setReportForm({ description: '', waterpointId: '' });
    setWpForm({ name: '', type: 'borehole', community: '', lga: '', description: '' });
    setReportSuccess(false);
    setWpSuccess(false);
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      toast('warning', 'Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setClickedLatLng({ lat: position.coords.latitude, lng: position.coords.longitude });
        setFlyTo({ lat: position.coords.latitude, lng: position.coords.longitude });
        toast('success', 'Location captured. Click the map to adjust if needed.');
      },
      () => {
        toast('error', 'Unable to get your location. Please enable location access.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitReport = async () => {
    if (!user || !clickedLatLng) return;
    if (!reportForm.description.trim()) {
      toast('error', 'Please describe the problem.');
      return;
    }
    setReportSubmitting(true);
    try {
      await createFaultReport({
        ...(reportForm.waterpointId ? { waterpointId: reportForm.waterpointId } : {}),
        reporterName: profile?.full_name || 'Citizen Reporter',
        reporterPhone: profile?.phone || '',
        description: reportForm.description.trim(),
        latitude: clickedLatLng.lat,
        longitude: clickedLatLng.lng,
        community: profile?.community || 'Unknown',
      });
      setReportSuccess(true);
      toast('success', 'Fault report submitted successfully!');
    } catch {
      toast('error', 'Failed to submit report. Please try again.');
    }
    setReportSubmitting(false);
  };

  const submitWaterpoint = async () => {
    if (!clickedLatLng) return;
    if (!wpForm.name.trim() || !wpForm.community.trim() || !wpForm.lga.trim()) {
      toast('error', 'Name, community, and LGA are required.');
      return;
    }
    setWpSubmitting(true);
    try {
      await createWaterpoint({
        name: wpForm.name.trim(),
        type: wpForm.type,
        status: 'functional',
        latitude: clickedLatLng.lat,
        longitude: clickedLatLng.lng,
        community: wpForm.community.trim(),
        lga: wpForm.lga.trim(),
        description: wpForm.description.trim(),
      });
      setWpSuccess(true);
      toast('success', 'Water point added successfully!');
      fetchWaterpoints();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast('error', 'Only admins can add water points. Please submit a fault report instead.');
      } else {
        toast('error', 'Failed to add water point. Please try again.');
      }
    }
    setWpSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">Explore Map</h1>
        <p className="text-sm text-slate-500 mt-1">
          {mapMode === 'view'
            ? 'Click a water point to see details, or use the buttons below to report a fault or add a new point.'
            : mapMode === 'report'
            ? 'Click on the map to pin the fault location, then fill in the details.'
            : 'Click on the map to place the new water point, then fill in the details.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {mapMode === 'view' ? (
          <>
            <button
              onClick={() => setMapMode('report')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              Report a Fault
            </button>
            <button
              onClick={() => setMapMode('add-point')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Water Point
            </button>
            <button
              onClick={getMyLocation}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
            >
              <Locate className="w-4 h-4" />
              Use My Location
            </button>
          </>
        ) : (
          <button
            onClick={cancelMode}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      {/* Mode indicator */}
      {mapMode !== 'view' && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
          mapMode === 'report' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-cyan-50 text-cyan-700 border border-cyan-200/60'
        }`}>
          {mapMode === 'report' ? <AlertTriangle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {mapMode === 'report' ? 'Fault Report Mode' : 'Add Water Point Mode'}
          -- Click the map to set location
        </div>
      )}

      {/* Map + Sidebar */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ minHeight: '500px' }}>
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          )}

          <MapContainer
            center={KWARA_CENTER}
            zoom={12}
            className="h-full w-full z-0"
            style={{ minHeight: '500px', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} mode={mapMode} />
            {flyTo && <FlyToMarker lat={flyTo.lat} lng={flyTo.lng} />}

            {/* Waterpoint markers */}
            {waterpoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={createCustomIcon(point.status)}
                eventHandlers={{ click: () => handleMarkerClick(point) }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-slate-900 text-sm">{point.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{point.community}, {point.lga}</p>
                    <p className="text-xs mt-1" style={{ color: statusColors[point.status] }}>{statusLabels[point.status]}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Clicked location marker for report/add */}
            {clickedLatLng && mapMode === 'report' && (
              <Marker position={[clickedLatLng.lat, clickedLatLng.lng]} icon={createReportIcon()}>
                <Popup>
                  <p className="font-semibold text-sm text-red-600">Fault Location</p>
                  <p className="text-xs text-slate-500">{clickedLatLng.lat.toFixed(4)}, {clickedLatLng.lng.toFixed(4)}</p>
                </Popup>
              </Marker>
            )}
            {clickedLatLng && mapMode === 'add-point' && (
              <Marker position={[clickedLatLng.lat, clickedLatLng.lng]} icon={createNewPointIcon()}>
                <Popup>
                  <p className="font-semibold text-sm text-cyan-600">New Water Point</p>
                  <p className="text-xs text-slate-500">{clickedLatLng.lat.toFixed(4)}, {clickedLatLng.lng.toFixed(4)}</p>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-96 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="w-4 h-4" />
              Filters
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as WaterpointStatus | 'all')}
                  className="appearance-none w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="functional">Functional</option>
                  <option value="faulty">Faulty</option>
                  <option value="under_repair">Under Repair</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as WaterpointType | 'all')}
                  className="appearance-none w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="all">All Types</option>
                  <option value="borehole">Borehole</option>
                  <option value="well">Well</option>
                  <option value="tap">Public Tap</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Selected Waterpoint Detail */}
          {selectedPoint && mapMode === 'view' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-700 text-base text-slate-900 tracking-tight">{selectedPoint.name}</h3>
                <button onClick={() => setSelectedPoint(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border`} style={{
                  color: statusColors[selectedPoint.status],
                  borderColor: statusColors[selectedPoint.status] + '40',
                  backgroundColor: statusColors[selectedPoint.status] + '10',
                }}>
                  {statusLabels[selectedPoint.status]}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {typeLabels[selectedPoint.type]}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-slate-700"><span className="text-slate-400 font-medium">Location:</span> {selectedPoint.community}, {selectedPoint.lga}</p>
                <p className="text-slate-700 font-mono text-xs"><span className="text-slate-400 font-medium">Coords:</span> {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}</p>
                {selectedPoint.description && <p className="text-slate-600">{selectedPoint.description}</p>}
              </div>
              <button
                onClick={() => openGoogleMaps(selectedPoint)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold shadow-sm transition-all"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </button>
            </div>
          )}

          {/* Report Form */}
          {mapMode === 'report' && clickedLatLng && (
            <div className="bg-white rounded-xl border border-amber-200 p-5">
              <h3 className="font-heading font-700 text-base text-slate-900 tracking-tight mb-1">Report a Fault</h3>
              <p className="text-xs text-slate-500 mb-4">Location: {clickedLatLng.lat.toFixed(4)}, {clickedLatLng.lng.toFixed(4)}</p>

              {reportSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-900">Report submitted!</p>
                  <p className="text-xs text-slate-500 mt-1">The water corporation will review your report.</p>
                  <button onClick={cancelMode} className="mt-4 text-sm font-medium text-teal-700 hover:text-teal-800">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Link to existing water point (optional)</label>
                    <select
                      value={reportForm.waterpointId}
                      onChange={(e) => setReportForm({ ...reportForm, waterpointId: e.target.value })}
                      className="field-input text-sm"
                    >
                      <option value="">None - general report</option>
                      {waterpoints.map((wp) => (
                        <option key={wp.id} value={wp.id}>{wp.name} ({wp.community})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Describe the problem</label>
                    <textarea
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                      className="field-input text-sm min-h-[80px] resize-none"
                      placeholder="What is wrong with the water point? Be specific..."
                    />
                  </div>
                  <button
                    onClick={submitReport}
                    disabled={reportSubmitting || !reportForm.description}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
                  >
                    {reportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Report
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add Waterpoint Form */}
          {mapMode === 'add-point' && clickedLatLng && (
            <div className="bg-white rounded-xl border border-cyan-200 p-5">
              <h3 className="font-heading font-700 text-base text-slate-900 tracking-tight mb-1">Add Water Point</h3>
              <p className="text-xs text-slate-500 mb-4">Location: {clickedLatLng.lat.toFixed(4)}, {clickedLatLng.lng.toFixed(4)}</p>

              {wpSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-900">Water point added!</p>
                  <p className="text-xs text-slate-500 mt-1">It will appear on the map for everyone.</p>
                  <button onClick={cancelMode} className="mt-4 text-sm font-medium text-teal-700 hover:text-teal-800">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={wpForm.name}
                      onChange={(e) => setWpForm({ ...wpForm, name: e.target.value })}
                      className="field-input text-sm"
                      placeholder="e.g. Adewole Borehole"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={wpForm.type}
                      onChange={(e) => setWpForm({ ...wpForm, type: e.target.value as WaterpointType })}
                      className="field-input text-sm"
                    >
                      <option value="borehole">Borehole</option>
                      <option value="well">Well</option>
                      <option value="tap">Public Tap</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Community</label>
                      <input
                        type="text"
                        value={wpForm.community}
                        onChange={(e) => setWpForm({ ...wpForm, community: e.target.value })}
                        className="field-input text-sm"
                        placeholder="e.g. Adewole"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">LGA</label>
                      <input
                        type="text"
                        value={wpForm.lga}
                        onChange={(e) => setWpForm({ ...wpForm, lga: e.target.value })}
                        className="field-input text-sm"
                        placeholder="e.g. Ilorin West"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      value={wpForm.description}
                      onChange={(e) => setWpForm({ ...wpForm, description: e.target.value })}
                      className="field-input text-sm min-h-[60px] resize-none"
                      placeholder="Optional details..."
                    />
                  </div>
                  <button
                    onClick={submitWaterpoint}
                    disabled={wpSubmitting || !wpForm.name}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
                  >
                    {wpSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Water Point
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-900 mb-2">Status Legend</p>
            <div className="space-y-1.5">
              {(['functional', 'faulty', 'under_repair'] as WaterpointStatus[]).map((s) => {
                const icons: Record<string, typeof CheckCircle2> = { functional: CheckCircle2, faulty: AlertTriangle, under_repair: Wrench };
                const Icon = icons[s];
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
      </div>
    </div>
  );
}
