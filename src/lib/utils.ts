import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export function nationalityToCode(nationalityEn: string): string {
  const map: Record<string, string> = {
    Indonesia: "ID",
    Pakistan: "PK",
    "Türkiye": "TR",
    Turkey: "TR",
    Nigeria: "NG",
    Egypt: "EG",
  };
  return map[nationalityEn] ?? "SA";
}
