import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';
import { Clapperboard } from 'lucide-react';

const AuthLayout = ({ children }) => {
    const [backdrops, setBackdrops] = useState([]);
    const [currentBackdrop, setCurrentBackdrop] = useState(0);

    useEffect(() => {
        const fetchBackdrops = async () => {
            try {
                const res = await api.getPopularMovies();
                const urls = res.data.results
                    .map(m => m.backdrop_path)
                    .filter(Boolean)
                    .slice(0, 10);
                setBackdrops(urls);
            } catch (error) {
                console.error("Could not fetch movie backdrops for auth screen", error);
            }
        };
        fetchBackdrops();
    }, []);

    useEffect(() => {
        if (backdrops.length > 1) {
            const interval = setInterval(() => {
                setCurrentBackdrop(prev => (prev + 1) % backdrops.length);
            }, 5000); // Change image every 5 seconds
            return () => clearInterval(interval);
        }
    }, [backdrops]);

    const IMG_BASE_URL = 'https://image.tmdb.org/t/p/original';

    return (
        <div className="min-h-[calc(100vh-81px)] flex items-center justify-center bg-background p-4 -m-6">
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden bg-card min-h-[700px]">
                {/* Left Visual Side */}
                <div className="relative hidden md:block">
                    <AnimatePresence>
                        {backdrops.length > 0 && (
                            <motion.img
                                key={currentBackdrop}
                                src={`${IMG_BASE_URL}${backdrops[currentBackdrop]}`}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5 }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                    <div className="relative h-full flex flex-col justify-end p-12 text-white">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex items-center gap-3 text-4xl font-bold"
                        >
                            <Clapperboard size={40} className="text-primary" />
                            Movie Social
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-xl mt-4 text-gray-300"
                        >
                            Discover, Discuss, Decide. Your ultimate movie companion.
                        </motion.p>
                    </div>
                </div>

                {/* Right Form Side */}
                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;