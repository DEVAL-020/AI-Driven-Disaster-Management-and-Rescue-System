import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck, User, AlertCircle } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [roleMode, setRoleMode] = useState("operator"); // "operator" or "citizen"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEmailValid = !email || EMAIL_REGEX.test(email.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      toast.error("Please enter a valid email address (e.g. user@domain.com)");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Access granted");
      navigate("/command");
    } catch (err) {
      toast.error(formatApiError(err));
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
          data-testid="login-back-btn"
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
              onClick={() => setRoleMode("operator")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                roleMode === "operator"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              data-testid="role-tab-operator"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Operator Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleMode("citizen")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                roleMode === "citizen"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              data-testid="role-tab-citizen"
            >
              <User className="w-4 h-4" />
              <span>Citizen Sign In</span>
            </button>
          </div>

          <div className="mb-6">
            <h1 className="font-heading font-bold uppercase tracking-wide text-2xl sm:text-3xl text-white mb-1.5">
              {roleMode === "operator" ? "Operator Sign In" : "Citizen Sign In"}
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              {roleMode === "operator"
                ? "Authenticate to access tactical command center & dispatch."
                : "Sign in to access citizen portal & emergency tracking."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Email Address</Label>
                {email && !isEmailValid && (
                  <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Invalid Email</span>
                )}
              </div>
              <Input
                data-testid="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 px-3.5 transition-colors ${
                  email && !isEmailValid ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder={roleMode === "operator" ? "operator@rescue.io" : "citizen@rescue.io"}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-slate-200 font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">Password</Label>
              </div>

              <div className="relative">
                <Input
                  data-testid="login-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0A0D14] border-white/20 text-white text-sm sm:text-base h-11 pl-3.5 pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading || (email ? !isEmailValid : false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-blue-600/25"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Sign In as ${roleMode === "operator" ? "Operator" : "Citizen"}`}
            </Button>
          </form>

          <p className="text-sm sm:text-base text-slate-300 mt-6 sm:mt-7 text-center">
            No account yet? <Link to="/register" className="text-blue-400 hover:underline font-medium">Create a new account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
