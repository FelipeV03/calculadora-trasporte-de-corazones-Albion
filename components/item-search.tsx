"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, X, RefreshCw, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ItemIcon } from "@/components/item-icon"
import { searchItems, AlbionItem, ITEM_BY_ID } from "@/lib/albion-items"
import {
  fetchPrices,
  PriceData,
  ALBION_CITIES,
  getServer,
  getPriceAge,
  AlbionServer,
} from "@/lib/albion-api"

const formatSilver = (v: number) => {
  if (!v || v === 0) return "—"
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

// ─── Item search dropdown ─────────────────────────────────────────────────────
interface ItemSearchProps {
  value?: string                         // selected item ID
  onChange?: (item: AlbionItem) => void  // called when item selected
  placeholder?: string
  className?: string
}

export function ItemSearchDropdown({ value, onChange, placeholder = "Buscar item...", className = "" }: ItemSearchProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<AlbionItem[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const selectedItem = value ? ITEM_BY_ID.get(value) : null

  useEffect(() => {
    setResults(searchItems(query, 20))
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const select = (item: AlbionItem) => {
    onChange?.(item)
    setQuery("")
    setOpen(false)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.({ id: "", name: "", tier: 0, category: "misc", subcategory: "" })
    setQuery("")
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {selectedItem && !open ? (
        <div
          className="flex items-center gap-2 px-3 h-10 rounded-md bg-secondary border border-border cursor-pointer hover:bg-secondary/80"
          onClick={() => { setOpen(true); setQuery("") }}
        >
          <ItemIcon itemId={selectedItem.id} size={24} />
          <span className="text-sm text-foreground flex-1 truncate">{selectedItem.name}</span>
          <button onClick={clear} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="bg-secondary border-border pl-8"
          />
        </div>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">Sin resultados para "{query}"</div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-secondary text-left transition-colors"
                onClick={() => select(item)}
              >
                <ItemIcon itemId={item.id} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.id}</p>
                </div>
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  T{item.tier}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Price panel (shows live prices for an item across cities) ────────────────
interface PricePanelProps {
  itemId: string
  server?: AlbionServer
  onUsePrice?: (price: number, city: string) => void
  compact?: boolean
}

export function PricePanel({ itemId, server, onUsePrice, compact = false }: PricePanelProps) {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const item = ITEM_BY_ID.get(itemId)
  const srv = server ?? getServer()

  const fetch = useCallback(async () => {
    if (!itemId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPrices([itemId], { server: srv, locations: ALBION_CITIES })
      setPrices(data)
      setLastFetch(new Date())
    } catch (e) {
      setError("Error al obtener precios. Verifica tu conexión.")
    } finally {
      setLoading(false)
    }
  }, [itemId, srv])

  useEffect(() => {
    if (itemId) fetch()
  }, [itemId, fetch])

  const validPrices = prices.filter((p) => p.sell_price_min > 0)
  const bestSell = validPrices.length > 0
    ? validPrices.reduce((b, p) => p.sell_price_min > b.sell_price_min ? p : b, validPrices[0])
    : null

  if (!itemId) return null

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-secondary/30">
        {item && <ItemIcon itemId={itemId} size={28} />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{item?.name ?? itemId}</p>
          {lastFetch && (
            <p className="text-[10px] text-muted-foreground">
              Actualizado {lastFetch.toLocaleTimeString("es-CO")}
            </p>
          )}
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error */}
      {error && <p className="px-3 py-2 text-xs text-red-400">{error}</p>}

      {/* Prices table */}
      {!error && (
        <div className={`overflow-x-auto ${compact ? "max-h-48" : "max-h-72"} overflow-y-auto`}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="text-muted-foreground border-b border-border/50">
                <th className="text-left px-3 py-1.5">Ciudad</th>
                <th className="text-right px-3 py-1.5">Venta mín.</th>
                <th className="text-right px-3 py-1.5">Venta máx.</th>
                <th className="text-right px-3 py-1.5">Actualizado</th>
                {onUsePrice && <th className="px-3 py-1.5" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="px-3 py-2 text-muted-foreground" colSpan={5}>
                      <div className="h-3 bg-secondary animate-pulse rounded w-3/4" />
                    </td>
                  </tr>
                ))
              ) : (
                ALBION_CITIES.map((city) => {
                  const p = prices.find((pr) => pr.city === city)
                  const isBest = bestSell?.city === city
                  const hasData = p && p.sell_price_min > 0
                  return (
                    <tr
                      key={city}
                      className={`border-b border-border/30 ${isBest ? "bg-green-500/5" : "hover:bg-secondary/20"}`}
                    >
                      <td className="px-3 py-1.5 font-medium text-foreground">
                        {city}
                        {isBest && (
                          <span className="ml-1.5 text-[9px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded-full">Mejor</span>
                        )}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-medium ${isBest ? "text-green-400" : hasData ? "text-foreground" : "text-muted-foreground"}`}>
                        {hasData ? formatSilver(p!.sell_price_min) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">
                        {hasData ? formatSilver(p!.sell_price_max) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground text-[10px]">
                        {hasData ? getPriceAge(p!.sell_price_min_date) : "—"}
                      </td>
                      {onUsePrice && (
                        <td className="px-3 py-1.5 text-right">
                          {hasData && (
                            <button
                              onClick={() => onUsePrice(p!.sell_price_min, city)}
                              className="text-[10px] text-primary hover:underline"
                            >
                              Usar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Full item price lookup panel (standalone) ────────────────────────────────
export function ItemPriceLookup({ server, defaultItemId }: { server?: AlbionServer; defaultItemId?: string }) {
  const [selectedId, setSelectedId] = useState(defaultItemId ?? "")
  const [enchantment, setEnchantment] = useState(0)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <ItemSearchDropdown
          value={selectedId}
          onChange={(item) => setSelectedId(item.id)}
          placeholder="Busca cualquier item..."
          className="flex-1"
        />
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((e) => (
            <button
              key={e}
              onClick={() => setEnchantment(e)}
              className={`w-8 h-10 rounded-md text-xs font-bold transition-colors border ${
                enchantment === e
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {e === 0 ? "0" : `.${e}`}
            </button>
          ))}
        </div>
      </div>

      {selectedId && (
        <PricePanel
          itemId={enchantment > 0 ? `${selectedId}@${enchantment}` : selectedId}
          server={server}
        />
      )}
    </div>
  )
}
