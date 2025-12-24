"use client";

import { useState, useRef, useEffect } from "react";
import { Layers, Plus, BookOpen, FolderOpen, Edit2, Trash2, Download, FileText } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Link from "next/link";
import { cn } from "../lib/utils";
import { WordData, ListData } from "../types";

interface SidebarProps {
    lists: ListData[];
    activeList: ListData | null;
    savedCards: WordData[];
    setSavedCards: (cards: WordData[]) => void;
    createList: () => void;
    deleteList: (id: number) => void;
    renameList: (id: number, name: string) => void;
    setActiveList: (list: ListData) => void;
    startLearning: () => void;
    exportToAnki: () => void;
    exportToObsidian: () => void;
    setData: (data: WordData) => void;
    removeCard: (word: string) => void;
}

export default function Sidebar({
    lists,
    activeList,
    savedCards,
    setSavedCards,
    createList,
    deleteList,
    renameList,
    setActiveList,
    startLearning,
    exportToAnki,
    exportToObsidian,
    setData,
    removeCard,
}: SidebarProps) {

    const [editingListId, setEditingListId] = useState<number | null>(null);
    const [editingListName, setEditingListName] = useState("");
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <aside className="hidden lg:flex w-80 border-r border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-xl p-6 flex-col gap-6 z-20 h-screen sticky top-0 transition-colors duration-500">
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

                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
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
                                                if (e.key === 'Enter') {
                                                    renameList(list.id, editingListName);
                                                    setEditingListId(null);
                                                } else if (e.key === 'Escape') setEditingListId(null);
                                            }}
                                            onBlur={() => {
                                                renameList(list.id, editingListName);
                                                setEditingListId(null);
                                            }}
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
    );
}
