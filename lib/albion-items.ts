// Albion Online Item Database
// Item IDs match the official Albion Online API item unique names.
// Icons are fetched from render.albiononline.com/v1/item/{id}.png

export type ItemCategory =
  | "raw"
  | "refined"
  | "weapons"
  | "armor"
  | "food"
  | "potions"
  | "artifacts"
  | "mounts"
  | "bags"
  | "misc"

export interface AlbionItem {
  id: string
  name: string          // Spanish display name
  tier: number          // 1-8
  category: ItemCategory
  subcategory: string   // e.g. "mineral", "espadas", etc.
  enchantable?: boolean
}

// ─── Raw resources ────────────────────────────────────────────────────────────
const RAW_NAMES: Record<string, { raw: string; sub: string }> = {
  ORE:   { raw: "Mineral", sub: "mineral" },
  WOOD:  { raw: "Troncos", sub: "madera" },
  HIDE:  { raw: "Piel cruda", sub: "piel" },
  FIBER: { raw: "Fibra", sub: "fibra" },
  ROCK:  { raw: "Piedra", sub: "piedra" },
}

const TIER_ORE_NAMES   = ["", "Cobre", "Hierro", "Acero", "Molibdeno", "Adamantio", "Meteorito", "Archivolt", "Celestium"]
const TIER_WOOD_NAMES  = ["", "Abeto", "Roble", "Pino", "Cedro", "Arce", "Madera muerta", "Árbol blanco", "Árbol estelar"]
const TIER_HIDE_NAMES  = ["", "Piel de ciervo", "Piel de oso", "Piel tosca", "Piel resistente", "Piel de bestia", "Piel oscura", "Piel de pesadilla", "Piel espectral"]
const TIER_FIBER_NAMES = ["", "Algodón", "Lino", "Algodón fino", "Hierba de hada", "Hierba fantasma", "Hierba estelar", "Hierba caída", "Hierba espectral"]
const TIER_ROCK_NAMES  = ["", "Arenisca", "Travertino", "Piedra caliza", "Granito", "Basalto", "Piedra negra", "Piedra oscura", "Piedra etérea"]

function generateRaw(): AlbionItem[] {
  const types = [
    { key: "ORE",   tierNames: TIER_ORE_NAMES },
    { key: "WOOD",  tierNames: TIER_WOOD_NAMES },
    { key: "HIDE",  tierNames: TIER_HIDE_NAMES },
    { key: "FIBER", tierNames: TIER_FIBER_NAMES },
    { key: "ROCK",  tierNames: TIER_ROCK_NAMES },
  ]
  const items: AlbionItem[] = []
  for (const t of types) {
    for (let tier = 1; tier <= 8; tier++) {
      items.push({
        id: `T${tier}_${t.key}`,
        name: `${t.tierNames[tier]} T${tier}`,
        tier,
        category: "raw",
        subcategory: RAW_NAMES[t.key].sub,
        enchantable: tier >= 3,
      })
    }
  }
  return items
}

// ─── Refined resources ────────────────────────────────────────────────────────
const REFINED_NAMES: Record<string, { name: string; sub: string }> = {
  METALBAR:   { name: "Barra metálica", sub: "barras" },
  PLANKS:     { name: "Tablones", sub: "madera" },
  LEATHER:    { name: "Cuero", sub: "cuero" },
  CLOTH:      { name: "Tela", sub: "tela" },
  STONEBLOCK: { name: "Bloques de piedra", sub: "piedra" },
}

const TIER_BAR_NAMES    = ["", "Bronce", "Hierro", "Acero", "Molibdeno", "Adamantio", "Meteórico", "Archivolt", "Celestial"]
const TIER_PLANK_NAMES  = ["", "Abeto", "Roble", "Pino", "Cedro", "Arce", "Árbol muerto", "Árbol blanco", "Árbol estelar"]
const TIER_LEATH_NAMES  = ["", "Cuero fino", "Cuero suave", "Cuero curtido", "Cuero resistente", "Cuero bestial", "Cuero oscuro", "Cuero pesadilla", "Cuero espectral"]
const TIER_CLOTH_NAMES  = ["", "Algodón", "Lino", "Seda", "Seda de hada", "Gasa fantasma", "Gasa estelar", "Gasa caída", "Gasa espectral"]
const TIER_STONE_NAMES  = ["", "Arenisca", "Travertino", "Caliza", "Granito", "Basalto", "Piedra negra", "Piedra oscura", "Piedra etérea"]

function generateRefined(): AlbionItem[] {
  const types = [
    { key: "METALBAR",   tierNames: TIER_BAR_NAMES },
    { key: "PLANKS",     tierNames: TIER_PLANK_NAMES },
    { key: "LEATHER",    tierNames: TIER_LEATH_NAMES },
    { key: "CLOTH",      tierNames: TIER_CLOTH_NAMES },
    { key: "STONEBLOCK", tierNames: TIER_STONE_NAMES },
  ]
  const items: AlbionItem[] = []
  for (const t of types) {
    for (let tier = 1; tier <= 8; tier++) {
      items.push({
        id: `T${tier}_${t.key}`,
        name: `${REFINED_NAMES[t.key].name} T${tier} (${t.tierNames[tier]})`,
        tier,
        category: "refined",
        subcategory: REFINED_NAMES[t.key].sub,
        enchantable: tier >= 3,
      })
    }
  }
  return items
}

// ─── Weapons ─────────────────────────────────────────────────────────────────
const WEAPON_DEFS = [
  // Swords
  { id: "MAIN_SWORD",         name: "Espada",            sub: "espadas" },
  { id: "2H_CLAYMORE",        name: "Claymore",           sub: "espadas" },
  { id: "2H_DUALSWORD",       name: "Sables duales",      sub: "espadas" },
  { id: "MAIN_SWORD_CRYSTAL", name: "Espada de cristal",  sub: "espadas" },
  // Bows
  { id: "MAIN_BOW",           name: "Arco",               sub: "arcos" },
  { id: "2H_BOW",             name: "Arco largo",         sub: "arcos" },
  { id: "2H_CROSSBOW",        name: "Ballesta",           sub: "arcos" },
  { id: "2H_BOW_KEEPER",      name: "Arco guardián",      sub: "arcos" },
  { id: "2H_DUALCROSSBOW_HELL", name: "Ballesta infernal", sub: "arcos" },
  // Daggers
  { id: "MAIN_DAGGER",        name: "Daga",               sub: "dagas" },
  { id: "2H_DAGGERPAIR",      name: "Par de dagas",       sub: "dagas" },
  { id: "2H_DUALSICKLE_HELL", name: "Hoz doble infernal", sub: "dagas" },
  // Axes
  { id: "MAIN_AXE",           name: "Hacha",              sub: "hachas" },
  { id: "2H_AXE",             name: "Hacha doble",        sub: "hachas" },
  { id: "2H_CLEAVER_HELL",    name: "Cuchilla infernal",  sub: "hachas" },
  // Maces
  { id: "MAIN_MACE",          name: "Maza",               sub: "mazas" },
  { id: "2H_HAMMER",          name: "Martillo",           sub: "mazas" },
  { id: "2H_POLEHAMMER",      name: "Martinete",          sub: "mazas" },
  { id: "MAIN_MACE_MORGANA",  name: "Maza de Morgana",    sub: "mazas" },
  // Spears
  { id: "MAIN_SPEAR",         name: "Lanza",              sub: "lanzas" },
  { id: "2H_HALBERD",         name: "Alabarda",           sub: "lanzas" },
  { id: "2H_HALBERD_MORGANA", name: "Alabarda de Morgana",sub: "lanzas" },
  // Fire Staffs
  { id: "MAIN_FIRESTAFF",     name: "Báculo de fuego",    sub: "báculos" },
  { id: "2H_FIRESTAFF",       name: "Báculo de fuego 2M", sub: "báculos" },
  { id: "2H_INFERNOSTAFF",    name: "Báculo infernal",    sub: "báculos" },
  // Frost Staffs
  { id: "MAIN_FROSTSTAFF",    name: "Báculo de hielo",    sub: "báculos" },
  { id: "2H_ICICLESTAFF",     name: "Báculo de estalactita", sub: "báculos" },
  { id: "2H_FROSTSTAFF_HELL", name: "Báculo de hielo infernal", sub: "báculos" },
  // Arcane Staffs
  { id: "MAIN_ARCANESTAFF",   name: "Báculo arcano",      sub: "báculos" },
  { id: "2H_ARCANESTAFF_HELL",name: "Báculo arcano infernal", sub: "báculos" },
  // Curse Staffs
  { id: "MAIN_CURSESTAFF",    name: "Báculo de maldición",sub: "báculos" },
  { id: "2H_CURSEDSTAFF",     name: "Báculo maldito 2M",  sub: "báculos" },
  { id: "2H_CURSEDSTAFF_MORGANA", name: "Báculo de Morgana", sub: "báculos" },
  // Holy Staffs
  { id: "MAIN_HOLYSTAFF",     name: "Báculo sagrado",     sub: "báculos" },
  { id: "2H_DIVINESTAFF",     name: "Báculo divino",      sub: "báculos" },
  { id: "2H_HOLYSTAFF_UNDEAD","name": "Báculo no-muerto sagrado", sub: "báculos" },
  // Nature Staffs
  { id: "MAIN_NATURESTAFF",   name: "Báculo de naturaleza",sub: "báculos" },
  { id: "2H_WILDSTAFF",       name: "Báculo salvaje",     sub: "báculos" },
  // Off-hand
  { id: "OFF_SHIELD",         name: "Escudo",             sub: "offhand" },
  { id: "OFF_TORCH",          name: "Antorcha",           sub: "offhand" },
  { id: "OFF_BOOK",           name: "Libro",              sub: "offhand" },
  { id: "OFF_TOWERSHIELD_UNDEAD", name: "Escudo Morgana", sub: "offhand" },
  { id: "OFF_JESTERCANE",     name: "Bastón de bufón",    sub: "offhand" },
]

function generateWeapons(): AlbionItem[] {
  const items: AlbionItem[] = []
  for (const w of WEAPON_DEFS) {
    for (let tier = 4; tier <= 8; tier++) {
      items.push({
        id: `T${tier}_${w.id}`,
        name: `${w.name} T${tier}`,
        tier,
        category: "weapons",
        subcategory: w.sub,
        enchantable: true,
      })
    }
  }
  return items
}

// ─── Armor ────────────────────────────────────────────────────────────────────
const ARMOR_DEFS = [
  // Plate
  { id: "HEAD_PLATE_SET1",    name: "Casco de placas",          sub: "plate" },
  { id: "ARMOR_PLATE_SET1",   name: "Armadura de placas",       sub: "plate" },
  { id: "SHOES_PLATE_SET1",   name: "Botas de placas",          sub: "plate" },
  { id: "HEAD_PLATE_SET2",    name: "Casco Templario",          sub: "plate" },
  { id: "ARMOR_PLATE_SET2",   name: "Coraza Templaria",         sub: "plate" },
  { id: "SHOES_PLATE_SET2",   name: "Botas Templarias",         sub: "plate" },
  { id: "HEAD_PLATE_HELL",    name: "Casco demoníaco",          sub: "plate" },
  { id: "ARMOR_PLATE_HELL",   name: "Armadura demoníaca",       sub: "plate" },
  { id: "SHOES_PLATE_HELL",   name: "Botas demoníacas",         sub: "plate" },
  { id: "HEAD_PLATE_UNDEAD",  name: "Casco no-muerto",          sub: "plate" },
  { id: "ARMOR_PLATE_UNDEAD", name: "Coraza no-muerta",         sub: "plate" },
  // Leather
  { id: "HEAD_LEATHER_SET1",  name: "Casco de cuero",           sub: "cuero" },
  { id: "ARMOR_LEATHER_SET1", name: "Armadura de cuero",        sub: "cuero" },
  { id: "SHOES_LEATHER_SET1", name: "Botas de cuero",           sub: "cuero" },
  { id: "HEAD_LEATHER_SET2",  name: "Casco de cuero pesado",    sub: "cuero" },
  { id: "ARMOR_LEATHER_SET2", name: "Armadura de cuero pesado", sub: "cuero" },
  { id: "SHOES_LEATHER_SET2", name: "Botas de cuero pesado",    sub: "cuero" },
  { id: "HEAD_LEATHER_KEEPER","name": "Casco Keeper",           sub: "cuero" },
  { id: "ARMOR_LEATHER_KEEPER","name": "Coraza Keeper",         sub: "cuero" },
  { id: "SHOES_LEATHER_KEEPER","name": "Botas Keeper",          sub: "cuero" },
  // Cloth
  { id: "HEAD_CLOTH_SET1",    name: "Sombrero de tela",         sub: "tela" },
  { id: "ARMOR_CLOTH_SET1",   name: "Túnica de tela",           sub: "tela" },
  { id: "SHOES_CLOTH_SET1",   name: "Sandalias de tela",        sub: "tela" },
  { id: "HEAD_CLOTH_SET2",    name: "Sombrero de tela fino",    sub: "tela" },
  { id: "ARMOR_CLOTH_SET2",   name: "Túnica de tela fina",      sub: "tela" },
  { id: "SHOES_CLOTH_SET2",   name: "Sandalias de tela finas",  sub: "tela" },
  { id: "HEAD_CLOTH_KEEPER",  name: "Sombrero Keeper",          sub: "tela" },
  { id: "ARMOR_CLOTH_MORGANA","name": "Túnica de Morgana",      sub: "tela" },
  { id: "SHOES_CLOTH_HELL",   name: "Sandalias infernales",     sub: "tela" },
  // Capes
  { id: "CAPE",               name: "Capa",                     sub: "capas" },
  { id: "CAPE_CONQUEROR",     name: "Capa del Conquistador",    sub: "capas" },
  { id: "CAPE_UNDEAD",        name: "Capa no-muerta",           sub: "capas" },
  { id: "CAPE_ROGUE",         name: "Capa del Pícaro",          sub: "capas" },
]

function generateArmor(): AlbionItem[] {
  const items: AlbionItem[] = []
  for (const a of ARMOR_DEFS) {
    const tiers = a.sub === "capas" ? [4, 5, 6, 7, 8] : [4, 5, 6, 7, 8]
    for (const tier of tiers) {
      items.push({
        id: `T${tier}_${a.id}`,
        name: `${a.name} T${tier}`,
        tier,
        category: "armor",
        subcategory: a.sub,
        enchantable: true,
      })
    }
  }
  return items
}

// ─── Food ─────────────────────────────────────────────────────────────────────
const FOOD_DEFS: AlbionItem[] = [
  { id: "T1_MEAL_SOUP", name: "Sopa T1", tier: 1, category: "food", subcategory: "comida" },
  { id: "T2_MEAL_SOUP", name: "Sopa T2", tier: 2, category: "food", subcategory: "comida" },
  { id: "T3_MEAL_SALAD", name: "Ensalada T3", tier: 3, category: "food", subcategory: "comida" },
  { id: "T3_MEAL_SALAD_FISH", name: "Ensalada de pescado T3", tier: 3, category: "food", subcategory: "comida" },
  { id: "T4_MEAL_STEW", name: "Estofado T4", tier: 4, category: "food", subcategory: "comida" },
  { id: "T4_MEAL_PIE", name: "Pastel T4", tier: 4, category: "food", subcategory: "comida" },
  { id: "T4_MEAL_SOUP", name: "Sopa T4", tier: 4, category: "food", subcategory: "comida" },
  { id: "T5_MEAL_SOUP", name: "Sopa T5", tier: 5, category: "food", subcategory: "comida" },
  { id: "T5_MEAL_PIE", name: "Pastel T5", tier: 5, category: "food", subcategory: "comida" },
  { id: "T5_MEAL_STEW", name: "Estofado T5", tier: 5, category: "food", subcategory: "comida" },
  { id: "T6_MEAL_SANDWICH", name: "Sándwich T6", tier: 6, category: "food", subcategory: "comida" },
  { id: "T6_MEAL_PIE", name: "Pastel T6", tier: 6, category: "food", subcategory: "comida" },
  { id: "T7_MEAL_PIE", name: "Pastel T7", tier: 7, category: "food", subcategory: "comida" },
  { id: "T7_MEAL_STEW", name: "Estofado T7", tier: 7, category: "food", subcategory: "comida" },
  { id: "T8_MEAL_PIE", name: "Pastel T8", tier: 8, category: "food", subcategory: "comida" },
  { id: "T8_MEAL_SOUP", name: "Sopa T8", tier: 8, category: "food", subcategory: "comida" },
]

// ─── Potions ──────────────────────────────────────────────────────────────────
const POTION_DEFS: AlbionItem[] = [
  { id: "T2_POTION_HEAL", name: "Poción de curación T2", tier: 2, category: "potions", subcategory: "pociones" },
  { id: "T4_POTION_HEAL", name: "Poción de curación T4", tier: 4, category: "potions", subcategory: "pociones" },
  { id: "T6_POTION_HEAL", name: "Poción de curación T6", tier: 6, category: "potions", subcategory: "pociones" },
  { id: "T8_POTION_HEAL", name: "Poción de curación T8", tier: 8, category: "potions", subcategory: "pociones" },
  { id: "T4_POTION_ENERGY", name: "Poción de energía T4", tier: 4, category: "potions", subcategory: "pociones" },
  { id: "T6_POTION_ENERGY", name: "Poción de energía T6", tier: 6, category: "potions", subcategory: "pociones" },
  { id: "T8_POTION_ENERGY", name: "Poción de energía T8", tier: 8, category: "potions", subcategory: "pociones" },
  { id: "T4_POTION_COOLDOWN", name: "Poción de enfriamiento T4", tier: 4, category: "potions", subcategory: "pociones" },
  { id: "T6_POTION_COOLDOWN", name: "Poción de enfriamiento T6", tier: 6, category: "potions", subcategory: "pociones" },
  { id: "T8_POTION_COOLDOWN", name: "Poción de enfriamiento T8", tier: 8, category: "potions", subcategory: "pociones" },
  { id: "T4_POTION_REVIVE", name: "Poción de revivir T4", tier: 4, category: "potions", subcategory: "pociones" },
  { id: "T6_POTION_REVIVE", name: "Poción de revivir T6", tier: 6, category: "potions", subcategory: "pociones" },
  { id: "T8_POTION_REVIVE", name: "Poción de revivir T8", tier: 8, category: "potions", subcategory: "pociones" },
]

// ─── Bags ─────────────────────────────────────────────────────────────────────
const BAG_DEFS: AlbionItem[] = [
  { id: "T3_BAG", name: "Bolsa T3", tier: 3, category: "bags", subcategory: "bolsas" },
  { id: "T4_BAG", name: "Bolsa T4", tier: 4, category: "bags", subcategory: "bolsas" },
  { id: "T5_BAG", name: "Bolsa T5", tier: 5, category: "bags", subcategory: "bolsas" },
  { id: "T6_BAG", name: "Bolsa T6", tier: 6, category: "bags", subcategory: "bolsas" },
  { id: "T7_BAG", name: "Bolsa T7", tier: 7, category: "bags", subcategory: "bolsas" },
  { id: "T8_BAG", name: "Bolsa T8", tier: 8, category: "bags", subcategory: "bolsas" },
  { id: "T4_BAG_INSIGHT", name: "Bolsa de Sabiduría T4", tier: 4, category: "bags", subcategory: "bolsas" },
  { id: "T6_BAG_INSIGHT", name: "Bolsa de Sabiduría T6", tier: 6, category: "bags", subcategory: "bolsas" },
  { id: "T8_BAG_INSIGHT", name: "Bolsa de Sabiduría T8", tier: 8, category: "bags", subcategory: "bolsas" },
]

// ─── Mounts ───────────────────────────────────────────────────────────────────
const MOUNT_DEFS: AlbionItem[] = [
  { id: "T3_MOUNT_HORSE", name: "Caballo T3", tier: 3, category: "mounts", subcategory: "caballos" },
  { id: "T4_MOUNT_HORSE", name: "Caballo T4", tier: 4, category: "mounts", subcategory: "caballos" },
  { id: "T5_MOUNT_HORSE", name: "Caballo T5", tier: 5, category: "mounts", subcategory: "caballos" },
  { id: "T6_MOUNT_HORSE", name: "Caballo T6", tier: 6, category: "mounts", subcategory: "caballos" },
  { id: "T7_MOUNT_HORSE", name: "Caballo T7", tier: 7, category: "mounts", subcategory: "caballos" },
  { id: "T8_MOUNT_HORSE", name: "Caballo T8", tier: 8, category: "mounts", subcategory: "caballos" },
  { id: "T4_MOUNT_OX", name: "Buey T4", tier: 4, category: "mounts", subcategory: "monturas" },
  { id: "T5_MOUNT_OX", name: "Buey T5", tier: 5, category: "mounts", subcategory: "monturas" },
  { id: "T6_MOUNT_OX", name: "Buey T6", tier: 6, category: "mounts", subcategory: "monturas" },
  { id: "T7_MOUNT_OX", name: "Buey T7", tier: 7, category: "mounts", subcategory: "monturas" },
  { id: "T8_MOUNT_OX", name: "Buey T8", tier: 8, category: "mounts", subcategory: "monturas" },
  { id: "T5_MOUNT_DIREWOLF", name: "Lobo Feroz T5", tier: 5, category: "mounts", subcategory: "bestias" },
  { id: "T6_MOUNT_DIREWOLF", name: "Lobo Feroz T6", tier: 6, category: "mounts", subcategory: "bestias" },
  { id: "T7_MOUNT_DIREWOLF", name: "Lobo Feroz T7", tier: 7, category: "mounts", subcategory: "bestias" },
  { id: "T5_MOUNT_BEAR", name: "Oso T5", tier: 5, category: "mounts", subcategory: "bestias" },
  { id: "T6_MOUNT_BEAR", name: "Oso T6", tier: 6, category: "mounts", subcategory: "bestias" },
  { id: "T5_MOUNT_SWAMP_SALAMANDER", name: "Salamandra T5", tier: 5, category: "mounts", subcategory: "bestias" },
]

// ─── Misc (tomes, runes, etc.) ────────────────────────────────────────────────
const MISC_DEFS: AlbionItem[] = [
  { id: "T4_SKILLBOOK_STANDARD", name: "Tomo de Conocimiento T4", tier: 4, category: "misc", subcategory: "tomos" },
  { id: "T5_SKILLBOOK_STANDARD", name: "Tomo de Conocimiento T5", tier: 5, category: "misc", subcategory: "tomos" },
  { id: "T6_SKILLBOOK_STANDARD", name: "Tomo de Conocimiento T6", tier: 6, category: "misc", subcategory: "tomos" },
  { id: "T4_RUNE", name: "Runa T4", tier: 4, category: "misc", subcategory: "artefactos" },
  { id: "T5_RUNE", name: "Runa T5", tier: 5, category: "misc", subcategory: "artefactos" },
  { id: "T6_RUNE", name: "Runa T6", tier: 6, category: "misc", subcategory: "artefactos" },
  { id: "T7_RUNE", name: "Runa T7", tier: 7, category: "misc", subcategory: "artefactos" },
  { id: "T4_SOUL", name: "Alma T4", tier: 4, category: "misc", subcategory: "artefactos" },
  { id: "T5_SOUL", name: "Alma T5", tier: 5, category: "misc", subcategory: "artefactos" },
  { id: "T6_SOUL", name: "Alma T6", tier: 6, category: "misc", subcategory: "artefactos" },
  { id: "T7_SOUL", name: "Alma T7", tier: 7, category: "misc", subcategory: "artefactos" },
  { id: "T4_RELIC", name: "Reliquia T4", tier: 4, category: "misc", subcategory: "artefactos" },
  { id: "T5_RELIC", name: "Reliquia T5", tier: 5, category: "misc", subcategory: "artefactos" },
  { id: "T6_RELIC", name: "Reliquia T6", tier: 6, category: "misc", subcategory: "artefactos" },
  { id: "T7_RELIC", name: "Reliquia T7", tier: 7, category: "misc", subcategory: "artefactos" },
  { id: "TREASURE_SILVER", name: "Baúl de plata", tier: 1, category: "misc", subcategory: "tesoros" },
  { id: "TREASURE_GOLD", name: "Baúl de oro", tier: 1, category: "misc", subcategory: "tesoros" },
]

// ─── Compile full database ────────────────────────────────────────────────────
export const ALBION_ITEMS: AlbionItem[] = [
  ...generateRaw(),
  ...generateRefined(),
  ...generateWeapons(),
  ...generateArmor(),
  ...FOOD_DEFS,
  ...POTION_DEFS,
  ...BAG_DEFS,
  ...MOUNT_DEFS,
  ...MISC_DEFS,
]

// Index by ID for fast lookup
export const ITEM_BY_ID = new Map<string, AlbionItem>(ALBION_ITEMS.map((i) => [i.id, i]))

// ─── Search ───────────────────────────────────────────────────────────────────
export function searchItems(query: string, limit = 30): AlbionItem[] {
  if (!query.trim()) return ALBION_ITEMS.slice(0, limit)
  const q = query.toLowerCase().trim()
  return ALBION_ITEMS.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.subcategory.toLowerCase().includes(q)
  ).slice(0, limit)
}

// ─── Refining resource mapping ────────────────────────────────────────────────
export const REFINE_RESOURCE_MAP = {
  ORE:   { raw: "ORE",   refined: "METALBAR",   rawLabel: "Mineral",   refinedLabel: "Barra metálica" },
  WOOD:  { raw: "WOOD",  refined: "PLANKS",     rawLabel: "Troncos",   refinedLabel: "Tablones" },
  HIDE:  { raw: "HIDE",  refined: "LEATHER",    rawLabel: "Piel cruda",refinedLabel: "Cuero" },
  FIBER: { raw: "FIBER", refined: "CLOTH",      rawLabel: "Fibra",     refinedLabel: "Tela" },
  ROCK:  { raw: "ROCK",  refined: "STONEBLOCK", rawLabel: "Piedra",    refinedLabel: "Bloque de piedra" },
} as const

export type RefineResourceKey = keyof typeof REFINE_RESOURCE_MAP

// Enchantment level item ID suffix
export function getEnchantedId(baseId: string, level: number): string {
  if (level === 0) return baseId
  if (baseId.includes("ORE") || baseId.includes("WOOD") || baseId.includes("HIDE") || baseId.includes("FIBER") || baseId.includes("ROCK")) {
    // Raw resources use _LEVEL suffix
    return `${baseId}_LEVEL${level}`
  }
  // Refined and crafted items use @N suffix
  return `${baseId}@${level}`
}
