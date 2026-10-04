import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, Loader2, ArrowLeft, Eye, EyeOff, Sparkles, ShieldCheck, User, AlertCircle } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [roleMode, setRoleMode] = useState("citizen"); // "citizen" or "rescue_team"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEmailValid = !form.email || EMAIL_REGEX.test(form.email.trim());

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const suggestStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
    let pwd = "";
    pwd += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    pwd += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    pwd += "0123456789"[Math.floor(Math.random() * 10)];
    pwd += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    for (let i = 0; i < 10; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    pwd = pwd.split("").sort(() => 0.5 - Math.random()).join("");
    setForm({ ...form, password: pwd });
    setShowPassword(true);
    navigator.clipboard.writeText(pwd).catch(() => {});
    toast.success("Strong password suggested & copied to clipboard!");
  };

  const getStrength = (p) => {
    if (!p) return { score: 0, label: "", color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { score: 25, label: "Weak", color: "bg-red-500", text: "text-red-400" };
    if (score === 2) return { score: 50, label: "Fair", color: "bg-amber-500", text: "text-amber-400" };
    if (score === 3) return { score: 75, label: "Good", color: "bg-blue-500", text: "text-blue-400" };
    return { score: 100, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
  };

  const strength = getStrength(form.password);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) {
      toast.error("Please enter a valid email address (e.g. user@domain.com)");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role: roleMode });
      toast.success("Account registered successfully");
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

        <div className="bg-[#121824]/90 border border-white/10 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Role Switcher Tabs */}
          <div className="flex bg-[#0A0D14] p-1 rounded-lg border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setRoleMode("citizen")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                roleMode === "citizen"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              data-testid="register-role-tab-citizen"
            >
              <User className="w-4 h-4" />
              <span>Citizen Account</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleMode("rescue_team")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                roleMode === "rescue_team"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              data-testid="register-role-tab-operator"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Responder Team</span>
            </button>
          </div>

          <div className="mb-6">
            <h1 className="font-heading font-bold uppercase tracking-wide text-2xl sm:text-3xl text-white mb-1.5">
              {roleMode === "citizen" ? "Citizen Registration" : "Responder Registration"}
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              {roleMode === "citizen"
                ? "Register to report emergencies, request rescue, and view live safety maps."
                : "Register for tactical dispatch, team coordination, and field ops access."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Full Name</Label>
              <Input
                data-testid="register-name-input"
                required
                value={form.name}
                onChange={set("name")}
                className="mt-1.5 bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 px-3.5"
                placeholder={roleMode === "citizen" ? "Jordan Smith" : "Officer Alex Mercer"}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Email Address</Label>
                {form.email && !isEmailValid && (
                  <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Invalid Email</span>
                )}
              </div>
              <Input
                data-testid="register-email-input"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                className={`bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 px-3.5 transition-colors ${
                  form.email && !isEmailValid ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder={roleMode === "citizen" ? "you@email.com" : "responder@rescue.io"}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Password</Label>
                <button
                  type="button"
                  onClick={suggestStrongPassword}
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 hover:underline focus:outline-none"
                  data-testid="register-suggest-password-btn"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Suggest Strong Password</span>
                </button>
              </div>

              <div className="relative">
                <Input
                  data-testid="register-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={set("password")}
                  className="bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 pl-3.5 pr-11"
                  placeholder="Min 6 characters"
                />
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

              {/* Password Strength Meter */}
              {form.password && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                  </div>
                </div>
              )}
            </div>

            <Button
              data-testid="register-submit-btn"
              type="submit"
              disabled={loading || (form.email ? !isEmailValid : false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-blue-600/25"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Create ${roleMode === "citizen" ? "Citizen" : "Responder"} Account`}
            </Button>
          </form>

          <p className="text-sm sm:text-base text-slate-300 mt-6 sm:mt-7 text-center">
            Already registered? <Link to="/login" className="text-blue-400 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
