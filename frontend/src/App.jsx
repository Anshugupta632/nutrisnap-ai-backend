import { useState } from 'react';
import Header from './components/Header';
import ThaliRing from './components/ThaliRing';
import LogMealButton from './components/LogMealButton';
import MealListItem from './components/MealListItem';
import UploadModal from './components/UploadModal';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meals, setMeals] = useState([]);

  const handleMealLogged = (result) => {
    // Naya meal list mein sabse upar add karo
    setMeals((prev) => [
      {
        mealType: result.meal.meal_type,
        time: new Date(result.meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calories: result.meal.total_calories,
        itemNames: result.items.map((i) => i.name).join(', '),
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-steel flex justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-8">
        <Header userName="Anshu" />

        <div className="flex justify-center">
          <ThaliRing protein={75} carbs={45} fats={90} />
        </div>

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