"use client"

import { useState, useMemo, useCallback } from "react"
import { ShoppingBag, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ItemIcon } from "@/components/item-icon"
import { ItemSearchDropdown } from "@/components/item-search"
import { AlbionItem } from "@/lib/albion-items"
import { fetchPrices, getServer, ALBION_CITIES, AlbionServer } from "@/lib/albion-api"

const CATEGORIES = [
  { id: "weapons", label: "Armas" },
  { id: "armor",   label: "Armadura" },
  { id: "food",    label: "Comida" },
  { id: "potions", label: "Pociones" },
  { id: "refined", label: "Refinados" },
  { id: "other",   label: "Otro" },
]

const TIERS = [2, 3, 4, 5, 6, 7, 8]

const formatSilver = (v: number) => {
  if (!v) return "—"
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

interface Material {
  id: string
  itemId: string        // Albion item ID (may be empty if custom)
  name: string
  qty: number
  price: number
  loadingPrice: boolean
}

interface CraftItem {
  id: string
  itemId: string        // Albion item ID (may be empty if custom)
  name: string
  category: string
  tier: number
  sellPrice: number
  quantity: number
  cityTax: number
  materials: Material[]
  loadingSellPrice: boolean
}

const newMat = (): Material => ({
  id: crypto.randomUUID(),
  itemId: "", name: "", qty: 1, price: 0, loadingPrice: false,
})

const newItem = (): CraftItem => ({
  id: crypto.randomUUID(),
  itemId: "", name: "", category: "weapons", tier: 4,
  sellPrice: 0, quantity: 1, cityTax: 3,
  materials: [newMat()], loadingSellPrice: false,
})

export function CraftingCalculator() {
  const [items, setItems] = useState<CraftItem[]>([newItem()])
  const [activeItemId, setActiveItemId] = useState<string>("")
  const [server] = useState<AlbionServer>(getServer())

  const activeItem = items.find(i => i.id === activeItemId) || items[0]

  const updateItem = (id: string, fields: Partial<CraftItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...fields } : item))
  }

  const updateMat = (itemId: string, matId: string, fields: Partial<Material>) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, materials: item.materials.map(m => m.id === matId ? { ...m, ...fields } : m) }
        : item
    ))
  }

  const addMat = (itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, materials: [...item.materials, newMat()] } : item
    ))
  }

  const removeMat = (itemId: string, matId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, materials: item.materials.filter(m => m.id !== matId) } : item
    ))
  }

  // Fetch real sell price for the crafted item
  const fetchSellPrice = useCallback(async (item: CraftItem) => {
    if (!item.itemId) return
    updateItem(item.id, { loadingSellPrice: true })
    try {
      const prices = await fetchPrices([item.itemId], { server, locations: ALBION_CITIES })
      const valid = prices.filter(p => p.sell_price_min > 0)
      if (valid.length > 0) {
        const best = valid.reduce((b, p) => p.sell_price_min < b.sell_price_min ? p : b, valid[0])
        updateItem(item.id, { sellPrice: best.sell_price_min, loadingSellPrice: false })
      } else {
        updateItem(item.id, { loadingSellPrice: false })
      }
    } catch {
      updateItem(item.id, { loadingSellPrice: false })
    }
  }, [server])

  // Fetch real price for a material
  const fetchMatPrice = useCallback(async (itemId: string, matId: string, matItemId: string) => {
    if (!matItemId) return
    updateMat(itemId, matId, { loadingPrice: true })
    try {
      const prices = await fetchPrices([matItemId], { server, locations: ALBION_CITIES })
      const valid = prices.filter(p => p.sell_price_min > 0)
      if (valid.length > 0) {
        const cheapest = valid.reduce((b, p) => p.sell_price_min < b.sell_price_min ? p : b, valid[0])
        updateMat(itemId, matId, { price: cheapest.sell_price_min, loadingPrice: false })
      } else {
        updateMat(itemId, matId, { loadingPrice: false })
      }
    } catch {
      updateMat(itemId, matId, { loadingPrice: false })
    }
  }, [server])

  const addItem = () => {
    const item = newItem()
    setItems(prev => [...prev, item])
    setActiveItemId(item.id)
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const remaining = prev.filter(i => i.id !== id)
      return remaining.length > 0 ? remaining : [newItem()]
    })
  }

  const calcItem = (item: CraftItem) => {
    const matCost = item.materials.reduce((s, m) => s + m.qty * m.price, 0)
    const revenue = item.sellPrice * (1 - item.cityTax / 100)
    const profit = revenue - matCost
    const profitTotal = profit * item.quantity
    const margin = matCost > 0 ? (profit / matCost) * 100 : 0
    const breakEven = item.cityTax < 100 ? matCost / (1 - item.cityTax / 100) : 0
    return { matCost, revenue, profit, profitTotal, margin, breakEven }
  }

  const activeCalc = activeItem ? calcItem(activeItem) : null

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Calculadora de Crafteo</h1>
              <p className="text-sm text-muted-foreground">
                Busca items con iconos · precios reales del servidor <span className="text-blue-400">{server.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <Button onClick={addItem} size="sm" className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30">
            <Plus className="w-4 h-4 mr-1" /> Nuevo item
          </Button>
        </div>

        {/* Item tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveItemId(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeItem?.id === item.id
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.itemId && <ItemIcon itemId={item.itemId} size={16} />}
              {item.name || `Item ${idx + 1}`}
              {items.length > 1 && (
                <span onClick={e => { e.stopPropagation(); removeItem(item.id) }} className="ml-1 hover:text-red-400">×</span>
              )}
            </button>
          ))}
        </div>

        {activeItem && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Item config */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {activeItem.itemId && <ItemIcon itemId={activeItem.itemId} size={32} />}
                  <CardTitle className="text-sm">Configuración del item</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Item search */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Buscar item crafteado</Label>
                  <ItemSearchDropdown
                    value={activeItem.itemId}
                    onChange={(albItem: AlbionItem) => {
                      updateItem(activeItem.id, {
                        itemId: albItem.id,
                        name: albItem.name,
                        tier: albItem.tier || activeItem.tier,
                        category: albItem.category || activeItem.category,
                      })
                    }}
                    placeholder="Busca el item que crafteas..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">O nombre personalizado</Label>
                    <Input
                      placeholder="ej: Espada T4"
                      value={activeItem.name}
                      onChange={e => updateItem(activeItem.id, { name: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Categoría</Label>
                    <select
                      value={activeItem.category}
                      onChange={e => updateItem(activeItem.id, { category: e.target.value })}
                      className="w-full h-10 rounded-md bg-secondary border border-border text-foreground text-sm px-3"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tier</Label>
                    <select
                      value={activeItem.tier}
                      onChange={e => updateItem(activeItem.id, { tier: Number(e.target.value) })}
                      className="w-full h-10 rounded-md bg-secondary border border-border text-foreground text-sm px-3"
                    >
                      {TIERS.map(t => <option key={t} value={t}>T{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Cantidad</Label>
                    <Input type="number" value={activeItem.quantity} onChange={e => updateItem(activeItem.id, { quantity: Number(e.target.value) })} min={1} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Precio venta</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={activeItem.sellPrice || ""}
                        onChange={e => updateItem(activeItem.id, { sellPrice: Number(e.target.value) })}
                        className="bg-secondary border-border flex-1"
                      />
                      {activeItem.itemId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 px-2 text-blue-400"
                          onClick={() => fetchSellPrice(activeItem)}
                          disabled={activeItem.loadingSellPrice}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${activeItem.loadingSellPrice ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tax ciudad (%)</Label>
                    <Input type="number" value={activeItem.cityTax} onChange={e => updateItem(activeItem.id, { cityTax: Number(e.target.value) })} min={0} max={10} step={0.1} className="bg-secondary border-border" />
                  </div>
                </div>

                {/* Materials */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground font-semibold">Materiales</Label>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-400" onClick={() => addMat(activeItem.id)}>
                      <Plus className="w-3 h-3 mr-1" /> Agregar
                    </Button>
                  </div>
                  {activeItem.materials.map((mat) => (
                    <div key={mat.id} className="rounded-lg bg-secondary/30 p-2 space-y-2">
                      {/* Item search for material */}
                      <div className="flex gap-2 items-center">
                        {mat.itemId && <ItemIcon itemId={mat.itemId} size={24} />}
                        <ItemSearchDropdown
                          value={mat.itemId}
                          onChange={(albItem: AlbionItem) => {
                            updateMat(activeItem.id, mat.id, { itemId: albItem.id, name: albItem.name })
                          }}
                          placeholder="Buscar material..."
                          className="flex-1"
                        />
                        <button onClick={() => removeMat(activeItem.id, mat.id)} className="text-muted-foreground hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Nombre (o personalizado)"
                          value={mat.name}
                          onChange={e => updateMat(activeItem.id, mat.id, { name: e.target.value })}
                          className="bg-secondary border-border text-xs col-span-1"
                        />
                        <Input
                          type="number"
                          placeholder="Cant."
                          value={mat.qty || ""}
                          onChange={e => updateMat(activeItem.id, mat.id, { qty: Number(e.target.value) })}
                          min={1}
                          className="bg-secondary border-border text-xs"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder="Precio"
                            value={mat.price || ""}
                            onChange={e => updateMat(activeItem.id, mat.id, { price: Number(e.target.value) })}
                            className="bg-secondary border-border text-xs flex-1"
                          />
                          {mat.itemId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 px-1.5 text-blue-400"
                              onClick={() => fetchMatPrice(activeItem.id, mat.id, mat.itemId)}
                              disabled={mat.loadingPrice}
                            >
                              <RefreshCw className={`w-3 h-3 ${mat.loadingPrice ? "animate-spin" : ""}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              {activeCalc && (
                <>
                  <Card className={`border ${activeCalc.profit > 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        {activeItem.itemId && <ItemIcon itemId={activeItem.itemId} size={40} />}
                        {activeCalc.profit > 0
                          ? <TrendingUp className="w-5 h-5 text-green-400" />
                          : <TrendingDown className="w-5 h-5 text-red-400" />
                        }
                        <span className={`font-bold text-lg ${activeCalc.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                          {activeCalc.profit > 0 ? "VALE LA PENA" : "MEJOR COMPRAR"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Ganancia/u</p>
                          <p className={`text-2xl font-bold ${activeCalc.profit > 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(activeCalc.profit)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Margen</p>
                          <p className={`text-2xl font-bold ${activeCalc.profit > 0 ? "text-green-400" : "text-red-400"}`}>{activeCalc.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Desglose de costos</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {activeItem.materials.map(mat => mat.price > 0 && (
                        <div key={mat.id} className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {mat.itemId && <ItemIcon itemId={mat.itemId} size={16} />}
                            <span>{mat.name || "Material"} ×{mat.qty}</span>
                          </div>
                          <span className="text-red-400">-{formatSilver(mat.qty * mat.price)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="text-muted-foreground">Costo materiales/u</span>
                        <span className="font-medium">-{formatSilver(activeCalc.matCost)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Ingreso/u (tras {activeItem.cityTax}% tax)</span>
                        <span className="text-green-400">+{formatSilver(activeCalc.revenue)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-border pt-2">
                        <span>Ganancia {activeItem.quantity}x</span>
                        <span className={activeCalc.profitTotal >= 0 ? "text-green-400" : "text-red-400"}>
                          {activeCalc.profitTotal >= 0 ? "+" : ""}{formatSilver(activeCalc.profitTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>Precio mínimo de venta (break-even)</span>
                        <span className="text-yellow-400">{formatSilver(activeCalc.breakEven)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Summary all items */}
              {items.length > 1 && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Resumen todos los items</CardTitle></CardHeader>
                  <CardContent>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border">
                          <th className="text-left py-1.5">Item</th>
                          <th className="text-right py-1.5">Ganancia/u</th>
                          <th className="text-right py-1.5">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => {
                          const c = calcItem(item)
                          return (
                            <tr key={item.id} className="border-b border-border/50">
                              <td className="py-1.5">
                                <div className="flex items-center gap-1.5">
                                  {item.itemId && <ItemIcon itemId={item.itemId} size={18} />}
                                  <span className="text-foreground">{item.name || "Sin nombre"}</span>
                                </div>
                              </td>
                              <td className={`py-1.5 text-right ${c.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(c.profit)}</td>
                              <td className={`py-1.5 text-right font-medium ${c.profitTotal >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(c.profitTotal)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
