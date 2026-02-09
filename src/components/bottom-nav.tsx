import { NavLink } from "react-router-dom";
import { Home, Wallet, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrip } from "@/lib/trip-context";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Wallet, label: "Spese", path: "/wallet" },
  { icon: Calendar, label: "Itinerario", path: "/itinerary" },
  { icon: BarChart3, label: "Statistiche", path: "/stats" },
];

export function BottomNav() {
  const { currentTrip } = useTrip();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Blur background */}
      <div className="absolute inset-0 glass border-t border-white/[0.06]" />

      {/* Current trip floating pill */}
      {currentTrip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] text-primary font-medium backdrop-blur-md max-w-[200px] truncate"
        >
          {currentTrip.name}
        </motion.div>
      )}

      <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Glow background for active item */}
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 relative z-10 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold relative z-10 tracking-wide",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
