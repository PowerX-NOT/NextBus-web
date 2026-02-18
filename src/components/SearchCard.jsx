import { useEffect, useMemo, useRef, useState } from 'react'

import { fetchRouteStops, searchRoutes } from '../api/bmtc.js'

const SearchMode = {
  PLACES: 'places',
  ROUTES: 'routes',
}

export default function SearchCard({
  isExpanded,
  onExpandedChange,
  onNearbyClick,
  onFavoritesClick,
  onRouteSelected,
  isUpVisible = true,
  isDownVisible = true,
  onToggleUp = () => {},
  onToggleDown = () => {},
}) {
  const [searchMode, setSearchMode] = useState(SearchMode.PLACES)
  const [query, setQuery] = useState('')

  const [routeSuggestions, setRouteSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState(null)

  const [selectedRoute, setSelectedRoute] = useState(null)
  const [routeStops, setRouteStops] = useState([])
  const [isLoadingStops, setIsLoadingStops] = useState(false)
  const [stopsError, setStopsError] = useState(null)

  const debounceRef = useRef(null)
  const latestRequestRef = useRef(0)

  useEffect(() => {
    if (!isExpanded) return
    if (searchMode !== SearchMode.ROUTES) return

    const q = query.trim()
    setSelectedRoute(null)
    setRouteStops([])
    setStopsError(null)

    if (!q) {
      setRouteSuggestions([])
      setSuggestionError(null)
      setIsLoadingSuggestions(false)
      return
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(async () => {
      const reqId = Date.now()
      latestRequestRef.current = reqId

      setIsLoadingSuggestions(true)
      setSuggestionError(null)
      try {
        const results = await searchRoutes(q)
        if (latestRequestRef.current !== reqId) return
        setRouteSuggestions(results)
      } catch (e) {
        if (latestRequestRef.current !== reqId) return
        setRouteSuggestions([])
        setSuggestionError(e?.message ?? 'Failed to load route suggestions')
      } finally {
        if (latestRequestRef.current !== reqId) return
        setIsLoadingSuggestions(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [isExpanded, query, searchMode])

  const groupedStops = useMemo(() => {
    const up = []
    const down = []
    for (const s of routeStops) {
      if (s.direction === 1) down.push(s)
      else up.push(s)
    }
    return { up, down }
  }, [routeStops])

  const handleRoutePick = async (route) => {
    setSelectedRoute(route)
    onRouteSelected?.(route)
    setIsLoadingStops(true)
    setStopsError(null)
    try {
      const stops = await fetchRouteStops(route.routeNo, route.routeParentId)
      setRouteStops(stops)
    } catch (e) {
      setRouteStops([])
      setStopsError(e?.message ?? 'Failed to load route stops')
    } finally {
      setIsLoadingStops(false)
    }
  }

  return (
    <section className={isExpanded ? 'nb-card nb-card--expanded' : 'nb-card'}>
      <button
        type="button"
        className="nb-card__handle"
        aria-label={isExpanded ? 'Collapse search' : 'Expand search'}
        onClick={() => onExpandedChange(!isExpanded)}
      >
        <span className="nb-card__handleBar" />
      </button>

      {isExpanded ? (
        <div className="nb-card__expanded">
          <div className="nb-card__chips">
            <button
              type="button"
              className={
                searchMode === SearchMode.PLACES
                  ? 'nb-chip nb-chip--active'
                  : 'nb-chip'
              }
              onClick={() => {
                setSearchMode(SearchMode.PLACES)
                setQuery('')
                setRouteSuggestions([])
                setSuggestionError(null)
                setSelectedRoute(null)
                onRouteSelected?.(null)
                setRouteStops([])
                setStopsError(null)
              }}
            >
              Places
            </button>
            <button
              type="button"
              className={
                searchMode === SearchMode.ROUTES
                  ? 'nb-chip nb-chip--active'
                  : 'nb-chip'
              }
              onClick={() => {
                setSearchMode(SearchMode.ROUTES)
                setQuery('')
                setRouteSuggestions([])
                setSuggestionError(null)
                setSelectedRoute(null)
                onRouteSelected?.(null)
                setRouteStops([])
                setStopsError(null)
              }}
            >
              Routes
            </button>
          </div>

          <div className="nb-card__field">
            <span className="nb-card__fieldIcon">⌕</span>
            <input
              className="nb-card__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchMode === SearchMode.PLACES
                  ? 'Search for places...'
                  : 'Search bus stops by route (e.g. 500D)'
              }
            />
            {query ? (
              <button
                type="button"
                className="nb-card__clear"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                ×
              </button>
            ) : null}
          </div>

          <div className="nb-card__actions">
            <button type="button" className="nb-action" onClick={onFavoritesClick}>
              Favorites
            </button>
            <button type="button" className="nb-action" onClick={onNearbyClick}>
              Nearby
            </button>
          </div>

          <div className="nb-card__list">
            {searchMode === SearchMode.ROUTES ? (
              selectedRoute ? (
                <div className="nb-stops">
                  <div className="nb-stops__title">{selectedRoute.routeNo}</div>

                  <div className="nb-dir">
                    <button
                      type="button"
                      className={isUpVisible ? 'nb-dir__btn nb-dir__btn--on' : 'nb-dir__btn'}
                      onClick={onToggleUp}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className={
                        isDownVisible ? 'nb-dir__btn nb-dir__btn--on' : 'nb-dir__btn'
                      }
                      onClick={onToggleDown}
                    >
                      Down
                    </button>
                  </div>

                  {isLoadingStops ? (
                    <div className="nb-empty">Loading stops...</div>
                  ) : stopsError ? (
                    <div className="nb-empty">{stopsError}</div>
                  ) : routeStops.length ? (
                    <>
                      {groupedStops.up.length ? (
                        <>
                          <div className="nb-stops__section">Up ({groupedStops.up.length})</div>
                          <ul className="nb-list">
                            {groupedStops.up.map((s) => (
                              <li key={s.id}>
                                <button type="button" className="nb-listItem">
                                  <span className="nb-listItem__title">{s.name}</span>
                                  <span className="nb-listItem__sub">Stop</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}

                      {groupedStops.down.length ? (
                        <>
                          <div className="nb-stops__section">Down ({groupedStops.down.length})</div>
                          <ul className="nb-list">
                            {groupedStops.down.map((s) => (
                              <li key={s.id}>
                                <button type="button" className="nb-listItem">
                                  <span className="nb-listItem__title">{s.name}</span>
                                  <span className="nb-listItem__sub">Stop</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <div className="nb-empty">No stops found</div>
                  )}

                  <button
                    type="button"
                    className="nb-action"
                    onClick={() => {
                      setSelectedRoute(null)
                      onRouteSelected?.(null)
                      setRouteStops([])
                      setStopsError(null)
                    }}
                  >
                    Back to routes
                  </button>
                </div>
              ) : isLoadingSuggestions ? (
                <div className="nb-empty">Loading routes...</div>
              ) : suggestionError ? (
                <div className="nb-empty">{suggestionError}</div>
              ) : routeSuggestions.length ? (
                <ul className="nb-list">
                  {routeSuggestions.map((r) => (
                    <li key={`${r.routeNo}:${r.routeParentId}`}>
                      <button
                        type="button"
                        className="nb-listItem"
                        onClick={() => handleRoutePick(r)}
                      >
                        <span className="nb-listItem__title">{r.routeNo}</span>
                        <span className="nb-listItem__sub">Route</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.trim() ? (
                <div className="nb-empty">No routes found</div>
              ) : (
                <div className="nb-empty">Type a route number (e.g. 500D)</div>
              )
            ) : (
              <div className="nb-empty">Start typing to search places</div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
