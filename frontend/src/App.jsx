import { useState, useEffect } from 'react';
import Header from './components/Header';
import ThaliRing from './components/ThaliRing';
import LogMealButton from './components/LogMealButton';
import MealListItem from './components/MealListItem';
import UploadModal from './components/UploadModal';
import ProfileSetup from './components/ProfileSetup';
import Avatar from './components/Avatar';
import { getTodaySummary, getUserProfile, getAvatarStatus } from './services/api';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meals, setMeals] = useState([]);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [avatar, setAvatar] = useState(null);
  const [profileComplete, setProfileComplete] = useState(null); // null = still checking
  const [checkingProfile, setCheckingProfile] = useState(true);

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

  const checkProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfileComplete(!!data.user.body_type);
    } catch (err) {
      console.error('Failed to check profile:', err);
      setProfileComplete(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  useEffect(() => {
    checkProfile();
  }, []);

  useEffect(() => {
    if (profileComplete) {
      fetchSummary();
      fetchAvatar();
    }
  }, [profileComplete]);

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

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-steel flex items-center justify-center">
        <p className="text-cream/60 font-body">Loading...</p>
      </div>
    );
  }

  if (!profileComplete) {
    return <ProfileSetup onComplete={() => setProfileComplete(true)} />;
  }

  return (
    <div className="min-h-screen bg-steel flex justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-8">
        <Header userName="Anshu" />

        <div className="flex justify-center">
          <ThaliRing protein={macros.protein} carbs={macros.carbs} fats={macros.fats} />
        </div>

        {avatar && (
          <Avatar
            stamina={avatar.stamina}
            strengthPoints={avatar.strength_points}
            deficitDays={avatar.protein_deficit_days}
          />
        )}

        <LogMealButton onClick={() => setIsModalOpen(true)} />

        <div className="flex flex-col gap-3">
          <h2 className="text-cream/70 font-body text-sm tracking-wide uppercase">
            Today's Meals
          </h2>
          {meals.length === 0 ? (
            <p className="text-cream/40 text-sm font-body text-center py-4">
              No meals logged yet. Tap "Log Meal" to get started.
            </p>
          ) : (
            meals.map((meal, i) => <MealListItem key={i} {...meal} />)
          )}
        </div>
      </div>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMealLogged}
      />
    </div>
  );
}

export default App;