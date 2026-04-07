"use client"

import { useState, useMemo } from "react"
import { Zap, TrendingUp, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const formatSilver = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

// Focus regeneration: 10k/day base, premium = 10k extra (20k/day)
const FOCUS_PER_DAY_BASE = 10_000
const FOCUS_PER_DAY_PREMIUM = 20_000
const MAX_FOCUS = 30_000

// Return rate bonuses
const BASE_REFINE_RETURN = 0.152
const FOCUS_REFINE_RETURN = 0.435
const BASE_CRAFT_RETURN = 0.0   // no base return on crafting
const FOCUS_CRAFT_RETURN = 0.435

// Focus cost per action (approximate)
const FOCUS_COST_REFINE = 4   // per refined item
const FOCUS_COST_CRAFT = 18   // per crafted item

type ActivityType = "refining" | "crafting" | "farming"

const ACTIVITIES: { id: ActivityType; label: string; desc: string }[] = [
  { id: "refining", label: "Refinamiento", desc: "Mejora el retorno de materiales al refinar" },
  { id: "crafting", label: "Crafteo", desc: "Mejora el retorno de materiales al craftear" },
  { id: "farming", label: "Farming / Crianza", desc: "Duplica aproximadamente el yield de cosechas y animales" },
]

export function FocusCalculator() {
  const [activity, setActivity] = useState<ActivityType>("refining")
  const [hasPremium, setHasPremium] = useState(true)
  const [currentFocus, setCurrentFocus] = useState(30_000)

  // Refining inputs
  const [refineItemsPerDay, setRefineItemsPerDay] = useState(0)
  const [refineValuePerReturn, setRefineValuePerReturn] = useState(0)
  const [refineSellPricePerUnit, setRefineSellPricePerUnit] = useState(0)
  const [refineRawCostPerUnit, setRefineRawCostPerUnit] = useState(0)

  // Crafting inputs
  const [craftItemsPerDay, setCraftItemsPerDay] = useState(0)
  const [craftMaterialValueSaved, setCraftMaterialValueSaved] = useState(0)
  const [craftSellPrice, setCraftSellPrice] = useState(0)
  const [craftMaterialCost, setCraftMaterialCost] = useState(0)

  // Farming inputs
  const [farmingPlotsOrAnimals, setFarmingPlotsOrAnimals] = useState(9)
  const [farmingBaseIncome, setFarmingBaseIncome] = useState(0)

  const focusPerDay = hasPremium ? FOCUS_PER_DAY_PREMIUM : FOCUS_PER_DAY_BASE

  const refineCalc = useMemo(() => {
    if (activity !== "refining") return null
    const itemsPerDay = refineItemsPerDay
    const focusUsedPerDay = itemsPerDay * FOCUS_COST_REFINE
    const daysUntilEmpty = focusUsedPerDay > focusPerDay
      ? currentFocus / Math.max(1, focusUsedPerDay - focusPerDay)
      : Infinity

    // Extra returns from focus vs no focus
    const extraReturnRate = FOCUS_REFINE_RETURN - BASE_REFINE_RETURN // ~28.3%
    const extraMaterialsPerItem = extraReturnRate // materials saved per item (relative to needed)
    const silvSavedPerItem = extraMaterialsPerItem * refineValuePerReturn
    const silvSavedPerDay = silvSavedPerItem * itemsPerDay

    // Profit difference
    const profitNoFocus = (refineSellPricePerUnit - refineRawCostPerUnit * (1 - BASE_REFINE_RETURN)) * itemsPerDay
    const profitFocus = (refineSellPricePerUnit - refineRawCostPerUnit * (1 - FOCUS_REFINE_RETURN)) * itemsPerDay
    const extraProfitPerDay = profitFocus - profitNoFocus

    return { focusUsedPerDay, daysUntilEmpty, silvSavedPerDay, extraProfitPerDay, profitNoFocus, profitFocus }
  }, [activity, refineItemsPerDay, refineValuePerReturn, refineSellPricePerUnit, refineRawCostPerUnit, focusPerDay, currentFocus])

  const craftCalc = useMemo(() => {
    if (activity !== "crafting") return null
    const itemsPerDay = craftItemsPerDay
    const focusUsedPerDay = itemsPerDay * FOCUS_COST_CRAFT
    const daysUntilEmpty = focusUsedPerDay > focusPerDay
      ? currentFocus / Math.max(1, focusUsedPerDay - focusPerDay)
      : Infinity

    const extraReturnRate = FOCUS_CRAFT_RETURN
    const silvSavedPerDay = extraReturnRate * craftMaterialValueSaved * itemsPerDay

    const profitNoFocus = (craftSellPrice - craftMaterialCost) * itemsPerDay
    const profitFocus = (craftSellPrice - craftMaterialCost * (1 - FOCUS_CRAFT_RETURN)) * itemsPerDay
    const extraProfitPerDay = profitFocus - profitNoFocus

    return { focusUsedPerDay, daysUntilEmpty, silvSavedPerDay, extraProfitPerDay, profitNoFocus, profitFocus }
  }, [activity, craftItemsPerDay, craftMaterialValueSaved, craftSellPrice, craftMaterialCost, focusPerDay, currentFocus])

  const farmCalc = useMemo(() => {
    if (activity !== "farming") return null
    const focusUsedPerDay = farmingPlotsOrAnimals * 1 * (22 / 24) // rough: 1 focus per plot per ~22h cycle
    const daysUntilEmpty = focusUsedPerDay > focusPerDay
      ? currentFocus / Math.max(1, focusUsedPerDay - focusPerDay)
      : Infinity

    const extraIncomePerDay = farmingBaseIncome // focus doubles, so extra = base
    return { focusUsedPerDay, daysUntilEmpty, extraIncomePerDay, totalWithFocus: farmingBaseIncome * 2 }
  }, [activity, farmingPlotsOrAnimals, farmingBaseIncome, focusPerDay, currentFocus])

  const focusSustainable = (() => {
    if (activity === "refining" && refineCalc) return refineCalc.focusUsedPerDay <= focusPerDay
    if (activity === "crafting" && craftCalc) return craftCalc.focusUsedPerDay <= focusPerDay
    if (activity === "farming" && farmCalc) return farmCalc.focusUsedPerDay <= focusPerDay
    return true
  })()

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Calculadora de Focus Points</h1>
              <p className="text-sm text-muted-foreground">¿Cuánto vale usar tu focus? ¿Aguanta el ritmo?</p>
            </div>
          </div>

          {/* Global config */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Focus actual</Label>
                  <Input
                    type="number"
                    value={currentFocus}
                    onChange={(e) => setCurrentFocus(Number(e.target.value))}
                    min={0}
                    max={MAX_FOCUS}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">Máx: {MAX_FOCUS.toLocaleString()}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Premium</Label>
                  <button
                    onClick={() => setHasPremium(!hasPremium)}
                    className={`w-full h-10 rounded-md text-sm font-medium transition-colors border ${
                      hasPremium
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {hasPremium ? `Premium: ${FOCUS_PER_DAY_PREMIUM.toLocaleString()}/día` : `Sin premium: ${FOCUS_PER_DAY_BASE.toLocaleString()}/día`}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Días hasta focus lleno</Label>
                  <div className="h-10 flex items-center px-3 rounded-md bg-secondary border border-border text-sm text-muted-foreground">
                    {((MAX_FOCUS - currentFocus) / focusPerDay).toFixed(1)} días
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity tabs */}
          <div className="flex gap-2 flex-wrap">
            {ACTIVITIES.map((a) => (
              <button
                key={a.id}
                onClick={() => setActivity(a.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activity === a.id
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Sustainability badge */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium ${
            focusSustainable ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            <Zap className="w-4 h-4" />
            {focusSustainable
              ? `Focus sostenible: regeneras ${focusPerDay.toLocaleString()}/día y gastas suficiente`
              : `Atención: gastas más focus del que regeneras (${focusPerDay.toLocaleString()}/día)`}
          </div>

          {/* Refining */}
          {activity === "refining" && (
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Parámetros de Refinamiento</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Items refinados por día</Label>
                    <Input type="number" value={refineItemsPerDay || ""} onChange={(e) => setRefineItemsPerDay(Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs text-muted-foreground">Valor del material crudo por retorno (silver)</Label>
                      <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Precio de venta del material crudo que recuperas</TooltipContent></Tooltip>
                    </div>
                    <Input type="number" value={refineValuePerReturn || ""} onChange={(e) => setRefineValuePerReturn(Number(e.target.value))} placeholder="ej: 2500" className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Precio de venta del refinado</Label>
                    <Input type="number" value={refineSellPricePerUnit || ""} onChange={(e) => setRefineSellPricePerUnit(Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Costo materiales crudos (total por unidad)</Label>
                    <Input type="number" value={refineRawCostPerUnit || ""} onChange={(e) => setRefineRawCostPerUnit(Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-1 text-muted-foreground">
                    <p>Retorno sin focus: <span className="text-foreground">{(BASE_REFINE_RETURN * 100).toFixed(1)}%</span></p>
                    <p>Retorno con focus: <span className="text-purple-400">{(FOCUS_REFINE_RETURN * 100).toFixed(1)}%</span></p>
                    <p>Focus por item: <span className="text-foreground">{FOCUS_COST_REFINE}</span></p>
                  </div>
                </CardContent>
              </Card>
              {refineCalc && (
                <div className="space-y-4">
                  <Card className="bg-purple-500/10 border-purple-500/30">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-3">ROI diario del focus en refinamiento</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-xs text-muted-foreground">Ganancia extra/día</p><p className="text-xl font-bold text-purple-400">{formatSilver(refineCalc.extraProfitPerDay)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Focus usado/día</p><p className="text-xl font-bold text-foreground">{refineCalc.focusUsedPerDay.toLocaleString()}</p></div>
                        <div><p className="text-xs text-muted-foreground">Ganancia sin focus/día</p><p className="text-lg font-bold text-muted-foreground">{formatSilver(refineCalc.profitNoFocus)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Ganancia con focus/día</p><p className="text-lg font-bold text-green-400">{formatSilver(refineCalc.profitFocus)}</p></div>
                      </div>
                      {refineCalc.daysUntilEmpty !== Infinity && (
                        <p className="text-xs text-red-400 mt-3">⚠ Sin más regeneración, el focus se acaba en {refineCalc.daysUntilEmpty.toFixed(1)} días</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Crafting */}
          {activity === "crafting" && (
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Parámetros de Crafteo</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Items crafteados por día</Label>
                    <Input type="number" value={craftItemsPerDay || ""} onChange={(e) => setCraftItemsPerDay(Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Valor total de materiales por item (silver)</Label>
                    <Input type="number" value={craftMaterialValueSaved || ""} onChange={(e) => setCraftMaterialValueSaved(Number(e.target.value))} placeholder="ej: 50000" className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Precio de venta del item</Label>
                    <Input type="number" value={craftSellPrice || ""} onChange={(e) => setCraftSellPrice(Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Costo total materiales</Label>
                    <Input type="number" value={craftMaterialCost || ""} onChange={(e) => setCraftMaterialCost(Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-1 text-muted-foreground">
                    <p>Retorno con focus: <span className="text-purple-400">{(FOCUS_CRAFT_RETURN * 100).toFixed(1)}%</span></p>
                    <p>Focus por item: <span className="text-foreground">{FOCUS_COST_CRAFT}</span></p>
                  </div>
                </CardContent>
              </Card>
              {craftCalc && (
                <div className="space-y-4">
                  <Card className="bg-purple-500/10 border-purple-500/30">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-3">ROI diario del focus en crafteo</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-xs text-muted-foreground">Ganancia extra/día</p><p className="text-xl font-bold text-purple-400">{formatSilver(craftCalc.extraProfitPerDay)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Focus usado/día</p><p className="text-xl font-bold text-foreground">{craftCalc.focusUsedPerDay.toLocaleString()}</p></div>
                        <div><p className="text-xs text-muted-foreground">Ganancia sin focus/día</p><p className="text-lg font-bold text-muted-foreground">{formatSilver(craftCalc.profitNoFocus)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Ganancia con focus/día</p><p className="text-lg font-bold text-green-400">{formatSilver(craftCalc.profitFocus)}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Farming */}
          {activity === "farming" && (
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Parámetros de Farming</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Parcelas / animales</Label>
                    <Input type="number" value={farmingPlotsOrAnimals} onChange={(e) => setFarmingPlotsOrAnimals(Number(e.target.value))} min={1} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Ingreso diario SIN focus (silver)</Label>
                    <Input type="number" value={farmingBaseIncome || ""} onChange={(e) => setFarmingBaseIncome(Number(e.target.value))} placeholder="ej: 200000" className="bg-secondary border-border" />
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <p>El focus en farming aproximadamente <span className="text-purple-400">duplica el yield</span> de cultivos y animales.</p>
                  </div>
                </CardContent>
              </Card>
              {farmCalc && farmingBaseIncome > 0 && (
                <Card className="bg-purple-500/10 border-purple-500/30">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-3">ROI diario del focus en farming</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-muted-foreground">Sin focus/día</p><p className="text-xl font-bold text-muted-foreground">{formatSilver(farmingBaseIncome)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Con focus/día</p><p className="text-xl font-bold text-green-400">{formatSilver(farmCalc.totalWithFocus)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Extra/día con focus</p><p className="text-xl font-bold text-purple-400">{formatSilver(farmCalc.extraIncomePerDay)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Focus usado/día</p><p className="text-xl font-bold text-foreground">{farmCalc.focusUsedPerDay.toFixed(0)}</p></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Focus regen summary */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Resumen de Focus</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Focus actual</p><p className="text-lg font-bold text-purple-400">{currentFocus.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Regen/día</p><p className="text-lg font-bold text-foreground">+{focusPerDay.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Máximo</p><p className="text-lg font-bold text-muted-foreground">{MAX_FOCUS.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Días hasta lleno</p><p className="text-lg font-bold text-foreground">{((MAX_FOCUS - currentFocus) / focusPerDay).toFixed(1)}d</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
