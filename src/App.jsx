import './App.css'

import { useEffect, useRef, useState } from 'react'
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
  const [isUpVisible, setIsUpVisible] = useState(true)
  const [isDownVisible, setIsDownVisible] = useState(true)
  const pollRef = useRef(null)

  const visiblePolylines = polylines.filter((p) => {
    if (!p) return false
    if (p.direction === 0) return isUpVisible
    if (p.direction === 1) return isDownVisible
    return true
  })

  const visibleVehicles = vehicles.filter((v) => {
    if (!v) return false
    if (v.direction === 0) return isUpVisible
    if (v.direction === 1) return isDownVisible
    return true
  })

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
      setIsUpVisible(true)
      setIsDownVisible(true)
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
          isUpVisible={isUpVisible}
          isDownVisible={isDownVisible}
          onToggleUp={() => {
            setIsUpVisible((v) => {
              const next = !v
              if (!next && !isDownVisible) return true
              return next
            })
          }}
          onToggleDown={() => {
            setIsDownVisible((v) => {
              const next = !v
              if (!next && !isUpVisible) return true
              return next
            })
          }}
        />
      </div>
    </APIProvider>
  )
}

export default App
