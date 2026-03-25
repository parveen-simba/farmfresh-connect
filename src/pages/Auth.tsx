import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser, registerUser, setCurrentUser } from "@/lib/store";
import { Sprout, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as "farmer" | "buyer") || "buyer";
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (!name.trim() || !phone.trim()) {
        toast.error("Please fill all fields");
        return;
      }
      const user = registerUser({ name, phone, role });
      setCurrentUser(user);
      toast.success(`Welcome, ${user.name}!`);
      navigate(role === "farmer" ? "/farmer" : "/marketplace");
    } else {
      if (!phone.trim()) {
        toast.error("Enter your phone number");
        return;
      }
      const user = loginUser(phone, role);
      if (!user) {
        toast.error("User not found. Please register first.");
        return;
      }
      toast.success(`Welcome back, ${user.name}!`);
      navigate(role === "farmer" ? "/farmer" : "/marketplace");
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
            <Input
              placeholder="Your Name / आपका नाम"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          )}
          <Input
            placeholder="Phone Number / फोन नंबर"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 rounded-xl text-base"
            type="tel"
          />
          <Button
            type="submit"
            className={`w-full h-12 rounded-xl text-base font-semibold ${isFarmer ? "bg-hero-gradient text-primary-foreground" : "bg-warm-gradient text-secondary-foreground"}`}
          >
            {isRegister ? "Register" : "Login"}
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
