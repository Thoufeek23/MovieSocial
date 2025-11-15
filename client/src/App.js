import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import ProtectedRoute from './components/ProtectedRoute';
import InterestsRoute from './components/InterestsRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import DiscussionPage from './pages/DiscussionPage';
import ReviewsPage from './pages/ReviewsPage';
import DiscussionsListPage from './pages/DiscussionsListPage';
import Leaderboard from './pages/Leaderboard';
import BadgeDetail from './pages/BadgeDetail';
import ModlePage from './pages/ModlePage';
import ModlePlayPage from './pages/ModlePlayPage';
import PuzzleAdmin from './pages/PuzzleAdmin';
import InterestsPage from './pages/InterestsPage';
import { AnimatePresence, motion } from 'framer-motion';
import Curtain from './components/Curtain';
import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

const PageWrapper = ({ children }) => {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const isAuthRoute = ['/login', '/signup', '/interests'].includes(location.pathname);

  return (
    <>
      <Navbar />
      <div className="flex">
        {!isAuthRoute && <Sidebar />}
  <main className={isAuthRoute ? 'flex-1 p-4 md:p-6 overflow-x-hidden' : 'flex-1 container max-w-full mx-auto p-4 md:p-6 overflow-x-hidden'}>
          <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><SignupPage /></PageWrapper>} />
            <Route path="/interests" element={
              <InterestsRoute>
                <PageWrapper><InterestsPage /></PageWrapper>
              </InterestsRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <PageWrapper><SearchPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/modle" element={
              <ProtectedRoute>
                <PageWrapper><ModlePage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/modle/play" element={
              <ProtectedRoute>
                <PageWrapper><ModlePlayPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route 
              path="/admin/puzzles" 
              element={
                <PrivateRoute>
                  <PageWrapper><PuzzleAdmin /></PageWrapper>
                </PrivateRoute>
              } 
            />
            <Route path="/movie/:id" element={
              <ProtectedRoute>
                <PageWrapper><MovieDetailPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/profile/:username" element={
              <ProtectedRoute>
                <PageWrapper><ProfilePage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <PageWrapper><Leaderboard /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/badges/:badgeId" element={
              <ProtectedRoute>
                <PageWrapper><BadgeDetail /></PageWrapper>
              </ProtectedRoute>
            } />
              <Route path="/discussions/:id" element={
                <ProtectedRoute>
                  <PageWrapper><DiscussionPage /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/discussions" element={
                <ProtectedRoute>
                  <PageWrapper><DiscussionsListPage /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/reviews" element={
                <ProtectedRoute>
                  <PageWrapper><ReviewsPage /></PageWrapper>
                </ProtectedRoute>
              } />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <HomePage />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
          </Routes>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}

const CurtainLayout = ({ children }) => {
  const { isJustLoggedIn, setJustLoggedIn } = useContext(AuthContext);

  return (
    <>
      {children}
      <AnimatePresence>
        {isJustLoggedIn && <Curtain onAnimationComplete={() => setJustLoggedIn(false)} />}
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#27272a',
            color: '#fafafa',
          },
        }}
      />
      <CurtainLayout>
        <AppRoutes />
      </CurtainLayout>
    </Router>
  );
}

export default App;