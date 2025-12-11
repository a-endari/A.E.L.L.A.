"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Search, Volume2, Sparkles, Download, ArrowRight, BookOpen, Trash2, Save, Eye, EyeOff, Layers, FileText, Info } from "lucide-react";
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WordData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New State Features
  const [savedCards, setSavedCards] = useState<WordData[]>([]);
  const [showPersian, setShowPersian] = useState(true);
  const [includePersian, setIncludePersian] = useState(true);

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

  const toggleSave = () => {
    if (!data) return;
    if (isSaved) {
      setSavedCards(prev => prev.filter(c => c.clean_word !== data.clean_word));
    } else {
      setSavedCards(prev => [...prev, data]);
    }
  };

  const removeCard = (wordToCheck: string) => {
    setSavedCards(prev => prev.filter(c => c.clean_word !== wordToCheck));
  };

  const downloadAnkiDeck = async () => {
    if (savedCards.length === 0) return;
    try {
      const response = await axios.post("http://localhost:8000/api/anki/download", {
        cards: savedCards
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'UniversalLanguageDeck.apkg');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Anki download failed", err);
      alert("Failed to download deck.");
    }
  };

  const downloadObsidian = async () => {
    if (savedCards.length === 0) return;
    try {
      const response = await axios.post("http://localhost:8000/api/obsidian/download", {
        cards: savedCards
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'UniversalLanguageObsidian.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Obsidian download failed", err);
      alert("Failed to download zip.");
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Global Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* --- LEFT SIDEBAR (Saved Cards) --- */}
      <aside className="w-80 border-r border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 flex flex-col gap-6 z-20 h-screen sticky top-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-300 font-semibold uppercase tracking-wider text-sm">
            <Layers size={16} />
            <span>Flashcard Station</span>
          </div>

          {/* Anki Download Area */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
            <p className="text-xs text-purple-200/70">
              {savedCards.length} cards ready to export.
            </p>
            <button
              onClick={downloadAnkiDeck}
              disabled={savedCards.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          <Link href="/help" className="flex items-center gap-2 text-xs text-slate-500 hover:text-purple-300 transition-colors px-1">
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
                  className="group p-3 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
                      {card.clean_word}
                    </p>
                    <p className="text-xs text-slate-500">{card.english_definition}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent loading the card when deleting
                      removeCard(card.clean_word);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
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
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-4"
            >
              <Sparkles size={14} />
              <span>Universal Language Assistant</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Learn Any Language <br />
              <span className="text-purple-400">Your Way.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Currently optimized for <strong>German from English/Persian</strong>, but built to be your universal companion.
              Generate Anki decks and Obsidian notes for any language journey.
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto w-full group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a German word (e.g. 'Haus')..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-xl shadow-black/20"
            />
            <button
              type="submit"
              disabled={loading || !query}
              className="absolute inset-y-2 right-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-4 h-4 rounded border-slate-500 text-purple-600 focus:ring-purple-500 bg-transparent"
              />
              <label htmlFor="persianToggle" className="text-sm text-slate-400 cursor-pointer select-none">
                Include Persian Definitions
              </label>

              {/* Tooltip Wrapper */}
              <div className="relative group/tooltip">
                <Info size={14} className="text-slate-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-xs text-slate-200 rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-xl z-50">
                  Checking this adds Persian meanings to cards <br /> and exports (Anki/Obsidian).
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
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
                className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
              >
                {/* Card Decoration */}
                <div className="absolute top-0 right-0 p-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8">
                  {/* Left: Word & Audio */}
                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-purple-300 uppercase tracking-wider">German</p>
                      <div className="flex items-center gap-4">
                        <h2 className="text-5xl font-bold text-white">{data.clean_word}</h2>
                        {data.audio_url && (
                          <button
                            onClick={playAudio}
                            className="p-3 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-full transition-all hover:scale-105 active:scale-95"
                            title="Play Pronunciation"
                          >
                            <Volume2 size={24} />
                          </button>
                        )}
                      </div>
                      {data.original_word !== data.clean_word && (
                        <p className="text-slate-500">Root: {data.clean_word}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={toggleSave}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border",
                          isSaved
                            ? "bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                            : "bg-slate-800 hover:bg-slate-700/80 border-white/5 text-slate-300"
                        )}
                      >
                        {isSaved ? <Save size={16} className="fill-current" /> : <Save size={16} />}
                        {isSaved ? "Saved" : "Save Card"}
                      </button>
                    </div>

                    {/* Synonyms (Moved to Left Column) */}
                    {data.synonyms && data.synonyms.length > 0 && (
                      <div className="pt-6 border-t border-white/10">
                        <p className="text-sm font-medium text-purple-300 uppercase tracking-wider mb-3">Synonyms</p>
                        <div className="flex flex-wrap gap-2">
                          {data.synonyms.map((syn, i) => (
                            <button
                              key={i}
                              onClick={() => searchForWord(syn)}
                              className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 text-sm hover:bg-purple-500/20 hover:border-purple-500/40 transition-colors"
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-white/10" />

                  {/* Right: Definition */}
                  <div className="flex-1 space-y-6">
                    {/* English Definition (Now Top) */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-green-300 uppercase tracking-wider">English Definition</p>
                      <p className="text-xl text-slate-200 font-serif italic">
                        {data.english_definition || <span className="text-slate-500 text-base not-italic">Definition not available</span>}
                      </p>
                    </div>

                    {/* Persian Definition (Now Bottom) */}
                    {/* Persian Definition (Now Bottom) */}
                    {(includePersian) && (
                      <div className="space-y-4 pt-6 border-t border-white/10 relative">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-300 uppercase tracking-wider">Persian Definition</p>
                          <button
                            onClick={() => setShowPersian(!showPersian)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
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
                              className="text-white leading-relaxed"
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
                                <p className="text-slate-500 italic text-base text-left" dir="ltr">Definition not available</p>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="h-12 bg-white/5 rounded-lg flex items-center justify-center text-sm text-slate-500 italic"
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
    </main>
  );
}
