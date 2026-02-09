"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripCardProps {
  name: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  coverImage?: string;
}

export function TripCard({ name, startDate, endDate, status, coverImage }: TripCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl h-48 cursor-pointer"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: coverImage ? `url(${coverImage})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
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
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
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
