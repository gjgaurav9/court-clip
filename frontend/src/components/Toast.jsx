import { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const colors = {
    error: 'bg-red-900/80 border-red-700 text-red-200',
    success: 'bg-green-900/80 border-green-700 text-green-200',
    info: 'bg-blue-900/80 border-blue-700 text-blue-200',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 border rounded-lg px-4 py-3 text-sm shadow-lg max-w-sm ${colors[type] || colors.error}`}>
      <div className="flex items-start gap-2">
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 cursor-pointer"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
