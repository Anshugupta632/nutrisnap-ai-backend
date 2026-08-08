import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ThaliRing from './components/ThaliRing';
import LogMealButton from './components/LogMealButton';
import MealListItem from './components/MealListItem';
import UploadModal from './components/UploadModal';
import ProfileSetup from './components/ProfileSetup';
import Avatar from './components/Avatar';
import LabelScannerModal from './components/LabelScannerModal';
import Login from './components/Login';
import { BackgroundEffect, ThaliRingSkeleton, CardSkeleton } from './components/BackgroundEffect';
import { getTodaySummary, getAvatarStatus, getMealHistory, downloadMonthlyReport, getStoredUser, logout } from './services/api';

const pageVariants = {
  initial: { opacity: 0, y: 30, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -30, scale: 0.98 },
};

const pageTransition = { type: 'spring', stiffness: 120, damping: 22 };

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [meals, setMeals] = useState([]);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [avatar, setAvatar] = useState(null);
  const [profileComplete, setProfileComplete] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [view, setView] = useState('auth');

  const fetchSummary = async () => {
    try {
      const data = await getTodaySummary();
      setMacros(data.percentages);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchAvatar = async () => {
    try {
      const data = await getAvatarStatus();
      setAvatar(data.avatar);
    } catch (err) {
      console.error('Failed to fetch avatar:', err);
    }
  };

  const fetchMealHistory = async () => {
    try {
      const data = await getMealHistory();
      if (data.success && data.meals) {
        setMeals(
          data.meals.map((meal) => ({
            mealType: meal.meal_type,
            time: new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            calories: meal.total_calories,
            itemNames: meal.meal_items?.map((i) => i.item_name).join(', ') || '',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch meal history:', err);
    }
  };

  const checkAuth = async () => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setProfileComplete(!!storedUser.body_type);
      if (storedUser.body_type) {
        setView('dashboard');
        await fetchSummary();
        await fetchAvatar();
        await fetchMealHistory();
      } else {
        setView('profile');
      }
    }
    setCheckingAuth(false);
    setCheckingProfile(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profileComplete && !checkingProfile) {
      fetchSummary();
      fetchAvatar();
      fetchMealHistory();
    }
  }, [profileComplete, checkingProfile]);

  const handleLogin = (userData) => {
    setUser(userData);
    setProfileComplete(!!userData.body_type);
    if (userData.body_type) {
      setView('dashboard');
      fetchSummary();
      fetchAvatar();
      fetchMealHistory();
    } else {
      setView('profile');
    }
  };

  const handleProfileComplete = () => {
    setProfileComplete(true);
    setView('dashboard');
    fetchSummary();
    fetchAvatar();
    fetchMealHistory();
  };

  const handleMealLogged = (result) => {
    setMeals((prev) => [
      {
        mealType: result.meal.meal_type,
        time: new Date(result.meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calories: result.meal.total_calories,
        itemNames: result.items.map((i) => i.name).join(', '),
      },
      ...prev,
    ]);
    fetchSummary();
    fetchAvatar();
  };

  const handleDownloadReport = async () => {
    try {
      const blob = await downloadMonthlyReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nutrisnap-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setProfileComplete(null);
    setMeals([]);
    setMacros({ protein: 0, carbs: 0, fats: 0 });
    setAvatar(null);
    setView('auth');
  };

  if (checkingAuth) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-steel flex items-center justify-center relative overflow-hidden"
      >
        <BackgroundEffect />
        <CardSkeleton className="max-w-md w-full mx-4 shadow-2xl backdrop-blur-xl border border-white/10" />
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'auth' && (
        <motion.div
          key="auth"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-steel relative overflow-hidden"
        >
          <Login onLogin={handleLogin} />
        </motion.div>
      )}

      {view === 'profile' && (
        <motion.div
          key="profile"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-steel relative overflow-hidden"
        >
          <ProfileSetup onComplete={handleProfileComplete} />
        </motion.div>
      )}

      {view === 'dashboard' && (
        <motion.div
          key="dashboard"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-steel relative overflow-x-hidden selection:bg-haldi/30"
        >
          {/* Ambient 3D Depth Lights */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-haldi/10 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="fixed bottom-10 right-0 w-[400px] h-[400px] bg-masala/15 rounded-full blur-[160px] pointer-events-none z-0" />

          <BackgroundEffect />

          <div className="flex justify-center px-4 py-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.1 }}
              className="w-full max-w-md flex flex-col gap-6"
            >
              <Header userName={user?.email?.split('@')[0] || 'User'} onLogout={handleLogout} />

              {/* Interactive 3D Card Ring Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 110, damping: 16, delay: 0.2 }}
                className="flex justify-center p-6 bg-dabba/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
              >
                {macros.protein === 0 && macros.carbs === 0 && macros.fats === 0 ? (
                  <ThaliRingSkeleton />
                ) : (
                  <ThaliRing protein={macros.protein} carbs={macros.carbs} fats={macros.fats} />
                )}
              </motion.div>

              {avatar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
                  className="bg-dabba/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl"
                >
                  <Avatar
                    stamina={avatar.stamina}
                    strengthPoints={avatar.strength_points}
                    deficitDays={avatar.protein_deficit_days}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
              >
                <LogMealButton onClick={() => setIsModalOpen(true)} />
              </motion.div>

              {/* 3D Glass Action Buttons */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.45 }}
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-dabba/80 backdrop-blur-md border border-white/10 hover:border-haldi/50 shadow-lg hover:shadow-haldi/10 transition-all flex items-center justify-center gap-3 text-cream font-body text-sm font-medium cursor-pointer"
              >
                <span className="text-lg">🔍</span>
                <span>Scan a Packet Label</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.5 }}
                onClick={handleDownloadReport}
                className="w-full py-3.5 px-4 rounded-2xl bg-dabba/80 backdrop-blur-md border border-white/10 hover:border-haldi/50 shadow-lg hover:shadow-haldi/10 transition-all flex items-center justify-center gap-3 text-cream font-body text-sm font-medium cursor-pointer"
              >
                <span className="text-lg">📄</span>
                <span>Download Monthly Report</span>
              </motion.button>

              {/* Meal History Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.55 }}
                className="flex flex-col gap-3 mt-2"
              >
                <h2 className="text-cream/80 font-body text-xs font-semibold tracking-wider uppercase px-1">
                  Today's Meals
                </h2>
                {meals.length === 0 ? (
                  <div className="bg-dabba/30 backdrop-blur-md rounded-2xl p-6 border border-white/5 text-center">
                    <p className="text-cream/40 text-sm font-body">
                      No meals logged yet. Tap "Log Meal" to get started.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {meals.map((meal, i) => (
                      <motion.div
                        key={meal.mealType + i}
                        whileHover={{ scale: 1.01, translateX: 3 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      >
                        <MealListItem {...meal} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            </motion.div>
          </div>

          <UploadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleMealLogged}
          />

          <LabelScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;