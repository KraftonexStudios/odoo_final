import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert a base64 string (from Prisma Bytes) into a data URL for <img src>
export function base64ToDataUrl(base64?: string | null, mime = "image/png") {
  if (!base64) return undefined
  
  // If it's already a data URL or regular URL, return it
  if (base64.startsWith('data:') || base64.startsWith('http://') || base64.startsWith('https://')) {
    return base64;
  }
  
  return `data:${mime};base64,${base64}`
}

// Get a consistent gradient color for avatars based on name
export function getAvatarGradient(name: string): string {
  const gradients = [
    "bg-gradient-to-br from-purple-500 to-pink-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-green-500 to-emerald-500",
    "bg-gradient-to-br from-orange-500 to-red-500",
    "bg-gradient-to-br from-indigo-500 to-purple-500",
    "bg-gradient-to-br from-pink-500 to-rose-500",
    "bg-gradient-to-br from-teal-500 to-green-500",
    "bg-gradient-to-br from-yellow-500 to-orange-500",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

// Get initials from first and last name
export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
}

// Format role for display (handles both string and array, replaces underscores with spaces)
export function formatRole(role?: string | string[]): string {
  if (!role) return "User";
  const roleStr = Array.isArray(role) ? role[0] : role;
  return roleStr?.replace(/_/g, " ") || "User";
}

// Get role as string (handles both string and array from Clerk metadata)
export function normalizeRole(role?: string | string[]): string {
  if (!role) return "TEAM_MEMBER";
  return Array.isArray(role) ? role[0] : role;
}

// Format file size in bytes to human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
