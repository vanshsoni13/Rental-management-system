import React from 'react';

const StatusBadge = ({ type = 'rental', status }) => {
  const normalized = (status || '').toLowerCase();

  const rentalStyles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    suspended: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const paymentStyles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    partial: 'bg-purple-100 text-purple-800 border-purple-200',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    refunded: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const stylesMap = type === 'payment' ? paymentStyles : rentalStyles;
  const style = stylesMap[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {normalized.toUpperCase()}
    </span>
  );
};

export default StatusBadge;
