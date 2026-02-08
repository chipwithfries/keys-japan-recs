'use client'

import { useState, useMemo } from 'react'
import data from '@/data/recommendations.json'

const categoryIcons: Record<string, string> = {
  restaurants: '🍜',
  bars: '🍶',
  activities: '⛩️',
  shopping: '🏬',
  tips: '💡',
}

const categoryOrder = ['restaurants', 'bars', 'activities', 'shopping', 'tips']

export default function Home() {
  const [activeRegion, setActiveRegion] = useState(data.regions[0]?.name ?? '')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const region = data.regions.find(r => r.name === activeRegion)

  const filteredCities = useMemo(() => {
    if (!region) return []
    return region.cities.map(city => {
      const recs = activeCategory
        ? city.recommendations.filter(r => r.category === activeCategory)
        : city.recommendations
      return { ...city, recommendations: recs }
    })
  }, [region, activeCategory])

  return (
    <>
      <header>
        <h1>
          <span className="kanji-accent">日本</span> Recommendations
        </h1>
        <p className="subtitle">A curated guide</p>
      </header>

      <nav>
        {data.regions.map(r => (
          <button
            key={r.name}
            className={activeRegion === r.name ? 'active' : ''}
            onClick={() => { setActiveRegion(r.name); setActiveCategory(null) }}
          >
            {r.name}
          </button>
        ))}
      </nav>

      <div className="filters">
        <button
          className={activeCategory === null ? 'active' : ''}
          onClick={() => setActiveCategory(null)}
        >
          All
        </button>
        {categoryOrder.map(cat => (
          <button
            key={cat}
            className={activeCategory === cat ? 'active' : ''}
            onClick={() => setActiveCategory(cat)}
          >
            {categoryIcons[cat]} {cat}
          </button>
        ))}
      </div>

      <main className="container">
        {filteredCities.map(city => (
          <section key={city.name} className="city-section">
            <h2 className="city-name">{city.name}</h2>
            {city.recommendations.length === 0 ? (
              <p className="city-empty">Recommendations coming soon…</p>
            ) : (
              <>
                {categoryOrder
                  .filter(cat => city.recommendations.some(r => r.category === cat))
                  .map(cat => (
                    <div key={cat}>
                      {!activeCategory && (
                        <div className="category-label">
                          {categoryIcons[cat]} {cat}
                        </div>
                      )}
                      {city.recommendations
                        .filter(r => r.category === cat)
                        .map((rec, i) => (
                          <div key={i} className="rec-card">
                            <div className="rec-header">
                              <span className="rec-name">
                                {rec.link ? (
                                  <a href={rec.link} target="_blank" rel="noopener noreferrer">
                                    {rec.name}
                                  </a>
                                ) : (
                                  rec.name
                                )}
                              </span>
                              {rec.area && <span className="rec-area">{rec.area}</span>}
                            </div>
                            <p className="rec-desc">{rec.description}</p>
                          </div>
                        ))}
                    </div>
                  ))}
              </>
            )}
          </section>
        ))}
      </main>

      <footer>
        <div className="divider" />
        いい旅を — Have a good trip
      </footer>
    </>
  )
}
