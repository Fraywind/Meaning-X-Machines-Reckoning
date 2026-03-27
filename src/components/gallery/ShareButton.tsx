"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Loader2, Globe, Copy, ExternalLink } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getUserId, getUserName, setUserName } from "@/lib/userId";
import { safeFetch } from "@/lib/api";

export default function ShareButton() {
  const { nodes, values, goalText, critique } = useStore();
  const [state, setState] = useState<"idle" | "naming" | "sharing" | "done" | "error">("idle");
  const [name, setName] = useState(getUserName() || "");
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!name.trim()) {
      setState("naming");
      return;
    }

    setState("sharing");
    setUserName(name.trim());

    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          userName: name.trim(),
          goalText,
          nodes,
          values,
          critique,
        }),
      });

      const data = await res.json();
      if (data.id) {
        setSharedId(data.id);
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  const handleCopyLink = async () => {
    if (!sharedId) return;
    const url = `${window.location.origin}/gallery?tree=${sharedId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state === "idle") {
    return (
      <button
        onClick={() => {
          if (getUserName()) {
            setName(getUserName()!);
            handleShare();
          } else {
            setState("naming");
          }
        }}
        className="flex-1 py-2.5 px-4 border border-cosmos-border rounded-xl text-cosmos-muted text-xs hover:border-purple-400/30 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share to Gallery
      </button>
    );
  }

  if (state === "naming") {
    return (
      <div className="flex-1 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) handleShare();
          }}
          placeholder="Your display name..."
          className="flex-1 px-3 py-2 text-xs bg-cosmos-bg/60 border border-cosmos-border rounded-xl text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-purple-400/50"
          autoFocus
        />
        <button
          onClick={handleShare}
          disabled={!name.trim()}
          className="px-3 py-2 border border-purple-400/30 rounded-xl text-purple-400 text-xs hover:bg-purple-400/10 disabled:opacity-30 transition-all"
        >
          Share
        </button>
      </div>
    );
  }

  if (state === "sharing") {
    return (
      <div className="flex-1 py-2.5 px-4 border border-cosmos-border rounded-xl text-cosmos-muted text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Sharing...
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 py-2.5 px-4 border border-purple-400/30 rounded-xl text-purple-400 text-xs flex items-center justify-center gap-2 bg-purple-400/5">
          <Check className="w-3.5 h-3.5" />
          Shared!
        </div>
        <button
          onClick={handleCopyLink}
          className="px-3 py-2.5 border border-cosmos-border rounded-xl text-cosmos-muted text-xs hover:border-cosmos-glow/30 transition-all flex items-center gap-1"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Link"}
        </button>
        <a
          href="/gallery"
          className="px-3 py-2.5 border border-cosmos-border rounded-xl text-cosmos-muted text-xs hover:border-cosmos-glow/30 transition-all flex items-center gap-1"
        >
          <Globe className="w-3 h-3" />
          Gallery
        </a>
      </div>
    );
  }

  // error
  return (
    <button
      onClick={() => setState("idle")}
      className="flex-1 py-2.5 px-4 border border-cosmos-conflict/30 rounded-xl text-cosmos-conflict text-xs flex items-center justify-center gap-2"
    >
      Failed — try again
    </button>
  );
}
