import { useState } from "react";
import { Plus, Loader2, Plane, Trash2, Edit2 } from "lucide-react";
import { TripCard } from "@/components/trip-card";
import { CreateTripDrawer } from "@/components/create-trip-drawer";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTrip } from "@/lib/trip-context";
import { supabase, type Trip } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function HomePage() {
  const { trips, currentTrip, loading, selectTrip, refreshTrips } = useTrip();
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Viaggi & Spese 👋</h1>
            <p className="text-sm text-muted-foreground">Gestisci i vostri viaggi insieme</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold">I Vostri Viaggi</h2>
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
      ) : (
        <div className="space-y-4">
          {trips.map((trip, index) => (
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
