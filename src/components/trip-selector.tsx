import { useState } from "react";
import { useTrip } from "@/lib/trip-context";
import { ChevronDown, Map, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function TripSelector() {
    const { trips, currentTrip, selectTrip } = useTrip();
    const [isOpen, setIsOpen] = useState(false);

    if (!currentTrip && trips.length === 0) return null;

    const handleSelect = (tripId: string) => {
        selectTrip(tripId);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm font-medium animate-in fade-in"
            >
                <Map className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {currentTrip?.name || "Seleziona viaggio"}
                </span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 top-full mt-2 w-64 max-h-[60vh] overflow-y-auto bg-popover border border-border rounded-xl shadow-xl z-50 p-1"
                        >
                            <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                I tuoi viaggi
                            </div>

                            {trips.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Nessun viaggio trovato
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {trips.map((trip) => (
                                        <button
                                            key={trip.id}
                                            onClick={() => handleSelect(trip.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                currentTrip?.id === trip.id
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "hover:bg-muted text-foreground"
                                            )}
                                        >
                                            <div className="flex flex-col items-start truncate">
                                                <span className="truncate w-full text-left">{trip.name}</span>
                                                <span className="text-xs text-muted-foreground opacity-80">
                                                    {new Date(trip.start_date).getFullYear()}
                                                </span>
                                            </div>
                                            {currentTrip?.id === trip.id && (
                                                <Check className="w-4 h-4" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
