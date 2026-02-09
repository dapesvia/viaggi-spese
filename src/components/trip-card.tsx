import { motion } from "framer-motion";
import { Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripCardProps {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  coverImage?: string;
  isSelected?: boolean;
}

export function TripCard({ name, startDate, endDate, status, coverImage, isSelected }: TripCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("it-IT", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-2xl h-48 cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: coverImage ? `url(${coverImage})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="relative h-full flex flex-col justify-end p-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              status === "active" && "bg-green-500/20 text-green-300",
              status === "upcoming" && "bg-blue-500/20 text-blue-300",
              status === "completed" && "bg-gray-500/20 text-gray-300"
            )}
          >
            {status === "active" ? "In corso" : status === "upcoming" ? "Prossimo" : "Completato"}
          </span>
          {isSelected && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground">
              Selezionato
            </span>
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>

        <div className="flex items-center gap-4 text-white/80 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
