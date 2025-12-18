"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Search, Volume2, Sparkles, Download, ArrowRight, BookOpen, Trash2, Save, Layers, FileText, Info, Plus, ChevronDown, FolderOpen, Palette, Check, Sun, Moon, Laptop, Edit2, Folder, X } from "lucide-react";
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
  definitions: string[];
  english_definition: string;
  synonyms: string[];
  audio_url: string | null;
  last_review?: string;
  source_lang?: string;
  target_lang?: string;
  secondary_lang?: string;
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

  // Learning Mode State
  const [learningMode, setLearningMode] = useState(false);
  const [learningQueue, setLearningQueue] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [dailyLimit, setDailyLimit] = useState(20);
  const [sessionTime, setSessionTime] = useState(0); // Timer in seconds
  // New State Features
  const [savedCards, setSavedCards] = useState<WordData[]>([]);
  const [lists, setLists] = useState<ListData[]>([]);
  const [activeList, setActiveList] = useState<ListData | null>(null);

  // Language Support
  const [sourceLang, setSourceLang] = useState("en");
  const [sourceLangState, setSourceLangState] = useState("de");
  const [targetLang, setTargetLang] = useState("en");
  const [secondaryTargetLang, setSecondaryTargetLang] = useState<string>(""); // Empty by default

  // Learning Logic State

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const supportedLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "fa", name: "Persian", flag: "🇮🇷" },
    { code: "tr", name: "Turkish", flag: "🇹🇷" },
    { code: "nl", name: "Dutch", flag: "🇳🇱" },
    { code: "pl", name: "Polish", flag: "🇵🇱" },
  ];

  // Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingListName, setEditingListName] = useState("");

  // Notification State
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error" | "info">("info");

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load Lists on Mount
  useEffect(() => {
    const loadLists = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/lists");
        setLists(response.data);
        if (response.data.length > 0 && !activeList) {
          setActiveList(response.data[0]);
        }
      } catch (e) {
        console.error("Failed to load lists", e);
      }
    };
    loadLists();
  }, []);

  // Load Cards for Active List
  useEffect(() => {
    if (!activeList) {
      setSavedCards([]);
      return;
    }
    const loadCards = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/lists/${activeList.id}/cards`);
        setSavedCards(response.data);
      } catch (e) {
        console.error("Failed to load cards", e);
        setSavedCards([]);
      }
    };
    loadCards();
  }, [activeList]);

  // Session Timer
  useEffect(() => {
    if (!learningMode) {
      setSessionTime(0);
      return;
    }

    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [learningMode]);

  const searchForWord = async (wordToSearch: string) => {
    setQuery(wordToSearch);
    if (!wordToSearch.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post("http://localhost:8000/api/lookup", {
        word: wordToSearch,
        source_lang: sourceLangState,
        target_lang: targetLang,
        secondary_lang: secondaryTargetLang || null,
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
    if (!data) return;

    // Validation: Check if a list exists
    if (!activeList) {
      if (lists.length === 0) {
        if (confirm("You need to create a list first! Create one now?")) {
          createList();
        }
      } else {
        alert("Please select a list to save to.");
      }
      return;
    }

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

    if (newListName.trim().toLowerCase() === 'general') {
      setNotificationMessage('❌ "General" is a reserved name.');
      setNotificationType('error');
      setShowNotification(true);
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/lists", { name: newListName });
      const listRes = await axios.get("http://localhost:8000/api/lists");
      setLists(listRes.data);
      const created = listRes.data.find((l: ListData) => l.name === newListName);
      if (created) setActiveList(created);
      setShowNotification(true);
      setNotificationMessage('✅ List created successfully!');
      setNotificationType('success');
      setShowListModal(false);
    } catch (e) {
      setNotificationMessage('❌ Failed to create list (Duplicate name?)');
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  const deleteList = async (listId?: number) => {
    const listToDelete = listId ? lists.find(l => l.id === listId) : activeList;
    if (!listToDelete) return;

    if (listToDelete.name === 'General') {
      setNotificationMessage('❌ Cannot delete the default "General" list.');
      setNotificationType('error');
      setShowNotification(true);
      return;
    }

    if (!confirm(`Delete list "${listToDelete.name}" and all its cards?`)) return;

    try {
      await axios.delete(`http://localhost:8000/api/lists/${listToDelete.id}`);
      const listRes = await axios.get("http://localhost:8000/api/lists");
      setLists(listRes.data);

      // If we deleted the active list, switch to the first one available
      if (activeList?.id === listToDelete.id) {
        if (listRes.data.length > 0) setActiveList(listRes.data[0]);
        else setActiveList(null);
        setSavedCards([]);
      }

      setNotificationMessage('🗑️ List deleted successfully.');
      setNotificationType('success');
      setShowNotification(true);
    } catch (e) {
      setNotificationMessage('❌ Failed to delete list.');
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  const renameList = async (listId: number, newName: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    if (list.name === 'General') {
      setNotificationMessage('❌ Cannot rename the default "General" list.');
      setNotificationType('error');
      setShowNotification(true);
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/lists/${listId}`, { name: newName });
      const res = await axios.get("http://localhost:8000/api/lists");
      setLists(res.data);
      setEditingListId(null);
      setNotificationMessage('✏️ List renamed successfully.');
      setNotificationType('success');
      setShowNotification(true);
    } catch (e) {
      setNotificationMessage('❌ Failed to rename list (Duplicate name?)');
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  const exportToAnki = async () => {
    if (savedCards.length === 0 || !activeList) return;
    try {
      const response = await axios.post(`http://localhost:8000/api/anki/download`, {
        cards: savedCards,
        deck_name: activeList.name,
        source_lang: sourceLangState,
        target_lang: targetLang,
        secondary_lang: secondaryTargetLang || null,
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeList.name}.apkg`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Anki export failed', e);
      alert("Failed to download deck.");
    }
  };

  const exportToObsidian = async () => {
    if (savedCards.length === 0 || !activeList) return;
    try {
      const response = await axios.post(`http://localhost:8000/api/obsidian/download`, {
        cards: savedCards,
        note_name: activeList.name,
        source_lang: sourceLangState,
        target_lang: targetLang,
        secondary_lang: secondaryTargetLang || null,
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeList.name}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Obsidian export failed', e);
      alert("Failed to download zip.");
    }
  };

  const startLearning = () => {
    if (savedCards.length === 0) return;
    // Shuffle cards for learning
    const shuffled = [...savedCards].sort(() => Math.random() - 0.5);
    setLearningQueue(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setLearningMode(true);
    setSessionStats({ reviewed: 0, correct: 0 });
  };

  const handleRating = async (rating: 'hard' | 'good' | 'easy') => {
    if (!activeList || learningQueue.length === 0) return;

    const currentCard = learningQueue[currentCardIndex];
    // Update card progress (simplified logic)
    // We cast to any to avoid TS errors for now, or we update the interface later
    const updatedCard = { ...currentCard, last_review: new Date().toISOString() };

    try {
      await axios.put(`http://localhost:8000/api/lists/${activeList.id}/cards/${currentCard.clean_word}`, updatedCard);
    } catch (e) {
      console.error("Failed to update card progress", e);
    }

    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: rating === 'hard' ? prev.correct : prev.correct + 1
    }));

    // SRS Logic: If hard, re-queue the card
    if (rating === 'hard') {
      setLearningQueue(prev => [...prev, currentCard]);
    }

    // Reset flip state FIRST to prevent showing back of next card
    setIsFlipped(false);

    if (currentCardIndex < learningQueue.length - 1 || rating === 'hard') {
      // Small delay to allow flip animation to complete before switching cards
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
      }, 150);
    } else {
      // End of session
      setNotificationMessage(`🎉 Session Complete! You reviewed ${sessionStats.reviewed + 1} cards.`);
      setNotificationType("success");
      setShowNotification(true);
      setTimeout(() => setLearningMode(false), 2000);
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

      {/* Themed Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[300] max-w-md"
          >
            <div className={`p-6 rounded-2xl backdrop-blur-xl shadow-2xl border ${notificationType === 'success' ? 'bg-green-500/20 border-green-500/30' :
              notificationType === 'error' ? 'bg-red-500/20 border-red-500/30' :
                'bg-blue-500/20 border-blue-500/30'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`text-3xl ${notificationType === 'success' ? 'text-green-400' :
                  notificationType === 'error' ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                  {notificationType === 'success' ? '✓' : notificationType === 'error' ? '✕' : 'ⓘ'}
                </div>
                <div className="flex-1">
                  <p className="text-[var(--text-main)] font-medium leading-relaxed">
                    {notificationMessage}
                  </p>
                </div>
                <button
                  onClick={() => setShowNotification(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <div className="absolute w-4 h-0.5 bg-current rotate-45 rounded-full" />
                    <div className="absolute w-4 h-0.5 bg-current -rotate-45 rounded-full" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <aside className="w-80 border-r border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-xl p-6 flex flex-col gap-6 z-20 h-screen sticky top-0 transition-colors duration-500">
        <div className="space-y-4">
          <div className="flex items-center justify-between font-semibold uppercase tracking-wider text-sm" style={{ color: 'var(--accent)' }}>
            <div className="flex items-center gap-2">
              <Layers size={16} />
              <span>Flashcard Station</span>
            </div>
            <div className="flex gap-1">
              <button onClick={createList} className="p-1 hover:bg-[var(--bg-input)] rounded transition-colors" title="Create New List" style={{ color: 'var(--accent)' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Prominent Learning Button */}
          <button
            onClick={startLearning}
            disabled={savedCards.length === 0}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white font-bold text-shadow shadow-lg shadow-purple-500/20 hover:scale-[1.02] hover:shadow-purple-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)' }}
          >
            <BookOpen size={20} className="fill-white/20" />
            Start Learning
          </button>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-input)] rounded-lg border border-[var(--border)] mb-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                <FolderOpen size={14} style={{ color: 'var(--accent)' }} />
                <span className="font-bold">My Lists</span>
              </div>
              <button
                onClick={createList}
                className="p-1 hover:text-[var(--accent)] transition-colors"
                title="Create New List"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {lists.map((list) => (
                <div key={list.id} className="group relative flex items-center justify-between">
                  {editingListId === list.id ? (
                    <div className="flex-1 px-3 py-2 bg-[var(--bg-input)] rounded-lg border border-[var(--accent)] flex items-center gap-2">
                      <input
                        autoFocus
                        className="bg-transparent text-sm text-[var(--text-main)] outline-none flex-1"
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameList(list.id, editingListName);
                          else if (e.key === 'Escape') setEditingListId(null);
                        }}
                        onBlur={() => renameList(list.id, editingListName)}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setActiveList(list)}
                      className={cn(
                        "flex-1 flex items-center justify-between px-3 py-2 rounded-lg border transition-all cursor-pointer",
                        activeList?.id === list.id
                          ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--text-main)]"
                          : "bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-main)]"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm overflow-hidden">
                        <FolderOpen size={14} className={activeList?.id === list.id ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                        <span className="truncate">{list.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {list.name !== 'General' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingListId(list.id);
                              setEditingListName(list.name);
                            }}
                            className="p-1 hover:text-[var(--accent)] transition-colors"
                            title="Rename List"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {list.name !== 'General' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteList(list.id);
                            }}
                            className="p-1 hover:text-red-400 transition-colors"
                            title="Delete List"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] space-y-3" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs text-[var(--text-muted)]">
              {savedCards.length} cards ready to export.
            </p>
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                disabled={savedCards.length === 0}
              >
                <Download size={16} />
                Export Deck
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    <button onClick={exportToAnki} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] text-sm flex items-center gap-2">
                      <Layers size={14} /> Anki Deck (.apkg)
                    </button>
                    <div className="h-px bg-[var(--border)]" />
                    <button onClick={exportToObsidian} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] text-sm flex items-center gap-2">
                      <FileText size={14} /> Obsidian Note (.zip)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Link href="/help" className="flex items-center gap-2 text-xs text-slate-500 hover:text-purple-300 transition-colors px-1 hidden">
            <BookOpen size={14} />
            <span>How to use Obsidian Export?</span>
          </Link>
        </div>

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

      <section className="flex-1 flex flex-col items-center p-6 md:p-12 overflow-y-auto h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl space-y-12 my-auto"
        >
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

            <p className="text-[var(--text-muted)] text-lg leading-relaxed">
              Your <strong>universal language companion</strong>. Learn any language pair with intelligent flashcards, spaced repetition, and seamless exports to Anki and Obsidian.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">From</span>
              <div className="relative">
                <select
                  value={sourceLangState}
                  onChange={(e) => setSourceLangState(e.target.value)}
                  className="appearance-none bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-main)] py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer hover:bg-[var(--bg-main)] transition-colors min-w-[140px]"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            <div className="text-[var(--text-muted)] p-2 bg-[var(--bg-input)] rounded-full">
              <ArrowRight size={16} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">To</span>
              <div className="relative">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="appearance-none bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-main)] py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer hover:bg-[var(--bg-main)] transition-colors min-w-[140px]"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            {/* Secondary Language Selector (Inline) */}
            <div className="w-px h-8 bg-[var(--border)] mx-2 hidden md:block" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">2nd Lang</span>
              <div className="relative">
                <select
                  value={secondaryTargetLang}
                  onChange={(e) => setSecondaryTargetLang(e.target.value)}
                  className="appearance-none bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-main)] py-2 pl-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer hover:bg-[var(--bg-main)] transition-colors min-w-[120px]"
                >
                  <option value="">(None)</option>
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto w-full group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-muted)] transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Type a ${supportedLanguages.find(l => l.code === sourceLangState)?.name} word...`}
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
                className="mt-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors"
              >
                <div className="absolute top-0 right-0 p-32 bg-[var(--accent)] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-10" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                        {supportedLanguages.find(l => l.code === (data.source_lang || sourceLangState))?.name}
                      </p>
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

                  <div className="hidden md:block w-px bg-[var(--border)]" />

                  <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                      {/* Dynamic Primary Label */}
                      <p className="text-sm font-medium text-green-500 uppercase tracking-wider">
                        {supportedLanguages.find(l => l.code === (data.target_lang || targetLang))?.name} Definition
                      </p>
                      <p className="text-xl text-[var(--text-main)] font-serif italic">
                        {data.english_definition || <span className="text-[var(--text-muted)] text-base not-italic">Definition not available</span>}
                      </p>
                    </div>

                    {/* Dynamic Secondary Label */}
                    {(data.secondary_lang || (data.definitions && data.definitions.length > 0)) && (
                      <div className="space-y-4 pt-6 border-t border-[var(--border)] relative">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">
                            {supportedLanguages.find(l => l.code === (data.secondary_lang || secondaryTargetLang))?.name} Definition
                          </p>
                        </div>

                        <div className="text-[var(--text-main)] leading-relaxed" dir="rtl">
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
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </section>

      <AnimatePresence>
        {learningMode && learningQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col items-center justify-center p-6"
          >
            {/* Close Button */}
            <button
              onClick={() => setLearningMode(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[var(--bg-input)] hover:bg-red-500/20 hover:text-red-500 transition-colors"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="absolute w-5 h-0.5 bg-current rotate-45 rounded-full" />
                <div className="absolute w-5 h-0.5 bg-current -rotate-45 rounded-full" />
              </div>
            </button>

            {/* Timer Display */}
            <div className="mb-4 text-center">
              <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-1">Session Time</p>
              <p className="text-3xl font-bold text-[var(--accent)] tabular-nums">
                {Math.floor(sessionTime / 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-lg h-2 bg-[var(--bg-input)] rounded-full mb-8 overflow-hidden relative">
              <div className="absolute inset-0 bg-white/5" />
              <div
                className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-400 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${((currentCardIndex) / learningQueue.length) * 100}%` }}
              />
            </div>

            {/* Flashcard */}
            <div
              className="relative w-full max-w-xl aspect-video perspective-1000 cursor-pointer group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* FRONT */}
                <div className="absolute inset-0 backface-hidden bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl flex flex-col items-center justify-center p-12 shadow-2xl group-hover:border-[var(--accent)] transition-colors">
                  <p className="text-sm uppercase tracking-widest text-[var(--accent)] mb-4">
                    {supportedLanguages.find(l => l.code === (learningQueue[currentCardIndex].source_lang || sourceLangState))?.name || 'Translate this'}
                  </p>
                  <h2 className="text-6xl font-bold text-[var(--text-main)] text-center">
                    {learningQueue[currentCardIndex].clean_word}
                  </h2>
                  <p className="mt-8 text-[var(--text-muted)] text-sm animate-pulse opacity-50 backface-hidden">Click to flip</p>
                </div>

                {/* BACK */}
                <div
                  className="absolute inset-0 backface-hidden bg-[var(--bg-card)] border border-[var(--active-border)] rounded-3xl flex flex-col items-center justify-center p-12 shadow-2xl"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <p className="text-xs font-medium text-green-500 uppercase tracking-widest mb-2">
                    {supportedLanguages.find(l => l.code === (learningQueue[currentCardIndex].target_lang || targetLang))?.name}
                  </p>
                  <h3 className="text-4xl font-serif italic text-[var(--text-main)] text-center mb-6">
                    {learningQueue[currentCardIndex].english_definition}
                  </h3>
                  {learningQueue[currentCardIndex].audio_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const audio = new Audio(learningQueue[currentCardIndex].audio_url!);
                        audio.play();
                      }}
                      className="p-4 rounded-full bg-[var(--bg-input)] text-[var(--accent)] hover:scale-110 transition-transform mb-4"
                    >
                      <Volume2 size={32} />
                    </button>
                  )}
                  {learningQueue[currentCardIndex].definitions && learningQueue[currentCardIndex].definitions.length > 0 && (
                    <div className="mt-4 flex flex-col items-center">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                        {supportedLanguages.find(l => l.code === (learningQueue[currentCardIndex].secondary_lang || secondaryTargetLang))?.name}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {learningQueue[currentCardIndex].definitions.map((def: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-[var(--bg-input)] rounded-full text-sm text-[var(--text-muted)]">
                            {def}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="mt-12 flex gap-4">
              {!isFlipped ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                  className="px-8 py-3 bg-[var(--accent)] text-white rounded-xl font-medium shadow-lg shadow-[var(--accent)]/20 hover:scale-105 transition-transform"
                >
                  Show Answer
                </button>
              ) : (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleRating('hard'); }} className="px-6 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">Hard</button>
                  <button onClick={(e) => { e.stopPropagation(); handleRating('good'); }} className="px-6 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-colors">Good</button>
                  <button onClick={(e) => { e.stopPropagation(); handleRating('easy'); }} className="px-6 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors">Easy</button>
                </>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowListModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
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
