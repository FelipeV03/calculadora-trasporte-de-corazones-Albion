"use client"

import { useState, useEffect } from "react"
import {
  Heart,
  Hammer,
  ShoppingBag,
  Receipt,
  Crown,
  Sprout,
  Zap,
  Route,
  Sword,
  Shield,
  CheckSquare,
  Menu,
  X,
  ChevronRight,
  Globe,
  Search,
  Package,
} from "lucide-react"
import { HeartsCalculator } from "@/components/hearts-calculator"
import { RefiningCalculator } from "@/components/refining-calculator"
import { CraftingCalculator } from "@/components/crafting-calculator"
import { MarketTaxCalculator } from "@/components/market-tax-calculator"
import { PremiumCalculator } from "@/components/premium-calculator"
import { FarmingCalculator } from "@/components/farming-calculator"
import { FocusCalculator } from "@/components/focus-calculator"
import { TransportPlanner } from "@/components/transport-planner"
import { DungeonCalculator } from "@/components/dungeon-calculator"
import { GuildTracker } from "@/components/guild-tracker"
import { DailyChecklist } from "@/components/daily-checklist"
import { ItemPriceLookup } from "@/components/item-search"
import { RecipeBrowser } from "@/components/recipe-browser"
import { getServer, setServer, AlbionServer, SERVER_LABELS } from "@/lib/albion-api"

type Tool = {
  id: string
  label: string
  icon: React.ReactNode
  component: React.ReactNode
  badge?: string
  color: string
}

const tools: Tool[] = [
  { id: "hearts",     label: "Corazones",    icon: <Heart className="w-4 h-4" />,       component: <HeartsCalculator />,      badge: "Popular", color: "text-primary" },
  { id: "prices",     label: "Consultar precios", icon: <Search className="w-4 h-4" />,  component: null,                      badge: "Live",    color: "text-yellow-400" },
  { id: "objects",    label: "Objetos",      icon: <Package className="w-4 h-4" />,      component: <RecipeBrowser />,         badge: "Nuevo",   color: "text-orange-400" },
  { id: "refining",   label: "Refinamiento", icon: <Hammer className="w-4 h-4" />,       component: <RefiningCalculator />,    color: "text-orange-400" },
  { id: "crafting",   label: "Crafteo",      icon: <ShoppingBag className="w-4 h-4" />, component: <CraftingCalculator />,    color: "text-blue-400" },
  { id: "market-tax", label: "Impuestos",    icon: <Receipt className="w-4 h-4" />,      component: <MarketTaxCalculator />,   color: "text-yellow-400" },
  { id: "premium",    label: "Premium",      icon: <Crown className="w-4 h-4" />,        component: <PremiumCalculator />,     color: "text-yellow-400" },
  { id: "farming",    label: "Farming",      icon: <Sprout className="w-4 h-4" />,       component: <FarmingCalculator />,     color: "text-green-400" },
  { id: "focus",      label: "Focus Points", icon: <Zap className="w-4 h-4" />,          component: <FocusCalculator />,       color: "text-purple-400" },
  { id: "transport",  label: "Rutas",        icon: <Route className="w-4 h-4" />,        component: <TransportPlanner />,      color: "text-cyan-400" },
  { id: "dungeons",   label: "Dungeons",     icon: <Sword className="w-4 h-4" />,        component: <DungeonCalculator />,     color: "text-red-400" },
  { id: "guild",      label: "Gremio",       icon: <Shield className="w-4 h-4" />,       component: <GuildTracker />,          color: "text-indigo-400" },
  { id: "checklist",  label: "Checklist",    icon: <CheckSquare className="w-4 h-4" />, component: <DailyChecklist />,        color: "text-teal-400" },
]

export function AlbionHub() {
  const [activeTool, setActiveTool] = useState("hearts")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [server, setServerState] = useState<AlbionServer>("west")
  const [serverMenuOpen, setServerMenuOpen] = useState(false)

  // Load server preference
  useEffect(() => {
    setServerState(getServer())
    const handler = (e: Event) => setServerState((e as CustomEvent<AlbionServer>).detail)
    window.addEventListener("albion-server-change", handler)
    return () => window.removeEventListener("albion-server-change", handler)
  }, [])

  const handleServerChange = (s: AlbionServer) => {
    setServer(s)
    setServerState(s)
    setServerMenuOpen(false)
  }

  const activeToolData = tools.find(t => t.id === activeTool) || tools[0]

  // Special component for price lookup
  const renderContent = () => {
    if (activeTool === "prices") {
      return (
        <div className="min-h-screen bg-background p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Consultar precios en vivo</h1>
                <p className="text-sm text-muted-foreground">
                  Precios reales via Albion Online Data Project · <span className="text-yellow-400">{SERVER_LABELS[server]}</span>
                </p>
              </div>
            </div>
            <ItemPriceLookup server={server} />
          </div>
        </div>
      )
    }
    return activeToolData.component
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
          <span className="font-bold text-primary text-sm">Albion Tools</span>
        </div>
        <span className="text-xs text-muted-foreground">{activeToolData.label}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay mobile */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-52 bg-card border-r border-border
          flex flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}>
          {/* Logo */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm leading-none">Albion Tools</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">v2.0 · by Comunidad</p>
              </div>
            </div>

            {/* Server selector */}
            <div className="mt-3 relative">
              <button
                onClick={() => setServerMenuOpen(!serverMenuOpen)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-xs"
              >
                <Globe className="w-3 h-3 text-muted-foreground" />
                <span className="text-foreground font-medium flex-1 text-left">{SERVER_LABELS[server]}</span>
                <span className="text-muted-foreground">▾</span>
              </button>
              {serverMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                  {(["west", "east", "europe"] as AlbionServer[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleServerChange(s)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors ${server === s ? "text-primary bg-primary/10" : "text-foreground"}`}
                    >
                      {SERVER_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {tools.map(tool => {
              const isActive = tool.id === activeTool
              return (
                <button
                  key={tool.id}
                  onClick={() => { setActiveTool(tool.id); setSidebarOpen(false) }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150 text-left group
                    ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}
                  `}
                >
                  <span className={isActive ? tool.color : "text-muted-foreground group-hover:text-foreground"}>
                    {tool.icon}
                  </span>
                  <span className="flex-1 truncate">{tool.label}</span>
                  {tool.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      tool.badge === "Live"
                        ? "bg-green-500/20 text-green-400"
                        : tool.badge === "Nuevo"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-primary/20 text-primary"
                    }`}>
                      {tool.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className={`w-3 h-3 ${tool.color}`} />}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Datos: Albion Online Data Project
            </p>
            <p className="text-[10px] text-muted-foreground text-center">
              Iconos: render.albiononline.com
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
