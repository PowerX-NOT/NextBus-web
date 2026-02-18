import { Map, Marker, useMap } from '@vis.gl/react-google-maps'

import { useEffect, useMemo, useRef } from 'react'

const defaultCenter = { lat: 12.9716, lng: 77.5946 }

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#2a2a2a' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#4a4a4a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#5a5a5a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#6a6a6a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#3a3a3a' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#4a4a6a' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#aaaaff' }],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#6a6aaa' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#5a5a8a' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ccccff' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#1a2a3a' }],
  },
]

function MapOverlays({ polylines, vehicles }) {
  const map = useMap('nb-map')
  const polylineRefs = useRef([])

  const visiblePolylines = useMemo(() => {
    return Array.isArray(polylines) ? polylines : []
  }, [polylines])

  useEffect(() => {
    if (!map) return
    if (!window.google?.maps?.Polyline) return

    for (const p of polylineRefs.current) {
      p.setMap(null)
    }
    polylineRefs.current = []

    for (const pl of visiblePolylines) {
      if (!pl?.points?.length) continue
      const direction = Number(pl.direction)
      const strokeColor = direction === 1 ? '#ef4444' : '#3b82f6'

      const polyline = new window.google.maps.Polyline({
        path: pl.points,
        geodesic: true,
        strokeColor,
        strokeOpacity: 0.9,
        strokeWeight: 4,
        clickable: false,
        zIndex: 3,
      })

      polyline.setMap(map)
      polylineRefs.current.push(polyline)
    }

    return () => {
      for (const p of polylineRefs.current) {
        p.setMap(null)
      }
      polylineRefs.current = []
    }
  }, [map, visiblePolylines])

  return Array.isArray(vehicles)
    ? vehicles
        .filter(
          (v) =>
            v?.location &&
            !Number.isNaN(v.location.lat) &&
            !Number.isNaN(v.location.lng)
        )
        .map((v, idx) => (
          <Marker
            key={`${v.vehicleId ?? v.vehicleNumber ?? 'v'}:${idx}`}
            position={v.location}
          />
        ))
    : null
}

export default function MapView({ polylines = [], vehicles = [] }) {
  return (
    <Map
      id="nb-map"
      style={{ width: '100%', height: '100%' }}
      defaultCenter={defaultCenter}
      defaultZoom={12}
      colorScheme="DARK"
      styles={darkMapStyle}
      gestureHandling="greedy"
      disableDefaultUI
    >
      <MapOverlays polylines={polylines} vehicles={vehicles} />
    </Map>
  )
}
