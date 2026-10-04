import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import ChatModal from '../components/ChatModal';
import TranscriptModal from '../components/TranscriptModal';
import AudioModal from '../components/AudioModal';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarPlus, LogOut, MessageSquare, FileText, PlayCircle, Clock, Calendar as CalendarIcon, Video } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [viewTranscriptMeeting, setViewTranscriptMeeting] = useState(null);
    const [playAudioMeeting, setPlayAudioMeeting] = useState(null);
    
    // Form State
    const [title, setTitle] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const res = await api.get('/meetings');
            setMeetings(res.data);
        } catch (error) {
            console.error('Failed to fetch meetings', error);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            await api.post('/meetings', { title, meetingLink, date, time });
            setTitle('');
            setMeetingLink('');
            setDate('');
            setTime('');
            fetchMeetings();
        } catch (error) {
            alert('Failed to schedule meeting');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-neo-bg font-sans">
            {/* Neo-Brutalist Topbar */}
            <nav className="bg-neo-yellow border-b-4 border-black sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-black flex items-center justify-center">
                                <Video className="h-5 w-5 text-neo-yellow" />
                            </div>
                            <h1 className="text-xl font-black text-black tracking-tight uppercase">Meeting Intelligence</h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-black font-bold uppercase">{user?.name}</span>
                            <button 
                                onClick={handleLogout} 
                                className="flex items-center gap-2 text-sm font-black text-black uppercase hover:text-red-600 transition-colors"
                            >
                                <LogOut className="h-5 w-5" strokeWidth={3} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* Left Column: Schedule Form */}
                    <div className="lg:col-span-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white border-4 border-black shadow-neo p-6 sticky top-24"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-neo-pink border-2 border-black">
                                    <CalendarPlus className="h-6 w-6 text-black" strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-black uppercase">Schedule Meeting</h2>
                            </div>

                            <form onSubmit={handleSchedule} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold uppercase text-black mb-1.5">Title</label>
                                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="block w-full border-4 border-black py-2.5 px-3 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all font-medium sm:text-sm" placeholder="e.g. Q3 Sync" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase text-black mb-1.5">Link</label>
                                    <input type="url" required value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className="block w-full border-4 border-black py-2.5 px-3 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all font-medium sm:text-sm" placeholder="https://meet.google.com/..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold uppercase text-black mb-1.5">Date</label>
                                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="block w-full border-4 border-black py-2 px-3 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all font-medium sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold uppercase text-black mb-1.5">Time</label>
                                        <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="block w-full border-4 border-black py-2 px-3 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all font-medium sm:text-sm" />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-neo-green border-4 border-black py-3 px-4 text-base font-black uppercase text-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                                        Schedule Automator
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Right Column: Meetings List */}
                    <div className="lg:col-span-2">
                        <div className="mb-6 flex items-center justify-between border-b-4 border-black pb-4">
                            <h3 className="text-3xl font-black text-black uppercase tracking-tight">Your Meetings</h3>
                        </div>

                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="space-y-6"
                        >
                            {meetings.length === 0 ? (
                                <motion.div variants={itemVariants} className="bg-white border-4 border-black border-dashed p-12 text-center shadow-neo">
                                    <CalendarIcon className="mx-auto h-12 w-12 text-black mb-4" strokeWidth={1.5} />
                                    <p className="text-lg font-bold text-black uppercase">No meetings scheduled yet.</p>
                                </motion.div>
                            ) : meetings.map((meeting) => (
                                <motion.div 
                                    variants={itemVariants}
                                    key={meeting._id} 
                                    className="group bg-white border-4 border-black p-5 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm transition-all duration-200"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        
                                        {/* Meeting Info */}
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-xl font-black text-black uppercase">{meeting.title}</h4>
                                                <span className={`px-3 py-1 text-xs uppercase tracking-wider font-black border-2 border-black
                                                    ${meeting.status === 'Scheduled' ? 'bg-neo-yellow text-black' : 
                                                    meeting.status === 'Completed' ? 'bg-neo-green text-black' : 
                                                    'bg-neo-blue text-black'}`}>
                                                    {meeting.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm font-bold text-black/70 uppercase">
                                                <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" strokeWidth={2.5} /> {meeting.date}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" strokeWidth={2.5} /> {meeting.time}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-3">
                                            <button 
                                                onClick={() => setViewTranscriptMeeting(meeting)}
                                                className="flex items-center gap-1.5 text-xs font-bold uppercase bg-neo-pink border-2 border-black text-black py-2 px-3 shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                            >
                                                <FileText className="h-4 w-4" strokeWidth={2.5} /> Transcript
                                            </button>
                                            <button 
                                                onClick={() => setPlayAudioMeeting(meeting)}
                                                className="flex items-center gap-1.5 text-xs font-bold uppercase bg-neo-blue border-2 border-black text-black py-2 px-3 shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                            >
                                                <PlayCircle className="h-4 w-4" strokeWidth={2.5} /> Audio
                                            </button>
                                            <button 
                                                onClick={() => setSelectedMeeting(meeting)}
                                                className="flex items-center gap-1.5 text-xs font-black uppercase bg-black border-2 border-black text-neo-yellow py-2 px-3 shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                            >
                                                <MessageSquare className="h-4 w-4" strokeWidth={2.5} /> Ask AI
                                            </button>
                                        </div>

                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                </div>
            </main>

            <AnimatePresence>
                {selectedMeeting && (
                    <ChatModal 
                        meeting={selectedMeeting} 
                        onClose={() => setSelectedMeeting(null)} 
                    />
                )}
                {viewTranscriptMeeting && (
                    <TranscriptModal 
                        meeting={viewTranscriptMeeting} 
                        onClose={() => setViewTranscriptMeeting(null)} 
                    />
                )}
                {playAudioMeeting && (
                    <AudioModal 
                        meeting={playAudioMeeting} 
                        onClose={() => setPlayAudioMeeting(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
