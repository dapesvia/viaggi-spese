import { useState, useMemo } from "react";
import { Plus, Loader2, Plane, Trash2, Edit2, Search, X, CalendarDays } from "lucide-react";
import { TripCard } from "@/components/trip-card";
import { CreateTripDrawer } from "@/components/create-trip-drawer";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTrip } from "@/lib/trip-context";
import { supabase, type Trip } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { trips, currentTrip, loading, selectTrip, refreshTrips } = useTrip();
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");

  const handleDeleteTrip = async () => {
    if (!deleteTrip) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', deleteTrip.id);

      if (error) throw error;

      setDeleteTrip(null);
      await refreshTrips();
    } catch (error) {
      console.error("Errore eliminazione viaggio:", error);
      alert("Errore nell'eliminare il viaggio");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered trips
  const filteredTrips = useMemo(() => {
    let result = trips;

    // Filter by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }

    // Filter by month (YYYY-MM format)
    if (filterMonth) {
      result = result.filter(t => {
        const start = t.start_date.slice(0, 7); // YYYY-MM
        const end = t.end_date.slice(0, 7);
        return start <= filterMonth && end >= filterMonth;
      });
    }

    return result;
  }, [trips, searchQuery, filterMonth]);

  const hasActiveFilters = searchQuery.trim() !== "" || filterMonth !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterMonth("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Viaggi & Spese 👋</h1>
            <p className="text-sm text-muted-foreground">Gestisci i vostri viaggi insieme</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">I Vostri Viaggi</h2>
          {trips.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-all ${showFilters || hasActiveFilters
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <AnimatePresence>
          {showFilters && trips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pb-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca per nome..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary/50 focus:bg-background transition-all outline-none text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Month filter */}
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary/50 focus:bg-background transition-all outline-none text-sm appearance-none"
                    style={{ colorScheme: "dark" }}
                  />
                  {filterMonth && (
                    <button
                      onClick={() => setFilterMonth("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Active filter indicator */}
                {hasActiveFilters && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between"
                  >
                    <p className="text-xs text-muted-foreground">
                      {filteredTrips.length} {filteredTrips.length === 1 ? "viaggio trovato" : "viaggi trovati"}
                    </p>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Cancella filtri
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Trips List */}
      {trips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
            <Plane className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nessun viaggio ancora</h3>
          <p className="text-muted-foreground mb-6">
            Crea il tuo primo viaggio per iniziare a tracciare le spese!
          </p>
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crea il primo viaggio
          </button>
        </motion.div>
      ) : filteredTrips.length === 0 && hasActiveFilters ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nessun risultato</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Nessun viaggio corrisponde alla tua ricerca
          </p>
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:underline font-medium"
          >
            Cancella filtri
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div onClick={() => selectTrip(trip.id)}>
                <TripCard
                  id={trip.id}
                  name={trip.name}
                  startDate={trip.start_date}
                  endDate={trip.end_date}
                  status={trip.status}
                  coverImage={trip.cover_image_url || undefined}
                  isSelected={currentTrip?.id === trip.id}
                />
              </div>

              {/* Action buttons */}
              <div className="absolute top-4 left-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTripToEdit(trip);
                    setShowCreateDrawer(true);
                  }}
                  className="p-2.5 rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all shadow-sm"
                  title="Modifica viaggio"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTrip({ id: trip.id, name: trip.name });
                  }}
                  className="p-2.5 rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all shadow-sm"
                  title="Elimina viaggio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB */}
      {trips.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreateDrawer(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Create/Edit Trip Drawer */}
      <CreateTripDrawer
        open={showCreateDrawer}
        onOpenChange={(open) => {
          setShowCreateDrawer(open);
          if (!open) setTripToEdit(null);
        }}
        tripToEdit={tripToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTrip}
        onClose={() => setDeleteTrip(null)}
        onConfirm={handleDeleteTrip}
        title="Elimina viaggio"
        message={`Stai per eliminare "${deleteTrip?.name}". Tutte le spese e l'itinerario verranno eliminati permanentemente.`}
        confirmText="Elimina viaggio"
        loading={deleting}
      />
    </div>
  );
}
