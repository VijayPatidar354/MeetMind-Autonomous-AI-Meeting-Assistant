import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-neo-bg px-4 sm:px-6 lg:px-8 font-sans">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 border-4 border-black shadow-neo"
            >
                <div>
                    <div className="mx-auto h-16 w-16 bg-neo-pink border-4 border-black shadow-neo-sm flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-black" />
                    </div>
                    <h2 className="mt-8 text-center text-4xl font-black tracking-tight text-black uppercase">
                        Sign Up!
                    </h2>
                    <p className="mt-2 text-center text-base font-bold text-black/70 uppercase">
                        Join the resistance
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-neo-yellow text-black p-3 text-sm font-bold border-4 border-black shadow-neo-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold uppercase leading-6 text-black">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-2 block w-full border-4 border-black py-2.5 px-4 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all sm:text-base font-medium"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold uppercase leading-6 text-black">Email address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2 block w-full border-4 border-black py-2.5 px-4 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all sm:text-base font-medium"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold uppercase leading-6 text-black">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-2 block w-full border-4 border-black py-2.5 px-4 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all sm:text-base font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full justify-center bg-neo-purple border-4 border-black px-3 py-3 text-lg font-black uppercase text-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm font-bold text-black uppercase">
                    Already have an account?{' '}
                    <Link to="/" className="text-neo-blue underline decoration-4 decoration-neo-blue hover:text-black hover:decoration-black transition-colors">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
