import { WalletDashboard } from "@/components/wallet-dashboard";

export default function WalletPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wallet</h1>
        <p className="text-muted-foreground">Track expenses and balances</p>
      </header>

      <WalletDashboard />
    </div>
  );
}
