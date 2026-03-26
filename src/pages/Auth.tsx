import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Sprout, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as "farmer" | "buyer") || "buyer";
  const navigate = useNavigate();
  const { signUp, signIn, profile, user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          toast.error("Please fill all fields");
          return;
        }
        await signUp(email, password, { name, role, phone });
        toast.success("Account created! Welcome to AgriLink 🌾");
      } else {
        if (!email.trim() || !password.trim()) {
          toast.error("Enter your email and password");
          return;
        }
        await signIn(email, password);
        toast.success("Welcome back! 🌾");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isFarmer = role === "farmer";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isFarmer ? "bg-hero-gradient" : "bg-warm-gradient"}`}>
            {isFarmer ? <Sprout className="w-8 h-8 text-primary-foreground" /> : <ShoppingCart className="w-8 h-8 text-secondary-foreground" />}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isFarmer ? "Farmer" : "Buyer"} {isRegister ? "Registration" : "Login"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <Input
                placeholder="Your Name / आपका नाम"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl text-base"
              />
              <Input
                placeholder="Phone Number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl text-base"
                type="tel"
              />
            </>
          )}
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl text-base"
            type="email"
          />
          <Input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl text-base"
            type="password"
          />
          <Button
            type="submit"
            disabled={submitting}
            className={`w-full h-12 rounded-xl text-base font-semibold ${isFarmer ? "bg-hero-gradient text-primary-foreground" : "bg-warm-gradient text-secondary-foreground"}`}
          >
            {submitting ? "Please wait..." : isRegister ? "Register" : "Login"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <button onClick={() => setIsRegister(!isRegister)} className="text-primary font-semibold underline-offset-2 hover:underline">
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

        <button onClick={() => navigate("/")} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default Auth;
