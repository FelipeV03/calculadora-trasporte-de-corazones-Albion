"use client"

import { useState, useMemo } from "react"
import { Sprout, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const formatSilver = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

// ---- CROPS ----
// yield per plot per cycle (base, no focus)
const CROPS = [
  { id: "wheat", name: "Trigo", tier: 4, cycleHours: 22, yieldPerPlot: 54, seedPrice: 400, producePrice: 800, producePerSeed: 54 },
  { id: "cabbage", name: "Repollo", tier: 3, cycleHours: 22, yieldPerPlot: 54, seedPrice: 200, producePrice: 400, producePerSeed: 54 },
  { id: "turnip", name: "Nabo", tier: 2, cycleHours: 22, yieldPerPlot: 54, seedPrice: 100, producePrice: 200, producePerSeed: 54 },
  { id: "pumpkin", name: "Calabaza", tier: 5, cycleHours: 22, yieldPerPlot: 54, seedPrice: 1200, producePrice: 2200, producePerSeed: 54 },
  { id: "corn", name: "Maíz", tier: 6, cycleHours: 22, yieldPerPlot: 54, seedPrice: 3500, producePrice: 5500, producePerSeed: 54 },
  { id: "pumpkin_giant", name: "Calabaza gigante", tier: 7, cycleHours: 22, yieldPerPlot: 54, seedPrice: 9000, producePrice: 14000, producePerSeed: 54 },
  { id: "sunflower", name: "Girasol", tier: 8, cycleHours: 22, yieldPerPlot: 54, seedPrice: 22000, producePrice: 33000, producePerSeed: 54 },
]

// ---- ANIMALS ----
const ANIMALS = [
  { id: "chicken", name: "Pollo", tier: 3, cycleHours: 22, plotsNeeded: 1, babyPrice: 500, producePrice: 300, produceQty: 18, meatPrice: 1200, adultChance: 0.3 },
  { id: "pig", name: "Cerdo", tier: 5, cycleHours: 22, plotsNeeded: 2, babyPrice: 3000, producePrice: 2000, produceQty: 10, meatPrice: 8000, adultChance: 0.3 },
  { id: "cow", name: "Vaca", tier: 5, cycleHours: 22, plotsNeeded: 2, babyPrice: 4500, producePrice: 3500, produceQty: 8, meatPrice: 12000, adultChance: 0.3 },
  { id: "goat", name: "Cabra", tier: 4, cycleHours: 22, plotsNeeded: 1, babyPrice: 1500, producePrice: 1000, produceQty: 12, meatPrice: 4000, adultChance: 0.3 },
  { id: "goose", name: "Ganso", tier: 4, cycleHours: 22, plotsNeeded: 1, babyPrice: 1200, producePrice: 800, produceQty: 14, meatPrice: 3500, adultChance: 0.3 },
  { id: "horse", name: "Caballo", tier: 5, cycleHours: 22, plotsNeeded: 4, babyPrice: 10000, producePrice: 0, produceQty: 0, meatPrice: 0, adultChance: 0.8 },
  { id: "ox", name: "Buey", tier: 5, cycleHours: 22, plotsNeeded: 4, babyPrice: 12000, producePrice: 0, produceQty: 0, meatPrice: 0, adultChance: 0.8 },
]

type Tab = "crops" | "animals"

export function FarmingCalculator() {
  const [tab, setTab] = useState<Tab>("crops")
  const [plots, setPlots] = useState(9)
  const [weeksToCalc, setWeeksToCalc] = useState(1)
  const [useFocus, setUseFocus] = useState(false)

  // Crop customizable prices
  const [cropPrices, setCropPrices] = useState<Record<string, { seedPrice: number; producePrice: number }>>(
    Object.fromEntries(CROPS.map((c) => [c.id, { seedPrice: c.seedPrice, producePrice: c.producePrice }]))
  )

  // Animal customizable prices
  const [animalPrices, setAnimalPrices] = useState<Record<string, { babyPrice: number; producePrice: number; meatPrice: number }>>(
    Object.fromEntries(ANIMALS.map((a) => [a.id, { babyPrice: a.babyPrice, producePrice: a.producePrice, meatPrice: a.meatPrice }]))
  )

  const focusMultiplier = useFocus ? 2.0 : 1.0 // focus roughly doubles yield

  const cropResults = useMemo(() => {
    const cyclesPerWeek = (7 * 24) / 22 // ~7.6 cycles per week
    const totalCycles = cyclesPerWeek * weeksToCalc

    return CROPS.map((crop) => {
      const sp = cropPrices[crop.id]
      const yieldPerCycle = crop.yieldPerPlot * focusMultiplier
      const totalYield = yieldPerCycle * plots * totalCycles
      const totalSeedCost = plots * totalCycles * sp.seedPrice // 1 seed per plot per cycle
      const totalRevenue = totalYield * sp.producePrice
      const profit = totalRevenue - totalSeedCost
      const profitPerWeek = profit / weeksToCalc
      const profitPerDay = profitPerWeek / 7
      return { ...crop, yieldPerCycle, totalYield, totalSeedCost, totalRevenue, profit, profitPerWeek, profitPerDay }
    }).sort((a, b) => b.profitPerWeek - a.profitPerWeek)
  }, [cropPrices, plots, weeksToCalc, useFocus])

  const animalResults = useMemo(() => {
    const cyclesPerWeek = (7 * 24) / 22
    const totalCycles = cyclesPerWeek * weeksToCalc

    return ANIMALS.map((animal) => {
      const ap = animalPrices[animal.id]
      const availablePlots = Math.floor(plots / animal.plotsNeeded)
      if (availablePlots === 0) return { ...animal, availablePlots: 0, profit: 0, profitPerWeek: 0, profitPerDay: 0 }

      const produceRevenue = animal.produceQty * ap.producePrice * availablePlots * totalCycles * focusMultiplier
      const babyCost = ap.babyPrice * availablePlots // initial cost only
      // Meat/adult sale: chance per cycle of getting an adult
      const meatRevenue = animal.adultChance * ap.meatPrice * availablePlots * totalCycles
      const totalRevenue = produceRevenue + meatRevenue
      const profit = totalRevenue - babyCost
      const profitPerWeek = profit / weeksToCalc
      const profitPerDay = profitPerWeek / 7
      return { ...animal, availablePlots, totalRevenue, babyCost, profit, profitPerWeek, profitPerDay }
    }).sort((a, b) => b.profitPerWeek - a.profitPerWeek)
  }, [animalPrices, plots, weeksToCalc, useFocus])

  const topCrop = cropResults[0]
  const topAnimal = animalResults[0]

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Calculadora de Farming</h1>
            <p className="text-sm text-muted-foreground">Compara cultivos vs animales y optimiza tu isla</p>
          </div>
        </div>

        {/* Global config */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cantidad de parcelas</Label>
                <Input type="number" value={plots} onChange={(e) => setPlots(Number(e.target.value))} min={1} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Semanas a calcular</Label>
                <Input type="number" value={weeksToCalc} onChange={(e) => setWeeksToCalc(Number(e.target.value))} min={1} max={52} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Focus Points</Label>
                <button
                  onClick={() => setUseFocus(!useFocus)}
                  className={`w-full h-10 rounded-md text-sm font-medium transition-colors border ${
                    useFocus
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {useFocus ? "Con Focus (×2 yield)" : "Sin Focus (yield base)"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["crops", "animals"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "crops" ? "🌾 Cultivos" : "🐄 Animales"}
            </button>
          ))}
        </div>

        {tab === "crops" && (
          <div className="space-y-4">
            {/* Best crop highlight */}
            {topCrop && (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-bold text-green-400">Mejor cultivo: {topCrop.name} T{topCrop.tier}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div><p className="text-xs text-muted-foreground">Ganancia/semana</p><p className="text-lg font-bold text-green-400">{formatSilver(topCrop.profitPerWeek)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Ganancia/día</p><p className="text-lg font-bold text-green-400">{formatSilver(topCrop.profitPerDay)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Total {weeksToCalc} sem.</p><p className="text-lg font-bold text-green-400">{formatSilver(topCrop.profit)}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Price inputs + results table */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cultivos — Precios y resultados ({plots} parcelas)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left py-2 pr-3">Cultivo</th>
                        <th className="text-right py-2 pr-3">Precio semilla</th>
                        <th className="text-right py-2 pr-3">Precio producto</th>
                        <th className="text-right py-2 pr-3">Yield/ciclo</th>
                        <th className="text-right py-2 pr-3">Ganancia/día</th>
                        <th className="text-right py-2">Ganancia/semana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cropResults.map((crop, idx) => (
                        <tr key={crop.id} className={`border-b border-border/50 ${idx === 0 ? "bg-green-500/5" : ""}`}>
                          <td className="py-2 pr-3 font-medium text-foreground">
                            T{crop.tier} {crop.name}
                            {idx === 0 && <span className="ml-1 text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Mejor</span>}
                          </td>
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              value={cropPrices[crop.id].seedPrice || ""}
                              onChange={(e) => setCropPrices((p) => ({ ...p, [crop.id]: { ...p[crop.id], seedPrice: Number(e.target.value) } }))}
                              className="bg-secondary border-border h-7 text-xs w-24 ml-auto"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              value={cropPrices[crop.id].producePrice || ""}
                              onChange={(e) => setCropPrices((p) => ({ ...p, [crop.id]: { ...p[crop.id], producePrice: Number(e.target.value) } }))}
                              className="bg-secondary border-border h-7 text-xs w-24 ml-auto"
                            />
                          </td>
                          <td className="py-2 pr-3 text-right text-muted-foreground">{crop.yieldPerCycle.toFixed(0)}</td>
                          <td className={`py-2 pr-3 text-right font-medium ${crop.profitPerDay >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(crop.profitPerDay)}</td>
                          <td className={`py-2 text-right font-bold ${crop.profitPerWeek >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(crop.profitPerWeek)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "animals" && (
          <div className="space-y-4">
            {/* Best animal highlight */}
            {topAnimal && topAnimal.availablePlots > 0 && (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-bold text-green-400">Mejor animal: {topAnimal.name} T{topAnimal.tier}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div><p className="text-xs text-muted-foreground">Ganancia/semana</p><p className="text-lg font-bold text-green-400">{formatSilver(topAnimal.profitPerWeek)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Ganancia/día</p><p className="text-lg font-bold text-green-400">{formatSilver(topAnimal.profitPerDay)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Parcelas usadas</p><p className="text-lg font-bold text-foreground">{topAnimal.availablePlots * topAnimal.plotsNeeded}/{plots}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Animales — Precios y resultados ({plots} parcelas)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left py-2 pr-3">Animal</th>
                        <th className="text-right py-2 pr-3">Precio cría</th>
                        <th className="text-right py-2 pr-3">Precio producto</th>
                        <th className="text-right py-2 pr-3">Precio carne</th>
                        <th className="text-right py-2 pr-3">Animales</th>
                        <th className="text-right py-2">Ganancia/semana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animalResults.map((animal, idx) => (
                        <tr key={animal.id} className={`border-b border-border/50 ${idx === 0 && animal.availablePlots > 0 ? "bg-green-500/5" : ""}`}>
                          <td className="py-2 pr-3 font-medium text-foreground">
                            T{animal.tier} {animal.name}
                            <span className="text-muted-foreground ml-1">({animal.plotsNeeded}p/u)</span>
                            {idx === 0 && animal.availablePlots > 0 && <span className="ml-1 text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Mejor</span>}
                          </td>
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              value={animalPrices[animal.id].babyPrice || ""}
                              onChange={(e) => setAnimalPrices((p) => ({ ...p, [animal.id]: { ...p[animal.id], babyPrice: Number(e.target.value) } }))}
                              className="bg-secondary border-border h-7 text-xs w-24 ml-auto"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              value={animalPrices[animal.id].producePrice || ""}
                              onChange={(e) => setAnimalPrices((p) => ({ ...p, [animal.id]: { ...p[animal.id], producePrice: Number(e.target.value) } }))}
                              className="bg-secondary border-border h-7 text-xs w-24 ml-auto"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              value={animalPrices[animal.id].meatPrice || ""}
                              onChange={(e) => setAnimalPrices((p) => ({ ...p, [animal.id]: { ...p[animal.id], meatPrice: Number(e.target.value) } }))}
                              className="bg-secondary border-border h-7 text-xs w-24 ml-auto"
                            />
                          </td>
                          <td className="py-2 pr-3 text-right text-muted-foreground">
                            {animal.availablePlots > 0 ? animal.availablePlots : <span className="text-red-400">Sin espacio</span>}
                          </td>
                          <td className={`py-2 text-right font-bold ${animal.profitPerWeek >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {animal.availablePlots > 0 ? formatSilver(animal.profitPerWeek) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">* Ciclo de cosecha: ~22 horas. Cálculo estimado, los precios reales varían por servidor.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
