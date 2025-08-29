import React, { useRef, useState } from 'react';
import { GoutIcon, DownloadIcon, UploadIcon, ResetIcon, SettingsIcon, ShareIcon, CheckIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface HeaderProps {
    onReset: () => void;
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, onExport, onImport, onOpenSettings }) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'GoutCare AI',
      text: t('header.shareText'),
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (clipboardErr) {
        console.error('Failed to copy to clipboard', clipboardErr);
        alert(t('errors.clipboardCopyFailed'));
      }
    }
  };


  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10 flex-shrink-0">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between md:justify-end h-16">
          <div className="flex items-center space-x-3 md:hidden">
            <GoutIcon />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>GoutCare AI</span>
              <span className="text-sm font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 px-2 py-0.5 rounded-full">v3</span>
            </h1>
          </div>
          <div className="flex items-center space-x-1">
              <input type="file" accept=".json" ref={fileInputRef} onChange={onImport} className="hidden" />
               <button onClick={handleShare} aria-label={t('header.buttons.share')} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 ${isCopied ? '!text-green-500' : ''}`}>
                  {isCopied ? <CheckIcon className="w-5 h-5"/> : <ShareIcon className="w-5 h-5"/>}
              </button>
              <button onClick={onOpenSettings} aria-label={t('header.buttons.settings')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                  <SettingsIcon className="w-5 h-5"/>
              </button>
              <button onClick={handleImportClick} aria-label={t('header.buttons.import')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                  <UploadIcon className="w-5 h-5"/>
              </button>
              <button onClick={onExport} aria-label={t('header.buttons.export')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                  <DownloadIcon className="w-5 h-5"/>
              </button>
              <button onClick={onReset} aria-label={t('header.buttons.reset')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500">
                  <ResetIcon className="w-5 h-5"/>
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;