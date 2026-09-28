import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertCircle, ExternalLink, RotateCcw } from 'lucide-react';
import type { Language } from '../../types';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix standard Leaflet default icon asset paths for Vite bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Production-ready OpenStreetMap France tile provider (Clean rendering, zero watermarks, no API key required)
const PRIMARY_TILE_URL = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  shopName: string;
  address: string;
  lang: Language;
  externalMapUrl?: string;
  className?: string;
}

export const LeafletMap: FC<LeafletMapProps> = ({
  latitude,
  longitude,
  shopName,
  address,
  lang,
  externalMapUrl,
  className = 'w-full h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const directionsUrl =
    externalMapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  const getDirectionsText = lang === 'mr' ? 'दिशादर्शन मिळवा (Get Directions) ↗' : 'Get Directions ↗';
  const errorTitle = lang === 'mr' ? 'नकाशा टाइल्स लोड करण्यात अडचण आली' : 'Unable to load map tiles';
  const errorDesc =
    lang === 'mr'
      ? 'नेटवर्क किंवा कनेक्शन समस्येमुळे नकाशा दिसू शकला नाही. आपण खालील बटणावर क्लिक करून थेट Google Maps वर पाहू शकता.'
      : 'Map tiles could not be fetched due to network conditions. You can open the location directly in Google Maps.';
  const retryText = lang === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry Map';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous instance and container ID safely
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (mapContainerRef.current as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    let consecutiveErrors = 0;

    try {
      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false, // Prevents accidental page scroll interception
        attributionControl: true
      });

      // Production-grade OpenStreetMap France raster tile layer
      const tileLayer = L.tileLayer(PRIMARY_TILE_URL, {
        subdomains: 'abc',
        maxZoom: 20,
        attribution: TILE_ATTRIBUTION
      });

      // Graceful error tracking for network or tile load failures
      tileLayer.on('tileerror', () => {
        consecutiveErrors += 1;
        // Trigger fallback view only if several tiles fail persistently
        if (consecutiveErrors >= 6) {
          setLoadError(true);
        }
      });

      tileLayer.on('tileload', () => {
        consecutiveErrors = Math.max(0, consecutiveErrors - 1);
      });

      tileLayer.addTo(map);

      // Custom Agricultural Baliraja Marker
      const customIcon = L.divIcon({
        className: 'baliraja-map-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; cursor: pointer;">
            <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ffffff; padding: 5px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; font-family: ui-serif, Georgia, serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.25); border: 2px solid #ffffff; margin-bottom: 3px;">
              ${shopName}
            </div>
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #047857 0%, #064e3b 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 6px 16px rgba(4,120,87,0.45);">
              <div style="width: 12px; height: 12px; background-color: #fef3c7; border-radius: 50%; transform: rotate(45deg); box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);"></div>
            </div>
            <div style="width: 16px; height: 6px; background-color: rgba(0,0,0,0.25); border-radius: 50%; filter: blur(1.5px); margin-top: -2px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -44]
      });

      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

      // Informational popup
      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px 4px; max-width: 240px; line-height: 1.4;">
          <div style="font-size: 14px; font-weight: 800; color: #064e3b; margin-bottom: 4px; font-family: ui-serif, Georgia, serif;">
            ${shopName}
          </div>
          <div style="font-size: 12px; color: #4b5563; margin-bottom: 10px; line-height: 1.35;">
            ${address}
          </div>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; background-color: #047857; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <span>${getDirectionsText}</span>
          </a>
        </div>
      `);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Ensure proper layout and sizing during framer-motion / page renders
      const timer1 = window.setTimeout(() => map.invalidateSize(), 100);
      const timer2 = window.setTimeout(() => map.invalidateSize(), 350);
      const timer3 = window.setTimeout(() => map.invalidateSize(), 800);

      // ResizeObserver for dynamic responsiveness
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        window.clearTimeout(timer1);
        window.clearTimeout(timer2);
        window.clearTimeout(timer3);
        if (resizeObserver) resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize Leaflet Map:', error);
      setLoadError(true);
    }
  }, [latitude, longitude, shopName, address, directionsUrl, getDirectionsText, retryKey]);

  return (
    <div className="relative w-full h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]">
      <div
        ref={mapContainerRef}
        className={`${className} min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]`}
        style={{ zIndex: 1, minHeight: '340px', width: '100%', height: '100%' }}
        aria-label={`${shopName} Map - ${address}`}
      />

      {/* Graceful Network / Tile Error Fallback Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-30 bg-stone-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 shadow-xs">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-stone-900 mb-1">{errorTitle}</h4>
          <p className="text-xs text-stone-600 max-w-sm mb-4 leading-relaxed">{errorDesc}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{getDirectionsText}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
            <button
              type="button"
              onClick={() => {
                setLoadError(false);
                setRetryKey((k) => k + 1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{retryText}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
