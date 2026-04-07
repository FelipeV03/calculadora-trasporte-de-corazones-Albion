"use client"

import { useState, useEffect, useMemo } from "react"
import { Crown, Plus, Trash2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const STORAGE_KEY = "albion-premium-calc"
const PREMIUM_DAYS = [30, 90, 180, 365]
// Approximate premium costs in silver at market (user can override)
const DEFAULT_PREMIUM_PRICES: Record<number, number> = {
  30: 20_000_000,
  90: 55_000_000,
  180: 100_000_000,
  365: 185_000_000,
}

const formatSilver = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

interface PriceHistoryEntry {
  id: string
  date: string
  days: number
  price: number
}

interface PremiumState {
  currentDays: number
  dailyIncome: number
  premiumPrices: Record<number, number>
  priceHistory: PriceHistoryEntry[]
  targetDays: number
  currentSilver: number
}

const defaultState: PremiumState = {
  currentDays: 0,
  dailyIncome: 0,
  premiumPrices: { ...DEFAULT_PREMIUM_PRICES },
  priceHistory: [],
  targetDays: 30,
  currentSilver: 0,
}

export function PremiumCalculator() {
  const [state, setState] = useState<PremiumState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setState({ ...defaultState, ...JSON.parse(saved) })
    } catch {}
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
    }
  }, [state, isLoaded])

  const update = (fields: Partial<PremiumState>) => setState((p) => ({ ...p, ...fields }))

  const updatePrice = (days: number, price: number) => {
    setState((p) => ({ ...p, premiumPrices: { ...p.premiumPrices, [days]: price } }))
  }

  const recordPrice = (days: number) => {
    const entry: PriceHistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString("es-CO"),
      days,
      price: state.premiumPrices[days],
    }
    setState((p) => ({ ...p, priceHistory: [entry, ...p.priceHistory].slice(0, 50) }))
  }

  const deleteHistory = (id: string) => {
    setState((p) => ({ ...p, priceHistory: p.priceHistory.filter((e) => e.id !== id) }))
  }

  const targetPrice = state.premiumPrices[state.targetDays] || 0
  const silverNeeded = Math.max(0, targetPrice - state.currentSilver)
  const daysToAfford = state.dailyIncome > 0 ? Math.ceil(silverNeeded / state.dailyIncome) : null
  const progressPct = targetPrice > 0 ? Math.min(100, (state.currentSilver / targetPrice) * 100) : 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Calculadora de Premium</h1>
            <p className="text-sm text-muted-foreground">¿Cuándo puedes comprar tu premium?</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Status & goal */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tu estado actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Días de premium restantes</Label>
                <Input
                  type="number"
                  value={state.currentDays || ""}
                  onChange={(e) => update({ currentDays: Number(e.target.value) })}
                  placeholder="ej: 15"
                  min={0}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Silver actual en banco</Label>
                <Input
                  type="number"
                  value={state.currentSilver || ""}
                  onChange={(e) => update({ currentSilver: Number(e.target.value) })}
                  placeholder="ej: 5000000"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ingreso diario promedio (silver)</Label>
                <Input
                  type="number"
                  value={state.dailyIncome || ""}
                  onChange={(e) => update({ dailyIncome: Number(e.target.value) })}
                  placeholder="ej: 500000"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo de premium objetivo</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PREMIUM_DAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => update({ targetDays: d })}
                      className={`py-2 rounded-md text-xs font-bold transition-colors ${
                        state.targetDays === d
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <div className="space-y-4">
            {/* Status */}
            <Card className={`border ${state.currentDays > 7 ? "bg-green-500/10 border-green-500/30" : state.currentDays > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30"}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className={`w-4 h-4 ${state.currentDays > 7 ? "text-green-400" : state.currentDays > 0 ? "text-yellow-400" : "text-red-400"}`} />
                  <span className={`font-bold text-sm ${state.currentDays > 7 ? "text-green-400" : state.currentDays > 0 ? "text-yellow-400" : "text-red-400"}`}>
                    {state.currentDays > 0 ? `Premium activo: ${state.currentDays} días restantes` : "Sin premium activo"}
                  </span>
                </div>
                {state.currentDays > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Expira en: {new Date(Date.now() + state.currentDays * 86400000).toLocaleDateString("es-CO")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Goal progress */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Objetivo: Premium {state.targetDays} días</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio de mercado</span>
                  <span className="text-foreground font-medium">{formatSilver(targetPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tienes</span>
                  <span className="text-green-400">{formatSilver(state.currentSilver)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Te faltan</span>
                  <span className={silverNeeded > 0 ? "text-red-400" : "text-green-400"}>
                    {silverNeeded > 0 ? `-${formatSilver(silverNeeded)}` : "¡Ya puedes comprarlo!"}
                  </span>
                </div>
                <Progress value={progressPct} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progressPct.toFixed(1)}% completado</p>
                {daysToAfford !== null && silverNeeded > 0 && (
                  <div className="rounded-lg bg-secondary/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Con {formatSilver(state.dailyIncome)}/día podrás comprarlo en:</p>
                    <p className="text-2xl font-bold text-primary mt-1">{daysToAfford} días</p>
                    <p className="text-xs text-muted-foreground">
                      Aprox. {new Date(Date.now() + daysToAfford * 86400000).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market prices */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Precios actuales del mercado (silver)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PREMIUM_DAYS.map((days) => (
                <div key={days} className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-semibold">{days} días</Label>
                  <Input
                    type="number"
                    value={state.premiumPrices[days] || ""}
                    onChange={(e) => updatePrice(days, Number(e.target.value))}
                    placeholder={formatSilver(DEFAULT_PREMIUM_PRICES[days])}
                    className="bg-secondary border-border text-sm"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => recordPrice(days)}
                    >
                      Registrar
                    </Button>
                  </div>
                  {/* Silver/day cost */}
                  <p className="text-xs text-muted-foreground text-center">
                    {formatSilver(Math.round(state.premiumPrices[days] / days))}/día
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price comparison */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Comparación de paquetes</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2">Paquete</th>
                  <th className="text-right py-2 pr-4">Precio</th>
                  <th className="text-right py-2 pr-4">Precio/día</th>
                  <th className="text-right py-2 pr-4">Días para ahorrar</th>
                  <th className="text-right py-2">Ahorro vs 30d</th>
                </tr>
              </thead>
              <tbody>
                {PREMIUM_DAYS.map((days) => {
                  const price = state.premiumPrices[days]
                  const pricePerDay = Math.round(price / days)
                  const daysToSave = state.dailyIncome > 0 ? Math.ceil(Math.max(0, price - state.currentSilver) / state.dailyIncome) : null
                  const price30PerDay = state.premiumPrices[30] / 30
                  const savings = (price30PerDay - pricePerDay) * days
                  return (
                    <tr key={days} className={`border-b border-border/50 ${state.targetDays === days ? "bg-secondary/30" : ""}`}>
                      <td className="py-2 font-medium text-foreground">{days} días</td>
                      <td className="py-2 pr-4 text-right text-foreground">{formatSilver(price)}</td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">{formatSilver(pricePerDay)}</td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">
                        {daysToSave !== null ? (silverNeeded > 0 && state.targetDays === days ? `${daysToSave}d` : "—") : "—"}
                      </td>
                      <td className={`py-2 text-right font-medium ${days === 30 ? "text-muted-foreground" : savings > 0 ? "text-green-400" : "text-red-400"}`}>
                        {days === 30 ? "Base" : savings > 0 ? `+${formatSilver(savings)}` : formatSilver(savings)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Price history */}
        {state.priceHistory.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Historial de precios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {state.priceHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-border/50 text-xs">
                    <span className="text-muted-foreground">{entry.date}</span>
                    <span className="text-foreground font-medium">{entry.days}d — {formatSilver(entry.price)}</span>
                    <button onClick={() => deleteHistory(entry.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
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
