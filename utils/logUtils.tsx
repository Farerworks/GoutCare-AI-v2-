import React from 'react';
import type { LogType } from '../types';
import { SymptomIcon, MedicationIcon, DietIcon, HeartIcon, TagIcon, BeakerIcon } from '../components/Icons';

export const getLogIcon = (type: LogType, className: string = "w-5 h-5") => {
  switch (type) {
    case 'symptom':
      return <SymptomIcon className={`${className} text-red-500`} />;
    case 'medication':
      return <MedicationIcon className={`${className} text-indigo-500`} />;
    case 'diet':
      return <DietIcon className={`${className} text-amber-500`} />;
    case 'wellness':
        return <HeartIcon className={`${className} text-green-500`} />;
    case 'life_event':
        return <TagIcon className={`${className} text-slate-500`} />;
    case 'purine_intake':
        return <BeakerIcon className={`${className} text-teal-500`} />;
    default:
      return null;
  }
};

export const getLogColor = (type: LogType) => {
    switch (type) {
      case 'symptom':
        return 'bg-red-500';
      case 'medication':
        return 'bg-indigo-500';
      case 'diet':
        return 'bg-amber-500';
      case 'wellness':
        return 'bg-green-500';
      case 'life_event':
        return 'bg-slate-500';
      case 'purine_intake':
        return 'bg-teal-500';
      default:
        return 'bg-slate-500';
    }
  };