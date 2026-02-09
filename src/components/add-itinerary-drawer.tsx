import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Clock, MapPin, FileText, Tag } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";
import { useToast } from "@/components/toast";

const ITEM_TYPES = [
    { id: "flight", label: "Volo", emoji: "✈️" },
    { id: "stay", label: "Alloggio", emoji: "🏨" },
    { id: "activity", label: "Attività", emoji: "🎭" },
    { id: "transport", label: "Trasporto", emoji: "🚗" },
    { id: "restaurant", label: "Ristorante", emoji: "🍽️" },
];

interface AddItineraryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
    defaultDate?: string; // YYYY-MM-DD format to pre-fill
}

export function AddItineraryDrawer({ open, onOpenChange, onSaved, defaultDate }: AddItineraryDrawerProps) {
    const { currentTrip } = useTrip();
    const { toast } = useToast();

    const [type, setType] = useState("activity");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [datetime, setDatetime] = useState("");
    const [locationName, setLocationName] = useState("");
    const [bookingRef, setBookingRef] = useState("");
    const [loading, setLoading] = useState(false);

    // Pre-fill date when drawer opens with a defaultDate
    useEffect(() => {
        if (open && defaultDate && !datetime) {
            setDatetime(`${defaultDate}T09:00`);
        }
    }, [open, defaultDate]);

    const handleSave = async () => {
        if (!title || !datetime || !currentTrip) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('itinerary_items').insert({
                trip_id: currentTrip.id,
                type,
                title,
                description: description || null,
                datetime,
                location_name: locationName || null,
                booking_reference: bookingRef || null
            });

            if (error) throw error;

            onOpenChange(false);
            onSaved();

            // Reset form
            setType("activity");
            setTitle("");
            setDescription("");
            setDatetime("");
            setLocationName("");
            setBookingRef("");
        } catch (error) {
            console.error('Errore salvataggio:', error);
            toast('Errore nel salvare. Riprova.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!currentTrip) return null;

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content
                    className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl glass border-t border-border/50 max-h-[90vh]"
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                    <div className="flex-shrink-0 mx-auto w-12 h-1.5 rounded-full bg-muted my-4" />

                    <div className="flex-1 overflow-y-auto px-4 pb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">Nuovo Elemento</h2>
                                <p className="text-sm text-muted-foreground">{currentTrip.name}</p>
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Type Selection */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Tipo
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {ITEM_TYPES.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setType(item.id)}
                                        className={cn(
                                            "p-3 rounded-xl border-2 transition-all",
                                            type === item.id
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="text-2xl mb-1">{item.emoji}</div>
                                        <div className="text-xs font-medium">{item.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Titolo *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Es: Volo Roma-Atene"
                                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {/* DateTime */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Data e Ora *
                            </label>
                            <input
                                type="datetime-local"
                                value={datetime}
                                onChange={(e) => setDatetime(e.target.value)}
                                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Location */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Luogo (opzionale)
                            </label>
                            <input
                                type="text"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                placeholder="Es: Aeroporto Fiumicino"
                                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Booking Reference */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                <Tag className="w-4 h-4 inline mr-1" />
                                Codice prenotazione (opzionale)
                            </label>
                            <input
                                type="text"
                                value={bookingRef}
                                onChange={(e) => setBookingRef(e.target.value)}
                                placeholder="Es: ABC123"
                                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Note (opzionale)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Aggiungi dettagli..."
                                rows={3}
                                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* Save Button */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={!title || !datetime || loading}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg disabled:opacity-50 shadow-lg shadow-primary/30"
                        >
                            {loading ? "Salvataggio..." : "Salva"}
                        </motion.button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
