import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { X, FileText, Loader2 } from 'lucide-react';

export default function TranscriptModal({ meeting, onClose }) {
    const [transcript, setTranscript] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTranscript = async () => {
            try {
                const res = await api.get(`/meetings/${meeting._id}/transcript`);
                setTranscript(res.data.content);
            } catch (err) {
                setError('Failed to load transcript. The meeting might still be processing or the file is missing.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTranscript();
    }, [meeting._id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white border-4 border-black shadow-neo w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b-4 border-black flex justify-between items-center bg-neo-pink z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black border-2 border-black">
                            <FileText className="h-6 w-6 text-neo-pink" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-black uppercase tracking-tight truncate pr-4">
                                Raw Transcript
                            </h3>
                            <p className="text-xs font-bold text-black/80 uppercase truncate">
                                Context: {meeting.title}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-black border-2 border-transparent hover:bg-black hover:text-neo-pink transition-colors focus:outline-none"
                    >
                        <X className="h-6 w-6" strokeWidth={3} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto bg-neo-bg">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-black">
                            <Loader2 className="h-10 w-10 animate-spin mb-4" strokeWidth={3} />
                            <p className="text-base font-black uppercase">Loading transcript...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="bg-neo-yellow text-black p-6 border-4 border-black shadow-neo max-w-md text-center text-base font-black uppercase">
                                {error}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border-4 border-black p-6 shadow-neo-sm">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-black leading-relaxed max-w-full overflow-x-hidden font-medium">
                                {transcript || "Transcript is completely empty."}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t-4 border-black flex justify-end">
                    <button
                        onClick={onClose}
                        className="inline-flex justify-center bg-black py-3 px-6 text-base font-black uppercase text-white shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all focus:outline-none"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
