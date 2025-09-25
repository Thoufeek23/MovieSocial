// src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage'; // <-- FIX: Added import
import MovieDetailPage from './pages/MovieDetailPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage'; // <-- FIX: Added import

function App() {
  return (
    <Router>
      <Navbar />
      <main className="container mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } 
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;