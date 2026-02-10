import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader2, MapPin, Building2 } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { useTrip } from "@/lib/trip-context";
import { supabase, type Trip } from "@/lib/supabase";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/components/toast";
import { MobileDatePicker } from "./mobile-date-picker";
import { MobileMoneyInput } from "./mobile-money-input";

interface CreateTripDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripToEdit?: Trip | null;
}

const ACCOMMODATION_TYPES = [
    { id: "hotel", label: "Hotel", emoji: "🏨" },
    { id: "airbnb", label: "Airbnb", emoji: "🏠" },
    { id: "bnb", label: "B&B", emoji: "🛏️" },
    { id: "apartment", label: "Appartamento", emoji: "🏢" },
    { id: "hostel", label: "Ostello", emoji: "🏕️" },
    { id: "friends", label: "Amici", emoji: "👥" },
    { id: "other", label: "Altro", emoji: "📍" },
];

export function CreateTripDrawer({ open, onOpenChange, tripToEdit }: CreateTripDrawerProps) {
    const { createTrip, updateTrip } = useTrip();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [budget, setBudget] = useState("");
    const [costPayer, setCostPayer] = useState<"alex" | "tina" | "split" | "custom">("split");
    const [manualAlex, setManualAlex] = useState("");
    const [manualTina, setManualTina] = useState("");
    const [coverUrl, setCoverUrl] = useState("");
    const [coverPreview, setCoverPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // New fields
    const [destinationAddress, setDestinationAddress] = useState("");
    const [accommodationName, setAccommodationName] = useState("");
    const [accommodationType, setAccommodationType] = useState("");
    const [isGift, setIsGift] = useState(false);

    // Populate form when tripToEdit changes
    useEffect(() => {
        if (tripToEdit) {
            setName(tripToEdit.name);
            setStartDate(tripToEdit.start_date);
            setEndDate(tripToEdit.end_date);
            setBudget(tripToEdit.budget ? tripToEdit.budget.toString() : "");
            setCostPayer(tripToEdit.cost_payer || "split");
            setManualAlex(tripToEdit.cost_split_manual_alex?.toString() || "");
            setManualTina(tripToEdit.cost_split_manual_tina?.toString() || "");
            setCoverUrl(tripToEdit.cover_image_url || "");
            setCoverPreview(tripToEdit.cover_image_url || "");
            setDestinationAddress(tripToEdit.destination_address || "");
            setAccommodationName(tripToEdit.accommodation_name || "");
            setAccommodationType(tripToEdit.accommodation_type || "");
            setIsGift(tripToEdit.is_gift || false);
        } else {
            resetForm();
        }
    }, [tripToEdit, open]);

    const resetForm = () => {
        setName("");
        setStartDate("");
        setEndDate("");
        setBudget("");
        setCostPayer("split");
        setManualAlex("");
        setManualTina("");
        setCoverUrl("");
        setCoverPreview("");
        setDestinationAddress("");
        setAccommodationName("");
        setAccommodationType("");
        setIsGift(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const compressedFile = await compressImage(file);

            const reader = new FileReader();
            reader.onload = (event) => {
                setCoverPreview(event.target?.result as string);
            };
            reader.readAsDataURL(compressedFile);

            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `trip-covers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);

            setCoverUrl(publicUrl);
        } catch (error) {
            console.error('Errore upload:', error);
            toast("Errore nel caricare l'immagine. Riprova.", 'error');
            setCoverPreview("");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !startDate || !endDate) return;

        setLoading(true);
        try {
            const tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
                name,
                start_date: startDate,
                end_date: endDate,
                budget: budget ? parseFloat(budget) : null,
                cost_payer: costPayer,
                cost_split_manual_alex: costPayer === 'custom' ? (parseFloat(manualAlex) || 0) : 0,
                cost_split_manual_tina: costPayer === 'custom' ? (parseFloat(manualTina) || 0) : 0,
                cover_image_url: coverUrl || null,
                destination_address: destinationAddress || null,
                accommodation_name: accommodationName || null,
                accommodation_type: accommodationType || null,
                is_gift: isGift,
                status: (new Date(startDate) <= new Date() ? "active" : "upcoming") as "active" | "upcoming"
            };

            if (tripToEdit) {
                await updateTrip(tripToEdit.id, tripData);
            } else {
                await createTrip(tripData);
            }

            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error("Errore salvataggio viaggio:", error);
            toast("Errore nel salvare il viaggio", 'error');
        } finally {
            setLoading(false);
        }
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
                            <h2 className="text-2xl font-bold">
                                {tripToEdit ? "Modifica Viaggio ✏️" : "Nuovo Viaggio ✈️"}
                            </h2>
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
                            <p className="text-xs text-muted-foreground -mt-2 ml-1">
                                💡 Puoi selezionare lo stesso giorno per viaggi giornalieri
                            </p>

                            {/* Destinazione / Indirizzo */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    Indirizzo / Località
                                </label>
                                <input
                                    type="text"
                                    value={destinationAddress}
                                    onChange={(e) => setDestinationAddress(e.target.value)}
                                    placeholder="Es: Via Roma 15, Parma oppure Skofije, Slovenia"
                                    className="w-full p-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    L'indirizzo o la zona dove sei stato
                                </p>
                            </div>

                            {/* Struttura / Alloggio */}
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                                    <Building2 className="w-4 h-4 inline mr-1" />
                                    Dove hai dormito? (opzionale)
                                </label>

                                {/* Nome struttura */}
                                <input
                                    type="text"
                                    value={accommodationName}
                                    onChange={(e) => setAccommodationName(e.target.value)}
                                    placeholder="Es: Hotel Belvedere, Airbnb Centro Storico..."
                                    className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-sm mb-3"
                                />

                                {/* Tipo struttura */}
                                <div className="flex flex-wrap gap-2">
                                    {ACCOMMODATION_TYPES.map((acc) => (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => setAccommodationType(accommodationType === acc.id ? "" : acc.id)}
                                            className={cn(
                                                "px-3 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5",
                                                accommodationType === acc.id
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                    : "bg-background hover:bg-muted text-muted-foreground border-border"
                                            )}
                                        >
                                            <span>{acc.emoji}</span>
                                            <span>{acc.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Costo Totale Viaggio */}
                            <div>
                                <MobileMoneyInput
                                    value={budget}
                                    onChange={setBudget}
                                    label="💰 Costo Totale Viaggio (Volo+Hotel)"
                                    placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Inserisci il costo base (es. volo e alloggio pagati in anticipo).
                                </p>
                            </div>

                            {/* Chi ha pagato */}
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                                    Chi ha pagato questo costo iniziale?
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCostPayer('alex')}
                                        className={cn(
                                            "p-3 rounded-lg text-sm font-medium transition-all border",
                                            costPayer === 'alex'
                                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                : "bg-background hover:bg-muted text-muted-foreground border-transparent"
                                        )}
                                    >
                                        👤 Alex
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCostPayer('tina')}
                                        className={cn(
                                            "p-3 rounded-lg text-sm font-medium transition-all border",
                                            costPayer === 'tina'
                                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                : "bg-background hover:bg-muted text-muted-foreground border-transparent"
                                        )}
                                    >
                                        👩 Tina
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setCostPayer('split')}
                                        className={cn(
                                            "p-3 rounded-lg text-sm font-medium transition-all border",
                                            costPayer === 'split'
                                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                : "bg-background hover:bg-muted text-muted-foreground border-transparent"
                                        )}
                                    >
                                        ⚖️ Diviso
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCostPayer('custom')}
                                        className={cn(
                                            "p-3 rounded-lg text-sm font-medium transition-all border",
                                            costPayer === 'custom'
                                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                : "bg-background hover:bg-muted text-muted-foreground border-transparent"
                                        )}
                                    >
                                        ✏️ Manuale
                                    </button>
                                </div>

                                {costPayer === 'custom' && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Pagato da Alex</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                                <input
                                                    type="number"
                                                    value={manualAlex}
                                                    onChange={(e) => setManualAlex(e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2 rounded-lg border bg-background text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Pagato da Tina</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                                <input
                                                    type="number"
                                                    value={manualTina}
                                                    onChange={(e) => setManualTina(e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2 rounded-lg border bg-background text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    {costPayer === 'split' && 'Pagato separatamente o diviso a metà'}
                                    {costPayer === 'alex' && 'Pagato interamente da Alex'}
                                    {costPayer === 'tina' && 'Pagato interamente da Tina'}
                                    {costPayer === 'custom' && 'Importi specifici pagati da ciascuno'}
                                </p>
                            </div>

                            {/* Gift Toggle */}
                            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        🎁 È un regalo?
                                    </label>
                                    <button
                                        onClick={() => setIsGift(!isGift)}
                                        className={cn(
                                            "relative w-14 h-7 rounded-full transition-all",
                                            isGift ? "bg-purple-500" : "bg-muted"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all",
                                            isGift ? "right-0.5" : "left-0.5"
                                        )} />
                                    </button>
                                </div>
                                {isGift && (
                                    <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-top-2">
                                        💡 Il costo di questo viaggio non verrà contato nel bilancio
                                    </p>
                                )}
                            </div>

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
                            {loading ? "Salvataggio..." : (tripToEdit ? "Salva Modifiche" : "Crea Viaggio ✨")}
                        </motion.button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
