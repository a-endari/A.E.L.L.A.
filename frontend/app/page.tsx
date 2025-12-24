"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight, ChevronDown } from "lucide-react";
import axios from "axios";

import ThemeToggle from "../components/ThemeToggle";
import Sidebar from "../components/Sidebar";
import SearchResults from "../components/SearchResults";
import NotificationToast from "../components/NotificationToast";
import ListModal from "../components/ListModal";
import LearningOverlay from "../components/LearningOverlay";
import { WordData, ListData } from "../types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WordData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Learning Mode State
  const [learningMode, setLearningMode] = useState(false);
  const [learningQueue, setLearningQueue] = useState<WordData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [sessionTime, setSessionTime] = useState(0); // Timer in seconds

  // New State Features
  const [savedCards, setSavedCards] = useState<WordData[]>([]);
  const [lists, setLists] = useState<ListData[]>([]);
  const [activeList, setActiveList] = useState<ListData | null>(null);

  // Language Support
  const [sourceLangState, setSourceLangState] = useState("de");
  const [targetLang, setTargetLang] = useState("en");
  const [secondaryTargetLang, setSecondaryTargetLang] = useState<string>("");

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

  // Notification State
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error" | "info">("info");

  // Theming State
  const [theme, setTheme] = useState("default");
  const [mode, setMode] = useState<"manual" | "system">("manual");

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
    handleChange(); // Initial check
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await axios.post("http://localhost:8000/api/lists", { name: newListName });
      const listRes = await axios.get("http://localhost:8000/api/lists");
      setLists(listRes.data);
      const created = listRes.data.find((l: ListData) => l.name === newListName);
      if (created) setActiveList(created);
      setShowNotification(true);
      setNotificationMessage('✅ List created successfully!');
      setNotificationType('success');
      setShowListModal(false);
    } catch {
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

      if (activeList?.id === listToDelete.id) {
        if (listRes.data.length > 0) setActiveList(listRes.data[0]);
        else setActiveList(null);
        setSavedCards([]);
      }

      setNotificationMessage('🗑️ List deleted successfully.');
      setNotificationType('success');
      setShowNotification(true);
    } catch {
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
      setNotificationMessage('✏️ List renamed successfully.');
      setNotificationType('success');
      setShowNotification(true);
    } catch {
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

    if (rating === 'hard') {
      setLearningQueue(prev => [...prev, currentCard]);
    }

    setIsFlipped(false);
    if (currentCardIndex < learningQueue.length - 1 || rating === 'hard') {
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
      }, 150);
    } else {
      setNotificationMessage(`🎉 Session Complete! You reviewed ${sessionStats.reviewed + 1} cards.`);
      setNotificationType("success");
      setShowNotification(true);
      setTimeout(() => setLearningMode(false), 2000);
    }
  };

  return (
    <main className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden relative transition-colors duration-500">
      {/* Global Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-50">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[var(--accent)] rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[var(--accent)] rounded-full blur-[120px] opacity-20" />
      </div>

      <ThemeToggle
        theme={theme}
        setTheme={setTheme}
        mode={mode}
        setMode={setMode}
      />

      <NotificationToast
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={() => setShowNotification(false)}
      />

      <Sidebar
        lists={lists}
        activeList={activeList}
        savedCards={savedCards}
        setSavedCards={setSavedCards}
        createList={createList}
        deleteList={deleteList}
        renameList={renameList}
        setActiveList={setActiveList}
        startLearning={startLearning}
        exportToAnki={exportToAnki}
        exportToObsidian={exportToObsidian}
        setData={setData}
        removeCard={removeCard}
      />

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

          <SearchResults
            data={data!}
            error={error}
            supportedLanguages={supportedLanguages}
            sourceLangState={sourceLangState}
            targetLang={targetLang}
            secondaryTargetLang={secondaryTargetLang}
            playAudio={playAudio}
            toggleSave={toggleSave}
            isSaved={isSaved}
            searchForWord={searchForWord}
          />

        </motion.div>
      </section>

      <LearningOverlay
        show={learningMode}
        onClose={() => setLearningMode(false)}
        queue={learningQueue}
        currentIndex={currentCardIndex}
        isFlipped={isFlipped}
        setIsFlipped={setIsFlipped}
        sessionTime={sessionTime}
        handleRating={handleRating}
        supportedLanguages={supportedLanguages}
        sourceLangState={sourceLangState}
        targetLang={targetLang}
        secondaryTargetLang={secondaryTargetLang}
      />

      <ListModal
        show={showListModal}
        onClose={() => setShowListModal(false)}
        onSubmit={submitCreateList}
        newListName={newListName}
        setNewListName={setNewListName}
      />

    </main>
  );
}
