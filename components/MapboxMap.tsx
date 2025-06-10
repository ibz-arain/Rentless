'use client'
import React, { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PropertyCard, transformPropertyData } from './properties';
import ReactDOM from 'react-dom/client';

import type { PropertyProps } from './properties';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Custom CSS for map controls
const mapControlStyles = `
  .mapboxgl-ctrl-group {
    background: #fefbf3;
    border: none !important;
    border-radius: 12px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
    overflow: hidden;
  }
  
  .mapboxgl-ctrl-group button {
    width: 36px !important;
    height: 36px !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .mapboxgl-ctrl-group button:hover {
    background-color: #f5f5f5 !important;
  }
  
  .mapboxgl-ctrl-group button.mapboxgl-ctrl-zoom-in,
  .mapboxgl-ctrl-group button.mapboxgl-ctrl-zoom-out,
  .mapboxgl-ctrl-group button.mapboxgl-ctrl-compass {
    color: #222 !important;
  }
  
  .mapboxgl-ctrl-group button:not(:first-child) {
    border-top: 1px solid #eeeeee !important;
  }
  
  .mapboxgl-ctrl-scale {
    background: transparent !important;
    border-top: transparent !important;
    color: var(--foreground) !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    padding: 4px 12px !important;
    backdrop-filter: blur(8px) !important;
    transition: all 0.2s ease !important;
    transform: translateY(20px) !important;
  }

  .mapboxgl-ctrl-scale:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    background: transparent !important;
    transform: translateY(20px) !important;
  }
  
  .mapboxgl-ctrl-geolocate, 
  .mapboxgl-ctrl-fullscreen {
    color: #222 !important;
  }
  
  .mapboxgl-ctrl-icon {
    filter: none !important;
  }
  .mapboxgl-ctrl-attrib {
    background: transparent !important;
    border-top: transparent !important;
    box-shadow: transparent !important;
    color: transparent !important;
    font-size: 0px !important;
    font-weight: 0 !important;
    padding: 0px 0px !important;
    backdrop-filter: blur(0px) !important;
    transition: all 0.2s ease !important;
  }

  /* Marker pins layering */
  .mapbox-price-pin {
    z-index: 1 !important;
  }

  /* Popups layering above pins */
  .mapboxgl-popup {
    z-index: 2 !important;
  }

  .mapboxgl-popup-content {
    z-index: 2 !important;
  }
`;

interface MapboxMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  properties: PropertyProps[];
  onMove?: (center: { lat: number; lng: number }, zoom: number, bounds: mapboxgl.LngLatBounds) => void;
  isListVisible?: boolean;
  favoriteIds: Set<number>;
  onFavoriteToggle: (propertyId: number, liked: boolean) => void;
  selectedPropertyId?: number | undefined;
  onPropertySelect?: (propertyId: number | undefined) => void;
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

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  center, 
  zoom = 12, 
  properties, 
  onMove, 
  isListVisible, 
  favoriteIds, 
  onFavoriteToggle,
  selectedPropertyId,
  onPropertySelect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const lastCenterRef = useRef(center);
  const lastZoomRef = useRef(zoom);
  const previousListVisibleRef = useRef(isListVisible);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const popupRootRef = useRef<ReactDOM.Root | null>(null);
  const popupCloseHandlerRef = useRef<(() => void) | null>(null);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is missing!');
      return;
    }
    
    // Add custom CSS to document head
    const styleElement = document.createElement('style');
    styleElement.textContent = mapControlStyles;
    document.head.appendChild(styleElement);
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [center.lng, center.lat],
      zoom,
    });

    // Disable kinetic panning to remove momentum freeze
    if ((mapRef.current as any).dragPan?.enable) {
      // Re-enable dragPan without kinetic (inertia)
      (mapRef.current as any).dragPan.disable();
      (mapRef.current as any).dragPan.enable({ kinetic: false });
    }

    // Add navigation controls (zoom in, zoom out, and compass)
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    mapRef.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');    
    // Add a small delay before initial resize to ensure container is ready
    setTimeout(() => {
      mapRef.current?.resize();
    }, 100);

    mapRef.current.on('moveend', () => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      const c = map.getCenter();
      const z = map.getZoom();
      const b = map.getBounds();
      // Only close popup if panned more than a small threshold
      const prev = lastCenterRef.current;
      const prevPoint = map.project([prev.lng, prev.lat]);
      const newPoint = map.project([c.lng, c.lat]);
      const dx = newPoint.x - prevPoint.x;
      const dy = newPoint.y - prevPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const CLOSE_THRESHOLD = 750; // CSS pixels threshold
      if (dist > CLOSE_THRESHOLD) {
        const oldPopup = popupRef.current;
        const oldRoot = popupRootRef.current;
        setTimeout(() => {
          // Only remove if same popup still active
          if (popupRef.current === oldPopup && popupRootRef.current === oldRoot) {
            if (oldPopup) {
              oldPopup.remove();
              popupRef.current = null;
            }
            if (oldRoot) {
              oldRoot.unmount();
              popupRootRef.current = null;
            }
          }
        }, 1000);
      }
      if (onMove && b) {
        onMove({ lat: c.lat, lng: c.lng }, z, b);
      }
      lastCenterRef.current = { lat: c.lat, lng: c.lng };
      lastZoomRef.current = z;
    });

    return () => {
      // Clean up custom styles
      document.head.querySelectorAll('style').forEach(el => {
        if (el.textContent === mapControlStyles) {
          el.remove();
        }
      });
      
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
    const pixelOffset = viewportWidth / 4;
    
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

  // Update property markers only when properties change or selected property changes
  useEffect(() => {
    if (!mapRef.current) return;
    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add new markers
    properties.forEach(property => {
      const el = document.createElement('div');
      el.className = 'mapbox-price-pin';
      el.style.padding = '4px 12px';
      
      const propertyId = (property as any).propertyId || (property as any).property_id;
      const isSelected = selectedPropertyId === propertyId;
      
      // Set initial style based on selection state
      el.style.background = isSelected ? '#e94351' : '#fff';
      el.style.color = isSelected ? '#fff' : '#222';
      el.style.border = '2px solid #e94351';
      el.style.borderRadius = '20px';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      el.style.display = 'inline-block';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '16px';
      el.style.cursor = 'pointer';
      el.style.userSelect = 'none';
      el.style.pointerEvents = 'auto';
      el.style.zIndex = isSelected ? '10' : '1';
      
      el.innerText = formatPrice((property as any).monthlyRent || (property as any).monthly_rent || 0);
      
      el.onmouseenter = () => {
        el.style.background = '#e94351';
        el.style.color = '#fff';
        el.style.borderColor = '#e94351';
        el.style.zIndex = '10';
      };
      el.onmouseleave = () => {
        if (selectedPropertyId !== propertyId) {
          el.style.background = '#fff';
          el.style.color = '#222';
          el.style.borderColor = '#e94351';
          el.style.zIndex = '1';
        }
      };
      el.onclick = (e) => {
        e.stopPropagation();
        if (onPropertySelect) {
          onPropertySelect(propertyId);
        }
      };
      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });    
  }, [properties, selectedPropertyId, onPropertySelect]);

  // Handle popup creation/removal separately to avoid React rendering conflicts
  useEffect(() => {
    // Cleanup previous popup and its listener before creating a new one
    if (popupRef.current) {
      if (popupCloseHandlerRef.current) {
        popupRef.current.off('close', popupCloseHandlerRef.current);
      }
      popupRef.current.remove();
    }
    if (popupRootRef.current) {
      popupRootRef.current.unmount();
      popupRootRef.current = null;
    }
    popupRef.current = null;
    popupCloseHandlerRef.current = null;

    // If no property is selected, or map isn't ready, we're done.
    if (!selectedPropertyId || !mapRef.current) {
      return;
    }
    
    const selectedProperty = properties.find(p => 
      (p as any).propertyId === selectedPropertyId || (p as any).property_id === selectedPropertyId
    );
    
    if (!selectedProperty) return;
    
    const handlePopupClose = () => {
      if (onPropertySelect) {
        onPropertySelect(undefined);
      }
      if (popupRootRef.current) {
        // This check is needed because the root might be unmounted by other effects
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
    };
    
    // Create a container for the React card
    const popupNode = document.createElement('div');
    popupNode.style.background = 'transparent';
    popupNode.style.boxShadow = 'none';
    popupNode.style.padding = '0';
    popupNode.style.border = 'none';
    popupNode.style.borderRadius = '0';
    
    // Render the PropertyCard into the popup
    const propertyData: PropertyProps = isCamelCaseProperty(selectedProperty) 
      ? selectedProperty 
      : transformPropertyData(selectedProperty);
    const popupIsMobile = window.innerWidth < 768;
    
    popupRootRef.current = ReactDOM.createRoot(popupNode);
    popupRootRef.current.render(
      <div style={{
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
        minWidth: popupIsMobile ? 200 : 280,
        maxWidth: popupIsMobile ? 200 : 280
      }}>
        <PropertyCard
          property={propertyData}
          isMobile={popupIsMobile}
          isMapPopup={popupIsMobile}
          initialIsLiked={favoriteIds.has(propertyData.propertyId)}
          onFavoriteToggle={(id, liked) => {
            onFavoriteToggle(id, liked);
          }}
        />
      </div>
    );
    
    const newPopup = new mapboxgl.Popup({ 
      offset: 24, 
      closeOnClick: true, 
      closeButton: false 
    })
    .setLngLat([selectedProperty.longitude, selectedProperty.latitude])
    .setDOMContent(popupNode)
    .addTo(mapRef.current);

    newPopup.on('close', handlePopupClose);

    // Store references for the next cleanup cycle
    popupRef.current = newPopup;
    popupCloseHandlerRef.current = handlePopupClose;
    
  }, [selectedPropertyId, properties, favoriteIds, onFavoriteToggle, onPropertySelect]);

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
  );
};

export default MapboxMap; 