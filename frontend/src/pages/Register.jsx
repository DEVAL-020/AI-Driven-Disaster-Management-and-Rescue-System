import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
    <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center"><ShieldAlert className="w-6 h-6 text-white" /></div>
          <span className="font-heading font-bold text-2xl tracking-wider uppercase text-white">Sentinel<span className="text-blue-500">AI</span></span>
        </Link>
        <div className="bg-[#121824]/90 border border-white/10 rounded-lg p-7 shadow-2xl">
          <h1 className="font-heading font-bold uppercase tracking-wide text-2xl text-white mb-1">Citizen Registration</h1>
          <p className="text-sm text-slate-400 mb-6">Register to report emergencies and request rescue.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-slate-300 font-mono text-xs uppercase tracking-widest">Full Name</Label>
              <Input data-testid="register-name-input" required value={form.name} onChange={set("name")}
                className="mt-1.5 bg-[#0A0D14] border-white/15 text-white" placeholder="Jordan Smith" />
            </div>
            <div>
              <Label className="text-slate-300 font-mono text-xs uppercase tracking-widest">Email</Label>
              <Input data-testid="register-email-input" type="email" required value={form.email} onChange={set("email")}
                className="mt-1.5 bg-[#0A0D14] border-white/15 text-white" placeholder="you@email.com" />
            </div>
            <div>
              <Label className="text-slate-300 font-mono text-xs uppercase tracking-widest">Password</Label>
              <Input data-testid="register-password-input" type="password" required minLength={6} value={form.password} onChange={set("password")}
                className="mt-1.5 bg-[#0A0D14] border-white/15 text-white" placeholder="Min 6 characters" />
            </div>
            <Button data-testid="register-submit-btn" type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
          <p className="text-sm text-slate-400 mt-6 text-center">Already registered? <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
