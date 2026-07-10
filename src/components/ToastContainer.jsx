import React from 'react';

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[60] space-y-3 sm:max-w-sm pointer-events-none flex flex-col items-center sm:items-end">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="glass-card-glossy p-4 rounded-2xl w-full flex items-center space-x-3.5 border-l-4 pointer-events-auto shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6)] animate-slide-in" 
          style={{ 
            borderColor: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f97316' : '#8b5cf6',
            background: 'linear-gradient(135deg, rgba(30,30,40,0.95) 0%, rgba(10,10,15,0.98) 100%)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <span className={`flex-shrink-0 ${toast.type === 'error' ? 'text-red-400' : toast.type === 'warning' ? 'text-orange-400' : 'text-purple-400'}`}>
            <i className={`fas ${toast.type === 'error' ? 'fa-circle-xmark' : toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-xl sm:text-2xl`}></i>
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white tracking-wide leading-relaxed">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
