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
  const basePolylineRefs = useRef([])
  const animPolylineRefs = useRef([])
  const animationFrameRef = useRef(null)

  const visiblePolylines = useMemo(() => {
    return Array.isArray(polylines) ? polylines : []
  }, [polylines])

  const distanceMeters = (a, b) => {
    const R = 6371000
    const toRad = (d) => (d * Math.PI) / 180
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const dLat = lat2 - lat1
    const dLng = toRad(b.lng - a.lng)

    const sa = Math.sin(dLat / 2)
    const sb = Math.sin(dLng / 2)
    const h = sa * sa + Math.cos(lat1) * Math.cos(lat2) * sb * sb
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
  }

  const interpolateLatLng = (a, b, t) => {
    const lat = a.lat + (b.lat - a.lat) * t
    const lng = a.lng + (b.lng - a.lng) * t
    return { lat, lng }
  }

  const densifyPolyline = (points, stepMeters = 15) => {
    if (!Array.isArray(points) || points.length < 2) return []
    if (!(stepMeters > 0)) return points

    const out = [points[0]]
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      const dist = distanceMeters(a, b)
      if (!(dist > stepMeters)) {
        out.push(b)
        continue
      }

      const steps = Math.max(1, Math.floor(dist / stepMeters))
      for (let s = 1; s <= steps; s += 1) {
        const t = Math.min(1, Math.max(0, s / steps))
        out.push(interpolateLatLng(a, b, t))
      }
    }

    return out
  }

  const easeOutCubic = (t) => {
    const x = Math.min(1, Math.max(0, t))
    return 1 - (1 - x) * (1 - x) * (1 - x)
  }

  const easeInCirc = (t) => {
    const x = Math.min(1, Math.max(0, t))
    return 1 - Math.sqrt(1 - x * x)
  }

  const lerp = (a, b, t) => {
    const x = Math.min(1, Math.max(0, t))
    return a + (b - a) * x
  }

  useEffect(() => {
    if (!map) return
    if (!window.google?.maps?.Polyline) return

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    for (const p of basePolylineRefs.current) p.setMap(null)
    for (const p of animPolylineRefs.current) p.setMap(null)
    basePolylineRefs.current = []
    animPolylineRefs.current = []

    const durationMs = 3000
    const holdMs = 120
    const cycleMs = durationMs + holdMs
    const created = []

    for (const pl of visiblePolylines) {
      if (!pl?.points?.length) continue
      const direction = Number(pl.direction)
      const color = direction === 1 ? '#E53935' : '#1E88E5'

      const densified = densifyPolyline(pl.points, 15)
      if (densified.length < 2) continue

      const basePolyline = new window.google.maps.Polyline({
        path: densified,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0,
        strokeWeight: 6,
        clickable: false,
        zIndex: 2,
      })

      const animPolyline = new window.google.maps.Polyline({
        path: densified.slice(0, 2),
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: 6,
        clickable: false,
        zIndex: 3,
      })

      basePolyline.setMap(map)
      animPolyline.setMap(map)
      basePolylineRefs.current.push(basePolyline)
      animPolylineRefs.current.push(animPolyline)
      created.push({ animPolyline, basePolyline, points: densified })
    }

    if (created.length) {
      const start = performance.now()
      const tick = (now) => {
        const elapsedInCycle = (now - start) % cycleMs
        const rawProgress = Math.min(1, elapsedInCycle / durationMs)
        const easedProgress = easeOutCubic(rawProgress)
        const bgAlpha = rawProgress < 0.001 ? 0 : lerp(0.3, 1.0, easeInCirc(rawProgress))

        for (const item of created) {
          const n = item.points.length
          const idx = Math.max(2, Math.min(n, 1 + Math.floor(easedProgress * (n - 1))))
          item.animPolyline.setPath(item.points.slice(0, idx))
          item.basePolyline.setOptions({ strokeOpacity: bgAlpha })
        }
        animationFrameRef.current = window.requestAnimationFrame(tick)
      }

      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      for (const p of basePolylineRefs.current) p.setMap(null)
      for (const p of animPolylineRefs.current) p.setMap(null)
      basePolylineRefs.current = []
      animPolylineRefs.current = []
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
