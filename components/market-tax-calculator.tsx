"use client"

import { useState, useMemo, useCallback } from "react"
import { Receipt, TrendingUp, RefreshCw, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ItemIcon } from "@/components/item-icon"
import { ItemSearchDropdown } from "@/components/item-search"
import { AlbionItem } from "@/lib/albion-items"
import {
  fetchPrices,
  PriceData,
  ALBION_CITIES,
  getServer,
  getPriceAge,
  AlbionServer,
} from "@/lib/albion-api"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const CITIES_WITH_TAX = [
  { id: "caerleon",      name: "Caerleon",      setupFee: 3,   transactionFee: 3 },
  { id: "fort-sterling", name: "Fort Sterling", setupFee: 3,   transactionFee: 2.5 },
  { id: "thetford",      name: "Thetford",      setupFee: 3,   transactionFee: 2.5 },
  { id: "martlock",      name: "Martlock",      setupFee: 3,   transactionFee: 2.5 },
  { id: "bridgewatch",   name: "Bridgewatch",   setupFee: 3,   transactionFee: 2.5 },
  { id: "lymhurst",      name: "Lymhurst",      setupFee: 3,   transactionFee: 2.5 },
  { id: "brecilien",     name: "Brecilien",     setupFee: 2,   transactionFee: 2 },
  { id: "black-market",  name: "Mercado Negro", setupFee: 0,   transactionFee: 0 },
]

const formatSilver = (v: number) => {
  if (!v || v === 0) return "—"
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

export function MarketTaxCalculator() {
  const [selectedItemId, setSelectedItemId] = useState("")
  const [selectedItem, setSelectedItem] = useState<AlbionItem | null>(null)
  const [realPrices, setRealPrices] = useState<PriceData[]>([])
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [lastFetch, setLastFetch] = useState<string | null>(null)

  const [sellPrice, setSellPrice]   = useState(0)
  const [buyPrice, setBuyPrice]     = useState(0)
  const [quantity, setQuantity]     = useState(1)
  const [premium, setPremium]       = useState(true)
  const [activeMode, setActiveMode] = useState<"sell" | "breakeven">("sell")
  const [server] = useState<AlbionServer>(getServer())

  const premiumMultiplier = premium ? 0.5 : 1

  // Fetch real prices for the selected item across all cities
  const fetchRealPrices = useCallback(async () => {
    if (!selectedItemId) return
    setLoadingPrices(true)
    try {
      const data = await fetchPrices([selectedItemId], { server, locations: ALBION_CITIES })
      setRealPrices(data)
      setLastFetch(new Date().toLocaleTimeString("es-CO"))
      // Auto-fill best sell price
      const valid = data.filter(p => p.sell_price_min > 0)
      if (valid.length > 0) {
        const best = valid.reduce((b, p) => p.sell_price_min > b.sell_price_min ? p : b, valid[0])
        setSellPrice(best.sell_price_min)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPrices(false)
    }
  }, [selectedItemId, server])

  const getRealPrice = (cityName: string) =>
    realPrices.find(p => p.city === cityName && p.sell_price_min > 0)

  const calcCity = (city: typeof CITIES_WITH_TAX[0]) => {
    const transFee = city.transactionFee * premiumMultiplier
    const totalTax = city.setupFee + transFee
    const netPerUnit = sellPrice * (1 - totalTax / 100)
    const profit = netPerUnit - buyPrice
    const totalProfit = profit * quantity
    const margin = buyPrice > 0 ? (profit / buyPrice) * 100 : 0
    const breakEven = buyPrice > 0 ? buyPrice / (1 - totalTax / 100) : 0
    return { transFee, totalTax, netPerUnit, profit, totalProfit, margin, breakEven }
  }

  const allCalcs = useMemo(() =>
    CITIES_WITH_TAX.map(city => ({ ...city, ...calcCity(city) })),
    [sellPrice, buyPrice, quantity, premium]
  )

  const bestCity = useMemo(() => {
    const valid = allCalcs.filter(c => c.netPerUnit > 0)
    if (!valid.length) return null
    return valid.reduce((b, c) => c.netPerUnit > b.netPerUnit ? c : b, valid[0])
  }, [allCalcs])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Calculadora de Impuestos</h1>
              <p className="text-sm text-muted-foreground">
                Precios en tiempo real · Servidor <span className="text-yellow-400">{server.toUpperCase()}</span>
              </p>
            </div>
          </div>

          {/* Item search + fetch */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Buscar item en el mercado</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <ItemSearchDropdown
                  value={selectedItemId}
                  onChange={(item: AlbionItem) => {
                    setSelectedItemId(item.id)
                    setSelectedItem(item)
                    setRealPrices([])
                  }}
                  placeholder="Buscar cualquier item..."
                  className="flex-1"
                />
                <Button
                  onClick={fetchRealPrices}
                  disabled={!selectedItemId || loadingPrices}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingPrices ? "animate-spin" : ""}`} />
                  {loadingPrices ? "Cargando..." : "Obtener precios reales"}
                </Button>
              </div>

              {/* Real prices by city */}
              {realPrices.length > 0 && selectedItem && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ItemIcon itemId={selectedItemId} size={24} />
                    <span className="font-medium text-foreground">{selectedItem.name}</span>
                    {lastFetch && <span>· Actualizado: {lastFetch}</span>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {ALBION_CITIES.map(city => {
                      const p = getRealPrice(city)
                      if (!p) return (
                        <div key={city} className="rounded-md bg-secondary/30 p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">{city}</p>
                          <p className="text-xs text-muted-foreground">—</p>
                        </div>
                      )
                      const isBest = realPrices.filter(r => r.sell_price_min > 0)
                        .reduce((b, r) => r.sell_price_min > b.sell_price_min ? r : b, realPrices[0])?.city === city
                      return (
                        <button
                          key={city}
                          onClick={() => setSellPrice(p.sell_price_min)}
                          className={`rounded-md p-2 text-center transition-colors cursor-pointer ${
                            isBest ? "bg-green-500/10 border border-green-500/30" : "bg-secondary/30 hover:bg-secondary/50"
                          }`}
                        >
                          <p className={`text-[10px] ${isBest ? "text-green-400" : "text-muted-foreground"}`}>
                            {city} {isBest ? "✓" : ""}
                          </p>
                          <p className={`text-xs font-bold ${isBest ? "text-green-400" : "text-foreground"}`}>
                            {formatSilver(p.sell_price_min)}
                          </p>
                          <p className="text-[9px] text-muted-foreground">{getPriceAge(p.sell_price_min_date)}</p>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Haz clic en una ciudad para usar ese precio</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual inputs */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Parámetros de venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Precio de venta</Label>
                  <div className="flex items-center gap-1">
                    {selectedItemId && <ItemIcon itemId={selectedItemId} size={24} />}
                    <Input type="number" placeholder="0" value={sellPrice || ""} onChange={e => setSellPrice(Number(e.target.value))} className="bg-secondary border-border flex-1" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Precio de compra</Label>
                  <Input type="number" placeholder="0" value={buyPrice || ""} onChange={e => setBuyPrice(Number(e.target.value))} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cantidad</Label>
                  <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Premium</Label>
                  <button
                    onClick={() => setPremium(!premium)}
                    className={`w-full h-10 rounded-md text-sm font-medium transition-colors border ${
                      premium
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {premium ? "Con Premium (-50% transaction)" : "Sin Premium"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Modo</Label>
                  <div className="flex gap-1">
                    {(["sell", "breakeven"] as const).map(m => (
                      <button key={m} onClick={() => setActiveMode(m)}
                        className={`flex-1 h-10 rounded-md text-xs font-medium transition-colors border ${
                          activeMode === m
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {m === "sell" ? "Ganancia" : "Min. venta"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best city highlight */}
          {sellPrice > 0 && bestCity && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-sm text-green-400">Mejor ciudad: {bestCity.name}</span>
                  <span className="text-xs text-muted-foreground">— {bestCity.totalTax.toFixed(2)}% tax total{premium ? " (con premium)" : ""}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="text-xs text-muted-foreground">Neto por unidad</p><p className="text-xl font-bold text-green-400">{formatSilver(bestCity.netPerUnit)}</p></div>
                  {buyPrice > 0 && (
                    <>
                      <div><p className="text-xs text-muted-foreground">Ganancia total ({quantity}u)</p><p className={`text-xl font-bold ${bestCity.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(bestCity.totalProfit)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Margen</p><p className={`text-xl font-bold ${bestCity.margin >= 0 ? "text-green-400" : "text-red-400"}`}>{bestCity.margin.toFixed(1)}%</p></div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* City table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Comparación por ciudad</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-3">Ciudad</th>
                      <th className="text-right py-2 pr-3">Precio real</th>
                      <th className="text-right py-2 pr-3">Tax total</th>
                      <th className="text-right py-2 pr-3">Neto/u</th>
                      {buyPrice > 0 && <th className="text-right py-2 pr-3">Ganancia/u</th>}
                      {activeMode === "breakeven" && <th className="text-right py-2">Min. venta</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {allCalcs.map(city => {
                      const isBest = bestCity?.id === city.id && sellPrice > 0
                      const realP = getRealPrice(city.name)
                      return (
                        <tr key={city.id} className={`border-b border-border/50 ${isBest ? "bg-green-500/5" : ""}`}>
                          <td className="py-2 pr-3 font-medium text-foreground">
                            {city.name}
                            {isBest && <span className="ml-1.5 text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Mejor</span>}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {realP
                              ? <span className="text-yellow-400">{formatSilver(realP.sell_price_min)}</span>
                              : <span className="text-muted-foreground">—</span>
                            }
                          </td>
                          <td className="py-2 pr-3 text-right text-red-400">{city.totalTax.toFixed(2)}%</td>
                          <td className="py-2 pr-3 text-right text-foreground">{sellPrice > 0 ? formatSilver(city.netPerUnit) : "—"}</td>
                          {buyPrice > 0 && (
                            <td className={`py-2 pr-3 text-right font-medium ${city.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {sellPrice > 0 ? (city.profit >= 0 ? "+" : "") + formatSilver(city.profit) : "—"}
                            </td>
                          )}
                          {activeMode === "breakeven" && (
                            <td className="py-2 text-right text-yellow-400">
                              {buyPrice > 0 ? formatSilver(city.breakEven) : "—"}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Setup fee: al crear la orden. Transaction fee: al vender.{premium ? " Premium reduce transaction fee un 50%." : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
