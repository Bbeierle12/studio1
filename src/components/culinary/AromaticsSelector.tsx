'use client';

import React, { useState } from 'react';
import { Plus, X, Search, Sparkles } from 'lucide-react';
import {
  AromaticBases,
  SpiceSignatures,
  type CulinaryRegion,
  getRegionDisplayName,
} from '@/types/culinary-taxonomy';

interface AromaticsSelectorProps {
  selectedBase?: keyof typeof AromaticBases;
  selectedSignature?: keyof typeof SpiceSignatures;
  customSpices?: string[];
  onBaseChange?: (base?: keyof typeof AromaticBases) => void;
  onSignatureChange?: (signature?: keyof typeof SpiceSignatures) => void;
  onSpicesChange?: (spices: string[]) => void;
  maxCustomSpices?: number;
}

// Common spices database
const COMMON_SPICES = [
  // Warm spices
  'cinnamon', 'nutmeg', 'clove', 'allspice', 'cardamom', 'star anise',

  // Hot spices
  'black pepper', 'white pepper', 'chili flakes', 'cayenne', 'paprika', 'chipotle',

  // Savory spices
  'cumin', 'coriander', 'fennel', 'fenugreek', 'mustard seed', 'caraway',

  // Herbs (dried)
  'oregano', 'thyme', 'rosemary', 'sage', 'bay leaf', 'basil', 'marjoram', 'tarragon',

  // Asian spices
  'ginger', 'turmeric', 'lemongrass', 'galangal', 'kaffir lime', 'sichuan pepper',

  // Aromatics
  'garlic powder', 'onion powder', 'sumac', 'za\'atar', 'harissa', 'saffron',
];

export const AromaticsSelector: React.FC<AromaticsSelectorProps> = ({
  selectedBase,
  selectedSignature,
  customSpices = [],
  onBaseChange,
  onSignatureChange,
  onSpicesChange,
  maxCustomSpices = 5,
}) => {
  const [spiceInput, setSpiceInput] = useState('');
  const [showSpiceSuggestions, setShowSpiceSuggestions] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const handleAddSpice = (spice: string) => {
    if (!spice.trim()) return;
    
    if (customSpices.includes(spice)) {
      return;
    }
    
    if (customSpices.length >= maxCustomSpices) {
      setShowLimitWarning(true);
      setTimeout(() => setShowLimitWarning(false), 3000);
      return;
    }
    
    onSpicesChange?.([...customSpices, spice]);
    setSpiceInput('');
    setShowSpiceSuggestions(false);
  };

  const handleRemoveSpice = (spice: string) => {
    onSpicesChange?.(customSpices.filter(s => s !== spice));
  };

  const spiceSuggestions = COMMON_SPICES.filter(spice =>
    spice.toLowerCase().includes(spiceInput.toLowerCase()) &&
    !customSpices.includes(spice)
  ).slice(0, 8);

  // Get recommended bases and signatures based on selected regions
  const getRecommendations = (regions?: CulinaryRegion[]) => {
    if (!regions || regions.length === 0) return { bases: [], signatures: [] };

    const bases = Object.entries(AromaticBases).filter(([_, base]) =>
      base.region.some(r => regions.includes(r))
    ).map(([key]) => key);

    const signatures = Object.entries(SpiceSignatures).filter(([_, sig]) =>
      sig.region.some(r => regions.includes(r))
    ).map(([key]) => key);

    return { bases, signatures };
  };

  return (
    <div className="space-y-6">
      {/* Aromatic Bases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Aromatic Foundation</h3>
          <span className="text-xs text-gray-500">Select one base</span>
        </div>
        <div className="grid gap-2">
          {Object.entries(AromaticBases).map(([key, base]) => {
            const isSelected = selectedBase === key;
            return (
              <div
                key={key}
                onClick={() => onBaseChange?.(isSelected ? undefined : key as any)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{base.name}</h4>
                  <div className="flex flex-wrap gap-1">
                    {base.region.map(r => (
                      <span
                        key={r}
                        className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                      >
                        {getRegionDisplayName(r)}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{base.description}</p>
                <div className="flex flex-wrap gap-1">
                  {base.ingredients.map(ing => (
                    <span
                      key={ing}
                      className={`text-xs px-2 py-1 rounded ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {ing.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spice Signatures */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Spice Signature</h3>
          <span className="text-xs text-gray-500">Select one blend</span>
        </div>
        <div className="grid gap-2">
          {Object.entries(SpiceSignatures).map(([key, sig]) => {
            const isSelected = selectedSignature === key;
            return (
              <div
                key={key}
                onClick={() => onSignatureChange?.(isSelected ? undefined : key as any)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{sig.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < sig.heatLevel ? 'text-red-500' : 'text-gray-300'
                          }`}
                        >
                          🌶️
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sig.region.map(r => (
                        <span
                          key={r}
                          className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                        >
                          {getRegionDisplayName(r)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{sig.description}</p>
                <div className="flex flex-wrap gap-1">
                  {sig.spices.map(spice => (
                    <span
                      key={spice}
                      className={`text-xs px-2 py-1 rounded ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {spice.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Spices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Key Spices & Herbs</h3>
          <span className="text-xs text-gray-500">
            {customSpices.length}/{maxCustomSpices} selected
          </span>
        </div>

        {/* Warning message */}
        {showLimitWarning && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            Maximum of {maxCustomSpices} spices reached. Remove one to add more.
          </div>
        )}

        {/* Selected spices */}
        {customSpices.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customSpices.map(spice => (
              <div
                key={spice}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm"
              >
                <span>{spice}</span>
                <button
                  onClick={() => handleRemoveSpice(spice)}
                  className="hover:text-green-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add spice input */}
        {customSpices.length < maxCustomSpices && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={spiceInput}
                  onChange={(e) => {
                    setSpiceInput(e.target.value);
                    setShowSpiceSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSpiceSuggestions(spiceInput.length > 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && spiceInput.trim()) {
                      handleAddSpice(spiceInput.trim());
                    }
                  }}
                  placeholder="Add a spice or herb..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <button
                onClick={() => spiceInput.trim() && handleAddSpice(spiceInput.trim())}
                disabled={!spiceInput.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showSpiceSuggestions && spiceSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {spiceSuggestions.map(spice => (
                  <button
                    key={spice}
                    onClick={() => handleAddSpice(spice)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    {spice}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick add common spices */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Quick add:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {COMMON_SPICES.slice(0, 12)
              .filter(spice => !customSpices.includes(spice))
              .map(spice => (
                <button
                  key={spice}
                  onClick={() => handleAddSpice(spice)}
                  disabled={customSpices.length >= maxCustomSpices}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {spice}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Smart combinations */}
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-900">Flavor Synergies</span>
        </div>
        <div className="text-xs text-amber-800 space-y-1">
          {selectedBase && (
            <p>
              <strong>{AromaticBases[selectedBase].name}</strong> pairs well with{' '}
              {selectedBase === 'MIREPOIX' && 'thyme, bay leaf, and parsley'}
              {selectedBase === 'SOFRITO' && 'oregano, cumin, and cilantro'}
              {selectedBase === 'HOLY_TRINITY' && 'cayenne, thyme, and paprika'}
              {selectedBase === 'MASALA_BASE' && 'turmeric, chili, and coriander'}
              {selectedBase === 'ASIAN_TRINITY' && 'soy sauce, sesame, and chili'}
            </p>
          )}
          {selectedSignature && (
            <p>
              <strong>{SpiceSignatures[selectedSignature].name}</strong> enhances dishes with{' '}
              {selectedSignature === 'GARAM_MASALA' && 'warming, sweet-savory depth'}
              {selectedSignature === 'FIVE_SPICE' && 'sweet-aromatic complexity'}
              {selectedSignature === 'RAS_EL_HANOUT' && 'exotic, multi-layered warmth'}
              {selectedSignature === 'BERBERE' && 'fiery, complex Ethiopian character'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};