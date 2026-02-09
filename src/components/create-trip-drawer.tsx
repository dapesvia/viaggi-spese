import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader2 } from "lucide-react";
import { Drawer } from "vaul";
import { useTrip } from "@/lib/trip-context";
import { supabase } from "@/lib/supabase";
import { MobileDatePicker } from "./mobile-date-picker";
import { MobileMoneyInput } from "./mobile-money-input";

interface CreateTripDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTripDrawer({ open, onOpenChange }: CreateTripDrawerProps) {
    const { createTrip } = useTrip();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [budget, setBudget] = useState("");
    const [coverUrl, setCoverUrl] = useState("");
    const [coverPreview, setCoverPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setCoverPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `trip-covers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);

            setCoverUrl(publicUrl);
        } catch (error) {
            console.error('Errore upload:', error);
            alert('Errore nel caricare l\'immagine. Riprova.');
            setCoverPreview("");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !startDate || !endDate) return;

        setLoading(true);
        try {
            await createTrip({
                name,
                start_date: startDate,
                end_date: endDate,
                budget: budget ? parseFloat(budget) : null,
                cover_image_url: coverUrl || null,
                status: new Date(startDate) <= new Date() ? "active" : "upcoming"
            });

            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error("Errore creazione viaggio:", error);
            alert("Errore nel creare il viaggio");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName("");
        setStartDate("");
        setEndDate("");
        setBudget("");
        setCoverUrl("");
        setCoverPreview("");
    };

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
                            <h2 className="text-2xl font-bold">Nuovo Viaggio ✈️</h2>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 rounded-full hover:bg-muted transition-colors active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    ✏️ Nome del viaggio
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Es: Vacanza in Grecia"
                                    className="w-full p-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
                                />
                            </div>

                            {/* Date con MobileDatePicker */}
                            <div className="grid grid-cols-2 gap-3">
                                <MobileDatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    label="📅 Data inizio"
                                    placeholder="Partenza"
                                />
                                <MobileDatePicker
                                    value={endDate}
                                    onChange={setEndDate}
                                    minDate={startDate}
                                    label="📅 Data fine"
                                    placeholder="Ritorno"
                                />
                            </div>

                            {/* Budget con MobileMoneyInput */}
                            <MobileMoneyInput
                                value={budget}
                                onChange={setBudget}
                                label="💰 Budget (opzionale)"
                                placeholder="0"
                            />

                            {/* Cover Image Upload */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    🖼️ Immagine copertina (opzionale)
                                </label>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {coverPreview ? (
                                    <div className="relative rounded-xl overflow-hidden h-40">
                                        <img
                                            src={coverPreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                setCoverPreview("");
                                                setCoverUrl("");
                                            }}
                                            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-destructive transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground active:bg-muted/50"
                                    >
                                        <Upload className="w-8 h-8" />
                                        <span className="text-sm font-medium">Tocca per scegliere una foto</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Save Button */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={!name || !startDate || !endDate || loading || uploading}
                            className="w-full h-14 mt-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg disabled:opacity-50 shadow-lg shadow-primary/30"
                        >
                            {loading ? "Creazione..." : "Crea Viaggio ✨"}
                        </motion.button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
