import { motion } from "framer-motion";

interface UserSelectorProps {
  onSelectUser: (user: "alex" | "valentina") => void;
}

export function UserSelector({ onSelectUser }: UserSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">TravelMate</h1>
          <p className="text-muted-foreground text-lg">Chi sta usando l'app?</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectUser("alex")}
            className="p-8 rounded-2xl border-2 border-border hover:border-primary bg-gradient-to-br from-blue-500/10 to-blue-600/5 transition-all active:scale-95"
          >
            <div className="text-6xl mb-4">👨</div>
            <div className="text-2xl font-bold">Alex</div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectUser("valentina")}
            className="p-8 rounded-2xl border-2 border-border hover:border-primary bg-gradient-to-br from-pink-500/10 to-pink-600/5 transition-all active:scale-95"
          >
            <div className="text-6xl mb-4">👩</div>
            <div className="text-2xl font-bold">Valentina</div>
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Questo aiuta a tracciare chi paga le spese
        </motion.p>
      </div>
    </div>
  );
}
