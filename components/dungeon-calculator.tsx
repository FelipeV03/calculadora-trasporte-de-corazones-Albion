"use client"

import { useState, useMemo } from "react"
import { Sword, TrendingUp, Skull, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const formatSilver = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

const formatFame = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString()
}

type ActivityId = "hce" | "corrupted" | "roads" | "solo" | "group" | "avalonian"

interface Activity {
  id: ActivityId
  name: string
  desc: string
  defaultFamePerHour: number
  defaultSilverPerHour: number
  defaultDeathRisk: number // % chance to die per run
  defaultRunMinutes: number
  deathLoss: number // estimated silver loss on death
}

const ACTIVITIES: Activity[] = [
  { id: "hce", name: "HCE (Hardcore Expeditions)", desc: "Alta fame, poco riesgo de muerte", defaultFamePerHour: 2_500_000, defaultSilverPerHour: 800_000, defaultDeathRisk: 2, defaultRunMinutes: 15, deathLoss: 500_000 },
  { id: "corrupted", name: "Corrupted Dungeon", desc: "PvP 1v1, alta fame y silver", defaultFamePerHour: 1_800_000, defaultSilverPerHour: 600_000, defaultDeathRisk: 25, defaultRunMinutes: 10, deathLoss: 1_500_000 },
  { id: "roads", name: "Roads of Avalon", desc: "Alta recompensa, alto riesgo", defaultFamePerHour: 3_000_000, defaultSilverPerHour: 1_200_000, defaultDeathRisk: 15, defaultRunMinutes: 20, deathLoss: 2_000_000 },
  { id: "solo", name: "Solo Dungeon (Open World)", desc: "Seguro, fame moderada", defaultFamePerHour: 800_000, defaultSilverPerHour: 300_000, defaultDeathRisk: 5, defaultRunMinutes: 20, deathLoss: 300_000 },
  { id: "group", name: "Group Dungeon (5 man)", desc: "Requiere grupo, buena fame", defaultFamePerHour: 1_500_000, defaultSilverPerHour: 500_000, defaultDeathRisk: 3, defaultRunMinutes: 25, deathLoss: 400_000 },
  { id: "avalonian", name: "Avalonian Dungeon", desc: "Máxima fame/silver, difícil", defaultFamePerHour: 4_000_000, defaultSilverPerHour: 1_800_000, defaultDeathRisk: 10, defaultRunMinutes: 40, deathLoss: 3_000_000 },
]

interface ActivityState {
  famePerHour: number
  silverPerHour: number
  deathRisk: number
  runMinutes: number
  deathLoss: number
}

export function DungeonCalculator() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityId>("hce")
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [daysPerWeek, setDaysPerWeek] = useState(5)
  const [gearCostPerSession, setGearCostPerSession] = useState(0)

  const [activityStates, setActivityStates] = useState<Record<ActivityId, ActivityState>>(
    Object.fromEntries(
      ACTIVITIES.map((a) => [
        a.id,
        {
          famePerHour: a.defaultFamePerHour,
          silverPerHour: a.defaultSilverPerHour,
          deathRisk: a.defaultDeathRisk,
          runMinutes: a.defaultRunMinutes,
          deathLoss: a.deathLoss,
        },
      ])
    ) as Record<ActivityId, ActivityState>
  )

  const updateActivity = (id: ActivityId, fields: Partial<ActivityState>) => {
    setActivityStates((prev) => ({ ...prev, [id]: { ...prev[id], ...fields } }))
  }

  const currentState = activityStates[selectedActivity]
  const currentActivity = ACTIVITIES.find((a) => a.id === selectedActivity)!

  const calc = useMemo(() => {
    const s = currentState
    const runsPerHour = 60 / s.runMinutes
    const deathRatePerRun = s.deathRisk / 100
    const deathsPerHour = runsPerHour * deathRatePerRun
    const deathLossPerHour = deathsPerHour * s.deathLoss

    const grossSilverPerHour = s.silverPerHour
    const netSilverPerHour = grossSilverPerHour - deathLossPerHour - gearCostPerSession / (hoursPerDay || 1)
    const netSilverPerSession = netSilverPerHour * hoursPerDay
    const netSilverPerWeek = netSilverPerSession * daysPerWeek

    const famePerSession = s.famePerHour * hoursPerDay
    const famePerWeek = famePerSession * daysPerWeek

    const runsPerSession = runsPerHour * hoursPerDay
    const expectedDeathsPerSession = runsPerSession * deathRatePerRun

    const effectiveHourlyROI = netSilverPerHour
    const riskScore = s.deathRisk // simple % score

    return {
      runsPerHour,
      deathsPerHour,
      deathLossPerHour,
      netSilverPerHour,
      netSilverPerSession,
      netSilverPerWeek,
      famePerSession,
      famePerWeek,
      expectedDeathsPerSession,
      effectiveHourlyROI,
      riskScore,
    }
  }, [currentState, hoursPerDay, daysPerWeek, gearCostPerSession])

  const allComparisons = useMemo(() => {
    return ACTIVITIES.map((a) => {
      const s = activityStates[a.id]
      const runsPerHour = 60 / s.runMinutes
      const deathRatePerRun = s.deathRisk / 100
      const deathLossPerHour = runsPerHour * deathRatePerRun * s.deathLoss
      const netSilverPerHour = s.silverPerHour - deathLossPerHour
      return { ...a, netSilverPerHour, famePerHour: s.famePerHour, deathRisk: s.deathRisk }
    }).sort((a, b) => b.netSilverPerHour - a.netSilverPerHour)
  }, [activityStates])

  const bestActivity = allComparisons[0]

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Sword className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Calculadora de Dungeons & Fame</h1>
            <p className="text-sm text-muted-foreground">Compara actividades, fame/hora y silver real tras muertes</p>
          </div>
        </div>

        {/* Global config */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Horas por sesión</Label>
                <Input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} min={0.5} step={0.5} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Días por semana</Label>
                <Input type="number" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))} min={1} max={7} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Costo gear por sesión (silver)</Label>
                <Input type="number" value={gearCostPerSession || ""} onChange={(e) => setGearCostPerSession(Number(e.target.value))} placeholder="ej: 200000" className="bg-secondary border-border" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedActivity(a.id)}
              className={`p-3 rounded-lg text-left transition-colors border ${
                selectedActivity === a.id
                  ? "bg-red-500/15 border-red-500/30 text-red-400"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <p className="text-xs font-bold leading-tight">{a.name}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Detail config */}
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{currentActivity.name} — Parámetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fame/hora</Label>
                  <Input type="number" value={currentState.famePerHour || ""} onChange={(e) => updateActivity(selectedActivity, { famePerHour: Number(e.target.value) })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Silver bruto/hora</Label>
                  <Input type="number" value={currentState.silverPerHour || ""} onChange={(e) => updateActivity(selectedActivity, { silverPerHour: Number(e.target.value) })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">% riesgo de muerte/run</Label>
                  <Input type="number" value={currentState.deathRisk} onChange={(e) => updateActivity(selectedActivity, { deathRisk: Number(e.target.value) })} min={0} max={100} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Minutos por run</Label>
                  <Input type="number" value={currentState.runMinutes} onChange={(e) => updateActivity(selectedActivity, { runMinutes: Number(e.target.value) })} min={1} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-muted-foreground">Pérdida estimada por muerte (silver)</Label>
                  <Input type="number" value={currentState.deathLoss || ""} onChange={(e) => updateActivity(selectedActivity, { deathLoss: Number(e.target.value) })} className="bg-secondary border-border" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-3">Resultados por sesión ({hoursPerDay}h × {daysPerWeek}d/semana)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Silver neto/hora</p>
                    <p className={`text-xl font-bold ${calc.netSilverPerHour >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(calc.netSilverPerHour)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fame/hora</p>
                    <p className="text-xl font-bold text-purple-400">{formatFame(currentState.famePerHour)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Silver neto por sesión</p>
                    <p className={`text-lg font-bold ${calc.netSilverPerSession >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(calc.netSilverPerSession)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fame por sesión</p>
                    <p className="text-lg font-bold text-foreground">{formatFame(calc.famePerSession)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Silver neto/semana</p>
                    <p className={`text-lg font-bold ${calc.netSilverPerWeek >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(calc.netSilverPerWeek)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fame/semana</p>
                    <p className="text-lg font-bold text-foreground">{formatFame(calc.famePerWeek)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Análisis de riesgo</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Muertes esperadas/sesión</span>
                  <span className={`font-medium ${calc.expectedDeathsPerSession < 1 ? "text-green-400" : "text-red-400"}`}>
                    {calc.expectedDeathsPerSession.toFixed(2)} muertes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pérdida por muertes/hora</span>
                  <span className="text-red-400">-{formatSilver(calc.deathLossPerHour)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Silver bruto/hora</span>
                  <span className="text-foreground">+{formatSilver(currentState.silverPerHour)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-bold">
                  <span>Silver neto/hora</span>
                  <span className={calc.netSilverPerHour >= 0 ? "text-green-400" : "text-red-400"}>{formatSilver(calc.netSilverPerHour)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comparison table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Comparación de actividades</CardTitle>
              <span className="text-xs text-muted-foreground">— ordenadas por silver neto/hora</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3">Actividad</th>
                    <th className="text-right py-2 pr-3">Fame/hora</th>
                    <th className="text-right py-2 pr-3">Silver neto/hora</th>
                    <th className="text-right py-2 pr-3">Riesgo</th>
                    <th className="text-right py-2">Silver/semana</th>
                  </tr>
                </thead>
                <tbody>
                  {allComparisons.map((a, idx) => {
                    const isSelected = a.id === selectedActivity
                    const isBest = idx === 0
                    const weeklyNet = a.netSilverPerHour * hoursPerDay * daysPerWeek
                    return (
                      <tr
                        key={a.id}
                        className={`border-b border-border/50 cursor-pointer hover:bg-secondary/30 ${isSelected ? "bg-secondary/50" : ""}`}
                        onClick={() => setSelectedActivity(a.id)}
                      >
                        <td className="py-2 pr-3 font-medium text-foreground">
                          {a.name}
                          {isBest && <span className="ml-1 text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Mejor</span>}
                        </td>
                        <td className="py-2 pr-3 text-right text-purple-400">{formatFame(a.famePerHour)}</td>
                        <td className={`py-2 pr-3 text-right font-medium ${a.netSilverPerHour >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(a.netSilverPerHour)}</td>
                        <td className={`py-2 pr-3 text-right ${a.deathRisk > 15 ? "text-red-400" : a.deathRisk > 5 ? "text-yellow-400" : "text-green-400"}`}>{a.deathRisk}%</td>
                        <td className={`py-2 text-right font-bold ${weeklyNet >= 0 ? "text-green-400" : "text-red-400"}`}>{formatSilver(weeklyNet)}</td>
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
  )
}
