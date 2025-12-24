"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";
import { WordData } from "../types";

interface LearningOverlayProps {
    show: boolean;
    onClose: () => void;
    queue: WordData[];
    currentIndex: number;
    isFlipped: boolean;
    setIsFlipped: (flipped: boolean) => void;
    sessionTime: number;
    handleRating: (rating: 'hard' | 'good' | 'easy') => void;
    supportedLanguages: { code: string; name: string }[];
    sourceLangState: string;
    targetLang: string;
    secondaryTargetLang: string;
}

export default function LearningOverlay({
    show,
    onClose,
    queue,
    currentIndex,
    isFlipped,
    setIsFlipped,
    sessionTime,
    handleRating,
    supportedLanguages,
    sourceLangState,
    targetLang,
    secondaryTargetLang,
}: LearningOverlayProps) {

    const currentCard = queue[currentIndex];

    if (!show || !currentCard) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col items-center justify-center p-6"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
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
                            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
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
                                    {supportedLanguages.find(l => l.code === (currentCard.source_lang || sourceLangState))?.name || 'Translate this'}
                                </p>
                                <h2 className="text-6xl font-bold text-[var(--text-main)] text-center">
                                    {currentCard.clean_word}
                                </h2>
                                <p className="mt-8 text-[var(--text-muted)] text-sm animate-pulse opacity-50 backface-hidden">Click to flip</p>
                            </div>

                            {/* BACK */}
                            <div
                                className="absolute inset-0 backface-hidden bg-[var(--bg-card)] border border-[var(--active-border)] rounded-3xl flex flex-col items-center justify-center p-12 shadow-2xl"
                                style={{ transform: 'rotateY(180deg)' }}
                            >
                                <p className="text-xs font-medium text-green-500 uppercase tracking-widest mb-2">
                                    {supportedLanguages.find(l => l.code === (currentCard.target_lang || targetLang))?.name}
                                </p>
                                <h3 className="text-4xl font-serif italic text-[var(--text-main)] text-center mb-6">
                                    {currentCard.english_definition}
                                </h3>
                                {currentCard.audio_url && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const audio = new Audio(currentCard.audio_url!);
                                            audio.play();
                                        }}
                                        className="p-4 rounded-full bg-[var(--bg-input)] text-[var(--accent)] hover:scale-110 transition-transform mb-4"
                                    >
                                        <Volume2 size={32} />
                                    </button>
                                )}
                                {currentCard.definitions && currentCard.definitions.length > 0 && (
                                    <div className="mt-4 flex flex-col items-center">
                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                                            {supportedLanguages.find(l => l.code === (currentCard.secondary_lang || secondaryTargetLang))?.name}
                                        </p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {currentCard.definitions.map((def: string, i: number) => (
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
    );
}
