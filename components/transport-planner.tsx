"use client"

import { useState, useMemo, useCallback } from "react"
import { Route, Plus, Trash2, ArrowRight, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ItemIcon } from "@/components/item-icon"
import { ItemSearchDropdown } from "@/components/item-search"
import { AlbionItem } from "@/lib/albion-items"
import { fetchPrices, ALBION_CITIES, getServer, getPriceAge, AlbionServer } from "@/lib/albion-api"

const CITIES = ALBION_CITIES

const formatSilver = (v: number) => {
  if (!v) return "—"
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

interface RouteItem {
  id: string
  itemId: string
  name: string
  buyCity: string
  sellCity: string
  buyPrice: number
  sellPrice: number
  quantity: number
  weight: number
  tax: number
  loading: boolean
  lastUpdated: string | null
}

interface SavedRoute {
  id: string
  name: string
  date: string
  totalProfit: number
  items: RouteItem[]
}

const newRouteItem = (): RouteItem => ({
  id: crypto.randomUUID(),
  itemId: "", name: "",
  buyCity: "Fort Sterling", sellCity: "Caerleon",
  buyPrice: 0, sellPrice: 0,
  quantity: 1, weight: 0, tax: 3,
  loading: false, lastUpdated: null,
})

export function TransportPlanner() {
  const [items, setItems] = useState<RouteItem[]>([newRouteItem()])
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])
  const [routeName, setRouteName] = useState("")
  const [maxLoad, setMaxLoad] = useState(1000)
  const [server] = useState<AlbionServer>(getServer())

  const updateItem = (id: string, fields: Partial<RouteItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev)
  }

  // Fetch buy price for buyCity and sell price for sellCity
  const fetchItemPrices = useCallback(async (item: RouteItem) => {
    if (!item.itemId) return
    updateItem(item.id, { loading: true })
    try {
      const prices = await fetchPrices([item.itemId], { server, locations: CITIES })
      const getPrice = (city: string) => prices.find(p => p.city === city && p.sell_price_min > 0)

      const buyP  = getPrice(item.buyCity)
      const sellP = getPrice(item.sellCity)

      updateItem(item.id, {
        buyPrice: buyP?.sell_price_min ?? item.buyPrice,
        sellPrice: sellP?.sell_price_min ?? item.sellPrice,
        loading: false,
        lastUpdated: new Date().toLocaleTimeString("es-CO"),
      })
    } catch {
      updateItem(item.id, { loading: false })
    }
  }, [server])

  const calcItem = (item: RouteItem) => {
    const revenue = item.sellPrice * (1 - item.tax / 100) * item.quantity
    const cost = item.buyPrice * item.quantity
    const profit = revenue - cost
    const totalWeight = item.weight * item.quantity
    const profitPerWeight = totalWeight > 0 ? profit / totalWeight : profit
    const margin = cost > 0 ? (profit / cost) * 100 : 0
    return { revenue, cost, profit, totalWeight, profitPerWeight, margin }
  }

  const summary = useMemo(() => {
    const calcs = items.map(item => ({ item, calc: calcItem(item) }))
    const totalProfit = calcs.reduce((s, { calc }) => s + calc.profit, 0)
    const totalCost = calcs.reduce((s, { calc }) => s + calc.cost, 0)
    const totalWeight = calcs.reduce((s, { calc }) => s + calc.totalWeight, 0)
    const overWeight = totalWeight > maxLoad
    const profitPerWeight = totalWeight > 0 ? totalProfit / totalWeight : 0
    const bestItem = calcs.length > 0 ? calcs.reduce((b, c) => c.calc.profitPerWeight > b.calc.profitPerWeight ? c : b, calcs[0]) : null
    return { calcs, totalProfit, totalCost, totalWeight, overWeight, profitPerWeight, bestItem }
  }, [items, maxLoad])

  const saveRoute = () => {
    if (!routeName.trim()) return
    const route: SavedRoute = {
      id: crypto.randomUUID(),
      name: routeName,
      date: new Date().toLocaleString("es-CO"),
      totalProfit: summary.totalProfit,
      items: [...items],
    }
    setSavedRoutes(prev => [route, ...prev].slice(0, 20))
    setRouteName("")
  }

  const loadRoute = (route: SavedRoute) => {
    setItems(route.items.map(i => ({ ...i, id: crypto.randomUUID() })))
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Route className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Planificador de Rutas</h1>
              <p className="text-sm text-muted-foreground">
                Iconos + precios reales · Servidor <span className="text-cyan-400">{server.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <Button onClick={() => setItems(p => [...p, newRouteItem()])} size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
            <Plus className="w-4 h-4 mr-1" /> Agregar item
          </Button>
        </div>

        {/* Load config */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-4 items-end">
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs text-muted-foreground">Capacidad de carga máxima (peso)</Label>
                <Input type="number" value={maxLoad} onChange={e => setMaxLoad(Number(e.target.value))} className="bg-secondary border-border" />
              </div>
              <div className={`px-4 py-2.5 rounded-lg text-sm font-medium border ${
                summary.overWeight ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"
              }`}>
                {summary.totalWeight.toFixed(0)} / {maxLoad} {summary.overWeight ? "⚠ SOBRECARGADO" : "✓ OK"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary.totalProfit !== 0 && (
          <Card className={`border ${summary.totalProfit > 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Ganancia total del viaje</p>
                  <p className={`text-2xl font-bold ${summary.totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(summary.totalProfit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inversión total</p>
                  <p className="text-xl font-bold text-foreground">{formatSilver(summary.totalCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ganancia/peso</p>
                  <p className="text-xl font-bold text-cyan-400">{formatSilver(summary.profitPerWeight)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mejor item (profit/peso)</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {summary.bestItem?.item.itemId && <ItemIcon itemId={summary.bestItem.item.itemId} size={20} />}
                    <p className="text-sm font-bold text-foreground truncate">{summary.bestItem?.item.name || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Items del viaje</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, idx) => {
                const c = calcItem(item)
                return (
                  <div key={item.id} className="rounded-lg bg-secondary/30 border border-border/50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.itemId && <ItemIcon itemId={item.itemId} size={28} />}
                        <span className="text-xs font-semibold text-muted-foreground">Item #{idx + 1}</span>
                        {item.lastUpdated && <span className="text-[10px] text-muted-foreground">· {item.lastUpdated}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.itemId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-cyan-400"
                            onClick={() => fetchItemPrices(item)}
                            disabled={item.loading}
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${item.loading ? "animate-spin" : ""}`} />
                            Actualizar precios
                          </Button>
                        )}
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item search */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Item</Label>
                        <ItemSearchDropdown
                          value={item.itemId}
                          onChange={(albItem: AlbionItem) => {
                            updateItem(item.id, { itemId: albItem.id, name: albItem.name })
                          }}
                          placeholder="Buscar item..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nombre (o personalizado)</Label>
                        <Input
                          placeholder="ej: Tablones T5"
                          value={item.name}
                          onChange={e => updateItem(item.id, { name: e.target.value })}
                          className="bg-secondary border-border text-sm h-10"
                        />
                      </div>
                    </div>

                    {/* Route */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Comprar en</Label>
                        <select
                          value={item.buyCity}
                          onChange={e => updateItem(item.id, { buyCity: e.target.value })}
                          className="w-full h-8 rounded-md bg-secondary border border-border text-foreground text-xs px-2"
                        >
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center justify-center pt-5">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Vender en</Label>
                        <select
                          value={item.sellCity}
                          onChange={e => updateItem(item.id, { sellCity: e.target.value })}
                          className="w-full h-8 rounded-md bg-secondary border border-border text-foreground text-xs px-2"
                        >
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Precio compra</Label>
                        <Input type="number" value={item.buyPrice || ""} onChange={e => updateItem(item.id, { buyPrice: Number(e.target.value) })} className="bg-secondary border-border text-xs h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Precio venta</Label>
                        <Input type="number" value={item.sellPrice || ""} onChange={e => updateItem(item.id, { sellPrice: Number(e.target.value) })} className="bg-secondary border-border text-xs h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Cantidad</Label>
                        <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, { quantity: Number(e.target.value) })} min={1} className="bg-secondary border-border text-xs h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Peso/u</Label>
                        <Input type="number" value={item.weight || ""} onChange={e => updateItem(item.id, { weight: Number(e.target.value) })} className="bg-secondary border-border text-xs h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tax (%)</Label>
                        <Input type="number" value={item.tax} onChange={e => updateItem(item.id, { tax: Number(e.target.value) })} min={0} max={10} step={0.1} className="bg-secondary border-border text-xs h-8" />
                      </div>
                    </div>

                    {/* Item result */}
                    {(item.buyPrice > 0 || item.sellPrice > 0) && (
                      <div className="flex items-center gap-3 text-xs pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span>{item.buyCity}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{item.sellCity}</span>
                        </div>
                        <span className="text-muted-foreground">Inv: {formatSilver(c.cost)}</span>
                        <span className="ml-auto font-bold">
                          <span className={c.profit >= 0 ? "text-green-400" : "text-red-400"}>
                            {c.profit >= 0 ? "+" : ""}{formatSilver(c.profit)} ({c.margin.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Save route */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Guardar ruta</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la ruta (ej: Sterling → Caerleon T5)"
                value={routeName}
                onChange={e => setRouteName(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={saveRoute} disabled={!routeName.trim()} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saved routes */}
        {savedRoutes.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Rutas guardadas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedRoutes.map(route => (
                  <div key={route.id} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{route.name}</p>
                      <p className="text-xs text-muted-foreground">{route.date} · {route.items.length} items</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {route.items.slice(0, 4).map(i => i.itemId && (
                          <ItemIcon key={i.id} itemId={i.itemId} size={20} />
                        ))}
                      </div>
                      <span className={`font-bold text-sm ${route.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(route.totalProfit)}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-400" onClick={() => loadRoute(route)}>Cargar</Button>
                      <button onClick={() => setSavedRoutes(p => p.filter(r => r.id !== route.id))} className="text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
