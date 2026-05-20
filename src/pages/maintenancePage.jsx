import { useEffect, useState } from 'react';

const MaintenancePage = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { onRetry(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onRetry]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
        <span className="text-4xl">🔧</span>
      </div>
      <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-red-500/10 border border-red-500/20">
        <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
        <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Server sedang bermasalah</span>
      </div>
      <h1 className="text-2xl font-black text-slate-100 mb-3">Sedang dalam pemeliharaan</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
        Server kami sedang mengalami gangguan sementara. Tim teknis sedang bekerja memulihkannya.
      </p>
      <div className="w-full max-w-sm bg-white/4 border border-white/10 p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">API Server</span>
          <span className="text-red-400 font-mono text-xs">Tidak terjangkau</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Cek ulang dalam</span>
          <span className="text-slate-400 font-mono text-xs">{countdown} detik</span>
        </div>
      </div>
      <button
        onClick={() => { onRetry(); setCountdown(30); }}
        className="flex items-center gap-2 px-5 py-2.5 border border-indigo-500/40 text-indigo-400 text-sm hover:bg-indigo-500/10 transition-all"
      >
        🔄 Coba sekarang
      </button>
      <p className="mt-6 text-xs text-slate-700">Halaman ini berjalan offline, tidak perlu koneksi server</p>
    </div>
  );
};

export default MaintenancePage;