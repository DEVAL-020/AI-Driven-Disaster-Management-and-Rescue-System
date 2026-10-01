import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, X, MessageSquare } from "lucide-react";

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "ai", text: "RESCUE-AI online. Ask me about rescue protocols, resource allocation, or disaster response." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { message: text });
      setMsgs((m) => [...m, { role: "ai", text: data.reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "⚠ Unable to reach AI core. Try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button data-testid="ai-chat-toggle" onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl shadow-blue-600/30 transition-all hover:scale-105">
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-sm h-[460px] bg-[#121824] border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden" data-testid="ai-chat-panel">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0A0D14]">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
              <div>
                <div className="font-heading font-semibold text-white text-sm tracking-wide">RESCUE-AI Assistant</div>
                <div className="font-mono text-[9px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />AI core online</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-[#0A0D14] border border-white/10 text-slate-200"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-[#0A0D14] border border-white/10 rounded-lg px-3 py-2"><Loader2 className="w-4 h-4 animate-spin text-blue-400" /></div></div>}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="p-3 border-t border-white/10 flex gap-2">
              <Input data-testid="ai-chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask RESCUE-AI..."
                className="bg-[#0A0D14] border-white/15 text-white" />
              <Button data-testid="ai-chat-send" type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-3"><Send className="w-4 h-4" /></Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
