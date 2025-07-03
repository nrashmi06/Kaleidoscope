import * as LucideIcons from "lucide-react";
import { lucideIconNames } from "./validLucideIcons";

export function getLucideIcon(name: string) {
  if (!lucideIconNames.includes(name as typeof lucideIconNames[number])) return null;
  return LucideIcons[name as keyof typeof LucideIcons] || null;
}
