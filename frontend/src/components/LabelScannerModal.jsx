import { useState } from 'react';
import { scanLabel } from '../services/api';

function LabelScannerModal({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select a label photo first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await scanLabel(selectedFile);
      setResult(data);
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
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-dabba rounded-2xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-cream">Scan Ingredient Label</h2>
          <button onClick={handleClose} className="text-cream/60 hover:text-cream text-2xl leading-none">
            &times;
          </button>
        </div>

        {!result && (
          <>
            <label className="border-2 border-dashed border-cream/20 rounded-xl h-48 flex items-center justify-center cursor-pointer overflow-hidden hover:border-haldi/50 transition-colors">
              {previewUrl ? (
                <img src={previewUrl} alt="Label preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-cream/50">
                  <span className="text-3xl">🔍</span>
                  <span className="text-sm font-body">Tap to select label photo</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {error && <p className="text-masala text-sm font-body">{error}</p>}

            <button
              onClick={handleScan}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-masala hover:bg-masala/90 disabled:opacity-50 transition-colors font-display font-semibold text-cream"
            >
              {isLoading ? 'Scanning label...' : 'Scan Now'}
            </button>
          </>
        )}

        {result && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-cream/50 text-xs font-body uppercase tracking-wide">Product</span>
              <span className="text-cream font-display font-semibold">{result.product_name}</span>
            </div>

            {result.has_hidden_sugar ? (
              <div className="bg-masala/15 border border-masala/40 rounded-xl p-4 flex flex-col gap-2">
                <p className="text-masala font-body font-semibold text-sm">
                  ⚠️ Hidden sugar detected
                </p>
                <p className="text-cream/80 text-sm font-body">
                  Found: {result.hidden_sugars_found.join(', ')}
                </p>
                <p className="text-cream/60 text-xs font-body mt-1">{result.suggestion}</p>
              </div>
            ) : (
              <div className="bg-curry/15 border border-curry/40 rounded-xl p-4">
                <p className="text-curry font-body font-semibold text-sm">
                  ✅ No hidden sugars detected
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-cream/50 text-xs font-body uppercase tracking-wide">Full Ingredients</span>
              <p className="text-cream/70 text-xs font-body leading-relaxed">
                {result.ingredients_text}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-steel hover:bg-steel/80 transition-colors font-display font-semibold text-cream"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LabelScannerModal;