'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import rawData from '@/data/recommendations.json'
import type { Recommendation } from '@/components/types'

interface City { name: string; recommendations: Recommendation[] }
interface Region { name: string; cities: City[] }
const data = rawData as { regions: Region[] }

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="map-loading">Loading map…</div> })
const BottomSheet = dynamic(() => import('@/components/BottomSheet'), { ssr: false })

const categoryIcons: Record<string, string> = {
  restaurants: '🍜', bars: '🍶', activities: '⛩️', shopping: '🏬', tips: '💡',
}
const categoryOrder = ['restaurants', 'bars', 'activities', 'shopping', 'tips']

export default function Home() {
  const [activeRegion, setActiveRegion] = useState(data.regions[0]?.name ?? '')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [view, setView] = useState<'list' | 'map'>('list')
  const [highlightedRec, setHighlightedRec] = useState<string | null>(null)
  const [scrollToRec, setScrollToRec] = useState<string | null>(null)

  const region = data.regions.find(r => r.name === activeRegion)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    data.regions.forEach(r =>
      r.cities.forEach((c: { recommendations: Recommendation[] }) =>
        c.recommendations.forEach((rec: Recommendation) =>
          rec.tags?.forEach((t: string) => tagSet.add(t))
        )
      )
    )
    return Array.from(tagSet).sort()
  }, [])

  const toggleTag = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const filteredCities = useMemo(() => {
    if (!region) return []
    return region.cities.map((city) => {
      let recs = city.recommendations as Recommendation[]
      if (activeCategory) recs = recs.filter(r => r.category === activeCategory)
      if (activeTags.length > 0) recs = recs.filter(r => activeTags.every(tag => r.tags?.includes(tag)))
      return { ...city, recommendations: recs }
    })
  }, [region, activeCategory, activeTags])

  const allFilteredRecs: Recommendation[] = useMemo(() => {
    return filteredCities.flatMap(city =>
      city.recommendations.map(r => ({ ...r, city: city.name } as Recommendation))
    )
  }, [filteredCities])

  const handleMarkerClick = useCallback((rec: Recommendation) => {
    setHighlightedRec(rec.name)
    setScrollToRec(rec.name)
  }, [])

  const handleCardClick = useCallback((rec: Recommendation) => {
    setHighlightedRec(rec.name)
    setTimeout(() => setHighlightedRec(null), 2000)
  }, [])

  const isEmpty = data.regions.length === 0
  const noResults = !isEmpty && allFilteredRecs.length === 0

  if (view === 'map') {
    return (
      <div className="map-view-container">
        {/* Back button */}
        <button className="map-back-btn" onClick={() => setView('list')} title="Back to list">
          ← <span className="kanji-accent">日本</span>
        </button>

        <MapView
          recommendations={allFilteredRecs}
          onMarkerClick={handleMarkerClick}
          highlightedRec={highlightedRec}
        />

        <BottomSheet
          recommendations={allFilteredRecs}
          regions={data.regions.map(r => r.name)}
          activeRegion={activeRegion}
          onRegionChange={(r) => { setActiveRegion(r); setActiveCategory(null); setActiveTags([]) }}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          allTags={allTags}
          activeTags={activeTags}
          onToggleTag={toggleTag}
          onClearTags={() => setActiveTags([])}
          onCardClick={handleCardClick}
          highlightedRec={highlightedRec}
          scrollToRec={scrollToRec}
          onScrollComplete={() => setScrollToRec(null)}
        />
      </div>
    )
  }

  return (
    <>
      <header>
        <h1><span className="kanji-accent">日本</span> Recommendations</h1>
        <p className="subtitle">A curated guide</p>
      </header>

      {isEmpty ? (
        <div className="empty-state">
          <div className="empty-icon">🗾</div>
          <h2>No recommendations yet</h2>
          <p>Check back soon — recommendations are on the way!</p>
        </div>
      ) : (
        <>
          <nav>
            {data.regions.map(r => (
              <button key={r.name} className={activeRegion === r.name ? 'active' : ''} onClick={() => { setActiveRegion(r.name); setActiveCategory(null); setActiveTags([]) }}>
                {r.name}
              </button>
            ))}
          </nav>

          <div className="filters">
            <button className={activeCategory === null ? 'active' : ''} onClick={() => setActiveCategory(null)}>All</button>
            {categoryOrder.map(cat => (
              <button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => setActiveCategory(cat)}>
                {categoryIcons[cat]} {cat}
              </button>
            ))}
            <span className="view-divider" />
            <button className={`view-toggle ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="List view">☰</button>
            <button className="view-toggle" onClick={() => setView('map')} title="Map view">🗺️</button>
          </div>

          {allTags.length > 0 && (
            <div className="tag-filters">
              {allTags.map(tag => (
                <button key={tag} className={`tag-pill ${activeTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>
                  {tag}
                </button>
              ))}
              {activeTags.length > 0 && (
                <button className="tag-pill tag-clear" onClick={() => setActiveTags([])}>✕ clear</button>
              )}
            </div>
          )}

          {noResults ? (
            <div className="empty-state small"><p>No matches for the current filters.</p></div>
          ) : (
            <main className="container">
              {filteredCities.map(city => (
                <section key={city.name} className="city-section">
                  <h2 className="city-name">{city.name}</h2>
                  {city.recommendations.length === 0 ? (
                    <p className="city-empty">Recommendations coming soon…</p>
                  ) : (
                    <>
                      {categoryOrder
                        .filter(cat => city.recommendations.some((r: Recommendation) => r.category === cat))
                        .map(cat => (
                          <div key={cat}>
                            {!activeCategory && <div className="category-label">{categoryIcons[cat]} {cat}</div>}
                            {city.recommendations
                              .filter((r: Recommendation) => r.category === cat)
                              .map((rec: Recommendation, i: number) => (
                                <div key={i} className="rec-card">
                                  <div className="rec-header">
                                    <span className="rec-name">
                                      {rec.link ? <a href={rec.link} target="_blank" rel="noopener noreferrer">{rec.name}</a> : rec.name}
                                    </span>
                                    {rec.area && <span className="rec-area">{rec.area}</span>}
                                  </div>
                                  <p className="rec-desc">{rec.description}</p>
                                  {rec.tags && rec.tags.length > 0 && (
                                    <div className="rec-tags">{rec.tags.map(tag => <span key={tag} className="rec-tag">{tag}</span>)}</div>
                                  )}
                                </div>
                              ))}
                          </div>
                        ))}
                    </>
                  )}
                </section>
              ))}
            </main>
          )}
        </>
      )}

      <footer>
        <div className="divider" />
        いい旅を — Have a good trip
      </footer>
    </>
  )
}
