import React, { useRef, useState } from 'react';
import { GoutIcon, DownloadIcon, UploadIcon, ResetIcon, SettingsIcon, ShareIcon, CheckIcon } from './Icons';

interface HeaderProps {
    onReset: () => void;
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, onExport, onImport, onOpenSettings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'GoutCare AI',
      text: 'Check out this Gout management app!',
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
        alert('Could not copy link to clipboard.');
      }
    }
  };


  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10 flex-shrink-0">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between md:justify-end h-16">
          <div className="flex items-center space-x-3 md:hidden">
            <GoutIcon />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              GoutCare AI <span className="text-sm font-medium text-slate-500 dark:text-slate-400">(통풍관리)</span>
            </h1>
          </div>
          <div className="flex items-center space-x-1">
              <input type="file" accept=".json" ref={fileInputRef} onChange={onImport} className="hidden" />
               <button onClick={handleShare} aria-label="Share App" className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 ${isCopied ? '!text-green-500' : ''}`}>
                  {isCopied ? <CheckIcon className="w-5 h-5"/> : <ShareIcon className="w-5 h-5"/>}
              </button>
              <button onClick={onOpenSettings} aria-label="Settings" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                  <SettingsIcon className="w-5 h-5"/>
              </button>
              <button onClick={handleImportClick} aria-label="Import Data" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                  <UploadIcon className="w-5 h-5"/>
              </button>
              <button onClick={onExport} aria-label="Export Data" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                  <DownloadIcon className="w-5 h-5"/>
              </button>
              <button onClick={onReset} aria-label="Reset Data" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500">
                  <ResetIcon className="w-5 h-5"/>
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;