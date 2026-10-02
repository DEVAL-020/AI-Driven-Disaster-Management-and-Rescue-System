import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, Radio, BrainCircuit, Network, Lock, MapPin, ArrowRight, Activity,
} from "lucide-react";

const features = [
  { icon: BrainCircuit, title: "AI Prediction", desc: "GPT-powered severity scoring, spread forecasting & auto-generated rescue actions.", color: "text-blue-400" },
  { icon: Radio, title: "IoT Telemetry", desc: "Live seismic, flood, thermal & air-quality sensor feeds with edge streaming.", color: "text-cyan-400" },
  { icon: Network, title: "Resilient Mesh", desc: "MQTT-over-TLS mesh topology with ping, packet-loss & bandwidth monitoring.", color: "text-emerald-400" },
  { icon: Lock, title: "Cyber Secure", desc: "AES-256 / RSA-2048 encryption, DDoS mitigation & live security event logs.", color: "text-amber-400" },
  { icon: MapPin, title: "Live Geo Map", desc: "Interactive incident map with real-time markers and severity overlays.", color: "text-rose-400" },
  { icon: ShieldAlert, title: "Rescue Ops", desc: "Citizen SOS portal, team allocation and dispatch coordination.", color: "text-violet-400" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 overflow-x-hidden">
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0A0D14]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="navbar-brand-logo">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-wider uppercase">Sentinel<span className="text-blue-500">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5" data-testid="nav-login-btn">Sign In</Button></Link>
            <Link to="/register"><Button className="bg-blue-600 hover:bg-blue-500 text-white" data-testid="nav-register-btn">Get Access</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative pt-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1790700552918-dc279338ac26?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600" alt="command center" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D14]/70 via-[#0A0D14]/85 to-[#0A0D14]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 py-24 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
              <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-blue-300">AI · IoT · Cloud · Networks · Cybersecurity</span>
            </div>
            <h1 className="font-heading font-extrabold uppercase tracking-wide text-4xl sm:text-5xl lg:text-7xl leading-[0.95]">
              AI-Driven Disaster<br /><span className="text-blue-500">Command & Rescue</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              A real-time crisis intelligence platform that fuses live IoT sensor telemetry with AI prediction over a secure, resilient network mesh — coordinating rescue operations from a single tactical command center.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/register"><Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-7 text-base group" data-testid="hero-get-started-btn">Launch Command Center <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="h-12 px-7 text-base border-white/20 bg-white/5 text-white hover:bg-white/10" data-testid="hero-signin-btn">Operator Sign In</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative max-w-7xl mx-auto px-5 pb-28">
        <h2 className="font-heading font-bold uppercase tracking-wide text-2xl sm:text-3xl mb-10 text-center">Integrated Response Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="bg-[#121824]/90 border border-white/10 rounded-lg p-6 hover:border-blue-500/40 hover:bg-[#1a2336] transition-all duration-200">
              <f.icon className={`w-8 h-8 ${f.color} mb-4`} />
              <h3 className="font-heading font-semibold text-lg tracking-wide mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">SentinelAI · Computer Networks PBL · Disaster Management & Rescue System</p>
      </footer>
    </div>
  );
}
