import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sprout, ShoppingCart, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-accent rounded-full px-4 py-2 mb-6">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-accent-foreground">Farm Fresh, Direct to You</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-gradient-primary">Agri</span>
            <span className="text-foreground">Link</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-2">
            किसान से सीधे आपके घर तक
          </p>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Connect directly with local farmers. Fresh produce, fair prices, zero middlemen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-hero-gradient hover:opacity-90 text-primary-foreground shadow-glow rounded-xl gap-3"
              onClick={() => navigate("/auth?role=farmer")}
            >
              <Sprout className="w-5 h-5" />
              I'm a Farmer
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground rounded-xl gap-3"
              onClick={() => navigate("/auth?role=buyer")}
            >
              <ShoppingCart className="w-5 h-5" />
              I'm a Buyer
            </Button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto w-full px-4"
        >
          {[
            { emoji: "🌾", title: "Fresh Produce", desc: "Direct from farm to table" },
            { emoji: "💰", title: "Fair Prices", desc: "No middlemen, better deals" },
            { emoji: "📍", title: "Hyperlocal", desc: "Nearby farmers only" },
          ].map((f, i) => (
            <div key={i} className="bg-card rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">{f.emoji}</div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <footer className="text-center text-sm text-muted-foreground py-6">
        AgriLink © 2026 — Empowering Indian Farmers
      </footer>
    </div>
  );
};

export default Landing;
