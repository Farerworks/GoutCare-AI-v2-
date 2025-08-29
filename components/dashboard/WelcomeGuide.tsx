import React from 'react';
import Card from '../common/Card';
import { SparklesIcon, CameraIcon, TargetIcon, BookOpenIcon } from '../Icons';
import { useI18n } from '../../hooks/useI18n';

interface WelcomeGuideProps {
    onDismiss: () => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onDismiss }) => {
    const { t } = useI18n();
    const features = [
        {
            icon: <CameraIcon className="w-8 h-8 text-sky-500" />,
            title: t('welcome.feature1Title'),
            description: t('welcome.feature1Desc')
        },
        {
            icon: <TargetIcon className="w-8 h-8 text-green-500" />,
            title: t('welcome.feature2Title'),
            description: t('welcome.feature2Desc')
        },
        {
            icon: <BookOpenIcon className="w-8 h-8 text-indigo-500" />,
            title: t('welcome.feature3Title'),
            description: t('welcome.feature3Desc')
        }
    ];

    return (
        <Card className="bg-gradient-to-br from-sky-100 to-indigo-200 dark:from-sky-900 dark:to-indigo-900 animate-fade-in">
            <div className="text-center">
                <SparklesIcon className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('welcome.title')}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{t('welcome.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-center">
                {features.map(feature => (
                    <div key={feature.title}>
                        {feature.icon}
                        <h3 className="mt-2 font-semibold text-slate-700 dark:text-slate-200">{feature.title}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
                    </div>
                ))}
            </div>
            <div className="mt-8 text-center">
                <button onClick={onDismiss} className="px-6 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full font-semibold text-sky-700 dark:text-sky-300 shadow-md hover:scale-105 transition-transform">
                    {t('welcome.getStarted')}
                </button>
            </div>
        </Card>
    );
};

export default WelcomeGuide;