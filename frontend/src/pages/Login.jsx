import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Access granted");
      navigate("/command");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0D14] flex items-center justify-center p-4 sm:p-5 pt-16 sm:pt-5 overflow-x-hidden">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[#121824]/90 hover:bg-[#1a2336] text-slate-300 hover:text-white border border-white/10 text-xs font-mono uppercase tracking-wider transition-all shadow-lg active:scale-95"
          data-testid="login-back-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          <span>Back</span>
        </button>
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-blue-600 flex items-center justify-center"><ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
          <span className="font-heading font-bold text-xl sm:text-2xl tracking-wider uppercase text-white">Sentinel<span className="text-blue-500">AI</span></span>
        </Link>
        <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-5 sm:p-7 shadow-2xl">
          <h1 className="font-heading font-bold uppercase tracking-wide text-xl sm:text-2xl text-white mb-1">Operator Sign In</h1>
          <p className="text-xs sm:text-sm text-slate-400 mb-5 sm:mb-6">Authenticate to access the command center.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-slate-300 font-mono text-[10px] sm:text-xs uppercase tracking-widest">Email</Label>
              <Input data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-[#0A0D14] border-white/15 text-white text-xs sm:text-sm" placeholder="operator@rescue.io" />
            </div>
            <div>
              <Label className="text-slate-300 font-mono text-[10px] sm:text-xs uppercase tracking-widest">Password</Label>
              <Input data-testid="login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 bg-[#0A0D14] border-white/15 text-white text-xs sm:text-sm" placeholder="••••••••" />
            </div>
            <Button data-testid="login-submit-btn" type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-10 sm:h-11 text-xs sm:text-sm font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
          <p className="text-xs sm:text-sm text-slate-400 mt-5 sm:mt-6 text-center">No account? <Link to="/register" className="text-blue-400 hover:underline font-medium">Register as citizen</Link></p>
        </div>
      </div>
    </div>
  );
}

