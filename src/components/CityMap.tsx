import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CameraNode, TrajectoryPoint } from '../types/traffic';
import { MapPin, Navigation, Info, ZoomIn, ZoomOut } from 'lucide-react';

interface CityMapProps {
  cameras: CameraNode[];
  activeTrajectory?: TrajectoryPoint[];
  selectedCameraId?: string;
  onSelectCamera?: (cameraId: string) => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  cameras,
  activeTrajectory = [],
  selectedCameraId,
  onSelectCamera,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const arrowDecoratorsRef = useRef<L.Marker[]>([]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center on Vijayawada (16.5062, 80.6480)
    const map = L.map(mapContainerRef.current, {
      center: [16.512, 80.635],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap standard tile layer with legal attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | BEL Signal Vision PS-26127',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update camera markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    cameras.forEach((cam) => {
      // Congestion color: green, amber, red
      const color =
        cam.congestionLevel === 'low'
          ? '#22c55e'
          : cam.congestionLevel === 'moderate'
          ? '#f59e0b'
          : '#ef4444';

      // Custom SVG Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-camera-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 28px;
            height: 28px;
            border-radius: 4px;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ">
            ${cam.vehicleCount}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: customIcon }).addTo(map);

      // Popup with standard uniform number format
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 180px; padding: 2px; color: #0f172a;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 2px;">${cam.name}</div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">Sample ANPR Node • ${cam.id}</div>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tr>
              <td style="color: #475569; padding: 2px 0;">Volume:</td>
              <td style="font-weight: bold; text-align: right; font-family: monospace;">${String(cam.vehicleCount).padStart(3, ' ')} veh/hr</td>
            </tr>
            <tr>
              <td style="color: #475569; padding: 2px 0;">Avg Speed:</td>
              <td style="font-weight: bold; text-align: right; font-family: monospace;">${String(cam.avgSpeedKmH).padStart(3, ' ')} km/h</td>
            </tr>
            <tr>
              <td style="color: #475569; padding: 2px 0;">Last Read:</td>
              <td style="font-weight: bold; text-align: right; font-family: monospace; color: #0284c7;">${cam.lastPlate}</td>
            </tr>
          </table>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectCamera) onSelectCamera(cam.id);
      });

      markersRef.current[cam.id] = marker;
    });
  }, [cameras, onSelectCamera]);

  // Update Trajectory Overlay line
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing polyline & arrow markers
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    arrowDecoratorsRef.current.forEach((m) => m.remove());
    arrowDecoratorsRef.current = [];

    if (activeTrajectory && activeTrajectory.length > 1) {
      const latlngs: [number, number][] = activeTrajectory.map((pt) => [pt.lat, pt.lng]);

      // Draw highlighted route line
      const polyline = L.polyline(latlngs, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
      }).addTo(map);

      polylineRef.current = polyline;

      // Add numbered stop tags along the route
      activeTrajectory.forEach((pt) => {
        const stopIcon = L.divIcon({
          className: 'custom-trajectory-stop',
          html: `
            <div style="
              background-color: #0284c7;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 10px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            ">
              ${pt.order}
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const stopMarker = L.marker([pt.lat, pt.lng], { icon: stopIcon }).addTo(map);
        stopMarker.bindPopup(`
          <div style="font-size: 11px;">
            <strong>Stop #${pt.order}: ${pt.cameraName}</strong><br/>
            Time: ${pt.timestamp}<br/>
            Speed: ${pt.speed} km/h • Plate: ${pt.plate}
          </div>
        `);
        arrowDecoratorsRef.current.push(stopMarker);
      });

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
  }, [activeTrajectory]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-3 flex flex-col space-y-2">
      {/* City Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Vijayawada Smart Surveillance Map:</span>
          <span className="text-slate-400">8 Sample ANPR Junctions</span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
            <span>Low (&lt;40 veh)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
            <span>Moderate (40-70)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-500"></span>
            <span>Congested (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* Map Element */}
      <div className="relative w-full h-[460px] rounded border border-slate-800 overflow-hidden bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating sample notice */}
        <div className="absolute top-2 left-2 z-20 bg-slate-900/90 backdrop-blur-xs border border-slate-800 text-[11px] text-slate-300 px-2.5 py-1 rounded shadow">
          Sample Locations: Benz Circle • MG Road • Ramavarappadu • PCR • PNBS
        </div>
      </div>
    </div>
  );
};
