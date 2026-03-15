'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { FRIEND_COLORS, STATIONS, ALL_STATION_NAMES } from '@/lib/mrt-data'
import { findBestMeetup, type MeetupResult } from '@/lib/bfs'

const MIN_FRIENDS = 2
const MAX_FRIENDS = 10

interface FriendRow {
  id: number
  value: string
  suggestions: string[]
  selIdx: number
  open: boolean
}

let _nextId = 3

export default function MrtFinder() {
  const [friends, setFriends] = useState<FriendRow[]>([
    { id: 1, value: '', suggestions: [], selIdx: -1, open: false },
    { id: 2, value: '', suggestions: [], selIdx: -1, open: false },
  ])
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ data: MeetupResult; friendValues: string[] } | null>(null)

  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])

  // Initialise Leaflet map after mount
  useEffect(() => {
    const init = async () => {
      const L = (await import('leaflet')).default
      LRef.current = L
      if (!mapDivRef.current || mapRef.current) return
      const map = L.map(mapDivRef.current, { zoomControl: true }).setView([1.352, 103.82], 12)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)
      mapRef.current = map
    }
    init()
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Close all autocomplete dropdowns on outside click
  useEffect(() => {
    const close = () => setFriends(prev => prev.map(f => ({ ...f, open: false })))
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  function updateFriend(id: number, patch: Partial<FriendRow>) {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  function handleInput(id: number, raw: string) {
    const q = raw.toLowerCase()
    const suggestions = q
      ? ALL_STATION_NAMES.filter(s => s.toLowerCase().includes(q)).slice(0, 8)
      : []
    updateFriend(id, { value: raw, suggestions, selIdx: -1, open: suggestions.length > 0 })
  }

  function handleKeyDown(id: number, e: React.KeyboardEvent) {
    const f = friends.find(f => f.id === id)!
    const len = f.suggestions.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      updateFriend(id, { selIdx: Math.min(f.selIdx + 1, len - 1) })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      updateFriend(id, { selIdx: Math.max(f.selIdx - 1, -1) })
    } else if (e.key === 'Enter' && f.selIdx >= 0 && f.suggestions[f.selIdx]) {
      updateFriend(id, { value: f.suggestions[f.selIdx], open: false, suggestions: [], selIdx: -1 })
    } else if (e.key === 'Escape') {
      updateFriend(id, { open: false })
    }
  }

  function selectSuggestion(id: number, suggestion: string, e: React.MouseEvent) {
    e.preventDefault()
    updateFriend(id, { value: suggestion, open: false, suggestions: [], selIdx: -1 })
  }

  function addFriend() {
    if (friends.length >= MAX_FRIENDS) return
    setFriends(prev => [...prev, { id: _nextId++, value: '', suggestions: [], selIdx: -1, open: false }])
  }

  function removeFriend(id: number) {
    if (friends.length <= MIN_FRIENDS) return
    setFriends(prev => prev.filter(f => f.id !== id))
  }

  function clearMap() {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => map.removeLayer(m))
    polylinesRef.current.forEach(p => map.removeLayer(p))
    markersRef.current = []
    polylinesRef.current = []
  }

  function findMeetup() {
    setError('')
    const L = LRef.current
    if (!L || !mapRef.current) {
      setError('Map is still loading, please try again.')
      return
    }

    const values = friends.map(f => f.value.trim()).filter(v => v !== '')
    if (values.length < 2) {
      setError('Please enter at least 2 stations.')
      return
    }
    const invalid = values.filter(v => !STATIONS[v])
    if (invalid.length) {
      setError(`Unknown station(s): ${invalid.join(', ')}`)
      return
    }
    if (new Set(values).size < 2) {
      setError('Please enter at least 2 different stations.')
      return
    }

    clearMap()
    const data = findBestMeetup(values)
    if (!data) {
      setError('Could not find a reachable meeting point.')
      return
    }

    const map = mapRef.current

    // Friend markers
    values.forEach((s, i) => {
      const info = STATIONS[s]
      if (!info) return
      const c = FRIEND_COLORS[i % FRIEND_COLORS.length]
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${c.bg};border:2.5px solid ${c.border};display:flex;align-items:center;justify-content:center;font-size:11px;font-family:monospace;font-weight:500;color:${c.text};box-shadow:0 2px 8px rgba(0,0,0,0.5)">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      const marker = L.marker([info.lat, info.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>Friend ${i + 1}</b><br>${s}`)
      markersRef.current.push(marker)
    })

    // Meetup marker
    const meetInfo = STATIONS[data.station]
    if (meetInfo) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:40px;height:40px;border-radius:50%;background:#e8ff6b;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 16px rgba(232,255,107,0.5)">⭐</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })
      const marker = L.marker([meetInfo.lat, meetInfo.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>Meet here!</b><br>${data.station}`)
        .openPopup()
      markersRef.current.push(marker)

      // Lines from each friend to meetup
      values.forEach((s, i) => {
        const info = STATIONS[s]
        if (!info) return
        const c = FRIEND_COLORS[i % FRIEND_COLORS.length]
        const line = L.polyline(
          [[info.lat, info.lng], [meetInfo.lat, meetInfo.lng]],
          { color: c.bg, weight: 2, opacity: 0.5, dashArray: '6,6' },
        ).addTo(map)
        polylinesRef.current.push(line)
      })

      // Fit map bounds
      const pts: [number, number][] = [...values, data.station]
        .filter(s => STATIONS[s])
        .map(s => [STATIONS[s].lat, STATIONS[s].lng])
      if (pts.length > 0) map.fitBounds(pts, { padding: [40, 40] })
    }

    setResult({ data, friendValues: values })
  }

  const maxVal = result ? Math.max(...result.data.stops) : 0
  const totalStops = result ? result.data.stops.reduce((a, b) => a + b, 0) : 0
  const avg = result ? (totalStops / result.data.stops.length).toFixed(1) : '0'
  const stddev = result ? Math.sqrt(result.data.variance).toFixed(1) : '0'

  return (
    <div className="container">
      <header>
        <div className="eyebrow">Singapore MRT</div>
        <h1>Find the <em>fairest</em><br />meetup station.</h1>
        <p className="subtitle">
          Enter each friend&apos;s MRT station. We&apos;ll find the stop where no one travels more
          than necessary — minimizing the longest journey.
        </p>
      </header>

      <div className="layout">
        {/* Left: Input Panel */}
        <div className="panel">
          <div className="panel-title">Friends&apos; Stations</div>
          <div className="friends-list">
            {friends.map((f, i) => {
              const c = FRIEND_COLORS[i % FRIEND_COLORS.length]
              return (
                <div key={f.id} className="friend-row">
                  <div
                    className="friend-badge"
                    style={{ background: c.bg + '22', borderColor: c.bg, color: c.bg }}
                  >
                    {i + 1}
                  </div>

                  <div
                    className="friend-input-wrap"
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      className="friend-input"
                      type="text"
                      placeholder={`Friend ${i + 1}'s MRT station…`}
                      value={f.value}
                      autoComplete="off"
                      onChange={e => handleInput(f.id, e.target.value)}
                      onKeyDown={e => handleKeyDown(f.id, e)}
                      onBlur={() => setTimeout(() => updateFriend(f.id, { open: false }), 150)}
                    />
                    {f.open && f.suggestions.length > 0 && (
                      <div className="autocomplete-list open">
                        {f.suggestions.map((s, si) => (
                          <div
                            key={s}
                            className={`autocomplete-item${f.selIdx === si ? ' selected' : ''}`}
                            onMouseDown={e => selectSuggestion(f.id, s, e)}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {friends.length > MIN_FRIENDS && (
                    <button
                      className="remove-btn"
                      onClick={() => removeFriend(f.id)}
                      title="Remove friend"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <button
            className="btn-secondary"
            onClick={addFriend}
            disabled={friends.length >= MAX_FRIENDS}
          >
            + Add Friend
          </button>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn" onClick={findMeetup}>
            Find Meetup Station →
          </button>
        </div>

        {/* Right: Map + Results */}
        <div className="right-panel">
          <div ref={mapDivRef} className="map-container" />

          {result && (
            <div className="panel result-panel">
              <div className="panel-title">Recommended Meetup</div>
              <div className="result-header">
                <div className="result-station">{result.data.station}</div>
                <div className="result-meta">
                  Max {result.data.maxStops} stop{result.data.maxStops !== 1 ? 's' : ''} from any friend
                </div>
              </div>

              <div className="breakdown-grid">
                {result.friendValues.map((s, i) => {
                  const c = FRIEND_COLORS[i % FRIEND_COLORS.length]
                  const stops = result.data.stops[i]
                  const pct = maxVal > 0 ? Math.round((stops / maxVal) * 100) : 100
                  return (
                    <div key={i} className="breakdown-card">
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.bg }} />
                      <div className="breakdown-friend">Friend {i + 1}</div>
                      <div className="breakdown-from">{s}</div>
                      <div className="breakdown-stops" style={{ color: c.bg }}>{stops}</div>
                      <div className="breakdown-label">stop{stops !== 1 ? 's' : ''}</div>
                      <div className="bar-wrap">
                        <div className="bar-fill" style={{ width: `${pct}%`, background: c.bg }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="score-row">
                <div className="score-item">
                  <div className="score-label">Max Stops</div>
                  <div className="score-value">{result.data.maxStops}</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Total Stops</div>
                  <div className="score-value">{totalStops}</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Avg Stops</div>
                  <div className="score-value">{avg}</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Std Dev</div>
                  <div className="score-value">{stddev}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
