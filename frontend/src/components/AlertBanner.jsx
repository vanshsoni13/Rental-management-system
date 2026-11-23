import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const AlertBanner = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  const config = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mr-2" />
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mr-2" />
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mr-2" />
    }
  };

  const current = config[type] || config.info;

  return (
    <div className={`p-4 border-l-4 flex items-center justify-between mb-4 ${current.bg}`}>
      <div className="flex items-center">
        {current.icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 font-bold ml-4 text-lg leading-none"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
