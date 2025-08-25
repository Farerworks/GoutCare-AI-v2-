import React from 'react';
import type { Preferences } from '../types';
import Button from './common/Button';
import { CloseIcon } from './Icons';
import { mlToOz, ozToMl } from '../utils/units';

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

  const handleFluidGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setPreferences(prev => ({
      ...prev,
      dailyFluidGoal: prev.fluidUnit === 'oz' ? ozToMl(value) : value,
    }));
  };

  const handlePurineGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setPreferences(prev => ({ ...prev, dailyPurineGoal: value }));
  };
  
  const displayFluidGoal = (
    preferences.fluidUnit === 'ml'
      ? preferences.dailyFluidGoal
      : mlToOz(preferences.dailyFluidGoal)
  ).toFixed(0);

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
            {/* Daily Goals */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">나의 목표</h3>
              <div>
                <label htmlFor="fluidGoal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">일일 수분 섭취 목표 ({preferences.fluidUnit})</label>
                <input
                  id="fluidGoal"
                  type="number"
                  value={displayFluidGoal}
                  onChange={handleFluidGoalChange}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="purineGoal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">일일 퓨린 점수 목표</label>
                <input
                  id="purineGoal"
                  type="number"
                  value={preferences.dailyPurineGoal}
                  onChange={handlePurineGoalChange}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>

            {/* Units */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">단위 설정</h3>
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