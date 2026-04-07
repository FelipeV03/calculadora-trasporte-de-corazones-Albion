"use client"

import { useState } from "react"
import { getIconUrl } from "@/lib/albion-api"
import { Package } from "lucide-react"

interface ItemIconProps {
  itemId: string
  enchantment?: number
  size?: number
  className?: string
  alt?: string
}

export function ItemIcon({ itemId, enchantment = 0, size = 40, className = "" }: ItemIconProps) {
  const [errored, setErrored] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const src = getIconUrl(itemId, size, enchantment)

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-secondary border border-border ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <Package className="text-muted-foreground" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    )
  }

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {!loaded && (
        <div
          className="absolute inset-0 rounded-md bg-secondary animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={itemId}
        width={size}
        height={size}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`rounded-md transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{ width: size, height: size }}
      />
    </div>
  )
}

// Compact icon with tier badge overlay
export function ItemIconWithTier({ itemId, tier, enchantment = 0, size = 40, className = "" }: ItemIconProps & { tier: number }) {
  const TIER_COLORS: Record<number, string> = {
    1: "bg-gray-500",
    2: "bg-gray-400",
    3: "bg-gray-300 text-gray-900",
    4: "bg-yellow-700",
    5: "bg-blue-500",
    6: "bg-blue-400",
    7: "bg-purple-500",
    8: "bg-amber-400 text-amber-900",
  }
  const ENCHANT_COLORS: Record<number, string> = {
    1: "bg-green-400 text-green-900",
    2: "bg-blue-400 text-blue-900",
    3: "bg-purple-400 text-purple-100",
    4: "bg-yellow-400 text-yellow-900",
  }

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <ItemIcon itemId={itemId} enchantment={enchantment} size={size} />
      {/* Tier badge */}
      <span
        className={`absolute bottom-0 left-0 text-white rounded-sm px-0.5 font-bold leading-none ${TIER_COLORS[tier] ?? "bg-gray-500"}`}
        style={{ fontSize: Math.max(8, size * 0.22) }}
      >
        T{tier}
      </span>
      {/* Enchantment badge */}
      {enchantment > 0 && (
        <span
          className={`absolute top-0 right-0 rounded-sm px-0.5 font-bold leading-none ${ENCHANT_COLORS[enchantment] ?? "bg-gray-400"}`}
          style={{ fontSize: Math.max(7, size * 0.2) }}
        >
          .{enchantment}
        </span>
      )}
    </div>
  )
}
