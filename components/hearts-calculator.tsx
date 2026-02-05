"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Heart,
  DollarSign,
  Target,
  Clock,
  History,
  Trash2,
  Plus,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  BarChart3,
  Trophy,
  RotateCcw,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

interface CityData {
  id: string
  name: string
  price: number
  priceHistory: { price: number; timestamp: string }[]
}

interface HistoryEntry {
  id: string
  date: string
  city: string
  price: number
  heartsNeeded: number
}

interface TripLogEntry {
  id: string
  date: string
  city: string
  heartsEarned: number
  investment: number
  profit: number
}

interface DashboardState {
  targetAmount: number
  currentHearts: number
  pricePerUnit: number
  heartsPerTrip: number
  activeCityId: string
  investmentPerTrip: number
  tripsCompleted: number
  cities: CityData[]
  history: HistoryEntry[]
  tripLog: TripLogEntry[]
}

const defaultCities: CityData[] = [
  { id: "fort-sterling", name: "Fort Sterling", price: 95000, priceHistory: [] },
  { id: "thetford", name: "Thetford", price: 92000, priceHistory: [] },
  { id: "martlock", name: "Martlock", price: 98000, priceHistory: [] },
  { id: "caerleon", name: "Caerleon", price: 105000, priceHistory: [] },
  { id: "bridgewatch", name: "Bridgewatch", price: 97000, priceHistory: [] },
  { id: "lymhurst", name: "Lymhurst", price: 94000, priceHistory: [] },
]

const DEFAULT_INVESTMENT_PER_TRIP = 86700

const DEFAULT_PRICE_PER_UNIT = 100000
const DEFAULT_HEARTS_PER_TRIP = 1

const defaultState: DashboardState = {
  targetAmount: 15000000,
  currentHearts: 0,
  pricePerUnit: DEFAULT_PRICE_PER_UNIT,
  heartsPerTrip: DEFAULT_HEARTS_PER_TRIP,
  activeCityId: "caerleon",
  investmentPerTrip: DEFAULT_INVESTMENT_PER_TRIP,
  tripsCompleted: 0,
  cities: defaultCities,
  history: [],
  tripLog: [],
}

const STORAGE_KEY = "albion-hearts-dashboard"

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toLocaleString("es-CO")
}

const formatFullCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-CO").format(value)
}

export function HeartsCalculator() {
  const [state, setState] = useState<DashboardState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [animatingCity, setAnimatingCity] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [tripButtonAnimating, setTripButtonAnimating] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState({ ...defaultState, ...parsed })
      }
    } catch (error) {
      console.error("Error al cargar estado:", error)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error("Error al guardar estado:", error)
      }
    }
  }, [state, isLoaded])

  const activeCity = useMemo(
    () => state.cities.find((c) => c.id === state.activeCityId) || state.cities[0],
    [state.cities, state.activeCityId]
  )

  const bestCity = useMemo(
    () => state.cities.reduce((max, city) => (city.price > max.price ? city : max), state.cities[0]),
    [state.cities]
  )

  // Cálculos basados en el precio por unidad (precio promedio del juego)
  const heartsNeeded = useMemo(
    () => (state.pricePerUnit > 0 ? Math.ceil(state.targetAmount / state.pricePerUnit) : 0),
    [state.targetAmount, state.pricePerUnit]
  )

  const heartsRemaining = Math.max(0, heartsNeeded - state.currentHearts)
  const progressPercentage = heartsNeeded > 0 ? Math.min(100, (state.currentHearts / heartsNeeded) * 100) : 0
  const currentValue = state.currentHearts * state.pricePerUnit
  const tripsRemaining = state.heartsPerTrip > 0 ? Math.ceil(heartsRemaining / state.heartsPerTrip) : 0

  // Cálculos de inversión basados en precio por unidad
  const profitPerTripBase = (state.pricePerUnit * state.heartsPerTrip) - state.investmentPerTrip
  const totalInvestmentMade = state.tripsCompleted * state.investmentPerTrip
  const totalCapitalRequired = tripsRemaining * state.investmentPerTrip
  const silverValueRemaining = heartsRemaining * state.pricePerUnit

  // Ganancia estimada si vendes en el mercado seleccionado
  const marketProfitPerTrip = (activeCity.price * state.heartsPerTrip) - state.investmentPerTrip
  const marketProfitDifference = marketProfitPerTrip - profitPerTripBase

  const chartData = useMemo(
    () =>
      state.cities.map((city) => ({
        name: city.name.split(" ")[0],
        fullName: city.name,
        price: city.price,
        isBest: city.id === bestCity.id,
        isActive: city.id === state.activeCityId,
      })),
    [state.cities, bestCity.id, state.activeCityId]
  )

  const chartConfig = {
    price: {
      label: "Precio",
      color: "hsl(var(--chart-3))",
    },
  }

  const updateCityPrice = (cityId: string, newPrice: number) => {
    setState((prev) => ({
      ...prev,
      cities: prev.cities.map((city) => {
        if (city.id === cityId) {
          const newHistory = [
            { price: city.price, timestamp: new Date().toISOString() },
            ...city.priceHistory,
          ].slice(0, 20)
          return { ...city, price: newPrice, priceHistory: newHistory }
        }
        return city
      }),
    }))
    setAnimatingCity(cityId)
    setTimeout(() => setAnimatingCity(null), 500)
  }

  const setActiveCity = (cityId: string) => {
    setState((prev) => ({ ...prev, activeCityId: cityId }))
  }

  const updateField = (field: keyof DashboardState, value: number) => {
    setState((prev) => ({ ...prev, [field]: value }))
  }

  const addHistoryEntry = () => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      city: activeCity.name,
      price: activeCity.price,
      heartsNeeded,
    }
    setState((prev) => ({
      ...prev,
      history: [entry, ...prev.history].slice(0, 15),
    }))
  }

  const removeHistoryEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((entry) => entry.id !== id),
    }))
  }

  const completeTrip = useCallback(() => {
    setTripButtonAnimating(true)
    setShowConfetti(true)
    
    const tripEntry: TripLogEntry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      city: activeCity.name,
      heartsEarned: state.heartsPerTrip,
      investment: state.investmentPerTrip,
      profit: marketProfitPerTrip,
    }

    setState((prev) => ({
      ...prev,
      currentHearts: prev.currentHearts + prev.heartsPerTrip,
      tripsCompleted: prev.tripsCompleted + 1,
      tripLog: [tripEntry, ...prev.tripLog].slice(0, 50),
    }))

    setTimeout(() => {
      setTripButtonAnimating(false)
    }, 600)

    setTimeout(() => {
      setShowConfetti(false)
    }, 3000)
  }, [activeCity.name, state.investmentPerTrip, state.heartsPerTrip, marketProfitPerTrip])

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentHearts: 0,
      tripsCompleted: 0,
      tripLog: [],
    }))
  }, [])

  const getPriceChange = (city: CityData) => {
    if (city.priceHistory.length === 0) return null
    const lastPrice = city.priceHistory[0].price
    const change = city.price - lastPrice
    if (change === 0) return null
    return {
      direction: change > 0 ? "up" : "down",
      amount: Math.abs(change),
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Heart className="h-12 w-12 text-primary animate-pulse" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)],
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Decoracion de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-ring/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Heart className="h-10 w-10 text-primary fill-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-balance">
                Panel de Comercio de Corazones
              </h1>
            </div>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              Rastrea precios de corazones en las ciudades reales y calcula tu camino hacia las ganancias
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border backdrop-blur-sm">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-foreground font-medium text-sm">
                  Meta: {formatFullCurrency(state.targetAmount)}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium text-sm">
                  Mejor: {bestCity.name} ({formatCurrency(bestCity.price)})
                </span>
              </div>
            </div>
          </header>

          {/* Mobile Tabs */}
          <div className="lg:hidden">
            <Tabs defaultValue="calculator" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 backdrop-blur-sm h-11">
                <TabsTrigger value="calculator" className="text-sm">Calculadora</TabsTrigger>
                <TabsTrigger value="cities" className="text-sm">Ciudades</TabsTrigger>
                <TabsTrigger value="chart" className="text-sm">Graficos</TabsTrigger>
              </TabsList>

              <TabsContent value="calculator" className="mt-4 space-y-4">
                <CalculatorCard
                  state={state}
                  activeCity={activeCity}
                  heartsNeeded={heartsNeeded}
                  heartsRemaining={heartsRemaining}
                  progressPercentage={progressPercentage}
                  currentValue={currentValue}
                  tripsRemaining={tripsRemaining}
                  profitPerTripBase={profitPerTripBase}
                  marketProfitPerTrip={marketProfitPerTrip}
                  marketProfitDifference={marketProfitDifference}
                  totalInvestmentMade={totalInvestmentMade}
                  totalCapitalRequired={totalCapitalRequired}
                  silverValueRemaining={silverValueRemaining}
                  tripButtonAnimating={tripButtonAnimating}
                  updateField={updateField}
                  completeTrip={completeTrip}
                  resetProgress={resetProgress}
                />
              </TabsContent>

              <TabsContent value="cities" className="mt-4">
                <CityPricesCard
                  cities={state.cities}
                  activeCityId={state.activeCityId}
                  bestCityId={bestCity.id}
                  animatingCity={animatingCity}
                  updateCityPrice={updateCityPrice}
                  setActiveCity={setActiveCity}
                  getPriceChange={getPriceChange}
                />
              </TabsContent>

              <TabsContent value="chart" className="mt-4 space-y-4">
                <ChartCard chartData={chartData} chartConfig={chartConfig} />
                <HistoryCard
                  history={state.history}
                  addHistoryEntry={addHistoryEntry}
                  removeHistoryEntry={removeHistoryEntry}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop Grid - 3 Columns */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
            {/* Column 1: Capital */}
            <CapitalCard
              state={state}
              activeCity={activeCity}
              tripsRemaining={tripsRemaining}
              profitPerTripBase={profitPerTripBase}
              marketProfitPerTrip={marketProfitPerTrip}
              marketProfitDifference={marketProfitDifference}
              totalInvestmentMade={totalInvestmentMade}
              totalCapitalRequired={totalCapitalRequired}
            />

            {/* Column 2: Calculator */}
            <CalculatorCard
              state={state}
              activeCity={activeCity}
              heartsNeeded={heartsNeeded}
              heartsRemaining={heartsRemaining}
              progressPercentage={progressPercentage}
              currentValue={currentValue}
              tripsRemaining={tripsRemaining}
              profitPerTripBase={profitPerTripBase}
              marketProfitPerTrip={marketProfitPerTrip}
              marketProfitDifference={marketProfitDifference}
              totalInvestmentMade={totalInvestmentMade}
              totalCapitalRequired={totalCapitalRequired}
              silverValueRemaining={silverValueRemaining}
              tripButtonAnimating={tripButtonAnimating}
              updateField={updateField}
              completeTrip={completeTrip}
              resetProgress={resetProgress}
            />

            {/* Column 3: Cities + Charts */}
            <div className="space-y-6">
              <CityPricesCard
                cities={state.cities}
                activeCityId={state.activeCityId}
                bestCityId={bestCity.id}
                animatingCity={animatingCity}
                updateCityPrice={updateCityPrice}
                setActiveCity={setActiveCity}
                getPriceChange={getPriceChange}
              />
              <ChartCard chartData={chartData} chartConfig={chartConfig} />
              <HistoryCard
                history={state.history}
                addHistoryEntry={addHistoryEntry}
                removeHistoryEntry={removeHistoryEntry}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-muted-foreground space-y-2">
            <p>Los precios se basan en tus entradas. Mantenlos actualizados para calculos precisos.</p>
            <div className="pt-4 border-t border-border/30">
              <p className="text-xs">
                Hecho con <span className="text-primary">❤</span> por <span className="font-medium">Poguito</span>
              </p>
              <p className="text-xs mt-1">
                © {new Date().getFullYear() > 2025 ? `2025 - ${new Date().getFullYear()}` : "2025"} Todos los derechos reservados
              </p>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  )
}

function CalculatorCard({
  state,
  activeCity,
  heartsNeeded,
  heartsRemaining,
  progressPercentage,
  currentValue,
  tripsRemaining,
  profitPerTripBase,
  marketProfitPerTrip,
  marketProfitDifference,
  totalInvestmentMade,
  totalCapitalRequired,
  silverValueRemaining,
  tripButtonAnimating,
  updateField,
  completeTrip,
  resetProgress,
}: {
  state: DashboardState
  activeCity: CityData
  heartsNeeded: number
  heartsRemaining: number
  progressPercentage: number
  currentValue: number
  tripsRemaining: number
  profitPerTripBase: number
  marketProfitPerTrip: number
  marketProfitDifference: number
  totalInvestmentMade: number
  totalCapitalRequired: number
  silverValueRemaining: number
  tripButtonAnimating: boolean
  updateField: (field: keyof DashboardState, value: number) => void
  completeTrip: () => void
  resetProgress: () => void
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-card/60 backdrop-blur-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Heart className="h-5 w-5 text-primary" />
            Calculadora de Ganancias
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Mercado seleccionado: <span className="text-ring font-medium">{activeCity.name}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="targetAmount" className="flex items-center gap-2 text-foreground text-sm">
              <DollarSign className="h-4 w-4 text-accent" />
              Meta Objetivo (SILVER)
            </Label>
            <Input
              id="targetAmount"
              type="number"
              value={state.targetAmount || ""}
              onChange={(e) => updateField("targetAmount", Number(e.target.value))}
              placeholder="15.000.000"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerUnit" className="flex items-center gap-2 text-foreground text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              Precio por Unidad en Silver (Precio Promedio)
            </Label>
            <Input
              id="pricePerUnit"
              type="number"
              value={state.pricePerUnit || ""}
              onChange={(e) => updateField("pricePerUnit", Number(e.target.value))}
              placeholder="100000"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentHearts" className="flex items-center gap-2 text-foreground text-sm">
              <Heart className="h-4 w-4 text-primary" />
              Corazones Actuales
            </Label>
            <Input
              id="currentHearts"
              type="number"
              value={state.currentHearts || ""}
              onChange={(e) => updateField("currentHearts", Number(e.target.value))}
              placeholder="0"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heartsPerTrip" className="flex items-center gap-2 text-foreground text-sm">
              <Heart className="h-4 w-4 text-accent" />
              Corazones por Viaje
            </Label>
            <Input
              id="heartsPerTrip"
              type="number"
              value={state.heartsPerTrip || ""}
              onChange={(e) => updateField("heartsPerTrip", Number(e.target.value))}
              placeholder="1"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investmentPerTrip" className="flex items-center gap-2 text-foreground text-sm">
              <Wallet className="h-4 w-4 text-yellow-500" />
              Inversión por Viaje (SILVER)
            </Label>
            <Input
              id="investmentPerTrip"
              type="number"
              value={state.investmentPerTrip || ""}
              onChange={(e) => updateField("investmentPerTrip", Number(e.target.value))}
              placeholder="86700"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
            />
          </div>

          {/* Complete Trip Button */}
          <div className="pt-2">
            <Button
              onClick={completeTrip}
              disabled={progressPercentage >= 100}
              className={`w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-300 ${
                tripButtonAnimating ? "scale-105 ring-4 ring-green-400/50" : ""
              } ${progressPercentage >= 100 ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"}`}
            >
              <Trophy className={`h-6 w-6 mr-2 ${tripButtonAnimating ? "animate-bounce" : ""}`} />
              ¡Viaje Completado!
              <span className="ml-2 text-sm font-normal opacity-90">
                (+{state.heartsPerTrip} ❤️)
              </span>
            </Button>
          </div>

          {/* Resultados */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Corazones Necesarios</p>
                <div className="flex items-center justify-center gap-1">
                  <Heart className="h-5 w-5 text-primary fill-primary" />
                  <span className="text-2xl font-bold text-foreground">{formatNumber(heartsNeeded)}</span>
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">Viajes Restantes</p>
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{formatNumber(tripsRemaining)}</span>
                </div>
              </div>
            </div>

            {heartsRemaining > 0 && (
              <p className="text-center text-muted-foreground text-sm">
                <span className="text-primary font-semibold">{formatNumber(heartsRemaining)}</span> corazones restantes
              </p>
            )}

            {/* Progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progreso</span>
                <span className="text-foreground font-medium">{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(currentValue)}</span>
                <span>{formatCurrency(state.targetAmount)}</span>
              </div>
            </div>

            {/* Estadisticas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">Silver Restante</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(silverValueRemaining)}</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-xs text-muted-foreground">Valor Actual</p>
                <p className="text-xl font-bold text-accent">{formatCurrency(currentValue)}</p>
              </div>
            </div>

            {/* Reset Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar Progreso
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    ¿Reiniciar todo el progreso?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará todos tus corazones actuales, viajes completados y comenzará 
                    una nueva meta de {formatCurrency(state.targetAmount)}. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-secondary border-border text-foreground hover:bg-secondary/80">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={resetProgress}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sí, Reiniciar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CapitalCard({
  state,
  activeCity,
  tripsRemaining,
  profitPerTripBase,
  marketProfitPerTrip,
  marketProfitDifference,
  totalInvestmentMade,
  totalCapitalRequired,
}: {
  state: DashboardState
  activeCity: CityData
  tripsRemaining: number
  profitPerTripBase: number
  marketProfitPerTrip: number
  marketProfitDifference: number
  totalInvestmentMade: number
  totalCapitalRequired: number
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <TrendingUp className="h-5 w-5 text-yellow-500" />
          Gestión de Capital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-xs text-muted-foreground">Inversión Total Realizada</p>
            <p className="text-lg font-bold text-yellow-500">{formatCurrency(totalInvestmentMade)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {state.tripsCompleted} viaje{state.tripsCompleted !== 1 ? "s" : ""} completado{state.tripsCompleted !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-muted-foreground">Capital para Próximo Viaje</p>
            <p className="text-lg font-bold text-blue-500">{formatCurrency(state.investmentPerTrip)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ten listo este monto</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <p className="text-xs text-muted-foreground">Capital Total Requerido (Viajes Restantes)</p>
          <p className="text-lg font-bold text-purple-500">{formatCurrency(totalCapitalRequired)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Para completar los {formatNumber(tripsRemaining)} viajes restantes
          </p>
        </div>

        {/* Ganancia estimada en el mercado seleccionado */}
        <div className="p-3 rounded-lg bg-ring/10 border border-ring/30">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-ring" />
            <p className="text-sm font-medium text-foreground">Ganancia en {activeCity.name}</p>
          </div>
          <p className="text-2xl font-bold text-ring">
            {marketProfitPerTrip >= 0 ? "+" : ""}{formatCurrency(marketProfitPerTrip)}
            <span className="text-sm font-normal text-muted-foreground ml-2">por viaje</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Vendiendo {state.heartsPerTrip} corazón{state.heartsPerTrip !== 1 ? "es" : ""} a {formatCurrency(activeCity.price)} c/u
          </p>
          {marketProfitDifference !== 0 && (
            <p className={`text-xs mt-2 ${marketProfitDifference > 0 ? "text-accent" : "text-destructive"}`}>
              {marketProfitDifference > 0 ? "+" : ""}{formatCurrency(marketProfitDifference)} vs precio promedio
            </p>
          )}
        </div>

        {/* Ganancia base con precio promedio */}
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-xs text-muted-foreground">Ganancia Base (Precio Promedio)</p>
          <p className="text-lg font-bold text-green-500">
            {profitPerTripBase >= 0 ? "+" : ""}{formatCurrency(profitPerTripBase)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ({state.heartsPerTrip} × {formatCurrency(state.pricePerUnit)}) - {formatCurrency(state.investmentPerTrip)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CityPricesCard({
  cities,
  activeCityId,
  bestCityId,
  animatingCity,
  updateCityPrice,
  setActiveCity,
  getPriceChange,
}: {
  cities: CityData[]
  activeCityId: string
  bestCityId: string
  animatingCity: string | null
  updateCityPrice: (cityId: string, price: number) => void
  setActiveCity: (cityId: string) => void
  getPriceChange: (city: CityData) => { direction: string; amount: number } | null
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-ring" />
          Mercados Regionales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cities.map((city) => {
          const priceChange = getPriceChange(city)
          const isBest = city.id === bestCityId
          const isActive = city.id === activeCityId
          const isAnimating = animatingCity === city.id

          return (
            <div
              key={city.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isBest
                  ? "bg-primary/10 border-primary/40"
                  : isActive
                    ? "bg-ring/10 border-ring/30"
                    : "bg-secondary/30 border-border hover:bg-secondary/50"
              } ${isAnimating ? "scale-[1.02]" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">{city.name}</span>
                  {isBest && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Mejor
                    </span>
                  )}
                  {isActive && !isBest && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-ring/20 text-ring rounded-full">
                      Activa
                    </span>
                  )}
                </div>
                {priceChange && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      priceChange.direction === "up" ? "text-accent" : "text-destructive"
                    }`}
                  >
                    {priceChange.direction === "up" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {formatCurrency(priceChange.amount)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={city.price || ""}
                  onChange={(e) => updateCityPrice(city.id, Number(e.target.value))}
                  className="bg-input border-border text-foreground h-9 text-sm flex-1"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      onClick={() => setActiveCity(city.id)}
                      className={`h-9 w-9 p-0 ${
                        isActive
                          ? "bg-ring text-foreground hover:bg-ring/90"
                          : "bg-transparent border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Establecer como ciudad activa</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  chartData,
  chartConfig,
}: {
  chartData: { name: string; fullName: string; price: number; isBest: boolean; isActive: boolean }[]
  chartConfig: { price: { label: string; color: string } }
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <BarChart3 className="h-5 w-5 text-ring" />
          Comparacion de Precios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border border-border bg-card p-2.5 shadow-lg">
                      <div className="font-medium text-foreground">{data.fullName}</div>
                      <div className="text-sm text-muted-foreground">{formatFullCurrency(data.price)}</div>
                      {data.isBest && <div className="text-xs text-primary mt-1">Mejor Precio</div>}
                    </div>
                  )
                }}
              />
              <defs>
                <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="barGradientBest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isBest ? "url(#barGradientBest)" : "url(#barGradientBlue)"}
                    opacity={entry.isActive ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function HistoryCard({
  history,
  addHistoryEntry,
  removeHistoryEntry,
}: {
  history: HistoryEntry[]
  addHistoryEntry: () => void
  removeHistoryEntry: (id: string) => void
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <History className="h-5 w-5 text-muted-foreground" />
            Registro de Precios
          </CardTitle>
          <Button
            onClick={addHistoryEntry}
            size="sm"
            className="bg-ring hover:bg-ring/90 text-foreground h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Registrar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-6">
            <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Sin registros aun</p>
            <p className="text-xs text-muted-foreground">Registra precios para seguir tendencias</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/50 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium truncate">{entry.city}</span>
                    <span className="text-primary text-xs">{formatCurrency(entry.price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHistoryEntry(entry.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
