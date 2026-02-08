'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { Recommendation } from './types'

interface BottomSheetProps {
  recommendations: Recommendation[]
  regions: string[]
  activeRegion: string
  onRegionChange: (region: string) => void
  activeCategory: string | null
  onCategoryChange: (cat: string | null) => void
  allTags: string[]
  activeTags: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  onCardClick: (rec: Recommendation) => void
  highlightedRec: string | null
  scrollToRec: string | null
  onScrollComplete: () => void
}

const categoryIcons: Record<string, string> = {
  restaurants: '🍜', bars: '🍶', activities: '⛩️', shopping: '🏬', tips: '💡',
}
const categoryOrder = ['restaurants', 'bars', 'activities', 'shopping', 'tips']

type SheetSnap = 'peek' | 'half' | 'full'

export default function BottomSheet({
  recommendations, regions, activeRegion, onRegionChange,
  activeCategory, onCategoryChange, allTags, activeTags,
  onToggleTag, onClearTags, onCardClick, highlightedRec,
  scrollToRec, onScrollComplete,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [snap, setSnap] = useState<SheetSnap>('peek')
  const dragState = useRef<{ startY: number; startTop: number; dragging: boolean }>({ startY: 0, startTop: 0, dragging: false })

  const snapHeights: Record<SheetSnap, string> = {
    peek: 'calc(100dvh - 72px)',   // show ~220px from bottom
    half: '45dvh',
    full: '80px',
  }

  // Scroll to rec when pin clicked
  useEffect(() => {
    if (!scrollToRec) return
    // Expand sheet first
    if (snap === 'peek') setSnap('half')

    setTimeout(() => {
      const el = cardRefs.current.get(scrollToRec)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('rec-card-flash')
        setTimeout(() => el.classList.remove('rec-card-flash'), 1200)
      }
      onScrollComplete()
    }, 350)
  }, [scrollToRec, snap, onScrollComplete])

  const handleDragStart = useCallback((clientY: number) => {
    if (!sheetRef.current) return
    dragState.current = {
      startY: clientY,
      startTop: sheetRef.current.getBoundingClientRect().top,
      dragging: true,
    }
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragState.current.dragging || !sheetRef.current) return
    const delta = clientY - dragState.current.startY
    const newTop = Math.max(80, dragState.current.startTop + delta)
    sheetRef.current.style.transition = 'none'
    sheetRef.current.style.top = `${newTop}px`
  }, [])

  const handleDragEnd = useCallback((clientY: number) => {
    if (!dragState.current.dragging || !sheetRef.current) return
    dragState.current.dragging = false
    sheetRef.current.style.transition = ''

    const vh = window.innerHeight
    const currentTop = sheetRef.current.getBoundingClientRect().top
    const ratio = currentTop / vh

    if (ratio < 0.25) setSnap('full')
    else if (ratio < 0.6) setSnap('half')
    else setSnap('peek')

    sheetRef.current.style.top = ''
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => handleDragStart(e.touches[0].clientY), [handleDragStart])
  const onTouchMove = useCallback((e: React.TouchEvent) => handleDragMove(e.touches[0].clientY), [handleDragMove])
  const onTouchEnd = useCallback((e: React.TouchEvent) => handleDragEnd(e.changedTouches[0].clientY), [handleDragEnd])
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientY)
    const onMove = (ev: MouseEvent) => handleDragMove(ev.clientY)
    const onUp = (ev: MouseEvent) => { handleDragEnd(ev.clientY); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [handleDragStart, handleDragMove, handleDragEnd])

  return (
    <div
      ref={sheetRef}
      className={`bottom-sheet bottom-sheet-${snap}`}
      style={{ top: snapHeights[snap] }}
    >
      {/* Drag handle */}
      <div
        className="sheet-handle-area"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <div className="sheet-handle" />
      </div>

      {/* Filters */}
      <div className="sheet-filters">
        <div className="sheet-regions">
          {regions.map(r => (
            <button key={r} className={activeRegion === r ? 'active' : ''} onClick={() => onRegionChange(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="sheet-categories">
          <button className={activeCategory === null ? 'active' : ''} onClick={() => onCategoryChange(null)}>All</button>
          {categoryOrder.map(cat => (
            <button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => onCategoryChange(cat)}>
              {categoryIcons[cat]} {cat}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="sheet-tags">
            {allTags.map(tag => (
              <button key={tag} className={`tag-pill ${activeTags.includes(tag) ? 'active' : ''}`} onClick={() => onToggleTag(tag)}>
                {tag}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button className="tag-pill tag-clear" onClick={onClearTags}>✕</button>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div ref={contentRef} className="sheet-content">
        {recommendations.length === 0 ? (
          <div className="sheet-empty">No matches for current filters</div>
        ) : (
          recommendations.map((rec, i) => (
            <div
              key={`${rec.name}-${i}`}
              ref={el => { if (el) cardRefs.current.set(rec.name, el); }}
              className={`rec-card sheet-card ${highlightedRec === rec.name ? 'rec-card-highlight' : ''}`}
              onClick={() => onCardClick(rec)}
            >
              <div className="rec-header">
                <span className="rec-name">
                  {categoryIcons[rec.category] || '📍'}{' '}
                  {rec.link ? (
                    <a href={rec.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      {rec.name}
                    </a>
                  ) : rec.name}
                </span>
                {rec.area && <span className="rec-area">{rec.area}</span>}
              </div>
              <p className="rec-desc">{rec.description}</p>
              {rec.tags && rec.tags.length > 0 && (
                <div className="rec-tags">
                  {rec.tags.map(tag => <span key={tag} className="rec-tag">{tag}</span>)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
