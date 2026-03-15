import { STATIONS, EDGES, ALL_STATION_NAMES } from './mrt-data'

export interface MeetupResult {
  station: string
  stops: number[]
  maxStops: number
  variance: number
}

export function bfs(start: string): Record<string, number> {
  const dist: Record<string, number> = {}
  const queue: string[] = [start]
  dist[start] = 0
  while (queue.length) {
    const curr = queue.shift()!
    const neighbors = EDGES[curr] ?? []
    for (const nb of neighbors) {
      if (dist[nb] === undefined) {
        dist[nb] = dist[curr] + 1
        queue.push(nb)
      }
    }
  }
  return dist
}

export function findBestMeetup(friendStations: string[]): MeetupResult | null {
  const allDists = friendStations.map(s => bfs(s))
  let best: MeetupResult | null = null
  let bestScore = Infinity

  for (const candidate of ALL_STATION_NAMES) {
    if (!STATIONS[candidate]) continue
    const stops = allDists.map(d => d[candidate])
    if (stops.some(s => s === undefined)) continue

    const maxStops = Math.max(...stops)
    const mean = stops.reduce((a, b) => a + b, 0) / stops.length
    const variance = stops.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / stops.length
    const score = maxStops * 1000 + variance

    if (score < bestScore) {
      bestScore = score
      best = { station: candidate, stops, maxStops, variance }
    }
  }
  return best
}
