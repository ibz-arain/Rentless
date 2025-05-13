import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PropertyCard, transformPropertyData } from './properties';
import ReactDOM from 'react-dom/client';

import type { PropertyProps } from './properties';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapboxMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  properties: PropertyProps[];
  onMove?: (center: { lat: number; lng: number }, zoom: number, bounds: mapboxgl.LngLatBounds) => void;
  isListVisible?: boolean;
}

// Helper to format price
function formatPrice(price: number) {
  if (price >= 1000) return `$${price.toLocaleString()}`;
  return `$${price}`;
}

// Type guard to check if property is already camelCase
function isCamelCaseProperty(obj: any): obj is PropertyProps {
  return obj && 'propertyId' in obj && 'monthlyRent' in obj;
}

const DRAWER_WIDTH_PERCENTAGE = 0.4; // 40% width for the drawer (2/5)

const MapboxMap: React.FC<MapboxMapProps> = ({ center, zoom = 12, properties, onMove, isListVisible }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const lastCenterRef = useRef(center);
  const lastZoomRef = useRef(zoom);
  const activePinRef = useRef<HTMLDivElement | null>(null);
  const previousListVisibleRef = useRef(isListVisible);
  let openPopup: mapboxgl.Popup | null = null;
  let popupRoot: ReactDOM.Root | null = null;

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is missing!');
      return;
    }
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [center.lng, center.lat],
      zoom,
    });

    // Add a small delay before initial resize to ensure container is ready
    setTimeout(() => {
      mapRef.current?.resize();
    }, 100);

    mapRef.current.on('moveend', () => {
      if (!mapRef.current) return;
      const c = mapRef.current.getCenter();
      const z = mapRef.current.getZoom();
      const b = mapRef.current.getBounds();
      if (onMove && b) {
        onMove({ lat: c.lat, lng: c.lng }, z, b);
      }
      lastCenterRef.current = { lat: c.lat, lng: c.lng };
      lastZoomRef.current = z;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // Only run on mount

  // Resize map when list visibility changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Add a small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      mapRef.current?.resize();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isListVisible]);

  // Update map center/zoom if props change (and only if different from current)
  useEffect(() => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    const z = mapRef.current.getZoom();
    const latDiff = Math.abs(center.lat - c.lat);
    const lngDiff = Math.abs(center.lng - c.lng);
    const zoomDiff = Math.abs((zoom ?? 12) - z);
    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      mapRef.current.setCenter([center.lng, center.lat]);
      lastCenterRef.current = center;
    }
    if (zoomDiff > 0.01) {
      mapRef.current.setZoom(zoom);
      lastZoomRef.current = zoom;
    }
  }, [center.lat, center.lng, zoom]);

  // Handle drawer state changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Only proceed if there's a change in visibility
    if (previousListVisibleRef.current === isListVisible) return;

    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const bounds = map.getBounds();
    
    if (!bounds) return;
    
    // Get the current viewport width in pixels
    const viewportWidth = map.getContainer().offsetWidth;
    
    // Calculate the offset in pixels (1/3 of viewport)
    const pixelOffset = viewportWidth / 3;
    
    // Convert pixel offset to longitude offset at current zoom level
    const pointLeft = map.unproject([0, 0]);
    const pointRight = map.unproject([pixelOffset, 0]);
    let lngOffset = pointRight.lng - pointLeft.lng;
    
    // Normalize the offset if it's larger than the world's width
    if (Math.abs(lngOffset) > 180) {
      lngOffset = (lngOffset > 0 ? 180 : -180) * (viewportWidth / 3) / viewportWidth;
    }
    
    // Calculate the new center based on drawer state
    let newLng = currentCenter.lng + (isListVisible ? -lngOffset : lngOffset);
    
    // Normalize the new longitude to stay within -180 to 180
    newLng = ((newLng + 180) % 360) - 180;

    // Animate to new center
    map.easeTo({
      center: [newLng, currentCenter.lat],
      duration: 300,
      easing: (t) => t * (2 - t) // easeOutQuad
    });

    previousListVisibleRef.current = isListVisible;
  }, [isListVisible]);

  // Update property markers only when properties change
  useEffect(() => {
    if (!mapRef.current) return;
    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    // Cleanup popup/root on marker re-render
    if (openPopup) {
      openPopup.remove();
      openPopup = null;
    }
    if (popupRoot) {
      popupRoot.unmount();
      popupRoot = null;
    }
    // Add new markers
    properties.forEach(property => {
      const el = document.createElement('div');
      el.className = 'mapbox-price-pin';
      el.style.padding = '4px 14px';
      el.style.background = '#fff';
      el.style.border = '2px solid #6366f1';
      el.style.borderRadius = '999px';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      el.style.display = 'inline-block';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '15px';
      el.style.color = '#222';
      el.style.cursor = 'pointer';
      el.style.userSelect = 'none';
      el.style.pointerEvents = 'auto';
      el.innerText = formatPrice((property as any).monthlyRent || (property as any).monthly_rent || 0);
      el.onmouseenter = () => {
        el.style.background = '#6366f1';
        el.style.color = '#fff';
        el.style.borderColor = '#6366f1';
        el.style.zIndex = '10';
      };
      el.onmouseleave = () => {
        if (activePinRef.current !== el) {
          el.style.background = '#fff';
          el.style.color = '#222';
          el.style.borderColor = '#6366f1';
          el.style.zIndex = '1';
        }
      };
      el.onclick = (e) => {
        e.stopPropagation();
        // Remove highlight from previous active pin
        if (activePinRef.current) {
          activePinRef.current.style.background = '#fff';
          activePinRef.current.style.color = '#222';
          activePinRef.current.style.borderColor = '#6366f1';
          activePinRef.current.style.zIndex = '1';
        }
        // Highlight this pin
        el.style.background = '#6366f1';
        el.style.color = '#fff';
        el.style.borderColor = '#6366f1';
        el.style.zIndex = '10';
        activePinRef.current = el;
        // Remove previous popup
        if (openPopup) {
          openPopup.remove();
          openPopup = null;
        }
        if (popupRoot) {
          popupRoot.unmount();
          popupRoot = null;
        }
        // Create a container for the React card
        const popupNode = document.createElement('div');
        popupNode.style.background = 'transparent';
        popupNode.style.boxShadow = 'none';
        popupNode.style.padding = '0';
        popupNode.style.border = 'none';
        popupNode.style.borderRadius = '0';
        // Render the PropertyCard into the popup
        const propertyData: PropertyProps = isCamelCaseProperty(property) ? property : transformPropertyData(property);
        popupRoot = ReactDOM.createRoot(popupNode);
        popupRoot.render(
          <div style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)', borderRadius: 16, overflow: 'hidden', background: '#fff', minWidth: 320, maxWidth: 360 }}>
            <PropertyCard property={propertyData} />
          </div>
        );
        openPopup = new mapboxgl.Popup({ offset: 32, closeOnClick: true, closeButton: true })
          .setDOMContent(popupNode)
          .setLngLat([property.longitude, property.latitude])
          .addTo(mapRef.current!);
        // Remove highlight when popup closes
        openPopup.on('close', () => {
          if (activePinRef.current) {
            activePinRef.current.style.background = '#fff';
            activePinRef.current.style.color = '#222';
            activePinRef.current.style.borderColor = '#6366f1';
            activePinRef.current.style.zIndex = '1';
            activePinRef.current = null;
          }
          if (popupRoot) {
            popupRoot.unmount();
            popupRoot = null;
          }
        });
      };
      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
    // Close popup on map move
    const map = mapRef.current;
    const closePopupOnMove = () => {
      if (openPopup) {
        openPopup.remove();
        openPopup = null;
      }
      if (popupRoot) {
        popupRoot.unmount();
        popupRoot = null;
      }
      if (activePinRef.current) {
        activePinRef.current.style.background = '#fff';
        activePinRef.current.style.color = '#222';
        activePinRef.current.style.borderColor = '#6366f1';
        activePinRef.current.style.zIndex = '1';
        activePinRef.current = null;
      }
    };
    map.on('movestart', closePopupOnMove);
    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (popupRoot) popupRoot.unmount();
      if (openPopup) openPopup.remove();
      map.off('movestart', closePopupOnMove);
    };
  }, [properties]);

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
  );
};

export default MapboxMap; 