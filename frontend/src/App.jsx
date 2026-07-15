import Header from './components/Header';
import ThaliRing from './components/ThaliRing';
import LogMealButton from './components/LogMealButton';
import MealListItem from './components/MealListItem';

function App() {
  const handleLogMeal = () => {
    console.log('Log Meal clicked - yahan photo upload flow aayega');
  };

  return (
    <div className="min-h-screen bg-steel flex justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-8">
        <Header userName="Anshu" />

        <div className="flex justify-center">
          <ThaliRing protein={75} carbs={45} fats={90} />
        </div>

        <LogMealButton onClick={handleLogMeal} />

        <div className="flex flex-col gap-3">
        <h2 className="text-cream/70 font-body text-sm tracking-wide uppercase">
  Today's Meals
</h2>
          <MealListItem
            mealType="Lunch"
            time="2:00 PM"
            calories={730}
            itemNames="Chawal, Dal, Sabzi, Roti"
          />
        </div>
      </div>
    </div>
  );
}

export default App;