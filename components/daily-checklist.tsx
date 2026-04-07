"use client"

import { useState, useEffect, useMemo } from "react"
import { CheckSquare, Plus, Trash2, RotateCcw, Calendar, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const STORAGE_KEY = "albion-daily-checklist"

type Frequency = "daily" | "weekly"
type Category = "farming" | "dungeons" | "market" | "guild" | "crafting" | "misc"

const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: "farming", label: "Farming", color: "text-green-400" },
  { id: "dungeons", label: "Dungeons", color: "text-red-400" },
  { id: "market", label: "Mercado", color: "text-yellow-400" },
  { id: "guild", label: "Gremio", color: "text-indigo-400" },
  { id: "crafting", label: "Crafteo", color: "text-orange-400" },
  { id: "misc", label: "Otro", color: "text-muted-foreground" },
]

const DEFAULT_TASKS: Task[] = [
  { id: "1", label: "Cosechar cultivos de la isla", category: "farming", frequency: "daily", completed: false, completedDate: null },
  { id: "2", label: "Alimentar animales", category: "farming", frequency: "daily", completed: false, completedDate: null },
  { id: "3", label: "Revisar órdenes de compra/venta", category: "market", frequency: "daily", completed: false, completedDate: null },
  { id: "4", label: "Usar Focus Points (refinamiento)", category: "crafting", frequency: "daily", completed: false, completedDate: null },
  { id: "5", label: "Hacer runs de dungeon", category: "dungeons", frequency: "daily", completed: false, completedDate: null },
  { id: "6", label: "Pagar impuesto de gremio", category: "guild", frequency: "weekly", completed: false, completedDate: null },
  { id: "7", label: "Reabastecerse de pociones/comida", category: "misc", frequency: "weekly", completed: false, completedDate: null },
  { id: "8", label: "Actualizar precios del mercado", category: "market", frequency: "weekly", completed: false, completedDate: null },
  { id: "9", label: "Revisar y ajustar isla (cultivos/animales)", category: "farming", frequency: "weekly", completed: false, completedDate: null },
  { id: "10", label: "Participar en GvG / ZvZ del gremio", category: "guild", frequency: "weekly", completed: false, completedDate: null },
]

interface Task {
  id: string
  label: string
  category: Category
  frequency: Frequency
  completed: boolean
  completedDate: string | null
  note?: string
}

interface ChecklistState {
  tasks: Task[]
  lastDailyReset: string
  lastWeeklyReset: string
  streak: number
  lastStreakDate: string
}

const todayStr = () => new Date().toISOString().split("T")[0]
const weekStr = () => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(now.setDate(diff)).toISOString().split("T")[0]
}

const defaultState: ChecklistState = {
  tasks: DEFAULT_TASKS,
  lastDailyReset: todayStr(),
  lastWeeklyReset: weekStr(),
  streak: 0,
  lastStreakDate: "",
}

export function DailyChecklist() {
  const [state, setState] = useState<ChecklistState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [newTaskLabel, setNewTaskLabel] = useState("")
  const [newTaskCategory, setNewTaskCategory] = useState<Category>("misc")
  const [newTaskFreq, setNewTaskFreq] = useState<Frequency>("daily")
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all")
  const [filterFreq, setFilterFreq] = useState<Frequency | "all">("all")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: ChecklistState = { ...defaultState, ...JSON.parse(saved) }
        // Auto-reset daily tasks
        if (parsed.lastDailyReset !== todayStr()) {
          parsed.tasks = parsed.tasks.map((t) =>
            t.frequency === "daily" ? { ...t, completed: false, completedDate: null } : t
          )
          // Update streak
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yStr = yesterday.toISOString().split("T")[0]
          parsed.streak = parsed.lastStreakDate === yStr ? (parsed.streak || 0) + 1 : 0
          parsed.lastDailyReset = todayStr()
        }
        // Auto-reset weekly tasks
        if (parsed.lastWeeklyReset !== weekStr()) {
          parsed.tasks = parsed.tasks.map((t) =>
            t.frequency === "weekly" ? { ...t, completed: false, completedDate: null } : t
          )
          parsed.lastWeeklyReset = weekStr()
        }
        setState(parsed)
      }
    } catch {}
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
    }
  }, [state, isLoaded])

  const toggleTask = (id: string) => {
    setState((p) => {
      const tasks = p.tasks.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedDate: !t.completed ? new Date().toLocaleTimeString("es-CO") : null }
          : t
      )
      // Check streak
      const dailyTasks = tasks.filter((t) => t.frequency === "daily")
      const allDailyDone = dailyTasks.length > 0 && dailyTasks.every((t) => t.completed)
      const streak = allDailyDone && p.lastStreakDate !== todayStr()
        ? { streak: (p.streak || 0) + 1, lastStreakDate: todayStr() }
        : {}
      return { ...p, tasks, ...streak }
    })
  }

  const addTask = () => {
    if (!newTaskLabel.trim()) return
    const task: Task = {
      id: crypto.randomUUID(),
      label: newTaskLabel.trim(),
      category: newTaskCategory,
      frequency: newTaskFreq,
      completed: false,
      completedDate: null,
    }
    setState((p) => ({ ...p, tasks: [...p.tasks, task] }))
    setNewTaskLabel("")
  }

  const removeTask = (id: string) => {
    setState((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) }))
  }

  const resetAll = (freq: Frequency | "all") => {
    setState((p) => ({
      ...p,
      tasks: p.tasks.map((t) =>
        freq === "all" || t.frequency === freq ? { ...t, completed: false, completedDate: null } : t
      ),
    }))
  }

  const filteredTasks = useMemo(() => {
    return state.tasks.filter((t) => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false
      if (filterFreq !== "all" && t.frequency !== filterFreq) return false
      return true
    })
  }, [state.tasks, filterCategory, filterFreq])

  const dailyTasks = state.tasks.filter((t) => t.frequency === "daily")
  const weeklyTasks = state.tasks.filter((t) => t.frequency === "weekly")
  const dailyDone = dailyTasks.filter((t) => t.completed).length
  const weeklyDone = weeklyTasks.filter((t) => t.completed).length
  const dailyPct = dailyTasks.length > 0 ? (dailyDone / dailyTasks.length) * 100 : 0
  const weeklyPct = weeklyTasks.length > 0 ? (weeklyDone / weeklyTasks.length) * 100 : 0

  const getCategoryColor = (cat: Category) =>
    CATEGORIES.find((c) => c.id === cat)?.color || "text-muted-foreground"

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Checklist Diaria & Semanal</h1>
            <p className="text-sm text-muted-foreground">No te olvides de nada en Albion</p>
          </div>
          {state.streak > 0 && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">{state.streak} días seguidos</span>
            </div>
          )}
        </div>

        {/* Progress overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs font-semibold text-foreground">Diarias</span>
                </div>
                <span className="text-xs text-muted-foreground">{dailyDone}/{dailyTasks.length}</span>
              </div>
              <Progress value={dailyPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{dailyPct.toFixed(0)}% completado hoy</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-foreground">Semanales</span>
                </div>
                <span className="text-xs text-muted-foreground">{weeklyDone}/{weeklyTasks.length}</span>
              </div>
              <Progress value={weeklyPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{weeklyPct.toFixed(0)}% completado esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {(["all", "daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterFreq(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterFreq === f ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Todas" : f === "daily" ? "Diarias" : "Semanales"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterCategory === "all" ? "bg-secondary text-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
            >
              Todo
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCategory(c.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterCategory === c.id ? "bg-secondary text-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => resetAll("daily")}>
              <RotateCcw className="w-3 h-3 mr-1" /> Reset diarias
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => resetAll("weekly")}>
              <RotateCcw className="w-3 h-3 mr-1" /> Reset semanales
            </Button>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filteredTasks.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay tareas que coincidan con los filtros</p>
              </CardContent>
            </Card>
          )}
          {filteredTasks.map((task) => {
            const catColor = getCategoryColor(task.category)
            const catLabel = CATEGORIES.find((c) => c.id === task.category)?.label || ""
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer select-none ${
                  task.completed
                    ? "bg-secondary/20 border-border/30 opacity-60"
                    : "bg-card border-border hover:bg-secondary/30"
                }`}
                onClick={() => toggleTask(task.id)}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  task.completed ? "bg-teal-500 border-teal-500" : "border-border"
                }`}>
                  {task.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.label}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${catColor}`}>{catLabel}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className={`text-xs ${task.frequency === "daily" ? "text-teal-400" : "text-indigo-400"}`}>
                      {task.frequency === "daily" ? "Diaria" : "Semanal"}
                    </span>
                    {task.completedDate && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">✓ {task.completedDate}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTask(task.id) }}
                  className="text-muted-foreground hover:text-red-400 flex-shrink-0 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add task */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Agregar tarea personalizada</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-36 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tarea</Label>
                <Input
                  placeholder="ej: Comprar pociones en el mercado"
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoría</Label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                  className="h-10 rounded-md bg-secondary border border-border text-foreground text-sm px-3"
                >
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Frecuencia</Label>
                <div className="flex gap-1">
                  {(["daily", "weekly"] as Frequency[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setNewTaskFreq(f)}
                      className={`px-3 h-10 rounded-md text-sm font-medium transition-colors border ${
                        newTaskFreq === f
                          ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {f === "daily" ? "Diaria" : "Semanal"}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={addTask} disabled={!newTaskLabel.trim()} className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 h-10">
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
