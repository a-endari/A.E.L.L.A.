"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Search, Volume2, Sparkles, Download, ArrowRight, BookOpen, Trash2, Save, Eye, EyeOff, Layers, FileText, Info, Plus, ChevronDown, FolderOpen, Palette, Check, Sun, Moon, Monitor, Laptop } from "lucide-react";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types for API Reference
interface WordData {
  original_word: string;
  clean_word: string;
  definitions: string[]; // Changed from string to string[]
  english_definition: string;
  synonyms: string[];
  audio_url: string | null;
}

interface ListData {
  id: number;
  name: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WordData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New State Features
  const [savedCards, setSavedCards] = useState<WordData[]>([]);
  const [lists, setLists] = useState<ListData[]>([]);
  const [activeList, setActiveList] = useState<ListData | null>(null);
  const [showPersian, setShowPersian] = useState(true);

  const [includePersian, setIncludePersian] = useState(true);

  // Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Theming State
  const [theme, setTheme] = useState("default");
  const [mode, setMode] = useState<"manual" | "system">("manual");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Load Theme Preference on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme");
    const savedMode = localStorage.getItem("app-theme-mode") as "manual" | "system" | null;

    if (savedMode === "system") {
      setMode("system");
    } else if (savedTheme) {
      setTheme(savedTheme);
      setMode("manual");
    }
  }, []);

  // System Theme Listener
  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setTheme(mediaQuery.matches ? "default" : "light");
    };

    // Initial check
    handleChange();

    // Listen
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  // Apply Theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (mode === "manual") {
      localStorage.setItem("app-theme", theme);
    }
    localStorage.setItem("app-theme-mode", mode);
  }, [theme, mode]);

  // Close theme menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themes = [
    { id: "default", name: "Midnight", color: "#0f172a" },
    { id: "light", name: "Paper", color: "#f8fafc" },
    { id: "tokyo-night", name: "Tokyo Night", color: "#1a1b26" },
    { id: "ayu", name: "Ayu Mirage", color: "#0f1419" },
    { id: "catppuccin", name: "Catppuccin", color: "#1e1e2e" },
  ];

  // Load lists on mount
  useEffect(() => {
    async function loadLists() {
      try {
        const res = await axios.get("http://localhost:8000/api/lists");
        setLists(res.data);
        if (res.data.length > 0) {
          setActiveList(res.data[0]); // Default to first list (General)
        }
      } catch (e) {
        console.error("Failed to load lists", e);
      }
    }
    loadLists();
  }, []);

  // Load cards when activeList changes
  useEffect(() => {
    if (!activeList) return;

    const listId = activeList.id; // Extract ID to satisfy TypeScript

    async function loadCards() {
      try {
        const res = await axios.get(`http://localhost:8000/api/lists/${listId}/cards`);
        setSavedCards(res.data);
      } catch (e) {
        console.error("Failed to load cards", e);
      }
    }
    loadCards();
  }, [activeList]);

  const searchForWord = async (wordToSearch: string) => {
    setQuery(wordToSearch);
    if (!wordToSearch.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post("http://localhost:8000/api/lookup", {
        word: wordToSearch,
        include_persian: includePersian,
      });
      setData(response.data);
    } catch (err) {
      setError("Could not find word. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    searchForWord(query);
  };

  const playAudio = () => {
    if (data?.audio_url) {
      const audio = new Audio(data.audio_url);
      audio.play();
    }
  };

  // --- Saved Cards Logic ---
  const isSaved = data ? savedCards.some(c => c.clean_word === data.clean_word) : false;

  const toggleSave = async () => {
    if (!data || !activeList) return;
    if (isSaved) {
      // Optimistic update
      setSavedCards(prev => prev.filter(c => c.clean_word !== data.clean_word));
      try {
        await axios.delete(`http://localhost:8000/api/lists/${activeList.id}/cards/${data.clean_word}`);
      } catch (e) {
        console.error("Failed to delete", e);
      }
    } else {
      // Optimistic update
      setSavedCards(prev => [...prev, data]);
      try {
        await axios.post(`http://localhost:8000/api/lists/${activeList.id}/cards`, data);
      } catch (e) {
        console.error("Failed to save", e);
      }
    }
  };

  const removeCard = async (wordToCheck: string) => {
    if (!activeList) return;
    // Optimistic update
    setSavedCards(prev => prev.filter(c => c.clean_word !== wordToCheck));
    try {
      await axios.delete(`http://localhost:8000/api/lists/${activeList.id}/cards/${wordToCheck}`);
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const createList = () => {
    setShowListModal(true);
    setNewListName("");
  };

  const submitCreateList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const res = await axios.post("http://localhost:8000/api/lists", { name: newListName });
      const listRes = await axios.get("http://localhost:8000/api/lists");
      setLists(listRes.data);
      const created = listRes.data.find((l: ListData) => l.name === newListName);
      if (created) setActiveList(created);
      setShowListModal(false);
    } catch (e) {
      alert("Failed to create list (Duplicate name?)");
    }
  };

  const deleteList = async () => {
    if (!activeList) return;
    if (!confirm(`Delete list "${activeList.name}" and all its cards?`)) return;

    try {
      await axios.delete(`http://localhost:8000/api/lists/${activeList.id}`);
      // Refresh
      const res = await axios.get("http://localhost:8000/api/lists");
      setLists(res.data);
      if (res.data.length > 0) setActiveList(res.data[0]);
      else setActiveList(null);
    } catch (e) {
      alert("Failed to delete list.");
    }
  };

  const downloadAnkiDeck = async () => {
    if (savedCards.length === 0 || !activeList) return;
    try {
      const response = await axios.post(`http://localhost:8000/api/anki/download?deck_name=${activeList.name}`, {
        cards: savedCards
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeList.name.replace(" ", "_")}.apkg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Anki download failed", err);
      alert("Failed to download deck.");
    }
  };

  const downloadObsidian = async () => {
    if (savedCards.length === 0 || !activeList) return;
    try {
      const response = await axios.post(`http://localhost:8000/api/obsidian/download?note_name=${activeList.name}`, {
        cards: savedCards
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeList.name.replace(" ", "_")}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Obsidian download failed", err);
      alert("Failed to download zip.");
    }
  };

  return (
    <main className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden relative transition-colors duration-500">
      {/* Global Background Gradients (Dynamic) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-50">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[var(--accent)] rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[var(--accent)] rounded-full blur-[120px] opacity-20" />
      </div>

      {/* Top Right Theme Controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-full backdrop-blur-xl shadow-xl transition-colors">
        {/* Light Mode */}
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

        {/* Dark Mode */}
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

        {/* System Mode */}
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

        {/* Palette Menu */}
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

      {/* --- LEFT SIDEBAR (Saved Cards) --- */}
      <aside className="w-80 border-r border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-xl p-6 flex flex-col gap-6 z-20 h-screen sticky top-0 transition-colors duration-500">
        <div className="space-y-4">
          <div className="flex items-center justify-between font-semibold uppercase tracking-wider text-sm" style={{ color: 'var(--accent)' }}>
            <div className="flex items-center gap-2">
              <Layers size={16} />
              <span>Flashcard Station</span>
            </div>
            <button onClick={createList} className="p-1 hover:bg-[var(--bg-input)] rounded transition-colors" title="Create New List" style={{ color: 'var(--accent)' }}>
              <Plus size={16} />
            </button>
          </div>

          {/* List Selector */}
          <div className="relative group/list">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-input)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                <FolderOpen size={14} style={{ color: 'var(--accent)' }} />
                <span className="truncate max-w-[140px]">{activeList?.name || "No Lists"}</span>
              </div>
              <div className="flex items-center gap-1">
                {lists.length > 1 && (
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const l = lists.find(x => x.id === parseInt(e.target.value));
                      if (l) setActiveList(l);
                    }}
                    value={activeList?.id}
                  >
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                )}
                <ChevronDown size={14} className="text-[var(--text-muted)]" />
              </div>
            </div>

            {activeList && lists.length > 0 && (
              <div className="flex justify-end mt-1">
                <button onClick={deleteList} className="text-[10px] text-[var(--text-muted)] hover:text-red-400 flex items-center gap-1">
                  <Trash2 size={10} /> Delete List
                </button>
              </div>
            )}
          </div>

          {/* Anki Download Area */}
          <div className="p-4 rounded-xl border border-[var(--border)] space-y-3" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs text-[var(--text-muted)]">
              {savedCards.length} cards ready to export.
            </p>
            <button
              onClick={() => downloadAnkiDeck()}
              disabled={savedCards.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 text-white rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Download size={16} />
              Download Anki Deck
            </button>
            <button
              onClick={downloadObsidian}
              disabled={savedCards.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              Export Obsidian Note
            </button>
          </div>


          <Link href="/help" className="flex items-center gap-2 text-xs text-slate-500 hover:text-purple-300 transition-colors px-1 hidden">
            <BookOpen size={14} />
            <span>How to use Obsidian Export?</span>
          </Link>
        </div>

        {/* Reorderable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
          <Reorder.Group axis="y" values={savedCards} onReorder={setSavedCards} className="space-y-2">
            {savedCards.length === 0 && (
              <p className="text-center text-slate-500 text-sm mt-10 italic">
                No cards saved yet.<br />Search and save words!
              </p>
            )}
            {savedCards.map((card) => (
              <Reorder.Item key={card.clean_word} value={card}>
                <motion.div
                  layout
                  onClick={() => setData(card)}
                  className="group p-3 bg-[var(--bg-input)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-main)] transition-colors">
                      {card.clean_word}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{card.english_definition}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent loading the card when deleting
                      removeCard(card.clean_word);
                    }}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </aside>

      {/* --- MAIN CONTENT CENTER --- */}
      <section className="flex-1 flex flex-col items-center p-6 md:p-12 overflow-y-auto h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl space-y-12 my-auto"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-input)] border border-[var(--border)] text-sm mb-4"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles size={14} />
              <span>Universal Language Assistant</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--text-main)]">
              Learn Any Language <br />
              <span style={{ color: 'var(--accent)' }}>Your Way.</span>
            </h1>

            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              Currently optimized for <strong>German from English/Persian</strong>, but built to be your universal companion.
              Generate Anki decks and Obsidian notes for any language journey.
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto w-full group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-muted)] transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a German word (e.g. 'Haus')..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl py-5 pl-12 pr-6 text-xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all shadow-xl shadow-black/5"
            />
            <button
              type="submit"
              disabled={loading || !query}
              className="absolute inset-y-2 right-2 px-4 bg-[var(--bg-input)] hover:bg-[var(--border)] text-[var(--text-main)] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
            </button>
          </form>

          {/* Persian Toggle */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 group relative">
              <input
                type="checkbox"
                id="persianToggle"
                checked={includePersian}
                onChange={(e) => setIncludePersian(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--text-muted)] text-[var(--accent)] focus:ring-[var(--accent)] bg-transparent"
              />
              <label htmlFor="persianToggle" className="text-sm text-[var(--text-muted)] cursor-pointer select-none">
                Include Persian Definitions
              </label>

              {/* Tooltip Wrapper */}
              <div className="relative group/tooltip">
                <Info size={14} className="text-[var(--text-muted)] cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--bg-card)] text-xs text-[var(--text-main)] rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none border border-[var(--border)] shadow-xl z-50">
                  Checking this adds Persian meanings to cards <br /> and exports (Anki/Obsidian).
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-card)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-center"
              >
                {error}
              </motion.div>
            )}

            {data && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors"
              >
                {/* Card Decoration */}
                <div className="absolute top-0 right-0 p-32 bg-[var(--accent)] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-10" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8">
                  {/* Left: Word & Audio */}
                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>German</p>
                      <div className="flex items-center gap-4">
                        <h2 className="text-5xl font-bold text-[var(--text-main)]">{data.clean_word}</h2>
                        {data.audio_url && (
                          <button
                            onClick={playAudio}
                            className="p-3 rounded-full transition-all hover:scale-105 active:scale-95 bg-[var(--bg-input)] text-[var(--accent)] hover:bg-[var(--bg-main)]"
                            title="Play Pronunciation"
                          >
                            <Volume2 size={24} />
                          </button>
                        )}
                      </div>
                      {data.original_word !== data.clean_word && (
                        <p className="text-[var(--text-muted)]">Root: {data.clean_word}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={toggleSave}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border",
                          isSaved
                            ? "bg-green-500/20 border-green-500/30 text-green-500 hover:bg-green-500/30"
                            : "bg-[var(--bg-input)] hover:bg-[var(--border)] border-[var(--border)] text-[var(--text-main)]"
                        )}
                      >
                        {isSaved ? <Save size={16} className="fill-current" /> : <Save size={16} />}
                        {isSaved ? "Saved" : "Save Card"}
                      </button>
                    </div>

                    {/* Synonyms (Moved to Left Column) */}
                    {data.synonyms && data.synonyms.length > 0 && (
                      <div className="pt-6 border-t border-[var(--border)]">
                        <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--accent)' }}>Synonyms</p>
                        <div className="flex flex-wrap gap-2">
                          {data.synonyms.map((syn, i) => (
                            <button
                              key={i}
                              onClick={() => searchForWord(syn)}
                              className="px-3 py-1 rounded-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-main)] text-sm hover:border-[var(--accent)] transition-colors"
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-[var(--border)]" />

                  {/* Right: Definition */}
                  <div className="flex-1 space-y-6">
                    {/* English Definition (Now Top) */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-green-500 uppercase tracking-wider">English Definition</p>
                      <p className="text-xl text-[var(--text-main)] font-serif italic">
                        {data.english_definition || <span className="text-[var(--text-muted)] text-base not-italic">Definition not available</span>}
                      </p>
                    </div>

                    {/* Persian Definition (Now Bottom) */}
                    {/* Persian Definition (Now Bottom) */}
                    {(includePersian) && (
                      <div className="space-y-4 pt-6 border-t border-[var(--border)] relative">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">Persian Definition</p>
                          <button
                            onClick={() => setShowPersian(!showPersian)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] rounded-md transition-colors"
                            title={showPersian ? "Hide Persian" : "Show Persian"}
                          >
                            {showPersian ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </div>

                        <AnimatePresence mode="wait">
                          {showPersian ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-[var(--text-main)] leading-relaxed"
                              dir="rtl"
                            >
                              {data.definitions && data.definitions.length > 0 ? (
                                <ul className="space-y-2 text-2xl font-bold">
                                  {data.definitions.map((def, i) => (
                                    <li key={i} className="flex gap-2 justify-start">
                                      <span>{def}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[var(--text-muted)] italic text-base text-left" dir="ltr">Definition not available</p>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="h-12 bg-[var(--bg-input)] rounded-lg flex items-center justify-center text-sm text-[var(--text-muted)] italic"
                            >
                              Hidden
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </section>

      {/* --- CREATE LIST MODAL --- */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowListModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              {/* Decorative Blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-[80px] opacity-20 -mr-10 -mt-10 pointer-events-none" />

              <h2 className="text-xl font-bold text-[var(--text-main)] mb-1">New List</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Create a collection for your vocabulary.</p>

              <form onSubmit={submitCreateList} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">List Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Verbs, Travel, Nouns..."
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowListModal(false)}
                    className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newListName.trim()}
                    className="px-6 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/20"
                  >
                    Create List
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
