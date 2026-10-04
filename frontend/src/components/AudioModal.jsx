import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { X, PlayCircle, Loader2 } from 'lucide-react';

export default function AudioModal({ meeting, onClose }) {
    const { user } = useAuthStore();
    const token = localStorage.getItem('token');
    const audioUrl = `http://localhost:3001/api/v1/meetings/${meeting._id}/audio`;

    const [audioSrc, setAudioSrc] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(audioUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Audio file missing or still processing');
            return res.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            setAudioSrc(url);
        })
        .catch(err => {
            setError(err.message);
        });

        return () => {
            if (audioSrc) URL.revokeObjectURL(audioSrc);
        };
    }, [audioUrl, token]);

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
                className="relative bg-white border-4 border-black shadow-neo w-full max-w-lg h-auto flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b-4 border-black flex justify-between items-center bg-neo-blue z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black border-2 border-black">
                            <PlayCircle className="h-6 w-6 text-neo-blue" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-black uppercase tracking-tight truncate pr-4">
                                Meeting Audio
                            </h3>
                            <p className="text-xs font-bold text-black/80 uppercase truncate">
                                Context: {meeting.title}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-black border-2 border-transparent hover:bg-black hover:text-neo-blue transition-colors focus:outline-none"
                    >
                        <X className="h-6 w-6" strokeWidth={3} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 flex flex-col items-center justify-center bg-neo-bg min-h-[160px]">
                    {error ? (
                        <div className="bg-neo-pink text-black p-4 border-4 border-black w-full text-center text-sm font-black uppercase shadow-neo-sm">
                            {error}
                        </div>
                    ) : audioSrc ? (
                        <div className="w-full bg-white p-4 border-4 border-black shadow-neo-sm">
                            <audio controls className="w-full" src={audioSrc} autoPlay>
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-black">
                            <Loader2 className="h-10 w-10 animate-spin mb-3" strokeWidth={3} />
                            <p className="text-base font-black uppercase">Fetching secure audio...</p>
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
