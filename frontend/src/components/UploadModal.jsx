import { useState } from 'react';
import { logMealPhoto } from '../services/api';

function UploadModal({ isOpen, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

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
      handleClose();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-dabba rounded-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-cream">Log Your Meal</h2>
          <button onClick={handleClose} className="text-cream/60 hover:text-cream text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Photo preview ya upload area */}
        <label className="border-2 border-dashed border-cream/20 rounded-xl h-48 flex items-center justify-center cursor-pointer overflow-hidden hover:border-haldi/50 transition-colors">
          {previewUrl ? (
            <img src={previewUrl} alt="Meal preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-cream/50">
              <span className="text-3xl">📸</span>
              <span className="text-sm font-body">Tap to select a photo</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        {/* Meal type selector */}
        <div className="flex gap-2">
          {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-body capitalize transition-colors ${
                mealType === type
                  ? 'bg-haldi text-steel font-semibold'
                  : 'bg-steel text-cream/60'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {error && <p className="text-masala text-sm font-body">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-masala hover:bg-masala/90 disabled:opacity-50 transition-colors font-display font-semibold text-cream"
        >
          {isLoading ? 'Analyzing your meal...' : 'Confirm & Analyze'}
        </button>
      </div>
    </div>
  );
}

export default UploadModal;