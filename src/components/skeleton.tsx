import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-xl bg-muted/60",
                className
            )}
        />
    );
}

/** Skeleton for the Home page trip cards */
export function TripCardSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl h-52 overflow-hidden relative">
                    <Skeleton className="absolute inset-0 rounded-2xl" />
                    <div className="absolute bottom-5 left-5 right-5 space-y-3">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-36" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Skeleton for Wallet page */
export function WalletSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-64 rounded-3xl" />
            <div className="space-y-3">
                <Skeleton className="h-5 w-32 rounded" />
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

/** Skeleton for Stats page */
export function StatsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-48 rounded-3xl" />
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
            <Skeleton className="h-72 rounded-2xl" />
        </div>
    );
}

/** Skeleton for Itinerary page */
export function ItinerarySkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 rounded-2xl" />
            <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-16 rounded-xl flex-shrink-0" />
                ))}
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="w-1 h-20 rounded-full" />
                        <Skeleton className="flex-1 h-20 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
