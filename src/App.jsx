import './App.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import MapView from './components/MapView.jsx'
import SearchCard from './components/SearchCard.jsx'

import { fetchLiveVehicles, fetchRoutePolylines } from './api/bmtc.js'

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [isCardExpanded, setIsCardExpanded] = useState(false)

  const [selectedRoute, setSelectedRoute] = useState(null)
  const [polylines, setPolylines] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [activeDirection, setActiveDirection] = useState(0)
  const pollRef = useRef(null)

  const visiblePolylines = useMemo(() => {
    return polylines.filter((p) => {
      if (!p) return false
      if (p.direction === 0) return activeDirection === 0
      if (p.direction === 1) return activeDirection === 1
      return true
    })
  }, [activeDirection, polylines])

  const visibleVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (!v) return false
      if (v.direction === 0) return activeDirection === 0
      if (v.direction === 1) return activeDirection === 1
      return true
    })
  }, [activeDirection, vehicles])

  if (!apiKey) {
    return (
      <div className="nb-shell">
        <header className="nb-topbar">
          <div className="nb-title">NextBus</div>
        </header>
        <main className="nb-content">
          <div className="nb-error">
            Missing Google Maps API key. Set <code>VITE_GOOGLE_MAPS_API_KEY</code>
            in <code>.env</code> and restart the dev server.
          </div>
        </main>
      </div>
    )
  }

  useEffect(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }

    if (!selectedRoute) {
      setPolylines([])
      setVehicles([])
      setActiveDirection(0)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const pls = await fetchRoutePolylines(
          selectedRoute.routeNo,
          selectedRoute.routeParentId
        )
        if (!cancelled) setPolylines(pls)
      } catch {
        if (!cancelled) setPolylines([])
      }
    })()

    const fetchVehiclesOnce = async () => {
      try {
        const vs = await fetchLiveVehicles(
          selectedRoute.routeNo,
          selectedRoute.routeParentId
        )
        if (!cancelled) setVehicles(vs)
      } catch {
        if (!cancelled) setVehicles([])
      }
    }

    fetchVehiclesOnce()
    pollRef.current = window.setInterval(fetchVehiclesOnce, 2000)

    return () => {
      cancelled = true
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [selectedRoute])

  return (
    <APIProvider apiKey={apiKey}>
      <div className="nb-shell">
        <header className="nb-topbar">
          <div className="nb-title">NextBus</div>
        </header>

        <main className="nb-content">
          <div className="nb-map">
            <MapView polylines={visiblePolylines} vehicles={visibleVehicles} />
          </div>
        </main>

        <SearchCard
          isExpanded={isCardExpanded}
          onExpandedChange={setIsCardExpanded}
          onFavoritesClick={() => {}}
          onNearbyClick={() => {}}
          onRouteSelected={setSelectedRoute}
          activeDirection={activeDirection}
          onSwapDirection={() => setActiveDirection((d) => (d === 0 ? 1 : 0))}
        />
      </div>
    </APIProvider>
  )
}

export default App
