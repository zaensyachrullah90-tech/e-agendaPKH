import React from 'react';

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="glass-card-glossy p-4 rounded-2xl flex items-center space-x-3.5 border-l-4 pointer-events-auto shadow-2xl animate-slide-in" 
          style={{ 
            borderColor: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f97316' : '#8b5cf6',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)'
          }}
        >
          <span className={toast.type === 'error' ? 'text-red-400' : toast.type === 'warning' ? 'text-orange-400' : 'text-purple-400'}>
            <i className={`fas ${toast.type === 'error' ? 'fa-circle-xmark' : toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-xl`}></i>
          </span>
          <p className="text-sm font-semibold text-white tracking-wide leading-snug">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}