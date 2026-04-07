"use client"

import { useState, useMemo, useCallback } from "react"
import { Hammer, TrendingUp, TrendingDown, RefreshCw, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ItemIcon } from "@/components/item-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { fetchPrices, getServer, getPriceAge, ALBION_CITIES, AlbionServer } from "@/lib/albion-api"
import { REFINE_RESOURCE_MAP, RefineResourceKey } from "@/lib/albion-items"

const REFINE_RECIPES: Record<number, { rawNeeded: number; prevRefinedNeeded: number }> = {
  2: { rawNeeded: 2, prevRefinedNeeded: 0 },
  3: { rawNeeded: 2, prevRefinedNeeded: 1 },
  4: { rawNeeded: 2, prevRefinedNeeded: 1 },
  5: { rawNeeded: 3, prevRefinedNeeded: 2 },
  6: { rawNeeded: 4, prevRefinedNeeded: 3 },
  7: { rawNeeded: 5, prevRefinedNeeded: 4 },
  8: { rawNeeded: 5, prevRefinedNeeded: 4 },
}

// Return rate presets (matching Brannstroom calculator logic)
const RETURN_PRESETS = [
  { id: "royal_city",      label: "Ciudad Real",          rate: 0.152 },
  { id: "royal_city_bonus",label: "Ciudad Real + Bonus",  rate: 0.367 },
  { id: "royal_island",    label: "Isla Real",            rate: 0.0 },
  { id: "royal_isl_bonus", label: "Isla Real + Bonus",    rate: 0.285 },
  { id: "focus",           label: "Con Focus (ciudad)",   rate: 0.435 },
  { id: "custom",          label: "Personalizado",        rate: 0 },
]

const RESOURCE_TYPES: { key: RefineResourceKey; label: string; emoji: string }[] = [
  { key: "ORE",   label: "Mineral",  emoji: "⛏️" },
  { key: "WOOD",  label: "Madera",   emoji: "🪵" },
  { key: "HIDE",  label: "Piel",     emoji: "🦴" },
  { key: "FIBER", label: "Fibra",    emoji: "🌿" },
  { key: "ROCK",  label: "Piedra",   emoji: "🪨" },
]

const formatSilver = (v: number) => {
  if (!v) return "—"
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

interface TierState {
  rawPrice: number
  rawCity: string
  prevRefinedPrice: number
  prevRefinedCity: string
  refinedSellPrice: number
  sellCity: string
  quantity: number
  lastUpdated: string | null
}

const defaultTier = (): TierState => ({
  rawPrice: 0, rawCity: "",
  prevRefinedPrice: 0, prevRefinedCity: "",
  refinedSellPrice: 0, sellCity: "",
  quantity: 10, lastUpdated: null,
})

export function RefiningCalculator() {
  const [selectedTier, setSelectedTier] = useState(4)
  const [selectedResource, setSelectedResource] = useState<RefineResourceKey>("ORE")
  const [returnPreset, setReturnPreset] = useState("royal_city")
  const [customReturnRate, setCustomReturnRate] = useState(15.2)
  const [cityTax, setCityTax] = useState(3)
  const [loadingTier, setLoadingTier] = useState<number | null>(null)
  const [server] = useState<AlbionServer>(getServer())
  const [tiers, setTiers] = useState<Record<number, TierState>>(
    Object.fromEntries([2,3,4,5,6,7,8].map(t => [t, defaultTier()]))
  )

  const resource = REFINE_RESOURCE_MAP[selectedResource]
  const recipe = REFINE_RECIPES[selectedTier]
  const currentTier = tiers[selectedTier]

  const returnRate = useMemo(() => {
    if (returnPreset === "custom") return customReturnRate / 100
    return RETURN_PRESETS.find(p => p.id === returnPreset)?.rate ?? 0.152
  }, [returnPreset, customReturnRate])

  const updateTier = (tier: number, fields: Partial<TierState>) => {
    setTiers(prev => ({ ...prev, [tier]: { ...prev[tier], ...fields } }))
  }

  // Fetch real prices from AODP for this tier+resource
  const fetchRealPrices = useCallback(async (tier: number) => {
    const res = REFINE_RESOURCE_MAP[selectedResource]
    const rawId = `T${tier}_${res.raw}`
    const refinedId = `T${tier}_${res.refined}`
    const prevRefinedId = tier > 2 ? `T${tier - 1}_${res.refined}` : null

    setLoadingTier(tier)
    try {
      const ids = [rawId, refinedId, ...(prevRefinedId ? [prevRefinedId] : [])]
      const prices = await fetchPrices(ids, { server, locations: ALBION_CITIES })

      const getBest = (id: string) => {
        const valid = prices.filter(p => p.item_id === id && p.sell_price_min > 0)
        if (!valid.length) return null
        return valid.reduce((b, p) => p.sell_price_min < b.sell_price_min ? p : b, valid[0])
      }

      const raw = getBest(rawId)
      const refined = getBest(refinedId)
      const prev = prevRefinedId ? getBest(prevRefinedId) : null

      updateTier(tier, {
        rawPrice: raw?.sell_price_min ?? 0,
        rawCity: raw?.city ?? "",
        prevRefinedPrice: prev?.sell_price_min ?? 0,
        prevRefinedCity: prev?.city ?? "",
        refinedSellPrice: refined?.sell_price_min ?? 0,
        sellCity: refined?.city ?? "",
        lastUpdated: new Date().toLocaleTimeString("es-CO"),
      })
    } catch (e) {
      console.error("Error fetching prices:", e)
    } finally {
      setLoadingTier(null)
    }
  }, [selectedResource, server])

  const calc = useMemo(() => {
    const t = tiers[selectedTier]
    const r = REFINE_RECIPES[selectedTier]
    if (!t || !r) return null

    const qty = t.quantity || 1
    const eff = returnRate
    const effectiveRaw = r.rawNeeded * (1 - eff)
    const effectivePrev = r.prevRefinedNeeded * (1 - eff)

    const rawCostPerUnit = effectiveRaw * t.rawPrice
    const prevCostPerUnit = effectivePrev * t.prevRefinedPrice
    const costPerUnit = rawCostPerUnit + prevCostPerUnit
    const revenuePerUnit = t.refinedSellPrice * (1 - cityTax / 100)
    const profitPerUnit = revenuePerUnit - costPerUnit
    const profitTotal = profitPerUnit * qty
    const margin = costPerUnit > 0 ? (profitPerUnit / costPerUnit) * 100 : 0
    const breakEven = costPerUnit > 0 ? costPerUnit / (1 - cityTax / 100) : 0

    return {
      effectiveRaw, effectivePrev, costPerUnit,
      revenuePerUnit, profitPerUnit, profitTotal, margin, breakEven,
      rawCostTotal: rawCostPerUnit * qty, prevCostTotal: prevCostPerUnit * qty,
    }
  }, [tiers, selectedTier, returnRate, cityTax])

  const isProfit = calc ? calc.profitPerUnit > 0 : false
  const rawId = `T${selectedTier}_${resource.raw}`
  const refinedId = `T${selectedTier}_${resource.refined}`
  const prevRefinedId = selectedTier > 2 ? `T${selectedTier - 1}_${resource.refined}` : null

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Calculadora de Refinamiento</h1>
              <p className="text-sm text-muted-foreground">
                Precios en tiempo real via Albion Online Data Project · Servidor: <span className="text-orange-400">{server.toUpperCase()}</span>
              </p>
            </div>
          </div>

          {/* Config row */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* Resource selector */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label className="text-xs text-muted-foreground">Tipo de recurso</Label>
                  <div className="flex flex-wrap gap-1">
                    {RESOURCE_TYPES.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setSelectedResource(r.key)}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          selectedResource === r.key
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r.emoji} {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tier selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tier</Label>
                  <div className="flex gap-1 flex-wrap">
                    {[2,3,4,5,6,7,8].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTier(t)}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                          selectedTier === t
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        T{t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tax */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Impuesto ciudad (%)</Label>
                  <Input type="number" value={cityTax} onChange={e => setCityTax(Number(e.target.value))} min={0} max={10} step={0.1} className="bg-secondary border-border h-8" />
                </div>

                {/* Fetch button */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <Button
                    onClick={() => fetchRealPrices(selectedTier)}
                    disabled={loadingTier !== null}
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 h-8"
                    size="sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingTier === selectedTier ? "animate-spin" : ""}`} />
                    Actualizar precios
                  </Button>
                  {currentTier.lastUpdated && (
                    <p className="text-[10px] text-muted-foreground">Últ: {currentTier.lastUpdated}</p>
                  )}
                </div>
              </div>

              {/* Return rate presets */}
              <div className="mt-4 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tasa de retorno</Label>
                <div className="flex flex-wrap gap-1">
                  {RETURN_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setReturnPreset(p.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        returnPreset === p.id
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.label} {p.id !== "custom" ? `(${(p.rate * 100).toFixed(1)}%)` : ""}
                    </button>
                  ))}
                  {returnPreset === "custom" && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={customReturnRate}
                        onChange={e => setCustomReturnRate(Number(e.target.value))}
                        min={0} max={100} step={0.1}
                        className="bg-secondary border-border h-7 w-20 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasa activa: <span className="text-purple-400">{(returnRate * 100).toFixed(1)}%</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Prices input with icons */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ItemIcon itemId={refinedId} size={32} />
                  <CardTitle className="text-sm font-semibold">
                    T{selectedTier} {resource.refinedLabel} — Precios
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Raw material */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ItemIcon itemId={rawId} size={20} />
                    <Label className="text-xs text-muted-foreground">
                      T{selectedTier} {resource.rawLabel} — precio compra
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={currentTier.rawPrice || ""}
                      onChange={e => updateTier(selectedTier, { rawPrice: Number(e.target.value) })}
                      className="bg-secondary border-border flex-1"
                    />
                    {currentTier.rawCity && (
                      <span className="text-xs text-muted-foreground self-center whitespace-nowrap">{currentTier.rawCity}</span>
                    )}
                  </div>
                </div>

                {/* Prev refined (if tier > 2) */}
                {recipe.prevRefinedNeeded > 0 && prevRefinedId && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <ItemIcon itemId={prevRefinedId} size={20} />
                      <Label className="text-xs text-muted-foreground">
                        T{selectedTier - 1} {resource.refinedLabel} — precio compra
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={currentTier.prevRefinedPrice || ""}
                        onChange={e => updateTier(selectedTier, { prevRefinedPrice: Number(e.target.value) })}
                        className="bg-secondary border-border flex-1"
                      />
                      {currentTier.prevRefinedCity && (
                        <span className="text-xs text-muted-foreground self-center whitespace-nowrap">{currentTier.prevRefinedCity}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Refined sell price */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ItemIcon itemId={refinedId} size={20} />
                    <Label className="text-xs text-muted-foreground">
                      T{selectedTier} {resource.refinedLabel} — precio venta
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={currentTier.refinedSellPrice || ""}
                      onChange={e => updateTier(selectedTier, { refinedSellPrice: Number(e.target.value) })}
                      className="bg-secondary border-border flex-1"
                    />
                    {currentTier.sellCity && (
                      <span className="text-xs text-muted-foreground self-center whitespace-nowrap">{currentTier.sellCity}</span>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cantidad a refinar</Label>
                  <Input type="number" value={currentTier.quantity} onChange={e => updateTier(selectedTier, { quantity: Number(e.target.value) })} min={1} className="bg-secondary border-border" />
                </div>

                {/* Recipe info */}
                <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground mb-1.5">Receta T{selectedTier}:</p>
                  <div className="flex items-center gap-1.5">
                    <ItemIcon itemId={rawId} size={16} />
                    <span>{recipe.rawNeeded}x T{selectedTier} {resource.rawLabel}</span>
                  </div>
                  {recipe.prevRefinedNeeded > 0 && prevRefinedId && (
                    <div className="flex items-center gap-1.5">
                      <ItemIcon itemId={prevRefinedId} size={16} />
                      <span>{recipe.prevRefinedNeeded}x T{selectedTier - 1} {resource.refinedLabel}</span>
                    </div>
                  )}
                  <p className="text-purple-400 mt-1.5">
                    → Retorno efectivo: {(returnRate * 100).toFixed(1)}%
                    {calc && ` (${calc.effectiveRaw.toFixed(2)}x raw + ${calc.effectivePrev.toFixed(2)}x prev)`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              {calc && (
                <>
                  <Card className={`border ${isProfit ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ItemIcon itemId={refinedId} size={36} />
                        {isProfit
                          ? <TrendingUp className="w-5 h-5 text-green-400" />
                          : <TrendingDown className="w-5 h-5 text-red-400" />
                        }
                        <span className={`font-bold text-lg ${isProfit ? "text-green-400" : "text-red-400"}`}>
                          {isProfit ? "RENTABLE" : "NO RENTABLE"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Ganancia por unidad</p>
                          <p className={`text-2xl font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>{formatSilver(calc.profitPerUnit)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Margen</p>
                          <p className={`text-2xl font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>{calc.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Desglose ({currentTier.quantity}x)</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-1.5"><ItemIcon itemId={rawId} size={16} /><span>Mat. crudos T{selectedTier}</span></div>
                        <span className="text-red-400">-{formatSilver(calc.rawCostTotal)}</span>
                      </div>
                      {recipe.prevRefinedNeeded > 0 && prevRefinedId && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <div className="flex items-center gap-1.5"><ItemIcon itemId={prevRefinedId} size={16} /><span>Refinados T{selectedTier-1}</span></div>
                          <span className="text-red-400">-{formatSilver(calc.prevCostTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="text-muted-foreground">Costo total</span>
                        <span className="font-medium">-{formatSilver(calc.costPerUnit * currentTier.quantity)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Ingreso (tras {cityTax}% tax)</span>
                        <span className="text-green-400">+{formatSilver(calc.revenuePerUnit * currentTier.quantity)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 font-bold">
                        <span>Ganancia total</span>
                        <span className={isProfit ? "text-green-400" : "text-red-400"}>
                          {isProfit ? "+" : ""}{formatSilver(calc.profitTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>Precio mínimo de venta (break-even)</span>
                        <span className="text-yellow-400">{formatSilver(calc.breakEven)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {(!calc || (currentTier.rawPrice === 0 && currentTier.refinedSellPrice === 0)) && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                    <div className="flex justify-center gap-2 mb-3">
                      <ItemIcon itemId={rawId} size={40} />
                      <ItemIcon itemId={refinedId} size={40} />
                    </div>
                    <p className="text-sm">Ingresa los precios o usa</p>
                    <p className="text-sm font-semibold text-orange-400">"Actualizar precios"</p>
                    <p className="text-xs text-muted-foreground mt-1">para obtener datos reales del mercado</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* All tiers comparison */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Comparación todos los tiers — {RESOURCE_TYPES.find(r => r.key === selectedResource)?.label}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-orange-400"
                  onClick={async () => {
                    for (const t of [2,3,4,5,6,7,8]) {
                      await fetchRealPrices(t)
                    }
                  }}
                  disabled={loadingTier !== null}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loadingTier !== null ? "animate-spin" : ""}`} />
                  Actualizar todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-4">Tier</th>
                      <th className="text-right py-2 pr-4">Costo/u</th>
                      <th className="text-right py-2 pr-4">Ingreso/u</th>
                      <th className="text-right py-2 pr-4">Ganancia/u</th>
                      <th className="text-right py-2 pr-4">Margen</th>
                      <th className="text-right py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[2,3,4,5,6,7,8].map((tier) => {
                      const t = tiers[tier]
                      const r = REFINE_RECIPES[tier]
                      const cost = r.rawNeeded * (1-returnRate) * t.rawPrice + r.prevRefinedNeeded * (1-returnRate) * t.prevRefinedPrice
                      const revenue = t.refinedSellPrice * (1 - cityTax / 100)
                      const profit = revenue - cost
                      const margin = cost > 0 ? (profit / cost) * 100 : 0
                      const hasData = t.rawPrice > 0 || t.refinedSellPrice > 0
                      const refinedItemId = `T${tier}_${resource.refined}`
                      return (
                        <tr
                          key={tier}
                          className={`border-b border-border/50 cursor-pointer hover:bg-secondary/30 ${selectedTier === tier ? "bg-secondary/50" : ""}`}
                          onClick={() => setSelectedTier(tier)}
                        >
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <ItemIcon itemId={refinedItemId} size={24} />
                              <span className="font-medium text-foreground">T{tier}</span>
                              {loadingTier === tier && <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />}
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-right text-muted-foreground">{hasData ? formatSilver(cost) : "—"}</td>
                          <td className="py-2 pr-4 text-right text-muted-foreground">{hasData ? formatSilver(revenue) : "—"}</td>
                          <td className={`py-2 pr-4 text-right font-medium ${!hasData ? "text-muted-foreground" : profit > 0 ? "text-green-400" : "text-red-400"}`}>
                            {hasData ? (profit > 0 ? "+" : "") + formatSilver(profit) : "—"}
                          </td>
                          <td className={`py-2 pr-4 text-right font-medium ${!hasData ? "text-muted-foreground" : margin > 0 ? "text-green-400" : "text-red-400"}`}>
                            {hasData ? `${margin.toFixed(1)}%` : "—"}
                          </td>
                          <td className="py-2 text-right">
                            {t.lastUpdated
                              ? <span className="text-[10px] text-muted-foreground">{t.lastUpdated}</span>
                              : <span className="text-[10px] text-muted-foreground/50">Sin datos</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
