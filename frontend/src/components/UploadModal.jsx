import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotoModal } from '../hooks/usePhotoModal';
import { logMealPhoto } from '../services/api';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 25 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 25 },
};

const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(8px)' },
  exit: { opacity: 0, backdropFilter: 'blur(0px)' },
};

function UploadModal({ isOpen, onClose, onSuccess }) {
  const {
    selectedFile,
    previewUrl,
    isLoading,
    error,
    setIsLoading,
    setError,
    handleFileChange,
    clearPreview,
    handleClose,
  } = usePhotoModal();

  const [mealType, setMealType] = useState('lunch');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a photo first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await logMealPhoto(selectedFile, mealType);
      onSuccess(result);
      handleClose(onClose);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
        className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50"
      >
        <motion.div
          variants={modalVariants}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="bg-dabba/80 backdrop-blur-2xl rounded-3xl w-full max-w-md p-6 flex flex-col gap-5 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h2 className="text-xl font-display font-bold text-cream tracking-tight flex items-center gap-2">
              <span>🍱</span> Log Your Meal
            </h2>
            <motion.button
              onClick={() => handleClose(onClose)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-cream/60 hover:text-cream text-lg transition-colors cursor-pointer"
            >
              &times;
            </motion.button>
          </div>

          {/* Photo preview with Laser Scanning effect */}
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative rounded-2xl h-52 overflow-hidden border border-white/10 shadow-lg group"
            >
              <img src={previewUrl} alt="Meal preview" className="w-full h-full object-cover" />
              
              {/* Laser Beam effect during API loading */}
              {isLoading && (
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee,0_0_8px_#22d3ee]"
                />
              )}
            </motion.div>
          )}

          {/* Camera and Gallery options */}
          <AnimatePresence mode="wait">
            {!previewUrl && (
              <motion.div
                key="camera-options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="grid grid-cols-2 gap-3.5"
              >
                <label className="border-2 border-dashed border-cream/20 rounded-2xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 hover:border-haldi/60 transition-all duration-300 group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">📷</span>
                  <span className="text-xs font-body font-medium text-cream/70 group-hover:text-cream">Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <label className="border-2 border-dashed border-cream/20 rounded-2xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 hover:border-haldi/60 transition-all duration-300 group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🖼️</span>
                  <span className="text-xs font-body font-medium text-cream/70 group-hover:text-cream">Choose Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {previewUrl && !isLoading && (
            <motion.button
              onClick={clearPreview}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-cream/60 hover:text-cream text-xs font-body underline self-start transition-colors cursor-pointer"
            >
              Choose a different photo
            </motion.button>
          )}

          {/* Meal type selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            className="flex gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5"
          >
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
              const isSelected = mealType === type;
              return (
                <motion.button
                  key={type}
                  onClick={() => setMealType(type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex-1 py-2.5 rounded-xl text-xs font-body capitalize transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-haldi text-steel font-bold shadow-[0_2px_12px_rgba(232,163,61,0.3)]'
                      : 'text-cream/60 hover:text-cream hover:bg-white/5'
                  }`}
                >
                  {type}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Animated Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-masala/20 border border-masala/40 rounded-xl p-3 text-masala text-xs font-body font-medium flex items-center gap-2 shadow-md"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action CTA Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`w-full py-3.5 rounded-xl font-display font-semibold text-cream text-sm transition-all shadow-lg cursor-pointer ${
              isLoading
                ? 'bg-masala/40 opacity-70 cursor-not-allowed'
                : 'bg-masala hover:bg-masala/90 shadow-[0_4px_20px_rgba(193,80,46,0.35)]'
            }`}
          >
            {isLoading ? 'Analyzing your meal...' : 'Confirm & Analyze'}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UploadModal;