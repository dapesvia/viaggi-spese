import { NavLink } from "react-router-dom";
import { Home, Wallet, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrip } from "@/lib/trip-context";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Wallet, label: "Spese", path: "/wallet" },
  { icon: Calendar, label: "Itinerario", path: "/itinerary" },
  { icon: FileText, label: "Documenti", path: "/docs" },
];

export function BottomNav() {
  const { currentTrip } = useTrip();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Current trip indicator */}
      {currentTrip && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
          {currentTrip.name}
        </div>
      )}
    </nav>
  );
}
