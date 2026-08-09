import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setupProfile } from '../services/api';

function ProfileSetup({ onComplete }) {
  const [bodyType, setBodyType] = useState('mesomorph');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const bodyTypes = [
    { value: 'ectomorph', label: 'Ectomorph', desc: 'Lean build, fast metabolism' },
    { value: 'mesomorph', label: 'Mesomorph', desc: 'Naturally athletic & muscular' },
    { value: 'endomorph', label: 'Endomorph', desc: 'Broader frame, gains weight easily' },
  ];

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const handleSubmit = async () => {
    if (!weight || weight <= 0) {
      setError('Please enter a valid weight');
      return;
    }
    if (height && height <= 0) {
      setError('Please enter a valid height');
      return;
    }
    if (age && (age <= 0 || age > 120)) {
      setError('Please enter a valid age');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await setupProfile({
        body_type: bodyType,
        weight_kg: Number(weight),
        height_cm: height ? Number(height) : undefined,
        age: age ? Number(age) : undefined,
        gender,
      });
      onComplete(response.user);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-steel flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-md bg-dabba/80 backdrop-blur-2xl rounded-3xl p-7 flex flex-col gap-6 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-display font-bold text-cream tracking-tight"
          >
            Set Up Your Profile
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-cream/60 text-xs font-body mt-1 leading-relaxed"
          >
            Personalize your daily targets for accurate nutrition tracking
          </motion.p>
        </div>

        {/* Body Type Selection Cards */}
        <div className="flex flex-col gap-2.5">
          <label className="text-cream/70 text-xs font-body uppercase tracking-wider font-semibold">
            Body Type
          </label>
          {bodyTypes.map((type, idx) => {
            const isSelected = bodyType === type.value;
            return (
              <motion.button
                key={type.value}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                whileHover={{ scale: 1.015, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBodyType(type.value)}
                className={`text-left px-4 py-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-haldi/15 border-haldi shadow-[0_0_20px_rgba(232,163,61,0.2)]'
                    : 'bg-black/20 border-white/10 hover:border-white/20 hover:bg-black/30'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`font-body font-semibold text-sm ${isSelected ? 'text-haldi' : 'text-cream'}`}>
                    {type.label}
                  </p>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-haldi text-xs"
                    >
                      âœ“
                    </motion.span>
                  )}
                </div>
                <p className="text-cream/50 text-xs font-body mt-0.5">{type.desc}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Weight & Height Input Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-cream/70 text-xs font-body font-semibold uppercase tracking-wider">
              Weight (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              className="bg-black/30 rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border border-white/10 focus:border-haldi focus:bg-black/40 transition-all placeholder:text-cream/30"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-cream/70 text-xs font-body font-semibold uppercase tracking-wider">
              Height (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="175"
              className="bg-black/30 rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border border-white/10 focus:border-haldi focus:bg-black/40 transition-all placeholder:text-cream/30"
            />
          </div>
        </div>

        {/* Age & Gender Selection */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-cream/70 text-xs font-body font-semibold uppercase tracking-wider">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              className="bg-black/30 rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border border-white/10 focus:border-haldi focus:bg-black/40 transition-all placeholder:text-cream/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-cream/70 text-xs font-body font-semibold uppercase tracking-wider">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="bg-black/30 rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border border-white/10 focus:border-haldi focus:bg-black/40 transition-all cursor-pointer"
            >
              {genders.map((g) => (
                <option key={g.value} value={g.value} className="bg-steel text-cream">
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Animated Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-masala/20 border border-masala/40 rounded-xl p-3 text-masala text-xs font-body font-medium flex items-center gap-2"
            >
              <span>âš ï¸</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Action CTA */}
        <motion.button
          onClick={handleSubmit}
          disabled={isLoading}
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          className={`w-full py-3.5 rounded-xl font-display font-semibold text-cream text-sm transition-all shadow-lg cursor-pointer ${
            isLoading
              ? 'bg-masala/50 cursor-not-allowed opacity-70'
              : 'bg-masala hover:bg-masala/90 shadow-[0_4px_20px_rgba(193,80,46,0.35)]'
          }`}
        >
          {isLoading ? 'Saving Profile...' : 'Continue'}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default ProfileSetup;
