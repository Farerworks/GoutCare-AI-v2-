import React from 'react';
import type { Preferences } from '../types';
import Button from './common/Button';
import { CloseIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, preferences, setPreferences }) => {
  if (!isOpen) return null;

  const handleWeightUnitChange = (unit: 'kg' | 'lbs') => {
    setPreferences(prev => ({ ...prev, weightUnit: unit }));
  };

  const handleFluidUnitChange = (unit: 'ml' | 'oz') => {
    setPreferences(prev => ({ ...prev, fluidUnit: unit }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto relative transform transition-all" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <CloseIcon />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">
            설정
          </h2>
          
          <div className="space-y-6">
            {/* Weight Unit Setting */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">체중 단위</label>
              <div className="flex rounded-lg shadow-sm">
                <button onClick={() => handleWeightUnitChange('kg')} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-l-lg transition-colors ${preferences.weightUnit === 'kg' ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                  Kilograms (kg)
                </button>
                <button onClick={() => handleWeightUnitChange('lbs')} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-r-lg transition-colors ${preferences.weightUnit === 'lbs' ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                  Pounds (lbs)
                </button>
              </div>
            </div>

            {/* Fluid Unit Setting */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">수분 단위</label>
              <div className="flex rounded-lg shadow-sm">
                <button onClick={() => handleFluidUnitChange('ml')} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-l-lg transition-colors ${preferences.fluidUnit === 'ml' ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                  Milliliters (ml)
                </button>
                <button onClick={() => handleFluidUnitChange('oz')} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-r-lg transition-colors ${preferences.fluidUnit === 'oz' ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                  Ounces (oz)
                </button>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
                <Button onClick={onClose}>닫기</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
