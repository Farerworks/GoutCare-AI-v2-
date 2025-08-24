export const KG_TO_LBS = 2.20462;
export const ML_TO_OZ = 0.033814;

export const kgToLbs = (kg: number): number => kg * KG_TO_LBS;
export const lbsToKg = (lbs: number): number => lbs / KG_TO_LBS;

export const mlToOz = (ml: number): number => ml * ML_TO_OZ;
export const ozToMl = (oz: number): number => oz / ML_TO_OZ;

export const formatWeight = (kg: number, unit: 'kg' | 'lbs'): string => {
    if (unit === 'lbs') {
        return `${kgToLbs(kg).toFixed(1)} lbs`;
    }
    return `${kg.toFixed(1)} kg`;
};

export const formatFluid = (ml: number, unit: 'ml' | 'oz'): string => {
    if (unit === 'oz') {
        return `${mlToOz(ml).toFixed(1)} oz`;
    }
    return `${Math.round(ml)} ml`;
};
