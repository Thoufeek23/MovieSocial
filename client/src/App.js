import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
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
  const isAuthRoute = ['/login', '/signup'].includes(location.pathname);

  return (
    <>
      <Navbar />
      <div className="flex">
        {!isAuthRoute && <Sidebar />}
        <main className={isAuthRoute ? 'flex-1 p-4 md:p-6' : 'flex-1 container mx-auto p-4 md:p-6'}>
          <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><SignupPage /></PageWrapper>} />
            <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
            <Route path="/modle" element={<PageWrapper><ModlePage /></PageWrapper>} />
            <Route path="/movie/:id" element={<PageWrapper><MovieDetailPage /></PageWrapper>} />
            <Route path="/profile/:username" element={<PageWrapper><ProfilePage /></PageWrapper>} />
            <Route path="/leaderboard" element={<PageWrapper><Leaderboard /></PageWrapper>} />
            <Route path="/badges/:badgeId" element={<PageWrapper><BadgeDetail /></PageWrapper>} />
              <Route path="/discussions/:id" element={<PageWrapper><DiscussionPage /></PageWrapper>} />
              <Route path="/discussions" element={<PageWrapper><DiscussionsListPage /></PageWrapper>} />
              <Route path="/reviews" element={<PageWrapper><ReviewsPage /></PageWrapper>} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <PageWrapper>
                    <HomePage />
                  </PageWrapper>
                </PrivateRoute>
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