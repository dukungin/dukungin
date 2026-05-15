// components/AudioManager.jsx - FIXED VERSION
import { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Music, Link, Trash2, Volume2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axiosInstance';
import toast from 'react-hot-toast';

const AudioManager = ({ 
  publicSounds = [],  
  onUpdatePublicSounds 
}) => {
  // ✅ TAMBAH STATE INI (baris 15)
  const [uploading, setUploading] = useState(false);
  
  const [newSound, setNewSound] = useState({ name: '', url: '', file: null });
  const [playingPreview, setPlayingPreview] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const audioRef = useRef(null);


  // ✅ FIXED playPreview - dengan cleanup & error handling
  const playPreview = useCallback((url) => {
    if (!url || !audioRef.current) return;
    
    // Stop previous
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = url;
    setPreviewError(false);
    
    // ✅ FIXED - langsung play tanpa if rusak
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlayingPreview(url);
        })
        .catch((err) => {
          console.warn('Audio play failed:', err);
          setPreviewError(true);
        });
    } else {
      setPlayingPreview(url); // Fallback untuk browser lama
    }
    
    // ✅ PROPER EVENT HANDLERS
    const handleEnded = () => {
      setPlayingPreview(null);
      setPreviewError(false);
    };
    
    const handleError = () => {
      setPlayingPreview(null);
      setPreviewError(true);
    };
    
    audioRef.current.onended = handleEnded;
    audioRef.current.onerror = handleError;
    
    // Cleanup timeout (max 30s)
    const timeout = setTimeout(() => {
      setPlayingPreview(null);
      setPreviewError(false);
      audioRef.current.pause();
    }, 30000);
    
    return () => clearTimeout(timeout);
  }, []);

  // ✅ Stop preview
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingPreview(null);
    setPreviewError(false);
  }, []);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // AudioManager.jsx - FIXED VERSION
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('audio/')) {
      toast.error('❌ Hanya file audio (.mp3, .wav, .ogg, .m4a)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('❌ File terlalu besar! Max 10MB');
      return;
    }

    try {
      setUploading(true);
      
      // ✅ UPLOAD KE SERVER
      const formData = new FormData();
      formData.append('audio', file);
      
      const res = await api.post('/api/overlay/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });
      
      // ✅ SET SERVER URL
      setNewSound({ 
        name: file.name.replace(/\.[^/.]+$/, ''), 
        url: res.data.url,  // ✅ SERVER URL bukan blob!
        file: null
      });
      
      toast.success('✅ File berhasil diupload!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('❌ Upload gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const addSound = async () => {
    if (!newSound.name || !newSound.url || publicSounds.length >= 20) return;
    
    try {
      // ✅ TEST dengan fetch (lebih reliable)
      const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(newSound.url)}`;
      const response = await fetch(proxyUrl, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok && response.headers.get('content-type')?.startsWith('audio/')) {
        const newSoundObj = {
          url: newSound.url,
          proxyUrl: proxyUrl,
          label: newSound.name,
          emoji: '🎵'
        };
        
        onUpdatePublicSounds([...publicSounds, newSoundObj]);
        setNewSound({ name: '', url: '', file: null });
        toast.success('✅ Suara ditambahkan!');
      } else {
        throw new Error('Invalid audio');
      }
    } catch (err) {
      console.error('Test audio failed:', err);
      toast.error('❌ Audio tidak valid atau tidak bisa diakses!');
    }
  };

  const removeSound = (index) => {
    const sound = publicSounds[index];
    const updated = publicSounds.filter((_, i) => i !== index);
    onUpdatePublicSounds(updated);
    
    // Cleanup blob URL
    if (sound.file) {
      URL.revokeObjectURL(sound.url);
    }
  };

  // ✅ PROXY untuk external audio (bypass CORS)
  const getAudioProxyUrl = (url) => {
    if (url.startsWith('http') && !url.includes(window.location.origin)) {
      return `/api/proxy-audio?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="space-y-4">
      {/* Add New Sound */}
      <div className="p-6 border border-indigo-200 dark:border-slate-50/15 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="font-black text-lg text-indigo-700 dark:text-indigo-300 mb-5 flex items-center gap-2">
          <Music size={20} /> Tambah Suara Publik
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
              📁 Upload File
            </label>
            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
              />
              <div className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                newSound.file 
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-800'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload size={18} className={newSound.file ? 'text-emerald-500' : 'text-indigo-500'} />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    {newSound.file?.name || 'Pilih file audio (.mp3, .wav, .ogg)'}
                  </span>
                  <span className="text-xs text-slate-400">Max 10MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* External URL */}
          <div>
            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
              🌐 Link External
            </label>
            <div className="relative">
              <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={newSound.url}
                onChange={(e) => setNewSound({ ...newSound, url: e.target.value })}
                placeholder="https://example.com/sound.mp3"
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-xl text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Name & Add */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                🏷️ Nama Suara
              </label>
              <input
                type="text"
                value={newSound.name}
                onChange={(e) => setNewSound({ ...newSound, name: e.target.value })}
                placeholder="Epic Win, Cash Sound, dll"
                maxLength={30}
                className="w-full p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-xl text-sm outline-none transition-all font-medium"
              />
            </div>
            
            <button
              onClick={addSound}
              disabled={!newSound.name || !newSound.url || publicSounds.length >= 20 || uploading}
              className="w-full p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {publicSounds.length >= 20 ? 'Max 20 Suara' : '✅ Tambah Suara'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Sounds List */}
      {publicSounds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              🎵 Suara Aktif ({publicSounds.length}/20)
            </h4>
            {playingPreview && (
              <button
                onClick={stopPreview}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-md active:scale-[0.98] transition-all"
              >
                ⏹️ Stop
              </button>
            )}
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/30">
            {publicSounds.map((sound, index) => (
              <motion.div
                key={`${sound.url}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group flex items-center justify-between p-4 bg-white/80 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-xl hover:shadow-md hover:border-indigo-300 transition-all hover:bg-white dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl">{sound.emoji || '🎵'}</span>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">
                      {sound.label || `Suara ${index + 1}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[220px] bg-slate-100/50 dark:bg-slate-900/50 px-2 py-0.5 rounded">
                      {sound.url.startsWith('blob:') ? 'Local File' : new URL(sound.url).hostname}
                    </p>
                  </div>
                  
                  {/* ✅ BETTER PLAY BUTTON */}
                  <button
                    onClick={() => playPreview(getAudioProxyUrl(sound.url))}
                    disabled={previewError}
                    className={`p-3 rounded-xl shadow-md active:scale-[0.95] transition-all flex-shrink-0 flex items-center justify-center ${
                      playingPreview === sound.url
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25'
                        : previewError
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-500 border-2 border-red-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-indigo-500/25'
                    }`}
                    title={previewError ? 'Audio tidak bisa diputar (CORS/proxy)' : 'Preview suara'}
                  >
                    {playingPreview === sound.url ? (
                      <Pause size={18} />
                    ) : previewError ? (
                      <Volume2 size={18} />
                    ) : (
                      <Play size={18} />
                    )}
                  </button>
                </div>
                
                <button
                  onClick={() => removeSound(index)}
                  className="p-3 ml-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl shadow-md hover:shadow-red-500/25 active:scale-[0.95] transition-all flex-shrink-0"
                  title="Hapus suara"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ HIDDEN AUDIO PLAYER dengan PROXY support */}
      <audio 
        ref={audioRef} 
        preload="metadata"
        crossOrigin="anonymous"
        className="hidden"
      />
      
      {/* Preview Error Toast */}
      <AnimatePresence>
        {previewError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-6 z-[1000] bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3 max-w-sm"
          >
            <Volume2 size={18} />
            <span>Audio tidak bisa diputar (CORS)</span>
            <button onClick={() => setPreviewError(false)} className="ml-auto text-white/80 hover:text-white">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioManager;