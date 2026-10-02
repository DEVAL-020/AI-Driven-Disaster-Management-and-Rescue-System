import { Github, ExternalLink } from "lucide-react";

export default function FloatingGithubButton() {
  const repoUrl = "https://github.com/DEVAL-020/AI-Driven-Disaster-Management-and-Rescue-System";

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="View Source Code on GitHub"
      data-testid="floating-github-btn"
      className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#121824]/95 backdrop-blur-md text-white border border-white/20 hover:border-blue-500/60 shadow-2xl hover:shadow-blue-500/20 hover:bg-[#1a2336] transition-all duration-300 hover:scale-105 active:scale-95 group"
    >
      <div className="relative flex items-center justify-center">
        <Github className="w-5 h-5 text-white group-hover:text-blue-400 transition-colors" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      </div>
      <span className="font-heading text-xs font-semibold uppercase tracking-wider text-slate-200 group-hover:text-white transition-colors">
        GitHub Code
      </span>
      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors ml-0.5" />
    </a>
  );
}
