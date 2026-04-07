// Albion Online Crafting Recipes Database
// Based on official game data and community resources (albiononline2d.com, ao-bin-dumps)
//
// Tier scaling (primary + secondary refined materials):
//   T2:  8  +  4
//   T3: 12  +  6
//   T4: 16  +  8
//   T5: 24  + 12
//   T6: 36  + 18
//   T7: 52  + 28
//   T8: 80  + 40

export interface RecipeMaterial {
  itemId: string   // Albion item ID (e.g. "T4_METALBAR")
  qty: number
  label: string    // Human-readable name
}

export interface CraftingRecipe {
  outputId: string      // item being crafted
  outputName: string
  materials: RecipeMaterial[]
  craftingFocus: number // focus cost per item
  station: string       // crafting station
  category: string
  subcategory: string
}

// ─── Tier scaling tables ──────────────────────────────────────────────────────
const PRIMARY: Record<number, number>   = { 2: 8,  3: 12, 4: 16, 5: 24, 6: 36, 7: 52, 8: 80 }
const SECONDARY: Record<number, number> = { 2: 4,  3: 6,  4: 8,  5: 12, 6: 18, 7: 28, 8: 40 }
const FOCUS_COST: Record<number, number> = { 2: 12, 3: 24, 4: 36, 5: 72, 6: 144, 7: 288, 8: 576 }

// ─── Material label helpers ───────────────────────────────────────────────────
const REFINED_LABELS: Record<string, string> = {
  METALBAR:   "Barra metálica",
  PLANKS:     "Tablones",
  LEATHER:    "Cuero",
  CLOTH:      "Tela",
  STONEBLOCK: "Bloque de piedra",
}

function mat(tier: number, type: string, qty: number): RecipeMaterial {
  return {
    itemId: `T${tier}_${type}`,
    qty,
    label: `${REFINED_LABELS[type] ?? type} T${tier}`,
  }
}

// ─── Weapon recipe templates ──────────────────────────────────────────────────
// Format: [primaryMaterial, secondaryMaterial]
const WEAPON_TEMPLATES: Record<string, [string, string, string, string, string]> = {
  // [id_suffix, name, primary, secondary, subcategory]
  MAIN_SWORD:         ["MAIN_SWORD",         "Espada",                 "METALBAR",   "PLANKS",     "espadas"],
  "2H_CLAYMORE":      ["2H_CLAYMORE",        "Claymore",               "METALBAR",   "PLANKS",     "espadas"],
  "2H_DUALSWORD":     ["2H_DUALSWORD",       "Sables duales",          "METALBAR",   "LEATHER",    "espadas"],
  MAIN_BOW:           ["MAIN_BOW",           "Arco corto",             "PLANKS",     "LEATHER",    "arcos"],
  "2H_BOW":           ["2H_BOW",             "Arco largo",             "PLANKS",     "LEATHER",    "arcos"],
  "2H_CROSSBOW":      ["2H_CROSSBOW",        "Ballesta",               "PLANKS",     "METALBAR",   "arcos"],
  MAIN_DAGGER:        ["MAIN_DAGGER",        "Daga",                   "METALBAR",   "LEATHER",    "dagas"],
  "2H_DAGGERPAIR":    ["2H_DAGGERPAIR",      "Par de dagas",           "METALBAR",   "LEATHER",    "dagas"],
  MAIN_AXE:           ["MAIN_AXE",           "Hacha",                  "METALBAR",   "PLANKS",     "hachas"],
  "2H_AXE":           ["2H_AXE",             "Hacha doble",            "METALBAR",   "PLANKS",     "hachas"],
  MAIN_MACE:          ["MAIN_MACE",          "Maza",                   "METALBAR",   "STONEBLOCK", "mazas"],
  "2H_HAMMER":        ["2H_HAMMER",          "Martillo",               "METALBAR",   "STONEBLOCK", "mazas"],
  "2H_POLEHAMMER":    ["2H_POLEHAMMER",      "Martinete",              "METALBAR",   "STONEBLOCK", "mazas"],
  MAIN_SPEAR:         ["MAIN_SPEAR",         "Lanza",                  "METALBAR",   "PLANKS",     "lanzas"],
  "2H_HALBERD":       ["2H_HALBERD",         "Alabarda",               "METALBAR",   "PLANKS",     "lanzas"],
  MAIN_FIRESTAFF:     ["MAIN_FIRESTAFF",     "Báculo de fuego",        "PLANKS",     "CLOTH",      "báculos"],
  "2H_FIRESTAFF":     ["2H_FIRESTAFF",       "Báculo de fuego 2M",     "PLANKS",     "CLOTH",      "báculos"],
  MAIN_FROSTSTAFF:    ["MAIN_FROSTSTAFF",    "Báculo de hielo",        "PLANKS",     "CLOTH",      "báculos"],
  "2H_ICICLESTAFF":   ["2H_ICICLESTAFF",     "Báculo estalactita",     "PLANKS",     "CLOTH",      "báculos"],
  MAIN_ARCANESTAFF:   ["MAIN_ARCANESTAFF",   "Báculo arcano",          "PLANKS",     "CLOTH",      "báculos"],
  MAIN_CURSESTAFF:    ["MAIN_CURSESTAFF",    "Báculo maldición",       "PLANKS",     "CLOTH",      "báculos"],
  "2H_CURSEDSTAFF":   ["2H_CURSEDSTAFF",     "Báculo maldito 2M",      "PLANKS",     "CLOTH",      "báculos"],
  MAIN_HOLYSTAFF:     ["MAIN_HOLYSTAFF",     "Báculo sagrado",         "PLANKS",     "CLOTH",      "báculos"],
  "2H_DIVINESTAFF":   ["2H_DIVINESTAFF",     "Báculo divino",          "PLANKS",     "CLOTH",      "báculos"],
  MAIN_NATURESTAFF:   ["MAIN_NATURESTAFF",   "Báculo naturaleza",      "PLANKS",     "CLOTH",      "báculos"],
  "2H_WILDSTAFF":     ["2H_WILDSTAFF",       "Báculo salvaje",         "PLANKS",     "CLOTH",      "báculos"],
  OFF_SHIELD:         ["OFF_SHIELD",         "Escudo",                 "METALBAR",   "PLANKS",     "offhand"],
  OFF_TORCH:          ["OFF_TORCH",          "Antorcha",               "PLANKS",     "CLOTH",      "offhand"],
  OFF_BOOK:           ["OFF_BOOK",           "Libro",                  "PLANKS",     "CLOTH",      "offhand"],
}

// ─── Armor recipe templates ───────────────────────────────────────────────────
const ARMOR_TEMPLATES: Record<string, [string, string, string, string, string]> = {
  // [id_suffix, name, primary, secondary, subcategory]
  HEAD_PLATE_SET1:    ["HEAD_PLATE_SET1",    "Casco de placas",        "METALBAR",   "STONEBLOCK", "plate"],
  ARMOR_PLATE_SET1:   ["ARMOR_PLATE_SET1",   "Armadura de placas",     "METALBAR",   "STONEBLOCK", "plate"],
  SHOES_PLATE_SET1:   ["SHOES_PLATE_SET1",   "Botas de placas",        "METALBAR",   "STONEBLOCK", "plate"],
  HEAD_PLATE_SET2:    ["HEAD_PLATE_SET2",    "Casco Templario",        "METALBAR",   "STONEBLOCK", "plate"],
  ARMOR_PLATE_SET2:   ["ARMOR_PLATE_SET2",   "Armadura Templaria",     "METALBAR",   "STONEBLOCK", "plate"],
  SHOES_PLATE_SET2:   ["SHOES_PLATE_SET2",   "Botas Templarias",       "METALBAR",   "STONEBLOCK", "plate"],
  HEAD_PLATE_HELL:    ["HEAD_PLATE_HELL",    "Casco demoníaco",        "METALBAR",   "STONEBLOCK", "plate"],
  ARMOR_PLATE_HELL:   ["ARMOR_PLATE_HELL",   "Armadura demoníaca",     "METALBAR",   "STONEBLOCK", "plate"],
  HEAD_LEATHER_SET1:  ["HEAD_LEATHER_SET1",  "Casco de cuero",         "LEATHER",    "PLANKS",     "cuero"],
  ARMOR_LEATHER_SET1: ["ARMOR_LEATHER_SET1", "Armadura de cuero",      "LEATHER",    "PLANKS",     "cuero"],
  SHOES_LEATHER_SET1: ["SHOES_LEATHER_SET1", "Botas de cuero",         "LEATHER",    "PLANKS",     "cuero"],
  HEAD_LEATHER_SET2:  ["HEAD_LEATHER_SET2",  "Casco de cuero pesado",  "LEATHER",    "PLANKS",     "cuero"],
  ARMOR_LEATHER_SET2: ["ARMOR_LEATHER_SET2", "Armadura cuero pesado",  "LEATHER",    "PLANKS",     "cuero"],
  SHOES_LEATHER_SET2: ["SHOES_LEATHER_SET2", "Botas de cuero pesado",  "LEATHER",    "PLANKS",     "cuero"],
  HEAD_LEATHER_KEEPER:["HEAD_LEATHER_KEEPER","Casco Keeper",           "LEATHER",    "PLANKS",     "cuero"],
  ARMOR_LEATHER_KEEPER:["ARMOR_LEATHER_KEEPER","Armadura Keeper",      "LEATHER",    "PLANKS",     "cuero"],
  HEAD_CLOTH_SET1:    ["HEAD_CLOTH_SET1",    "Sombrero de tela",       "CLOTH",      "STONEBLOCK", "tela"],
  ARMOR_CLOTH_SET1:   ["ARMOR_CLOTH_SET1",   "Túnica de tela",         "CLOTH",      "STONEBLOCK", "tela"],
  SHOES_CLOTH_SET1:   ["SHOES_CLOTH_SET1",   "Sandalias de tela",      "CLOTH",      "STONEBLOCK", "tela"],
  HEAD_CLOTH_SET2:    ["HEAD_CLOTH_SET2",    "Sombrero de tela fino",  "CLOTH",      "STONEBLOCK", "tela"],
  ARMOR_CLOTH_SET2:   ["ARMOR_CLOTH_SET2",   "Túnica de tela fina",    "CLOTH",      "STONEBLOCK", "tela"],
  SHOES_CLOTH_SET2:   ["SHOES_CLOTH_SET2",   "Sandalias finas",        "CLOTH",      "STONEBLOCK", "tela"],
  HEAD_CLOTH_KEEPER:  ["HEAD_CLOTH_KEEPER",  "Sombrero Keeper",        "CLOTH",      "STONEBLOCK", "tela"],
  ARMOR_CLOTH_MORGANA:["ARMOR_CLOTH_MORGANA","Túnica de Morgana",      "CLOTH",      "STONEBLOCK", "tela"],
  CAPE:               ["CAPE",               "Capa",                   "CLOTH",      "LEATHER",    "capas"],
  CAPE_CONQUEROR:     ["CAPE_CONQUEROR",     "Capa del Conquistador",  "CLOTH",      "LEATHER",    "capas"],
}

// ─── Consumables & other recipes ─────────────────────────────────────────────
const BAG_TEMPLATES: Record<string, [string, string, string, string, string]> = {
  BAG:         ["BAG",         "Bolsa",               "LEATHER",  "PLANKS",  "bolsas"],
  BAG_INSIGHT: ["BAG_INSIGHT", "Bolsa de Sabiduría",  "LEATHER",  "CLOTH",   "bolsas"],
}

// ─── Generate recipe for a specific tier ─────────────────────────────────────
function makeRecipe(
  tier: number,
  suffix: string,
  name: string,
  primary: string,
  secondary: string,
  category: string,
  subcategory: string
): CraftingRecipe {
  const p = PRIMARY[tier]   ?? 16
  const s = SECONDARY[tier] ?? 8
  const f = FOCUS_COST[tier] ?? 36

  // Armor pieces (head/shoes) use half of weapon primary qty
  const isHalfPiece = suffix.startsWith("HEAD_") || suffix.startsWith("SHOES_") || suffix === "CAPE" || suffix === "CAPE_CONQUEROR" || suffix === "OFF_SHIELD" || suffix === "OFF_TORCH" || suffix === "OFF_BOOK"
  const primaryQty   = isHalfPiece ? Math.ceil(p / 2) : p
  const secondaryQty = isHalfPiece ? Math.ceil(s / 2) : s

  return {
    outputId:   `T${tier}_${suffix}`,
    outputName: `${name} T${tier}`,
    materials:  [
      mat(tier, primary,   primaryQty),
      mat(tier, secondary, secondaryQty),
    ],
    craftingFocus: f,
    station: category === "weapons" || category === "armor" ? "Forja" : "Taller",
    category,
    subcategory,
  }
}

// ─── Generate all recipes ─────────────────────────────────────────────────────
function buildWeaponRecipes(): CraftingRecipe[] {
  const list: CraftingRecipe[] = []
  for (const [, [suffix, name, primary, secondary, sub]] of Object.entries(WEAPON_TEMPLATES)) {
    for (let t = 4; t <= 8; t++) {
      list.push(makeRecipe(t, suffix, name, primary, secondary, "weapons", sub))
    }
  }
  return list
}

function buildArmorRecipes(): CraftingRecipe[] {
  const list: CraftingRecipe[] = []
  for (const [, [suffix, name, primary, secondary, sub]] of Object.entries(ARMOR_TEMPLATES)) {
    for (let t = 4; t <= 8; t++) {
      list.push(makeRecipe(t, suffix, name, primary, secondary, "armor", sub))
    }
  }
  return list
}

function buildBagRecipes(): CraftingRecipe[] {
  const list: CraftingRecipe[] = []
  for (const [, [suffix, name, primary, secondary, sub]] of Object.entries(BAG_TEMPLATES)) {
    for (let t = 3; t <= 8; t++) {
      list.push(makeRecipe(t, suffix, name, primary, secondary, "misc", sub))
    }
  }
  return list
}

// Food recipes (based on known Albion recipes)
const FOOD_RECIPES: CraftingRecipe[] = [
  {
    outputId: "T4_MEAL_STEW",   outputName: "Estofado T4",
    materials: [
      { itemId: "T1_FARM_CORN",  qty: 20, label: "Maíz" },
      { itemId: "T3_FARM_GOAT",  qty: 8,  label: "Carne de cabra T3" },
      { itemId: "T2_FARM_MILK",  qty: 8,  label: "Leche T2" },
    ],
    craftingFocus: 24, station: "Cocina", category: "food", subcategory: "comida",
  },
  {
    outputId: "T4_MEAL_PIE",    outputName: "Pastel T4",
    materials: [
      { itemId: "T1_FARM_WHEAT", qty: 20, label: "Trigo" },
      { itemId: "T3_FARM_GOAT",  qty: 8,  label: "Carne de cabra T3" },
      { itemId: "T2_FARM_EGG",   qty: 8,  label: "Huevo T2" },
    ],
    craftingFocus: 24, station: "Cocina", category: "food", subcategory: "comida",
  },
  {
    outputId: "T4_MEAL_SOUP",   outputName: "Sopa T4",
    materials: [
      { itemId: "T1_FARM_WHEAT",    qty: 16, label: "Trigo" },
      { itemId: "T2_FARM_TURNIP",   qty: 12, label: "Nabo T2" },
      { itemId: "T2_FARM_POTATO",   qty: 8,  label: "Papa T2" },
    ],
    craftingFocus: 24, station: "Cocina", category: "food", subcategory: "comida",
  },
  {
    outputId: "T5_MEAL_SOUP",   outputName: "Sopa T5",
    materials: [
      { itemId: "T2_FARM_WHEAT",    qty: 20, label: "Trigo T2" },
      { itemId: "T3_FARM_TURNIP",   qty: 16, label: "Nabo T3" },
      { itemId: "T3_FARM_POTATO",   qty: 8,  label: "Papa T3" },
    ],
    craftingFocus: 48, station: "Cocina", category: "food", subcategory: "comida",
  },
  {
    outputId: "T6_MEAL_SANDWICH", outputName: "Sándwich T6",
    materials: [
      { itemId: "T3_FARM_WHEAT",    qty: 24, label: "Trigo T3" },
      { itemId: "T5_FARM_GOAT",     qty: 16, label: "Carne T5" },
      { itemId: "T4_FARM_TURNIP",   qty: 12, label: "Nabo T4" },
    ],
    craftingFocus: 96, station: "Cocina", category: "food", subcategory: "comida",
  },
]

// Potion recipes
const POTION_RECIPES: CraftingRecipe[] = [
  {
    outputId: "T4_POTION_HEAL",   outputName: "Poción de curación T4",
    materials: [
      { itemId: "T3_HERB",    qty: 20, label: "Hierba T3" },
      { itemId: "T2_MUSHROOM", qty: 8, label: "Hongo T2" },
    ],
    craftingFocus: 24, station: "Alquimia", category: "potions", subcategory: "pociones",
  },
  {
    outputId: "T6_POTION_HEAL",   outputName: "Poción de curación T6",
    materials: [
      { itemId: "T5_HERB",    qty: 20, label: "Hierba T5" },
      { itemId: "T4_MUSHROOM", qty: 8, label: "Hongo T4" },
    ],
    craftingFocus: 96, station: "Alquimia", category: "potions", subcategory: "pociones",
  },
  {
    outputId: "T8_POTION_HEAL",   outputName: "Poción de curación T8",
    materials: [
      { itemId: "T7_HERB",    qty: 20, label: "Hierba T7" },
      { itemId: "T6_MUSHROOM", qty: 8, label: "Hongo T6" },
    ],
    craftingFocus: 384, station: "Alquimia", category: "potions", subcategory: "pociones",
  },
  {
    outputId: "T4_POTION_ENERGY", outputName: "Poción de energía T4",
    materials: [
      { itemId: "T3_HERB",    qty: 16, label: "Hierba T3" },
      { itemId: "T2_MUSHROOM", qty: 8, label: "Hongo T2" },
    ],
    craftingFocus: 24, station: "Alquimia", category: "potions", subcategory: "pociones",
  },
  {
    outputId: "T6_POTION_ENERGY", outputName: "Poción de energía T6",
    materials: [
      { itemId: "T5_HERB",    qty: 16, label: "Hierba T5" },
      { itemId: "T4_MUSHROOM", qty: 8, label: "Hongo T4" },
    ],
    craftingFocus: 96, station: "Alquimia", category: "potions", subcategory: "pociones",
  },
  {
    outputId: "T4_POTION_COOLDOWN", outputName: "Poción de enfriamiento T4",
    materials: [
      { itemId: "T3_HERB",     qty: 16, label: "Hierba T3" },
      { itemId: "T3_MUSHROOM", qty: 8,  label: "Hongo T3" },
    ],
    craftingFocus: 24, station: "Alquimia", category: "potions", subcategory: "pociones",
  },
  {
    outputId: "T6_POTION_COOLDOWN", outputName: "Poción de enfriamiento T6",
    materials: [
      { itemId: "T5_HERB",     qty: 16, label: "Hierba T5" },
      { itemId: "T5_MUSHROOM", qty: 8,  label: "Hongo T5" },
    ],
    craftingFocus: 96, station: "Alquimia", category: "potions", subcategory: "pociones",
  },
]

// ─── Compile all recipes ──────────────────────────────────────────────────────
export const ALL_RECIPES: CraftingRecipe[] = [
  ...buildWeaponRecipes(),
  ...buildArmorRecipes(),
  ...buildBagRecipes(),
  ...FOOD_RECIPES,
  ...POTION_RECIPES,
]

// Index by output ID
export const RECIPE_BY_ID = new Map<string, CraftingRecipe>(
  ALL_RECIPES.map(r => [r.outputId, r])
)

// Get recipe for an item
export function getRecipe(itemId: string): CraftingRecipe | undefined {
  return RECIPE_BY_ID.get(itemId)
}

// Get all unique material IDs from a recipe (for batch price fetch)
export function getRecipeMaterialIds(recipe: CraftingRecipe): string[] {
  return [...new Set(recipe.materials.map(m => m.itemId))]
}

// ─── Category metadata ────────────────────────────────────────────────────────
export const RECIPE_CATEGORIES = [
  { id: "all",     label: "Todo",      emoji: "🗺️" },
  { id: "weapons", label: "Armas",     emoji: "⚔️" },
  { id: "armor",   label: "Armadura",  emoji: "🛡️" },
  { id: "food",    label: "Comida",    emoji: "🍖" },
  { id: "potions", label: "Pociones",  emoji: "🧪" },
  { id: "misc",    label: "Otros",     emoji: "📦" },
] as const

export const WEAPON_SUBCATEGORIES = [
  { id: "all",     label: "Todas" },
  { id: "espadas", label: "Espadas" },
  { id: "arcos",   label: "Arcos" },
  { id: "dagas",   label: "Dagas" },
  { id: "hachas",  label: "Hachas" },
  { id: "mazas",   label: "Mazas" },
  { id: "lanzas",  label: "Lanzas" },
  { id: "báculos", label: "Báculos" },
  { id: "offhand", label: "Off-hand" },
]

export const ARMOR_SUBCATEGORIES = [
  { id: "all",   label: "Todas" },
  { id: "plate", label: "Placas" },
  { id: "cuero", label: "Cuero" },
  { id: "tela",  label: "Tela" },
  { id: "capas", label: "Capas" },
]
