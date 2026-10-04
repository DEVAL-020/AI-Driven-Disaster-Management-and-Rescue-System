import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role: "citizen" });
      toast.success("Account created");
      navigate("/command");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0D14] flex items-center justify-center p-4 sm:p-5 pt-16 sm:pt-5 overflow-x-hidden">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#121824]/90 hover:bg-[#1a2336] text-slate-200 hover:text-white border border-white/15 text-xs sm:text-sm font-mono uppercase tracking-wider transition-all shadow-lg active:scale-95"
          data-testid="register-back-btn"
        >
          <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-400" />
          <span>Back</span>
        </button>
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-blue-600 flex items-center justify-center"><ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
          <span className="font-heading font-bold text-xl sm:text-2xl tracking-wider uppercase text-white">Sentinel<span className="text-blue-500">AI</span></span>
        </Link>
        <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-6 sm:p-8 shadow-2xl">
          <h1 className="font-heading font-bold uppercase tracking-wide text-2xl sm:text-3xl text-white mb-1.5">Citizen Registration</h1>
          <p className="text-sm sm:text-base text-slate-300 mb-6 sm:mb-7">Register to report emergencies and request rescue.</p>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Full Name</Label>
              <Input data-testid="register-name-input" required value={form.name} onChange={set("name")}
                className="mt-1.5 bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 px-3.5" placeholder="Jordan Smith" />
            </div>
            <div>
              <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Email</Label>
              <Input data-testid="register-email-input" type="email" required value={form.email} onChange={set("email")}
                className="mt-1.5 bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 px-3.5" placeholder="you@email.com" />
            </div>
            <div>
              <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Password</Label>
              <div className="relative mt-1.5">
                <Input data-testid="register-password-input" type={showPassword ? "text" : "password"} required minLength={6} value={form.password} onChange={set("password")}
                  className="bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 pl-3.5 pr-11" placeholder="Min 6 characters" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  data-testid="register-toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button data-testid="register-submit-btn" type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>
          <p className="text-sm sm:text-base text-slate-300 mt-6 sm:mt-7 text-center">Already registered? <Link to="/login" className="text-blue-400 hover:underline font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
