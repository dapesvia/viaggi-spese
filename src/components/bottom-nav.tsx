import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, Wallet, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddExpenseDrawer } from "./add-expense-drawer";
import type { User } from "../App";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/itinerary", icon: MapPin, label: "Itinerario" },
  { href: "/wallet", icon: Wallet, label: "Spese" },
  { href: "/docs", icon: FileText, label: "Documenti" },
];

interface BottomNavProps {
  currentUser: User;
}

export function BottomNav({ currentUser }: BottomNavProps) {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="relative flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 2).map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.href}
            />
          ))}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            className="relative -mt-8 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50"
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
            <motion.div
              className="absolute inset-0 rounded-full bg-primary"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </motion.button>

          {navItems.slice(2).map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.href}
            />
          ))}
        </div>
      </nav>

      <AddExpenseDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        currentUser={currentUser}
      />
    </>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute -inset-2 rounded-full bg-primary/10"
            initial={false}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
    </Link>
  );
}
