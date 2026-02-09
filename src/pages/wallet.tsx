import { WalletDashboard } from "@/components/wallet-dashboard";
import type { User } from "../App";

interface WalletPageProps {
  currentUser: User;
}

export default function WalletPage({ currentUser }: WalletPageProps) {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portafoglio</h1>
        <p className="text-muted-foreground">Traccia spese e bilanci</p>
      </header>

      <WalletDashboard currentUser={currentUser} />
    </div>
  );
}
