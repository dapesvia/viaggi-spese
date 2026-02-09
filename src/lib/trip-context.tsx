import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, type Trip } from "./supabase";

interface TripContextType {
    trips: Trip[];
    currentTrip: Trip | null;
    loading: boolean;
    selectTrip: (tripId: string) => void;
    refreshTrips: () => Promise<void>;
    createTrip: (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<Trip>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) throw error;

            setTrips(data || []);

            // Auto-select first trip or restore from localStorage
            const savedTripId = localStorage.getItem('currentTripId');
            if (data && data.length > 0) {
                const savedTrip = savedTripId ? data.find(t => t.id === savedTripId) : null;
                setCurrentTrip(savedTrip || data[0]);
            }
        } catch (error) {
            console.error('Errore caricamento viaggi:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectTrip = (tripId: string) => {
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
            setCurrentTrip(trip);
            localStorage.setItem('currentTripId', tripId);
        }
    };

    const createTrip = async (tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Trip> => {
        const { data, error } = await supabase
            .from('trips')
            .insert({
                ...tripData,
                created_by: null // No auth, no user
            })
            .select()
            .single();

        if (error) throw error;

        await loadTrips();
        setCurrentTrip(data);
        localStorage.setItem('currentTripId', data.id);

        return data;
    };

    return (
        <TripContext.Provider value={{
            trips,
            currentTrip,
            loading,
            selectTrip,
            refreshTrips: loadTrips,
            createTrip
        }}>
            {children}
        </TripContext.Provider>
    );
}

export function useTrip() {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
}
