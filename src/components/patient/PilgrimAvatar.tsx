import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Patient } from "@/types/patient";

interface Props {
  patient: Pick<Patient, "id" | "fullName">;
  size?: number;
  animate?: boolean;
}

const PALETTE = [
  "#185FA5", // c-blue 600
  "#0F6E56", // c-teal 600
  "#993C1D", // c-coral 600
  "#993556", // c-pink 600
  "#534AB7", // c-purple 600
  "#3B6D11", // c-green 600
  "#854F0B", // c-amber 600
];

function hashToIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % PALETTE.length;
}

export function PilgrimAvatar({ patient, size = 64, animate = false }: Props) {
  const { i18n } = useTranslation();
  const name = i18n.language === "ar" ? patient.fullName.ar : patient.fullName.en;
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  const bg = PALETTE[hashToIndex(patient.id)];
  const fontSize = Math.round(size * 0.42);

  const inner = (
    <div
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 500,
        fontSize,
        letterSpacing: 0.5,
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );

  if (!animate) return inner;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {inner}
    </motion.div>
  );
}
