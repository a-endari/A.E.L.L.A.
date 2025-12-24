"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Save } from "lucide-react";
import { cn } from "../lib/utils";
import { WordData } from "../types";

interface SearchResultsProps {
    data: WordData;
    error: string | null;
    supportedLanguages: { code: string; name: string }[];
    sourceLangState: string;
    targetLang: string;
    secondaryTargetLang: string;
    playAudio: () => void;
    toggleSave: () => void;
    isSaved: boolean;
    searchForWord: (word: string) => void;
}

export default function SearchResults({
    data,
    error,
    supportedLanguages,
    sourceLangState,
    targetLang,
    secondaryTargetLang,
    playAudio,
    toggleSave,
    isSaved,
    searchForWord,
}: SearchResultsProps) {

    return (
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
    );
}
