import { useState } from "react";
import { useTrip } from "@/lib/trip-context";
import { ChevronDown, Map, Check, Edit2, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CreateTripDrawer } from "./create-trip-drawer";
import { ConfirmDialog } from "./confirm-dialog";
import { type Trip } from "@/lib/supabase";

export function TripSelector() {
    const { trips, currentTrip, selectTrip, deleteTrip } = useTrip();
    const [isOpen, setIsOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
    const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Show even if no current trip, to allow selection
    // if (!currentTrip && trips.length === 0) return null; 

    const handleSelect = (tripId: string) => {
        selectTrip(tripId);
        setIsOpen(false);
    };

    const handleDelete = async () => {
        if (tripToDelete) {
            await deleteTrip(tripToDelete.id);
            setTripToDelete(null);
        }
    };

    return (
        <>
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
                                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Dropdown */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute left-0 top-full mt-2 w-72 max-h-[60vh] overflow-y-auto bg-popover border border-border rounded-xl shadow-xl z-50 p-1"
                            >
                                <div className="flex items-center justify-between px-3 py-2">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        I tuoi viaggi
                                    </span>
                                    <button
                                        onClick={() => {
                                            setIsCreateOpen(true);
                                            setIsOpen(false);
                                            setTripToEdit(null);
                                        }}
                                        className="p-1 hover:bg-muted rounded-full"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {trips.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Nessun viaggio trovato
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {trips.map((trip) => (
                                            <div
                                                key={trip.id}
                                                className={cn(
                                                    "group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                    currentTrip?.id === trip.id
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-muted text-foreground"
                                                )}
                                            >
                                                <button
                                                    className="absolute inset-0 z-0"
                                                    onClick={() => handleSelect(trip.id)}
                                                />

                                                <div className="flex flex-col items-start truncate z-10 pointer-events-none">
                                                    <span className="truncate w-40 text-left">{trip.name}</span>
                                                    <span className="text-xs text-muted-foreground opacity-80">
                                                        {new Date(trip.start_date).getFullYear()}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 z-20">
                                                    {currentTrip?.id === trip.id && (
                                                        <Check className="w-4 h-4 mr-1" />
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTripToEdit(trip);
                                                            setIsCreateOpen(true);
                                                            setIsOpen(false);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTripToDelete(trip);
                                                            setIsOpen(false);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            <CreateTripDrawer
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) setTripToEdit(null);
                }}
                tripToEdit={tripToEdit}
            />

            <ConfirmDialog
                open={!!tripToDelete}
                onClose={() => setTripToDelete(null)}
                onConfirm={handleDelete}
                title="Elimina viaggio"
                message={`Sei sicuro di voler eliminare "${tripToDelete?.name}"? Tutte le spese associate verranno perse irreversibilmente.`}
                confirmText="Elimina definitivamente"
            />
        </>
    );
}
