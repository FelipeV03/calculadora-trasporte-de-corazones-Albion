// Albion Online Data Project (AODP) API Client
// Docs: https://www.albion-online-data.com/

export type AlbionServer = "west" | "east" | "europe"

export const SERVER_URLS: Record<AlbionServer, string> = {
  west: "https://west.albion-online-data.com/api/v2",
  east: "https://east.albion-online-data.com/api/v2",
  europe: "https://europe.albion-online-data.com/api/v2",
}

export const SERVER_LABELS: Record<AlbionServer, string> = {
  west: "América (West)",
  east: "Asia (East)",
  europe: "Europa",
}

export const ALBION_CITIES = [
  "Caerleon",
  "Fort Sterling",
  "Thetford",
  "Martlock",
  "Bridgewatch",
  "Lymhurst",
  "Brecilien",
  "Black Market",
]

export interface PriceData {
  item_id: string
  city: string
  quality: number
  sell_price_min: number
  sell_price_min_date: string
  sell_price_max: number
  sell_price_max_date: string
  buy_price_min: number
  buy_price_min_date: string
  buy_price_max: number
  buy_price_max_date: string
}

export interface HistoryData {
  location: string
  item_id: string
  quality: number
  data: { item_count: number; avg_price: number; timestamp: string }[]
}

// ─── Simple in-memory cache ──────────────────────────────────────────────────
const cache = new Map<string, { data: PriceData[]; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(server: AlbionServer, itemIds: string[], locations: string[], quality: number) {
  return `${server}|${itemIds.sort().join(",")}|${locations.sort().join(",")}|${quality}`
}

// ─── Fetch prices ─────────────────────────────────────────────────────────────
export async function fetchPrices(
  itemIds: string[],
  options: {
    server?: AlbionServer
    locations?: string[]
    quality?: number
  } = {}
): Promise<PriceData[]> {
  const server = options.server ?? getServer()
  const locations = options.locations ?? ALBION_CITIES
  const quality = options.quality ?? 1

  const key = getCacheKey(server, itemIds, locations, quality)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  const base = SERVER_URLS[server]
  const ids = encodeURIComponent(itemIds.join(","))
  const locs = encodeURIComponent(locations.join(","))
  const url = `${base}/stats/prices/${ids}?locations=${locs}&qualities=${quality}`

  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`AODP error ${res.status}: ${res.statusText}`)

  const data: PriceData[] = await res.json()
  cache.set(key, { data, ts: Date.now() })
  return data
}

// ─── Fetch prices grouped by city ────────────────────────────────────────────
export async function fetchPricesByCity(
  itemId: string,
  server?: AlbionServer
): Promise<Record<string, PriceData>> {
  const prices = await fetchPrices([itemId], { server })
  return Object.fromEntries(prices.map((p) => [p.city, p]))
}

// ─── Best sell price across cities ──────────────────────────────────────────
export function getBestSellPrice(prices: PriceData[]): PriceData | null {
  const valid = prices.filter((p) => p.sell_price_min > 0)
  if (!valid.length) return null
  return valid.reduce((best, p) => (p.sell_price_min > best.sell_price_min ? p : best), valid[0])
}

// ─── Price freshness ─────────────────────────────────────────────────────────
export function getPriceAge(dateStr: string): string {
  if (!dateStr || dateStr.startsWith("0001")) return "Sin datos"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `hace ${days}d`
  if (hours > 0) return `hace ${hours}h`
  if (mins > 0) return `hace ${mins}m`
  return "Ahora mismo"
}

// ─── Icon URL ────────────────────────────────────────────────────────────────
export function getIconUrl(itemId: string, size = 64, enchantment = 0): string {
  const id = enchantment > 0 ? `${itemId}@${enchantment}` : itemId
  return `https://render.albiononline.com/v1/item/${id}.png?size=${size}`
}

// ─── Server preference in localStorage ───────────────────────────────────────
export function getServer(): AlbionServer {
  if (typeof window === "undefined") return "west"
  return (localStorage.getItem("albion-server") as AlbionServer) ?? "west"
}

export function setServer(server: AlbionServer): void {
  localStorage.setItem("albion-server", server)
  // Dispatch event so components can react
  window.dispatchEvent(new CustomEvent("albion-server-change", { detail: server }))
  // Invalidate cache on server change
  cache.clear()
}

// ─── Fetch gold prices ────────────────────────────────────────────────────────
export async function fetchGoldPrices(count = 24, server?: AlbionServer): Promise<{ price: number; timestamp: string }[]> {
  const s = server ?? getServer()
  const url = `${SERVER_URLS[s]}/stats/gold.json?count=${count}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Gold API error ${res.status}`)
  return res.json()
}
