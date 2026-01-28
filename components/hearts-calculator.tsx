"use client"

import { useState, useEffect, useMemo } from "react"
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
  placeholder?: string
}

interface HistoryEntry {
  id: string
  date: string
  city: string
  price: number
  heartsNeeded: number
}

interface DashboardState {
  targetAmount: number
  currentHearts: number
  profitPerTrip: number
  marketPrice: number
  activeCityId: string
  cities: CityData[]
  history: HistoryEntry[]
}

const defaultCities: CityData[] = [
  { id: "fort-sterling", name: "Fort Sterling", price: 0, priceHistory: [], placeholder: "35000" },
  { id: "thetford", name: "Thetford", price: 0, priceHistory: [], placeholder: "46000" },
  { id: "martlock", name: "Martlock", price: 0, priceHistory: [], placeholder: "44000" },
  { id: "caerleon", name: "Caerleon", price: 0, priceHistory: [], placeholder: "49000" },
  { id: "bridgewatch", name: "Bridgewatch", price: 0, priceHistory: [], placeholder: "44000" },
  { id: "lymhurst", name: "Lymhurst", price: 0, priceHistory: [], placeholder: "43000" },
]

const defaultState: DashboardState = {
  targetAmount: 0,
  currentHearts: 0,
  profitPerTrip: 0,
  marketPrice: 0,
  activeCityId: "caerleon",
  cities: defaultCities,
  history: [],
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

  const marketPrice = state.marketPrice > 0 ? state.marketPrice : activeCity.price
  
  const currentValue = state.currentHearts * marketPrice
  const silverRemaining = Math.max(0, state.targetAmount - currentValue)
  const heartsNeeded = useMemo(
    () => (marketPrice > 0 ? Math.ceil(silverRemaining / marketPrice) : 0),
    [silverRemaining, marketPrice]
  )

  const heartsRemaining = heartsNeeded
  const progressPercentage = state.targetAmount > 0 ? Math.min(100, (currentValue / state.targetAmount) * 100) : 0
  const tripsNeeded = state.profitPerTrip > 0 ? Math.ceil(heartsNeeded / state.profitPerTrip) : 0

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
                  tripsNeeded={tripsNeeded}
                  updateField={updateField}
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

          {/* Desktop Grid */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            <CalculatorCard
              state={state}
              activeCity={activeCity}
              heartsNeeded={heartsNeeded}
              heartsRemaining={heartsRemaining}
              progressPercentage={progressPercentage}
              currentValue={currentValue}
              tripsNeeded={tripsNeeded}
              updateField={updateField}
            />

            <CityPricesCard
              cities={state.cities}
              activeCityId={state.activeCityId}
              bestCityId={bestCity.id}
              animatingCity={animatingCity}
              updateCityPrice={updateCityPrice}
              setActiveCity={setActiveCity}
              getPriceChange={getPriceChange}
            />

            <div className="space-y-6">
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
  tripsNeeded,
  updateField,
}: {
  state: DashboardState
  activeCity: CityData
  heartsNeeded: number
  heartsRemaining: number
  progressPercentage: number
  currentValue: number
  tripsNeeded: number
  updateField: (field: keyof DashboardState, value: number) => void
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Heart className="h-5 w-5 text-primary" />
          Calculadora de Ganancias
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Ciudad activa: <span className="text-ring font-medium">{activeCity.name}</span>
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
          <Label htmlFor="profitPerTrip" className="flex items-center gap-2 text-foreground text-sm">
            <Heart className="h-4 w-4 text-accent" />
            Corazones de Ganancia por Viaje
          </Label>
          <Input
            id="profitPerTrip"
            type="number"
            value={state.profitPerTrip || ""}
            onChange={(e) => updateField("profitPerTrip", Number(e.target.value))}
            placeholder="7"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketPrice" className="flex items-center gap-2 text-foreground text-sm">
            <DollarSign className="h-4 w-4 text-ring" />
            Precio por Unidad (SILVER)
          </Label>
          <Input
            id="marketPrice"
            type="number"
            value={state.marketPrice || ""}
            onChange={(e) => updateField("marketPrice", Number(e.target.value))}
            placeholder="105000"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
          />
        </div>

        {/* Resultados */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Corazones Necesarios</p>
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-7 w-7 text-primary fill-primary" />
              <span className="text-4xl font-bold text-foreground">{formatNumber(heartsNeeded)}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Total corazones para vender
            </p>
          </div>

          {tripsNeeded > 0 && (
            <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/30">
              <p className="text-sm text-muted-foreground mb-1">Viajes Restantes</p>
              <div className="flex items-center justify-center gap-2">
                <Target className="h-6 w-6 text-accent" />
                <span className="text-3xl font-bold text-accent">{formatNumber(tripsNeeded)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                El número más importante
              </p>
            </div>
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
                  value={city.price === 0 ? "" : city.price}
                  onChange={(e) => updateCityPrice(city.id, Number(e.target.value) || 0)}
                  placeholder={city.placeholder}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 text-sm flex-1"
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
