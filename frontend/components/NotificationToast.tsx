"use client";

import { motion, AnimatePresence } from "framer-motion";

interface NotificationToastProps {
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
    onClose: () => void;
}

export default function NotificationToast({ show, message, type, onClose }: NotificationToastProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-8 right-8 z-[300] max-w-md"
                >
                    <div className={`p-6 rounded-2xl backdrop-blur-xl shadow-2xl border ${type === 'success' ? 'bg-green-500/20 border-green-500/30' :
                            type === 'error' ? 'bg-red-500/20 border-red-500/30' :
                                'bg-blue-500/20 border-blue-500/30'
                        }`}>
                        <div className="flex items-start gap-4">
                            <div className={`text-3xl ${type === 'success' ? 'text-green-400' :
                                    type === 'error' ? 'text-red-400' :
                                        'text-blue-400'
                                }`}>
                                {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ⓘ'}
                            </div>
                            <div className="flex-1">
                                <p className="text-[var(--text-main)] font-medium leading-relaxed">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
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
    );
}
