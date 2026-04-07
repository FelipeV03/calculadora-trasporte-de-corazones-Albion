"use client"

import { useState, useEffect, useMemo } from "react"
import { Shield, Plus, Trash2, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const STORAGE_KEY = "albion-guild-tracker"

const formatSilver = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString("es-CO")
}

interface Member {
  id: string
  name: string
  role: string
  contribution: number
  sessionEarnings: number
  note: string
}

interface ContributionLog {
  id: string
  date: string
  memberId: string
  memberName: string
  amount: number
  description: string
}

interface GuildState {
  guildName: string
  taxRate: number
  totalPool: number
  members: Member[]
  log: ContributionLog[]
  splitMode: "equal" | "contribution"
}

const defaultState: GuildState = {
  guildName: "Mi Gremio",
  taxRate: 10,
  totalPool: 0,
  members: [],
  log: [],
  splitMode: "equal",
}

const newMember = (): Member => ({
  id: crypto.randomUUID(),
  name: "",
  role: "Miembro",
  contribution: 0,
  sessionEarnings: 0,
  note: "",
})

const ROLES = ["Lider", "Oficial", "Veterano", "Miembro", "Recluta"]

export function GuildTracker() {
  const [state, setState] = useState<GuildState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [newContribAmount, setNewContribAmount] = useState<Record<string, number>>({})
  const [newContribDesc, setNewContribDesc] = useState<Record<string, string>>({})
  const [sessionIncome, setSessionIncome] = useState(0)

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

  const update = (fields: Partial<GuildState>) => setState((p) => ({ ...p, ...fields }))

  const addMember = () => {
    setState((p) => ({ ...p, members: [...p.members, newMember()] }))
  }

  const updateMember = (id: string, fields: Partial<Member>) => {
    setState((p) => ({ ...p, members: p.members.map((m) => (m.id === id ? { ...m, ...fields } : m)) }))
  }

  const removeMember = (id: string) => {
    setState((p) => ({ ...p, members: p.members.filter((m) => m.id !== id) }))
  }

  const addContribution = (memberId: string) => {
    const amount = newContribAmount[memberId] || 0
    const desc = newContribDesc[memberId] || ""
    if (!amount) return
    const member = state.members.find((m) => m.id === memberId)
    if (!member) return
    const entry: ContributionLog = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString("es-CO"),
      memberId,
      memberName: member.name || "Sin nombre",
      amount,
      description: desc,
    }
    setState((p) => ({
      ...p,
      totalPool: p.totalPool + amount,
      members: p.members.map((m) => m.id === memberId ? { ...m, contribution: m.contribution + amount } : m),
      log: [entry, ...p.log].slice(0, 100),
    }))
    setNewContribAmount((prev) => ({ ...prev, [memberId]: 0 }))
    setNewContribDesc((prev) => ({ ...prev, [memberId]: "" }))
  }

  const distributeSession = () => {
    if (!sessionIncome || state.members.length === 0) return
    const taxAmount = sessionIncome * (state.taxRate / 100)
    const distributable = sessionIncome - taxAmount
    const totalContrib = state.members.reduce((s, m) => s + m.contribution, 0)

    setState((p) => ({
      ...p,
      totalPool: p.totalPool + taxAmount,
      members: p.members.map((m) => {
        const share = p.splitMode === "equal"
          ? distributable / p.members.length
          : totalContrib > 0
            ? (m.contribution / totalContrib) * distributable
            : distributable / p.members.length
        return { ...m, sessionEarnings: m.sessionEarnings + share }
      }),
    }))
    setSessionIncome(0)
  }

  const resetSession = () => {
    setState((p) => ({ ...p, members: p.members.map((m) => ({ ...m, sessionEarnings: 0 })) }))
  }

  const summary = useMemo(() => {
    const totalContrib = state.members.reduce((s, m) => s + m.contribution, 0)
    const totalEarnings = state.members.reduce((s, m) => s + m.sessionEarnings, 0)
    const taxCollected = state.totalPool
    return { totalContrib, totalEarnings, taxCollected }
  }, [state])

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tracker de Gremio</h1>
            <p className="text-sm text-muted-foreground">Controla impuestos, contribuciones y distribución de silver</p>
          </div>
        </div>

        {/* Guild config */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-xs text-muted-foreground">Nombre del gremio</Label>
                <Input value={state.guildName} onChange={(e) => update({ guildName: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Impuesto de gremio (%)</Label>
                <Input type="number" value={state.taxRate} onChange={(e) => update({ taxRate: Number(e.target.value) })} min={0} max={100} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Modo de distribución</Label>
                <button
                  onClick={() => update({ splitMode: state.splitMode === "equal" ? "contribution" : "equal" })}
                  className={`w-full h-10 rounded-md text-sm font-medium transition-colors border ${
                    state.splitMode === "equal"
                      ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {state.splitMode === "equal" ? "Partes iguales" : "Por contribución"}
                </button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pool del gremio</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-secondary border border-border text-sm font-bold text-indigo-400">
                  {formatSilver(state.totalPool)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Contribución total</p>
              <p className="text-xl font-bold text-indigo-400">{formatSilver(summary.totalContrib)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Distribuido (sesión)</p>
              <p className="text-xl font-bold text-green-400">{formatSilver(summary.totalEarnings)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Miembros</p>
              <p className="text-xl font-bold text-foreground">{state.members.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Session distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Distribuir sesión de grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Silver total de la sesión</Label>
                <Input
                  type="number"
                  value={sessionIncome || ""}
                  onChange={(e) => setSessionIncome(Number(e.target.value))}
                  placeholder="ej: 5000000"
                  className="bg-secondary border-border"
                />
              </div>
              {sessionIncome > 0 && (
                <div className="text-xs text-muted-foreground space-y-1 min-w-32">
                  <p>Impuesto ({state.taxRate}%): <span className="text-red-400">-{formatSilver(sessionIncome * state.taxRate / 100)}</span></p>
                  <p>A distribuir: <span className="text-green-400">{formatSilver(sessionIncome * (1 - state.taxRate / 100))}</span></p>
                </div>
              )}
              <Button onClick={distributeSession} disabled={!sessionIncome || state.members.length === 0} className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30">
                Distribuir
              </Button>
              <Button variant="ghost" size="sm" onClick={resetSession} className="text-muted-foreground hover:text-foreground">
                Reset sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Miembros ({state.members.length})</CardTitle>
              <Button onClick={addMember} size="sm" className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30">
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {state.members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Agrega miembros para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.members.map((member) => {
                  const totalContrib = state.members.reduce((s, m) => s + m.contribution, 0)
                  const contribPct = totalContrib > 0 ? (member.contribution / totalContrib) * 100 : 0
                  return (
                    <div key={member.id} className="rounded-lg bg-secondary/30 border border-border/50 p-3 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Input
                          placeholder="Nombre del jugador"
                          value={member.name}
                          onChange={(e) => updateMember(member.id, { name: e.target.value })}
                          className="bg-secondary border-border text-xs h-8"
                        />
                        <select
                          value={member.role}
                          onChange={(e) => updateMember(member.id, { role: e.target.value })}
                          className="h-8 rounded-md bg-secondary border border-border text-foreground text-xs px-2"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <Input
                          placeholder="Nota"
                          value={member.note}
                          onChange={(e) => updateMember(member.id, { note: e.target.value })}
                          className="bg-secondary border-border text-xs h-8 col-span-1"
                        />
                        <button onClick={() => removeMember(member.id)} className="h-8 px-2 text-muted-foreground hover:text-red-400 flex items-center justify-end gap-1 text-xs">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Contribución total</p>
                          <p className="font-bold text-indigo-400">{formatSilver(member.contribution)}</p>
                          <Progress value={contribPct} className="h-1 mt-1" />
                          <p className="text-muted-foreground mt-0.5">{contribPct.toFixed(1)}% del total</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ganancias sesión</p>
                          <p className="font-bold text-green-400">{formatSilver(member.sessionEarnings)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Balance neto</p>
                          <p className={`font-bold ${(member.sessionEarnings - member.contribution) >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatSilver(member.sessionEarnings - member.contribution)}
                          </p>
                        </div>
                      </div>

                      {/* Add contribution */}
                      <div className="flex gap-2 pt-1 border-t border-border/50">
                        <Input
                          type="number"
                          placeholder="Cantidad (silver)"
                          value={newContribAmount[member.id] || ""}
                          onChange={(e) => setNewContribAmount((p) => ({ ...p, [member.id]: Number(e.target.value) }))}
                          className="bg-secondary border-border text-xs h-7 flex-1"
                        />
                        <Input
                          placeholder="Descripción"
                          value={newContribDesc[member.id] || ""}
                          onChange={(e) => setNewContribDesc((p) => ({ ...p, [member.id]: e.target.value }))}
                          className="bg-secondary border-border text-xs h-7 flex-1"
                        />
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30"
                          onClick={() => addContribution(member.id)}
                        >
                          + Contribución
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log */}
        {state.log.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Historial de contribuciones</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {state.log.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-border/50 text-xs">
                    <span className="text-muted-foreground">{entry.date}</span>
                    <span className="text-foreground font-medium">{entry.memberName}</span>
                    <span className="text-muted-foreground">{entry.description}</span>
                    <span className="text-indigo-400 font-bold">+{formatSilver(entry.amount)}</span>
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
