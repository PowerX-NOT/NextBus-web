import { useMemo, useState } from 'react'

const SearchMode = {
  PLACES: 'places',
  ROUTES: 'routes',
}

export default function SearchCard({
  isExpanded,
  onExpandedChange,
  onNearbyClick,
  onFavoritesClick,
}) {
  const [searchMode, setSearchMode] = useState(SearchMode.PLACES)
  const [query, setQuery] = useState('')

  const routeSuggestions = useMemo(() => {
    if (searchMode !== SearchMode.ROUTES) return []
    const all = ['500D', '500A', '201', 'KIA-5', 'MF-10', '365', '401K']
    const q = query.trim().toLowerCase()
    if (!q) return all.slice(0, 5)
    return all.filter((r) => r.toLowerCase().includes(q)).slice(0, 8)
  }, [query, searchMode])

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
              routeSuggestions.length ? (
                <ul className="nb-list">
                  {routeSuggestions.map((r) => (
                    <li key={r}>
                      <button type="button" className="nb-listItem">
                        <span className="nb-listItem__title">{r}</span>
                        <span className="nb-listItem__sub">Route</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="nb-empty">No routes found</div>
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
