"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, RefreshCw, ChevronRight, Package, TrendingUp, TrendingDown, Minus, X } from "lucide-react"
import { ItemIcon, ItemIconWithTier } from "@/components/item-icon"
import {
  ALL_RECIPES,
  RECIPE_CATEGORIES,
  WEAPON_SUBCATEGORIES,
  ARMOR_SUBCATEGORIES,
  type CraftingRecipe,
} from "@/lib/albion-recipes"
import {
  fetchPrices,
  getBestSellPrice,
  getPriceAge,
  getServer,
  type AlbionServer,
  type PriceData,
} from "@/lib/albion-api"
import { ALBION_CITIES } from "@/lib/albion-api"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSilver(n: number) {
  if (!n || n === 0) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("es-CO")
}

function getTierFromId(id: string): number {
  const m = id.match(/^T(\d)/)
  return m ? parseInt(m[1]) : 0
}

const TIER_COLORS: Record<number, string> = {
  4: "bg-yellow-700 text-yellow-100",
  5: "bg-blue-600 text-blue-100",
  6: "bg-blue-400 text-blue-900",
  7: "bg-purple-500 text-purple-100",
  8: "bg-amber-400 text-amber-900",
}

// ─── Item Detail Panel ────────────────────────────────────────────────────────

interface DetailPanelProps {
  recipe: CraftingRecipe
  server: AlbionServer
  onClose: () => void
}

function DetailPanel({ recipe, server, onClose }: DetailPanelProps) {
  const [prices, setPrices] = useState<Record<string, PriceData[]>>({})
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState(0)

  const tier = getTierFromId(recipe.outputId)
  const allItemIds = [recipe.outputId, ...recipe.materials.map(m => m.itemId)]

  async function loadPrices() {
    setLoading(true)
    try {
      const data = await fetchPrices(allItemIds, { server, locations: ALBION_CITIES })
      const grouped: Record<string, PriceData[]> = {}
      for (const id of allItemIds) {
        grouped[id] = data.filter(p => p.item_id === id)
      }
      setPrices(grouped)
      setLastFetch(Date.now())
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.outputId, server])

  const outputBest  = getBestSellPrice(prices[recipe.outputId] ?? [])
  const outputPrice = outputBest?.sell_price_min ?? 0

  // Total material cost (cheapest available city per material)
  const matCosts = recipe.materials.map(m => {
    const best = getBestSellPrice(prices[m.itemId] ?? [])
    const unitPrice = best?.sell_price_min ?? 0
    return { ...m, unitPrice, total: unitPrice * m.qty }
  })
  const totalMatCost = matCosts.reduce((s, m) => s + m.total, 0)
  const profit = outputPrice > 0 && totalMatCost > 0 ? outputPrice - totalMatCost : null

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-border">
        <ItemIconWithTier itemId={recipe.outputId} tier={tier} size={56} />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground leading-tight">{recipe.outputName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estación: <span className="text-foreground">{recipe.station}</span>
            {" · "}Focus: <span className="text-purple-400">{recipe.craftingFocus.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadPrices}
            disabled={loading}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Actualizar precios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Recipe materials */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Materiales necesarios
          </h3>
          <div className="space-y-2">
            {matCosts.map(m => (
              <div key={m.itemId} className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50">
                <ItemIcon itemId={m.itemId} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">×{m.qty}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">
                    {formatSilver(m.unitPrice)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Total: {formatSilver(m.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Profit summary */}
        {(outputPrice > 0 || totalMatCost > 0) && (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Análisis de costos
            </h3>
            <div className="rounded-lg bg-secondary/50 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Costo materiales</span>
                <span className="font-bold text-foreground">{formatSilver(totalMatCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Precio de venta</span>
                <span className="font-bold text-foreground">{formatSilver(outputPrice)}</span>
              </div>
              {profit !== null && (
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-muted-foreground font-medium">Ganancia estimada</span>
                  <span className={`font-bold flex items-center gap-1 ${profit > 0 ? "text-green-400" : profit < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {profit > 0 ? <TrendingUp className="w-3 h-3" /> : profit < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {formatSilver(Math.abs(profit))}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Output item prices */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Precios del ítem en ciudades
          </h3>
          {loading && !prices[recipe.outputId] ? (
            <div className="text-xs text-muted-foreground text-center py-4">Cargando precios...</div>
          ) : (
            <div className="space-y-1">
              {ALBION_CITIES.map(city => {
                const p = (prices[recipe.outputId] ?? []).find(x => x.city === city)
                if (!p) return null
                const hasData = p.sell_price_min > 0
                return (
                  <div
                    key={city}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs ${
                      hasData && outputBest?.city === city
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-secondary/30"
                    }`}
                  >
                    <span className={`${hasData && outputBest?.city === city ? "text-green-400 font-semibold" : "text-muted-foreground"}`}>
                      {city}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-foreground">
                        {formatSilver(p.sell_price_min)}
                      </span>
                      {p.sell_price_min_date && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          {getPriceAge(p.sell_price_min_date)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {lastFetch > 0 && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Actualizado {getPriceAge(new Date(lastFetch).toISOString())}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  recipe: CraftingRecipe
  isSelected: boolean
  onSelect: () => void
}

function ItemCard({ recipe, isSelected, onSelect }: ItemCardProps) {
  const tier = getTierFromId(recipe.outputId)
  return (
    <button
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-left w-full ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
      }`}
    >
      <ItemIconWithTier itemId={recipe.outputId} tier={tier} size={48} />
      <p className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2 w-full">
        {recipe.outputName.replace(/ T\d$/, "")}
      </p>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TIER_COLORS[tier] ?? "bg-gray-500 text-white"}`}>
        T{tier}
      </span>
      {isSelected && (
        <div className="absolute top-1.5 right-1.5">
          <ChevronRight className="w-3 h-3 text-primary" />
        </div>
      )}
    </button>
  )
}

// ─── Main RecipeBrowser Component ─────────────────────────────────────────────

export function RecipeBrowser() {
  const [server, setServerState] = useState<AlbionServer>("west")
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeSubcategory, setActiveSubcategory] = useState("all")
  const [activeTiers, setActiveTiers] = useState<number[]>([4, 5, 6, 7, 8])
  const [search, setSearch] = useState("")
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null)

  useEffect(() => {
    setServerState(getServer())
    const handler = (e: Event) => setServerState((e as CustomEvent<AlbionServer>).detail)
    window.addEventListener("albion-server-change", handler)
    return () => window.removeEventListener("albion-server-change", handler)
  }, [])

  // Toggle tier selection
  function toggleTier(t: number) {
    setActiveTiers(prev =>
      prev.includes(t)
        ? prev.length > 1 ? prev.filter(x => x !== t) : prev
        : [...prev, t]
    )
  }

  // Subcategory options based on active category
  const subcategoryOptions = useMemo(() => {
    if (activeCategory === "weapons") return WEAPON_SUBCATEGORIES
    if (activeCategory === "armor") return ARMOR_SUBCATEGORIES
    return null
  }, [activeCategory])

  // Reset subcategory when category changes
  useEffect(() => {
    setActiveSubcategory("all")
  }, [activeCategory])

  // Filtered recipes
  const filtered = useMemo(() => {
    return ALL_RECIPES.filter(r => {
      if (activeCategory !== "all" && r.category !== activeCategory) return false
      if (activeSubcategory !== "all" && r.subcategory !== activeSubcategory) return false
      const tier = getTierFromId(r.outputId)
      if (!activeTiers.includes(tier)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!r.outputName.toLowerCase().includes(q) && !r.outputId.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [activeCategory, activeSubcategory, activeTiers, search])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Page header */}
      <div className="px-4 md:px-6 pt-5 pb-3 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Objetos del juego</h1>
            <p className="text-sm text-muted-foreground">
              Recetas de crafteo · precios en vivo · {filtered.length} ítems
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ítem..."
            className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {RECIPE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Subcategory filter */}
        {subcategoryOptions && (
          <div className="flex flex-wrap gap-1 mb-2">
            {subcategoryOptions.map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubcategory(sub.id)}
                className={`px-2.5 py-0.5 rounded-full text-xs transition-all ${
                  activeSubcategory === sub.id
                    ? "bg-secondary text-foreground font-semibold border border-primary/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Tier filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Tier:</span>
          {[4, 5, 6, 7, 8].map(t => (
            <button
              key={t}
              onClick={() => toggleTier(t)}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                activeTiers.includes(t)
                  ? TIER_COLORS[t] ?? "bg-gray-500 text-white"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              T{t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid + detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Item grid */}
        <div className={`overflow-y-auto p-3 transition-all ${selectedRecipe ? "hidden md:block md:w-1/2 lg:w-[55%]" : "w-full"}`}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Package className="w-10 h-10 opacity-30" />
              <p className="text-sm">No se encontraron ítems</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filtered.map(recipe => (
                <ItemCard
                  key={recipe.outputId}
                  recipe={recipe}
                  isSelected={selectedRecipe?.outputId === recipe.outputId}
                  onSelect={() => setSelectedRecipe(
                    selectedRecipe?.outputId === recipe.outputId ? null : recipe
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedRecipe && (
          <div className={`flex flex-col ${selectedRecipe ? "w-full md:w-1/2 lg:w-[45%]" : "hidden"}`}>
            <DetailPanel
              recipe={selectedRecipe}
              server={server}
              onClose={() => setSelectedRecipe(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
