import { useState } from 'react';
import axios from 'axios';
import { TEST_USER_ID } from '../services/api';

const API_BASE_URL = 'http://localhost:5000';

function ProfileSetup({ onComplete }) {
  const [bodyType, setBodyType] = useState('mesomorph');
  const [weight, setWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const bodyTypes = [
    { value: 'ectomorph', label: 'Ectomorph', desc: 'Lean, fast metabolism' },
    { value: 'mesomorph', label: 'Mesomorph', desc: 'Naturally muscular' },
    { value: 'endomorph', label: 'Endomorph', desc: 'Gains weight easily' },
  ];

  const handleSubmit = async () => {
    if (!weight || weight <= 0) {
      setError('Please enter a valid weight');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/setup-profile`, {
        user_id: TEST_USER_ID,
        body_type: bodyType,
        weight_kg: Number(weight),
      });
      onComplete(response.data.user);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-steel flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-dabba rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-cream">Set Up Your Profile</h1>
          <p className="text-cream/60 text-sm font-body mt-1">
            This helps us personalize your daily nutrition targets
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-cream/70 text-sm font-body">Body Type</label>
          {bodyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setBodyType(type.value)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                bodyType === type.value
                  ? 'bg-haldi/20 border-haldi'
                  : 'bg-steel border-transparent'
              }`}
            >
              <p className="font-body font-semibold text-cream">{type.label}</p>
              <p className="text-cream/50 text-xs font-body">{type.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-cream/70 text-sm font-body">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 70"
            className="bg-steel rounded-xl px-4 py-3 text-cream font-mono outline-none border border-transparent focus:border-haldi"
          />
        </div>

        {error && <p className="text-masala text-sm font-body">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-masala hover:bg-masala/90 disabled:opacity-50 transition-colors font-display font-semibold text-cream"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

export default ProfileSetup;