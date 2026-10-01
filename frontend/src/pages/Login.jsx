import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center"><ShieldAlert className="w-6 h-6 text-white" /></div>
          <span className="font-heading font-bold text-2xl tracking-wider uppercase text-white">Sentinel<span className="text-blue-500">AI</span></span>
        </Link>
        <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-7 shadow-2xl">
          <h1 className="font-heading font-bold uppercase tracking-wide text-2xl text-white mb-1">Operator Sign In</h1>
          <p className="text-sm text-slate-400 mb-6">Authenticate to access the command center.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-slate-300 font-mono text-xs uppercase tracking-widest">Email</Label>
              <Input data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-[#0A0D14] border-white/15 text-white" placeholder="operator@rescue.io" />
            </div>
            <div>
              <Label className="text-slate-300 font-mono text-xs uppercase tracking-widest">Password</Label>
              <Input data-testid="login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 bg-[#0A0D14] border-white/15 text-white" placeholder="••••••••" />
            </div>
            <Button data-testid="login-submit-btn" type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
          <p className="text-sm text-slate-400 mt-6 text-center">No account? <Link to="/register" className="text-blue-400 hover:underline">Register as citizen</Link></p>
        </div>
      </div>
    </div>
  );
}

