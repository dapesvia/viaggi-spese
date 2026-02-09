import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AuthPage() {
    const { signIn, signUp } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === "login") {
                await signIn(email, password);
            } else {
                if (!username.trim()) {
                    throw new Error("Il nome utente è richiesto");
                }
                await signUp(email, password, username);
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || "Errore di autenticazione");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                    <Plane className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    TravelMate
                </h1>
                <p className="text-muted-foreground mt-2">Viaggi & Spese Condivise</p>
            </motion.div>

            {/* Form Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-sm"
            >
                <div className="p-6 rounded-2xl glass border border-border/50 shadow-xl">
                    {/* Toggle */}
                    <div className="flex mb-6 p-1 rounded-xl bg-muted">
                        <button
                            onClick={() => setMode("login")}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${mode === "login"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Accedi
                        </button>
                        <button
                            onClick={() => setMode("signup")}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${mode === "signup"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Registrati
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "signup" && (
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Nome (es: Alex)"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
                                    required={mode === "signup"}
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
                                required
                                minLength={6}
                            />
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg disabled:opacity-50 shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {mode === "login" ? "Accedi" : "Registrati"}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    {mode === "login"
                        ? "Non hai un account? "
                        : "Hai già un account? "}
                    <button
                        onClick={() => setMode(mode === "login" ? "signup" : "login")}
                        className="text-primary font-medium hover:underline"
                    >
                        {mode === "login" ? "Registrati" : "Accedi"}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
