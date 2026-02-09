import { motion } from "framer-motion";
import { Calendar, Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripCardProps {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  coverImage?: string;
  isSelected?: boolean;
  destinationAddress?: string;
}

const STATUS_CONFIG = {
  active: { label: "In corso", bg: "bg-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  upcoming: { label: "Prossimo", bg: "bg-blue-500/20", text: "text-blue-300", dot: "bg-blue-400" },
  completed: { label: "Completato", bg: "bg-white/10", text: "text-white/60", dot: "bg-white/40" },
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

export function TripCard({ id, name, startDate, endDate, status, coverImage, isSelected, destinationAddress }: TripCardProps) {
  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("it-IT", { month: "short", day: "numeric" });
  };

  // Compute days
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Pick a consistent gradient based on the id
  const gradientIndex = id.charCodeAt(0) % FALLBACK_GRADIENTS.length;
  const statusCfg = STATUS_CONFIG[status];

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-2xl h-52 cursor-pointer transition-all duration-300",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: coverImage ? `url(${coverImage})` : FALLBACK_GRADIENTS[gradientIndex],
        }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
      }} />

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 z-10"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5">
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm",
              statusCfg.bg, statusCfg.text
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusCfg.dot)} />
            {statusCfg.label}
          </span>
          {isSelected && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/25 text-primary-foreground backdrop-blur-sm">
              Selezionato
            </span>
          )}
        </div>

        {/* Trip name */}
        <h3 className="text-2xl font-bold text-white mb-1.5 leading-tight">{name}</h3>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-white/70 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDate(startDate)} – {formatDate(endDate)}
            </span>
          </div>
          <span className="text-white/30">•</span>
          <span className="text-white/50 text-xs">{days}g</span>

          {destinationAddress && (
            <>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1 text-white/50 text-xs truncate max-w-[120px]">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{destinationAddress}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
