"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface ThemeToggleProps {
    theme: string;
    setTheme: (theme: string) => void;
    mode: "manual" | "system";
    setMode: (mode: "manual" | "system") => void;
}

export default function ThemeToggle({ theme, setTheme, mode, setMode }: ThemeToggleProps) {
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    const themes = [
        { id: "default", name: "Midnight", color: "#0f172a" },
        { id: "light", name: "Paper", color: "#f8fafc" },
        { id: "tokyo-night", name: "Tokyo Night", color: "#1a1b26" },
        { id: "ayu", name: "Ayu Mirage", color: "#0f1419" },
        { id: "catppuccin", name: "Catppuccin", color: "#1e1e2e" },
    ];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setShowThemeMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-full backdrop-blur-xl shadow-xl transition-colors">
            <button
                onClick={() => { setMode("manual"); setTheme("light"); }}
                className={cn(
                    "p-2 rounded-full transition-all text-[var(--text-muted)] hover:text-yellow-400",
                    mode === "manual" && theme === "light" ? "bg-[var(--bg-input)] text-yellow-400 shadow-sm" : "hover:bg-[var(--bg-input)]"
                )}
                title="Light Mode"
            >
                <Sun size={18} />
            </button>

            <button
                onClick={() => { setMode("manual"); setTheme("default"); }}
                className={cn(
                    "p-2 rounded-full transition-all text-[var(--text-muted)] hover:text-blue-400",
                    mode === "manual" && theme !== "light" ? "bg-[var(--bg-input)] text-blue-400 shadow-sm" : "hover:bg-[var(--bg-input)]"
                )}
                title="Dark Mode"
            >
                <Moon size={18} />
            </button>

            <button
                onClick={() => setMode("system")}
                className={cn(
                    "p-2 rounded-full transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]",
                    mode === "system" ? "bg-[var(--bg-input)] text-[var(--text-main)] shadow-sm" : "hover:bg-[var(--bg-input)]"
                )}
                title="System Preference"
            >
                <Laptop size={18} />
            </button>

            <div className="w-px h-4 bg-[var(--border)] mx-1" />

            <div ref={themeMenuRef} className="relative">
                <button
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    className={cn(
                        "p-2 rounded-full transition-all text-[var(--text-muted)] hover:text-[var(--accent)]",
                        showThemeMenu ? "text-[var(--accent)] bg-[var(--bg-input)]" : "hover:bg-[var(--bg-input)]"
                    )}
                    title="Select Theme"
                >
                    <Palette size={18} />
                </button>

                <AnimatePresence>
                    {showThemeMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute top-12 right-0 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl p-1.5 flex flex-col gap-0.5"
                        >
                            {themes.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setMode("manual");
                                        setTheme(t.id);
                                        setShowThemeMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg hover:bg-[var(--bg-input)] transition-colors text-left group"
                                >
                                    <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ background: t.color }} />
                                    <span className={cn(
                                        "transition-colors",
                                        theme === t.id ? "font-bold text-[var(--text-main)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                                    )}>
                                        {t.name}
                                    </span>
                                    {theme === t.id && <Check size={12} className="ml-auto text-[var(--accent)]" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
