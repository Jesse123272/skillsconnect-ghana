'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function ArtisanMap({ artisans = [], currentPosition }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.L) {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !currentPosition || !mapRef.current) {
      return;
    }

    const L = window.L;
    if (!L) {
      return;
    }

    if (leafletMapRef.current) {
      leafletMapRef.current.off();
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: currentPosition,
      zoom: 11,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomControl: true,
    });

    leafletMapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const markers = [];

    artisans.forEach((artisan) => {
      if (!artisan.lat || !artisan.lng) {
        return;
      }

      const marker = L.marker([artisan.lat, artisan.lng]).addTo(map);
      marker.bindPopup(
        `<div style="max-width:220px;">
           <strong>${artisan.full_name || 'Artisan'}</strong><br />
           <small>${artisan.category_name || 'Trade'}</small><br />
           <small>${artisan.region || ''}${artisan.district ? `, ${artisan.district}` : ''}</small><br />
           <small>${artisan.distance_km ? artisan.distance_km.toFixed(1) + ' km away' : ''}</small>
         </div>`
      );
      markers.push(marker);
    });

    const currentMarker = L.circleMarker(currentPosition, {
      radius: 7,
      color: '#0d6efd',
      fillColor: '#0d6efd',
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(map);
    currentMarker.bindPopup('<strong>Your location</strong>').openPopup();

    const points = markers.map((marker) => marker.getLatLng()).concat(currentMarker.getLatLng());
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds.pad(0.2));
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.off();
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [leafletLoaded, artisans, currentPosition]);

  return (
    <>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha512-1POQ7ypuPxLO08ru9ezSfV2iiV4yjEP6AE9oU0XbIeGxGq92C5Qj4n1SL6x7e/57QLmHq21Q5qNT0C8hG+7vUA=="
        crossOrigin=""
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.L) {
            setLeafletLoaded(true);
          }
        }}
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha512-sA+eP7uyrUb91ZLQ/eKVF7a8U8FieldO6uB+Sm/QW1p8OZdz8TzorK0aFeyPvE7PWm7CqIT+QmVZxN4ql7k7g=="
        crossOrigin=""
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} className="rounded-3" />
    </>
  );
}
