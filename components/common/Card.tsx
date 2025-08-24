import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  const cardClassName = `bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden p-4 sm:p-6 ${className}`;
  
  return <div className={cardClassName}>{children}</div>;
};

export default Card;
