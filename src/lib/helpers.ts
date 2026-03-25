import { Sprout, ShoppingCart, Star, MapPin, Clock, Leaf } from "lucide-react";

const categoryIcons: Record<string, string> = {
  vegetables: "🥬",
  fruits: "🍎",
  grains: "🌾",
  dairy: "🥛",
  spices: "🌶️",
  other: "📦",
};

export function getCategoryEmoji(category: string): string {
  return categoryIcons[category] || "📦";
}

export function formatPrice(price: number): string {
  return `₹${price}`;
}

export function daysSinceHarvest(harvestDate: string): number {
  const harvest = new Date(harvestDate);
  const now = new Date();
  return Math.floor((now.getTime() - harvest.getTime()) / (1000 * 60 * 60 * 24));
}

export function freshnessLabel(harvestDate: string): { label: string; color: string } {
  const days = daysSinceHarvest(harvestDate);
  if (days <= 1) return { label: "Just Harvested 🌿", color: "text-primary" };
  if (days <= 3) return { label: "Very Fresh", color: "text-primary" };
  if (days <= 7) return { label: "Fresh", color: "text-secondary" };
  return { label: `${days} days ago`, color: "text-muted-foreground" };
}

export { Sprout, ShoppingCart, Star, MapPin, Clock, Leaf };
