import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { 
    Sparkles, 
    ArrowLeft, 
    ArrowRight, 
    RotateCcw, 
    Calendar,
    Loader
} from 'lucide-react';

const AIMovieRecommendationPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState({
        genres: [],
        mood: '',
        languages: [],
        endings: '',
        themes: [],
        enjoys: [],
        pace: '',
        characters: [],
        experience: '',
        watchWith: '',
        releasePeriod: ''
    });
    const [recommendations, setRecommendations] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);

    const totalSteps = 11;

    // Load stored recommendations on component mount
    React.useEffect(() => {
        const storedRecommendations = localStorage.getItem('aiMovieRecommendations');
        const storedPreferences = localStorage.getItem('aiMoviePreferences');
        
        if (storedRecommendations && storedPreferences) {
            try {
                const parsedRecommendations = JSON.parse(storedRecommendations);
                const parsedPreferences = JSON.parse(storedPreferences);
                
                setRecommendations(parsedRecommendations);
                setPreferences(parsedPreferences);
                setShowResults(true);
            } catch (error) {
                console.error('Error loading stored recommendations:', error);
                // Clear corrupted data
                localStorage.removeItem('aiMovieRecommendations');
                localStorage.removeItem('aiMoviePreferences');
            }
        }
    }, []);

    const handleMultiSelect = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleSingleSelect = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const resetPreferences = () => {
        setPreferences({
            genres: [],
            mood: '',
            languages: [],
            endings: '',
            themes: [],
            enjoys: [],
            pace: '',
            characters: [],
            experience: '',
            watchWith: '',
            releasePeriod: ''
        });
        setCurrentStep(1);
        setShowResults(false);
        setRecommendations([]);
        
        // Clear stored data from localStorage
        localStorage.removeItem('aiMovieRecommendations');
        localStorage.removeItem('aiMoviePreferences');
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            console.log('Submitting preferences:', preferences);
            
            // Validate preferences before sending
            const requiredFields = ['genres', 'mood', 'languages'];
            const missingFields = requiredFields.filter(field => {
                const value = preferences[field];
                return !value || (Array.isArray(value) && value.length === 0);
            });
            
            if (missingFields.length > 0) {
                toast.error(`Please complete: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }
            
            const response = await api.getAIMovieRecommendations(preferences);
            console.log('API Response:', response);
            
            setRecommendations(response.data.recommendations);
            setShowResults(true);
            
            // Store recommendations and preferences in localStorage
            localStorage.setItem('aiMovieRecommendations', JSON.stringify(response.data.recommendations));
            localStorage.setItem('aiMoviePreferences', JSON.stringify(preferences));
            
            toast.success('Got your personalized recommendations!');
        } catch (error) {
            console.error('Error getting recommendations:', error);
            
            // More detailed error handling
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.msg || error.response.data?.details || 'Unknown error';
                
                if (status === 400) {
                    toast.error(`Invalid request: ${message}`);
                } else if (status === 401) {
                    toast.error('Please log in again');
                } else if (status === 429) {
                    toast.error('Too many requests. Please try again later.');
                } else {
                    toast.error(`Server error: ${message}`);
                }
            } else if (error.request) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('Failed to get recommendations. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What genres do you usually enjoy?</h2>
                            <p className="text-gray-400">Choose any number that appeal to you</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Romance / Rom-com', 'Action', 'Thriller / Mystery', 'Horror', 'Drama', 'Comedy', 
                              'Sci-fi / Fantasy', 'Adventure', 'Animated', 'Crime / Gangster', 'Slice-of-life', 'Feel-good movies'].map((genre) => (
                                <button
                                    key={genre}
                                    onClick={() => handleMultiSelect('genres', genre)}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        preferences.genres.includes(genre)
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What kind of mood do you prefer in movies?</h2>
                            <p className="text-gray-400">Choose the mood that resonates with you</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['Light-hearted & fun', 'Deep & emotional', 'Intense & gripping', 'Slow & realistic',
                              'Fast-paced & exciting', 'Inspirational / uplifting', 'A mix of emotional + entertaining'].map((mood) => (
                                <button
                                    key={mood}
                                    onClick={() => handleSingleSelect('mood', mood)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        preferences.mood === mood
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {mood}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What languages do you prefer?</h2>
                            <p className="text-gray-400">Select all languages you're comfortable with</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['English', 'Tamil', 'Telugu', 'Malayalam', 'Hindi', 'Kannada', 'Korean', 'Japanese', 'Any language is fine'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => handleMultiSelect('languages', lang)}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        preferences.languages.includes(lang)
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What type of endings do you prefer?</h2>
                            <p className="text-gray-400">Choose your preferred story conclusion style</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['Happy ending', 'Bittersweet ending', 'Open ending', 'Tragic ending', "Doesn't matter if the movie is good"].map((ending) => (
                                <button
                                    key={ending}
                                    onClick={() => handleSingleSelect('endings', ending)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        preferences.endings === ending
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {ending}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What story themes attract you the most?</h2>
                            <p className="text-gray-400">Select themes that interest you</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Love & relationships', 'Friendship', 'Coming-of-age', 'Family drama', 'Crime & investigation',
                              'Revenge', 'Social issues', 'Fantasy / world-building', 'Survival / adventure', 
                              'Psychological themes', 'Historical / period films'].map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => handleMultiSelect('themes', theme)}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        preferences.themes.includes(theme)
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Do you enjoy movies with:</h2>
                            <p className="text-gray-400">Select what you value most in films</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Strong emotional depth', 'Strong comedy', 'Strong action', 'Strong plot twists',
                              'Strong character development', 'Music-driven storytelling', 'Realistic slice-of-life vibes',
                              'Larger-than-life moments'].map((enjoy) => (
                                <button
                                    key={enjoy}
                                    onClick={() => handleMultiSelect('enjoys', enjoy)}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        preferences.enjoys.includes(enjoy)
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {enjoy}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What kind of pace do you prefer?</h2>
                            <p className="text-gray-400">Choose your preferred movie pacing</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['Slow-burn', 'Medium paced', 'Fast paced', 'Depends on the genre'].map((pace) => (
                                <button
                                    key={pace}
                                    onClick={() => handleSingleSelect('pace', pace)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        preferences.pace === pace
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {pace}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 8:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What kind of characters do you connect with?</h2>
                            <p className="text-gray-400">Select character types that resonate with you</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Boy-next-door / girl-next-door', 'Flawed but relatable characters', 'Strong, confident leads',
                              'Quirky, funny characters', 'Dark, mysterious characters', 'Underdogs',
                              'Characters with deep emotional arcs'].map((character) => (
                                <button
                                    key={character}
                                    onClick={() => handleMultiSelect('characters', character)}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        preferences.characters.includes(character)
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {character}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 9:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What kind of movie experience do you enjoy most?</h2>
                            <p className="text-gray-400">Choose your ideal movie experience</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Feel-good & relaxing', 'Emotional rollercoaster', 'Thought-provoking', 'Adrenaline/high-energy',
                              'Beautiful visuals & cinematography', 'Strong writing & performances', 'Escapist entertainment',
                              'Realistic & grounded'].map((experience) => (
                                <button
                                    key={experience}
                                    onClick={() => handleSingleSelect('experience', experience)}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        preferences.experience === experience
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {experience}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 10:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">How do you usually watch movies?</h2>
                            <p className="text-gray-400">Select your typical movie-watching situation</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['Alone', 'With friends', 'With partner', 'With family', 'Depends on the mood'].map((watchWith) => (
                                <button
                                    key={watchWith}
                                    onClick={() => handleSingleSelect('watchWith', watchWith)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        preferences.watchWith === watchWith
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {watchWith}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 11:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">What release period do you prefer?</h2>
                            <p className="text-gray-400">Choose your preferred era of films</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Classics (1970s & earlier)', '1980s', '1990s', 'Early 2000s (2000–2010)',
                              'Recent (2010–2020)', 'Very recent (2020–present)', 'No preference — any era is fine'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => handleSingleSelect('releasePeriod', period)}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        preferences.releasePeriod === period
                                            ? 'border-green-500 bg-green-500/20 text-green-300'
                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const MovieCard = ({ movie, rank }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all group cursor-pointer"
            onClick={() => navigate(`/movie/${movie.id}`)}
        >
            <div className="relative">
                {movie.poster_path && (
                    <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
                    />
                )}
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-sm font-bold">
                    #{rank + 1}
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{movie.title}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                </div>
                {movie.ai_reason && (
                    <p className="text-gray-300 text-sm line-clamp-3">
                        <span className="text-green-400 font-medium">Why this fits: </span>
                        {movie.ai_reason}
                    </p>
                )}
            </div>
        </motion.div>
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Please log in to get personalized movie recommendations</h1>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Finding perfect movies for you...</h2>
                    <p className="text-gray-400">Our AI is analyzing your preferences</p>
                </div>
            </div>
        );
    }

    if (showResults) {
        const topRecommendations = recommendations.slice(0, 5);
        const moreRecommendations = recommendations.slice(5);

        return (
            <div className="min-h-screen bg-black py-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-8 h-8 text-green-400" />
                            <h1 className="text-3xl font-bold text-white">Your Personalized Recommendations</h1>
                        </div>
                        <p className="text-gray-400">Based on your preferences, here are movies we think you'll love</p>
                    </motion.div>

                    {/* Top 5 Recommendations */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">🎯 Top Picks for You</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {topRecommendations.map((movie, index) => (
                                <MovieCard key={movie.id} movie={movie} rank={index} />
                            ))}
                        </div>
                    </div>

                    {/* More Suggestions */}
                    {moreRecommendations.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white">✨ More Great Options</h2>
                                <button
                                    onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                                    className="text-green-400 hover:text-green-300 font-medium"
                                >
                                    {showMoreSuggestions ? 'Show Less' : 'Show More'}
                                </button>
                            </div>
                            <AnimatePresence>
                                {showMoreSuggestions && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                                    >
                                        {moreRecommendations.map((movie, index) => (
                                            <MovieCard key={movie.id} movie={movie} rank={index + 5} />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => {
                                setShowResults(false);
                                setCurrentStep(1);
                                // Clear stored data when modifying preferences
                                localStorage.removeItem('aiMovieRecommendations');
                                localStorage.removeItem('aiMoviePreferences');
                            }}
                            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 justify-center"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Modify Preferences
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Get New Suggestions
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="border border-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="w-8 h-8 text-green-400" />
                        <h1 className="text-3xl font-bold text-white">Movie Picker</h1>
                    </div>
                    <p className="text-gray-400">Answer a few questions and let our AI find the perfect movie for you</p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
                        <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                            className="bg-green-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                >
                    {renderStepContent()}
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </button>
                        )}
                        <button
                            onClick={resetPreferences}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>

                    <button
                        onClick={nextStep}
                        disabled={loading}
                        className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        {currentStep === totalSteps ? (
                            loading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Getting Recommendations...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Get My Movies!
                                </>
                            )
                        ) : (
                            <>
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIMovieRecommendationPage;