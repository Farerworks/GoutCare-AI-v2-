
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const cardClassName = `bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 overflow-hidden p-4 sm:p-6 ${className}`;
  
  return <div className={cardClassName} {...props}>{children}</div>;
};

export default Card;
