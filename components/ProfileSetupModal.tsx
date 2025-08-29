
import React, { useState } from 'react';
import type { Preferences } from '../types';
import Button from './common/Button';
import { useI18n } from '../hooks/useI18n';
import { lbsToKg } from '../utils/units';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onSave: (profileData: Partial<Preferences>) => void;
  preferences: Preferences;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onSave, preferences }) => {
  const { t } = useI18n();
  const [gender, setGender] = useState<Preferences['gender']>('prefer_not_to_say');
  const [birthYear, setBirthYear] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(weight) || 0;
    const weightInKg = preferences.weightUnit === 'lbs' ? lbsToKg(weightValue) : weightValue;

    onSave({
        gender,
        birthYear: birthYear ? Number(birthYear) : undefined,
        height: height ? Number(height) : undefined,
        weight: weightInKg > 0 ? weightInKg : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto relative transform transition-all animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100">
            {t('profileSetup.title')}
          </h2>
          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">{t('profileSetup.subtitle')}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="setup-gender" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.personalProfile.gender')}</label>
                <select id="setup-gender" value={gender} onChange={(e) => setGender(e.target.value as Preferences['gender'])} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">
                    <option value="male">{t('settings.personalProfile.male')}</option>
                    <option value="female">{t('settings.personalProfile.female')}</option>
                    <option value="other">{t('settings.personalProfile.other')}</option>
                    <option value="prefer_not_to_say">{t('settings.personalProfile.preferNotToSay')}</option>
                </select>
              </div>
               <div>
                <label htmlFor="setup-birthYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.personalProfile.birthYear')}</label>
                <input id="setup-birthYear" type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="1990" className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
              </div>
             <div>
                <label htmlFor="setup-height" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.personalProfile.height')}</label>
                <input id="setup-height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
            </div>
            <div>
                <label htmlFor="setup-weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.personalProfile.weight', { unit: preferences.weightUnit })}</label>
                <input id="setup-weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75.5" className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
            </div>
            <div className="pt-2">
                <Button type="submit" className="w-full">{t('profileSetup.saveButton')}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;