import './App.css'

import { useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import MapView from './components/MapView.jsx'
import SearchCard from './components/SearchCard.jsx'

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [isCardExpanded, setIsCardExpanded] = useState(false)

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

  return (
    <APIProvider apiKey={apiKey}>
      <div className="nb-shell">
        <header className="nb-topbar">
          <div className="nb-title">NextBus</div>
        </header>

        <main className="nb-content">
          <div className="nb-map">
            <MapView />
          </div>
        </main>

        <SearchCard
          isExpanded={isCardExpanded}
          onExpandedChange={setIsCardExpanded}
          onFavoritesClick={() => {}}
          onNearbyClick={() => {}}
        />
      </div>
    </APIProvider>
  )
}

export default App
