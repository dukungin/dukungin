import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Moon, Sun, User, 
  ShieldCheck, ArrowLeft, Clock, Loader2 
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ─── Theme tokens ──────────────────────────────────────────────────────────────
const getTheme = (dark) => ({
  pageBg:           dark ? '#0f0c29'                       : '#f5f4ff',
  rightBg:          dark ? '#13111f'                       : '#ffffff',
  inputBg:          dark ? 'rgba(255,255,255,1)'        : 'rgba(79,70,229,0.04)',
  inputBgFocus:     dark ? 'rgba(255,255,255,1)'        : 'rgba(79,70,229,0.07)',
  inputBorder:      dark ? 'rgba(255,255,255,0.12)'        : 'rgba(79,70,229,0.18)',
  inputBorderFocus: dark ? 'rgba(99,102,241,0.7)'          : 'rgba(79,70,229,0.8)',
  tabBg:            dark ? 'rgba(255,255,255,0.04)'        : 'rgba(79,70,229,0.06)',
  tabBorder:        dark ? 'rgba(255,255,255,0.08)'        : 'rgba(79,70,229,0.14)',
  tabInactive:      dark ? '#475569'                       : '#94a3b8',
  divider:          dark ? 'rgba(255,255,255,0.2)'        : 'rgba(0,0,0,0.08)',
  dividerText:      dark ? '#ffffff'                       : '#94a3b8',
  toggleBg:         dark ? 'rgba(255,255,255,0.08)'        : 'rgba(79,70,229,0.08)',
  toggleColor:      dark ? '#a5b4fc'                       : '#4f46e5',
  heading:          dark ? '#ffffff'                       : '#1e1b4b',
  subtext:          dark ? '#475569'                       : '#64748b',
  label:            dark ? '#818cf8'                       : '#4f46e5',
  inputText:        dark ? '#1e1b4b'                       : '#1e1b4b',
  iconDefault:      dark ? '#94a3b8'                       : '#94a3b8',
  switchText:       dark ? '#475569'                       : '#64748b',
  switchLink:       dark ? '#818cf8'                       : '#4f46e5',
  backBtn:          dark ? '#94a3b8'                       : '#64748b',
  forgotColor:      dark ? '#818cf8'                       : '#4f46e5',
  forgotHover:      dark ? '#a78bfa'                       : '#7c3aed',
});

// ─── Background Canvas ─────────────────────────────────────────────────────────
const BgCanvas = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div style={{ 
      position:'absolute', top:'-80px', left:'-60px', width:'420px', height:'420px', 
      borderRadius:'0%', background:'radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)' 
    }} />
    <div style={{ 
      position:'absolute', bottom:'-100px', right:'-80px', width:'360px', height:'360px', 
      borderRadius:'0%', background:'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' 
    }} />
    <svg width="100%" height="100%" style={{ opacity:0.06 }}>
      <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  </div>
);

// ─── Notification Modal ────────────────────────────────────────────────────────
const NotifModal = ({ notification, onClose }) => (
  <AnimatePresence>
    {notification.show && (
      <div className='fixed z-[9999] w-screen h-screen flex justify-center items-center'>
        <motion.div 
          initial={{ opacity:0 }} 
          animate={{ opacity:1 }} 
          exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(15,15,30,0.75)', backdropFilter:'blur(10px)' }}
          onClick={onClose} 
        />
        <motion.div
          initial={{ opacity:0, scale:0.88, y:28 }} 
          animate={{ opacity:1, scale:1, y:0 }} 
          exit={{ opacity:0, scale:0.88, y:28 }}
          transition={{ type:'spring', stiffness:340, damping:30 }}
          style={{ position:'fixed', zIndex:101, transform:'translate(-50%,-50%)', width:'92vw', maxWidth:400 }}
        >
          <div style={{ 
            background:'rgba(255,255,255,0.97)', padding:'36px 32px', 
            boxShadow:'0 32px 80px rgba(0,0,0,0.22)', textAlign:'center' 
          }}>
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} 
              transition={{ type:'spring', stiffness:400, damping:20, delay:0.1 }}
              style={{ 
                width:68, height:68, margin:'0 auto 20px', display:'flex', 
                alignItems:'center', justifyContent:'center', 
                background: notification.type==='success' ? '#ecfdf5' : '#fff1f2', 
                color: notification.type==='success' ? '#059669' : '#e11d48' 
              }}
            >
              {notification.type==='success' ? <CheckCircle2 size={34}/> : <AlertCircle size={34}/>}
            </motion.div>
            <h3 style={{ fontSize:20, fontWeight:900, color:'#1e1b4b', marginBottom:8 }}>
              {notification.title}
            </h3>
            <p style={{ fontSize:14, color:'#64748b', lineHeight:1.6, marginBottom:24 }}>
              {notification.message}
            </p>
            <button onClick={onClose}
              style={{ 
                width:'100%', padding:'14px 0', borderRadius:0, fontWeight:900, fontSize:14, 
                border:'none', cursor:'pointer', 
                background: notification.type==='success' ? '#4f46e5' : '#e11d48', 
                color:'white', transition:'opacity 0.2s' 
              }}
              onMouseEnter={e => e.target.style.opacity='0.88'} 
              onMouseLeave={e => e.target.style.opacity='1'}
            >
              {notification.type==='success' ? 'Lanjutkan →' : 'Coba Lagi'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─── Auth Input Component ─────────────────────────────────────────────────────
const AuthInput = ({ icon: Icon, type='text', value, onChange, placeholder, T, className = "" }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={{ position:'relative' }}>
      <div style={{ 
        position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', 
        color: focused ? '#4f46e5' : T.iconDefault, transition:'color 0.2s', 
        zIndex:1, display:'flex' 
      }}>
        <Icon size={18} />
      </div>
      <input
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={e => onChange(e.target.value.replace(/<script.*?>.*?<\/script>/gi, ''))}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:'100%', boxSizing:'border-box',
          background: focused ? T.inputBgFocus : T.inputBg,
          border: `1.5px solid ${focused ? T.inputBorderFocus : T.inputBorder}`,
          borderRadius:0, padding:'15px 48px',
          color: T.inputText, fontSize:15, fontWeight:600,
          outline:'none', transition:'all 0.2s',
        }}
        className={`auth-input-field ${className}`}
      />
      {isPassword && (
        <button type="button" onClick={() => setShowPassword(v => !v)}
          style={{ 
            position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', 
            background:'none', border:'none', cursor:'pointer', color: T.iconDefault, 
            display:'flex', zIndex:1 
          }}
        >
          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
      )}
    </div>
  );
};

// ─── Left Panel Components ────────────────────────────────────────────────────
const BrandLogo = () => (
  <div className='md:mb-[48px] mb-0 inline-flex' style={{ 
    alignItems:'center', gap:10, background:'rgba(255,255,255,0.12)', 
    border:'1px solid rgba(255,255,255,0.2)', borderRadius:0, padding:'8px 16px' 
  }}>
    <div style={{ width:26, height:26, background:'white', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span className='flex justify-center items-center' style={{ color:'#4f46e5', fontWeight:900, fontSize:13, fontStyle:'italic' }}>
        <img src="/jellyfish.png" alt="icon" className='w-[70%] h-[70%]' />
      </span>
    </div>
    <span style={{ color:'white', fontWeight:800, fontSize:13, letterSpacing:'-0.01em' }}>
      TAPTIPTUP From Indonesia 🚀
    </span>
  </div>
);

const HeroJellyfish = () => (
  <div style={{ position:'relative' }} className='md:mb-[32px] mt-0 md:mt-[-10px] mb-[16px]'>
    <motion.img className='md:block hidden' src="/jellyfish.png" alt=""
      animate={{ y:[0,-10,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
      style={{ width:'18%', userSelect:'none', pointerEvents:'none' }} />
    <motion.img className='md:block md:opacity-[0.45] opacity-[0.20]' src="/jellyfish.png" alt=""
      animate={{ y:[0,8,0], rotate:[-45,-38,-45] }} 
      transition={{ duration:5.5, repeat:Infinity, ease:'easeInOut', delay:0.8 }}
      style={{ position:'absolute', top:-60, right:-30, width:'44%', transform:'rotate(-45deg)', userSelect:'none', pointerEvents:'none' }} />
  </div>
);

const HeroContent = () => (
  <>
    <h1 style={{ 
      fontSize:'clamp(28px,3.2vw,40px)', fontWeight:900, color:'white', 
      lineHeight:1.20, letterSpacing:'-0.02em', marginBottom:14 
    }}>
      Mulai Terima<br />
      <span style={{ color:'#a5b4fc' }}>Dukungan</span> Real-time.
    </h1>
    <p style={{ color:'rgba(199,210,254,0.8)', lineHeight:1.65 }} 
       className='md:text-[15px] text-[13px] md:w-[90%] w-[98%]'>
      Platform donasi real-time untuk streamer Indonesia dengan overlay OBS custom, 
      pembayaran lokal, dan pencairan cepat.
    </p>
  </>
);

const StatBadge = ({ value, label }) => (
  <div style={{ 
    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', 
    padding:'14px 20px', textAlign:'center' 
  }}>
    <div style={{ fontSize:22, fontWeight:900, color:'white', lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:4, fontWeight:600 }}>
      {label}
    </div>
  </div>
);

const StatsGrid = () => (
  <div className='md:inline hidden' style={{ position:'relative', zIndex:10 }}>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:28 }}>
      <StatBadge value="2.5%" label="Potongan" />
      <StatBadge value="99.9%" label="Uptime" />
      <StatBadge value="<2det" label="Notif Alert" />
    </div>
  </div>
);

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────
const LeftPanel = () => (
  <div className="auth-left md:h-[100vh] h-max" style={{
    position:'relative', width:'48%',
    background:'linear-gradient(145deg, #312e81 0%, #4f46e5 45%, #6d28d9 100%)',
    display:'flex', flexDirection:'column', justifyContent:'space-between',
    padding:'48px 44px', overflow:'hidden',
  }}>
    <BgCanvas />
    <div style={{ position:'relative', zIndex:10 }}>
      <BrandLogo />
      <HeroJellyfish />
      <HeroContent />
    </div>
    <StatsGrid />
  </div>
);

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
const ThemeToggle = ({ isDark, onToggle, T }) => (
  <motion.button onClick={onToggle} whileTap={{ scale:0.90 }} style={{
    position:'absolute', top:24, right:24, display:'flex', alignItems:'center', gap:7,
    background: T.toggleBg, padding:'12px 18px', cursor:'pointer', zIndex:20,
    borderRadius:0, transition:'background 0.35s',
  }}>
    <AnimatePresence mode="wait">
      <motion.div key={isDark ? 'moon' : 'sun'}
        initial={{ opacity:0, rotate:-30, scale:0.7 }}
        animate={{ opacity:1, rotate:0, scale:1 }}
        exit={{ opacity:0, rotate:30, scale:0.7 }}
        transition={{ duration:0.22 }}
        style={{ display:'flex', color: T.toggleColor }}
      >
        {isDark ? <Moon size={15}/> : <Sun size={15}/>}
      </motion.div>
    </AnimatePresence>
    <span style={{ fontSize:12, fontWeight:800, color: T.toggleColor, letterSpacing:'0.02em' }}>
      {isDark ? 'Dark' : 'Light'}
    </span>
  </motion.button>
);

// ─── RIGHT PANEL WRAPPER ──────────────────────────────────────────────────────
const RightPanel = ({ T, isDark, setIsDark, children }) => (
  <div className='md:min-h-[100vh] h-max pb-8 md:pb-[40px] md:py-[40px] md:px-[0px] py-[20px]' 
    style={{
      flex:1, position:'relative', background: T.rightBg, display:'flex', 
      alignItems:'center', justifyContent:'center', transition:'background 0.35s',
    }}
  >
    <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} T={T} />
    <div style={{ width:'100%', maxWidth: '80%', marginTop: 16 }}>
      {children}
    </div>
  </div>
);

// ─── MAIN AUTH FORM ───────────────────────────────────────────────────────────
const MainAuthForm = ({ 
  T, isLogin, setIsLogin, loading, formData, setFormData, 
  isTabActive, handleSubmit, setCurrentPage 
}) => {
  const isFormValid = formData.email && formData.password && (isLogin || formData.username);

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="main-form"
        initial={{ opacity:0, y:20 }} 
        animate={{ opacity:1, y:0 }} 
        exit={{ opacity:0, y:-20 }}
        transition={{ duration:0.22 }}
      >
        <div style={{ marginBottom:28 }}>
          <h2 style={{ 
            fontSize:28, fontWeight:900, color: T.heading, lineHeight:1.2, 
            letterSpacing:'-0.01em', transition:'color 0.35s' 
          }}>
            {isLogin ? 'Login ke Dashboard' : 'Buat Akun Baru'}
          </h2>
          <p style={{ color: T.subtext, fontSize:14, marginTop:8, lineHeight:1.55 }}>
            {isLogin 
              ? 'Masuk untuk mengelola overlay dan donasi kamu.' 
              : 'Daftar sekarang dan mulai kustomisasi alert-mu.'
            }
          </p>
        </div>

        <div style={{ 
          display:'flex', background: T.tabBg, border:`1px solid ${T.tabBorder}`, 
          borderRadius:0, padding:6, marginBottom:28 
        }}>
          {['Masuk','Daftar'].map((label, i) => (
            <button key={label} className="tab-btn" onClick={() => setIsLogin(i === 0)}
              style={{ 
                flex:1, padding:'12px 0', borderRadius:0, fontWeight:800, fontSize:14, 
                cursor:'pointer', border:'none',
                background: isTabActive(i) ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                color: isTabActive(i) ? 'white' : T.tabInactive,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:20 }}>
            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  key="username" 
                  initial={{ opacity:0, height:0, marginBottom:0 }} 
                  animate={{ opacity:1, height:'auto', marginBottom:16 }} 
                  exit={{ opacity:0, height:0, marginBottom:0 }}
                  transition={{ duration:0.2 }}
                >
                  <AuthInput 
                    icon={User} 
                    placeholder="Username" 
                    value={formData.username} 
                    onChange={v => setFormData(f => ({ ...f, username:v }))} 
                    T={T} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <AuthInput 
              icon={Mail} 
              type="email" 
              placeholder="Alamat Email" 
              value={formData.email} 
              onChange={v => setFormData(f => ({ ...f, email:v }))} 
              T={T} 
            />
            <AuthInput 
              icon={Lock} 
              type="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={v => setFormData(f => ({ ...f, password:v }))} 
              T={T} 
            />
          </div>

          {isLogin && (
            <div style={{ textAlign:'right', marginBottom:24 }}>
              <button type="button" onClick={() => setCurrentPage('forgot-password')}
                style={{ 
                  background:'none', border:'none', cursor:'pointer', 
                  color: T.forgotColor, fontSize:13, fontWeight:700, 
                  transition:'color 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.color=T.forgotHover}
                onMouseLeave={e => e.currentTarget.style.color=T.forgotColor}
              >
                Lupa Password?
              </button>
            </div>
          )}

          <button type="submit" disabled={!isFormValid || loading} className="submit-btn"
            style={{ 
              width:'100%', padding:'16px 0', borderRadius:0, fontWeight:900, fontSize:15, 
              border:'none', cursor:'pointer', 
              background: isFormValid ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e2e8f0',
              color: isFormValid ? 'white' : '#64748b', 
              opacity: loading ? 0.65 : 1, display:'flex', alignItems:'center', 
              justifyContent:'center', gap:8, 
              boxShadow: isFormValid ? '0 8px 32px rgba(79,70,229,0.4)' : 'none',
              transition:'all 0.2s'
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Login Dashboard' : 'Daftar Sekarang'}
                <ArrowRight size={16}/>
              </>
            )}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0' }}>
          <div style={{ flex:1, height:1, background: T.divider }} />
          <span style={{ color: T.dividerText, fontSize:12, fontWeight:600 }}>atau</span>
          <div style={{ flex:1, height:1, background: T.divider }} />
        </div>

        <p style={{ textAlign:'center', color: T.switchText, fontSize:14 }}>
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background:'none', border:'none', cursor:'pointer', 
              color: T.switchLink, fontWeight:800, fontSize:14 
            }}
            onMouseEnter={e => e.currentTarget.style.color='#7c3aed'}
            onMouseLeave={e => e.currentTarget.style.color=T.switchLink}
          >
            {isLogin ? 'Daftar Gratis' : 'Masuk Sekarang'}
          </button>
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── FORGOT PASSWORD PAGE ────────────────────────────────────────────────────
const ForgotPasswordPage = ({ T, setCurrentPage, emailReset, setEmailReset, loading, setLoading, notify, closeNotif }) => {
  const handleForgotPassword = async () => {
    if (!emailReset) return;
    
    setLoading(true);
    try {
      const res = await axios.post('https://server-dukungin-production.up.railway.app/api/auth/forgot-password', { 
        email: emailReset 
      });
      notify('Link Reset Dikirim!', res.data.message, 'success');
      setTimeout(() => {
        closeNotif();
        setCurrentPage('main');
      }, 3000);
    } catch (err) {
      notify('Gagal', err.response?.data?.message || 'Email tidak terdaftar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      key="forgot" 
      initial={{ opacity:0, y:20 }} 
      animate={{ opacity:1, y:0 }} 
      exit={{ opacity:0, y:-20 }}
    >
      <button onClick={() => setCurrentPage('main')}
        style={{ 
          position: 'absolute',
          top: 40,
          marginLeft: -3,
          background:'none', border:'none', cursor:'pointer', color: T.backBtn, 
          fontSize:14, fontWeight:700, display:'flex', alignItems:'center', gap:6, 
          marginBottom:32, transition:'color 0.2s' 
        }}
        onMouseEnter={e => e.currentTarget.style.color='#4f46e5'}
        onMouseLeave={e => e.currentTarget.style.color=T.backBtn}
      >
        <ArrowLeft size={18} />
        Kembali
      </button>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          width: 72, height: 72, margin: '0 auto 20px', background: '#fef3c7', 
          borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Mail size={32} style={{ color: '#d97706' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.heading, marginBottom: 8 }}>
          Lupa Password?
        </h2>
        <p style={{ color: T.subtext, fontSize:14, lineHeight:1.6 }}>
          Masukkan email kamu dan kami akan kirim link reset password.
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <AuthInput 
          icon={Mail} 
          placeholder="Email kamu" 
          value={emailReset} 
          onChange={setEmailReset} 
          T={T} 
        />
        <button 
          onClick={handleForgotPassword} 
          disabled={loading || !emailReset}
          className="submit-btn"
          style={{ 
            width:'100%', padding:'16px 0', borderRadius:0, fontWeight:900, fontSize:14, 
            border:'none', cursor:'pointer', 
            background: emailReset ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0', 
            color: emailReset ? 'white' : '#64748b', opacity: loading ? 0.6 : 1, 
            display:'flex', alignItems:'center', justifyContent:'center', gap:8 
          }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Link Reset →'}
        </button>
      </div>
    </motion.div>
  );
};

// ─── VERIFY PIN PAGE ─────────────────────────────────────────────────────────
const VerifyPinPage = ({ T, notify, closeNotif, navigate, email }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    
    setLoading(true);
    try {
      const res = await axios.post('https://server-dukungin-production.up.railway.app/api/auth/verify-pin', {
        email, pin
      });
      notify('Verifikasi Berhasil!', res.data.message, 'success');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err) {
      notify('Gagal', err.response?.data?.message || 'PIN salah atau kadaluarsa', 'error');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    try {
      const res = await axios.post('https://server-dukungin-production.up.railway.app/api/auth/resend-pin', { email });
      notify('PIN Baru Dikirim!', res.data.message, 'success');
      setCountdown(300);
    } catch (err) {
      notify('Gagal', err.response?.data?.message, 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <motion.div 
      key="verify-pin" 
      initial={{ opacity:0, y:20 }} 
      animate={{ opacity:1, y:0 }} 
      exit={{ opacity:0, y:-20 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          width: 80, height: 80, margin: '0 auto 24px', background: '#eff6ff', 
          borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <ShieldCheck size={36} style={{ color: '#4f46e5' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.heading, marginBottom: 8 }}>
          Verifikasi PIN
        </h2>
        <p style={{ color: T.subtext, fontSize:14 }}>
          Masukkan 6 digit kode yang dikirim ke <strong>{email}</strong>
        </p>
        {countdown > 0 && (
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
            background: '#dbeafe', borderRadius: 999, padding: '8px 16px', marginTop: 12 
          }}>
            <Clock size={16} style={{ color: '#1e40af' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1e40af' }}>
              {formatTime(countdown)}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleVerify}>
        <div style={{ marginBottom: 24 }}>
          <input
            type="text" 
            maxLength={6} 
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').toUpperCase())}
            placeholder="000000"
            style={{
              width: '100%', boxSizing: 'border-box', background: T.inputBgFocus,
              border: `2px solid ${T.inputBorderFocus}`, borderRadius: 16, 
              padding: '24px 20px', fontSize: 32, fontWeight: 800, 
              textAlign: 'center', letterSpacing: '12px', 
              color: T.inputText, outline: 'none', fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || pin.length !== 6}
          className="submit-btn"
          style={{ 
            width: '100%', padding: '18px 0', borderRadius: 16, fontWeight: 900, fontSize: 15, 
            border: 'none', cursor: 'pointer', 
            background: pin.length === 6 ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
            color: pin.length === 6 ? 'white' : '#64748b', 
            opacity: loading ? 0.7 : 1 
          }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verifikasi PIN'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <button 
          onClick={handleResend} 
          disabled={resendLoading || countdown > 0}
          style={{ 
            background: 'none', border: 'none', color: T.forgotColor, 
            fontSize: 14, fontWeight: 600, cursor: countdown > 0 ? 'not-allowed' : 'pointer',
            opacity: countdown > 0 ? 0.5 : 1 
          }}
        >
          {resendLoading ? 'Mengirim...' : countdown > 0 ? `Kirim ulang ${formatTime(countdown)}` : 'Kirim ulang PIN'}
        </button>
      </div>
    </motion.div>
  );
};

// ─── RESET PASSWORD PAGE ─────────────────────────────────────────────────────
const ResetPasswordPage = ({ T, notify, closeNotif, navigate }) => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password konfirmasi tidak cocok');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('https://server-dukungin-production.up.railway.app/api/auth/reset-password', {
        email, token, newPassword: formData.password
      });
      notify('Password Berhasil Diubah!', res.data.message, 'success');
      setTimeout(() => navigate('/auth'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Token tidak valid atau sudah kadaluarsa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !email) {
      navigate('/auth');
    }
  }, [token, email, navigate]);

  if (!token || !email) return null;

  return (
    <motion.div 
      key="reset-password" 
      initial={{ opacity:0, y:20 }} 
      animate={{ opacity:1, y:0 }} 
      exit={{ opacity:0, y:-20 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          width: 80, height: 80, margin: '0 auto 24px', background: '#ecfdf5', 
          borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <ShieldCheck size={36} style={{ color: '#059669' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.heading, marginBottom: 8 }}>
          Reset Password
        </h2>
        <p style={{ color: T.subtext, fontSize:14 }}>
          Buat password baru untuk akun <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity:0, height:0 }} 
          animate={{ opacity:1, height: 'auto' }} 
          style={{ 
            background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, 
            padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center' 
          }}
        >
          <AlertCircle size={18} style={{ color: '#ef4444', marginRight: 12 }} />
          <span style={{ color: '#dc2626', fontSize: 14, fontWeight: 500 }}>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleReset}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AuthInput 
            icon={Lock} 
            type="password" 
            placeholder="Password baru (min 6 karakter)" 
            value={formData.password}
            onChange={v => setFormData(f => ({ ...f, password: v }))}
            T={T}
          />
          <AuthInput 
            icon={Lock} 
            type="password" 
            placeholder="Konfirmasi password" 
            value={formData.confirmPassword}
            onChange={v => setFormData(f => ({ ...f, confirmPassword: v }))}
            T={T}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="submit-btn"
            style={{ 
              width: '100%', padding: '18px 0', borderRadius: 16, fontWeight: 900, fontSize: 15, 
              border: 'none', cursor: 'pointer', 
              background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', 
              opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set Password Baru'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Auth = () => {
  const [isDark, setIsDark] = useState(false);
  const T = getTheme(isDark);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Page state
  const [currentPage, setCurrentPage] = useState('main');
  const [tempEmail, setTempEmail] = useState('');

  // Form state
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username:'', email:'', password:'' });
  const [emailReset, setEmailReset] = useState('');

  // Notification
  const [notification, setNotification] = useState({ show:false, title:'', message:'', type:'success' });
  const notify = (title, message, type='success') => setNotification({ show:true, title, message, type });
  const closeNotif = () => setNotification(n => ({ ...n, show:false }));

  // Check reset password URL
  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (token && email) {
      setCurrentPage('reset-password');
    }
  }, [searchParams]);

  // Main form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isFormValid = formData.email && formData.password && (isLogin || formData.username);
    
    if (!isFormValid) return;
    
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`https://server-dukungin-production.up.railway.app${endpoint}`, formData);
      
      if (isLogin) {
        // Login success
        localStorage.setItem('token', res.data.token);
        notify('Login Berhasil!', 'Selamat datang kembali di dashboard!', 'success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        // Register → Verify PIN
        setTempEmail(formData.email);
        notify('Registrasi Berhasil!', 'Cek email kamu untuk PIN verifikasi (berlaku 5 menit)', 'success');
        setTimeout(() => {
          closeNotif();
          setCurrentPage('verify-pin');
          setFormData({ username:'', email:'', password:'' });
        }, 2500);
      }
    } catch (err) {
      notify('Gagal', err.response?.data?.message || 'Koneksi terputus atau server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isTabActive = (i) => (isLogin && i === 0) || (!isLogin && i === 1);

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'reset-password':
        return <ResetPasswordPage T={T} notify={notify} closeNotif={closeNotif} navigate={navigate} />;
      
      case 'verify-pin':
        return <VerifyPinPage T={T} notify={notify} closeNotif={closeNotif} navigate={navigate} email={tempEmail} />;
      
      case 'forgot-password':
        return (
          <ForgotPasswordPage 
            T={T} setCurrentPage={setCurrentPage} 
            emailReset={emailReset} setEmailReset={setEmailReset}
            loading={loading} setLoading={setLoading}
            notify={notify} closeNotif={closeNotif}
          />
        );
      
      default:
        return (
          <MainAuthForm 
            T={T} isLogin={isLogin} setIsLogin={setIsLogin}
            loading={loading} formData={formData} setFormData={setFormData}
            isTabActive={isTabActive} handleSubmit={handleSubmit}
            setCurrentPage={setCurrentPage}
          />
        );
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .auth-input-field::placeholder { color: #94a3b8 !important; font-weight: 400; }
        .tab-btn { transition: all 0.22s cubic-bezier(.4,0,.2,1); }
        .tab-btn:active { transform: scale(0.97); }
        .submit-btn:active:not(:disabled) { transform: scale(0.97) !important; }
        .submit-btn:hover:not(:disabled) { filter: brightness(1.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-root { flex-direction: column !important; }
          .auth-left { width: 100% !important; min-height: auto !important; padding: 32px 0px !important; }
        }
      `}</style>

      <div className="auth-root" style={{ 
        minHeight:'100vh', overflow:'hidden', background: T.pageBg, 
        display:'flex', flexDirection:'row', transition:'background 0.35s' 
      }}>
        <NotifModal notification={notification} onClose={closeNotif} />
        
        <LeftPanel />
        <RightPanel T={T} isDark={isDark} setIsDark={setIsDark}>
          <AnimatePresence mode="wait">
            {renderPage()}
          </AnimatePresence>
        </RightPanel>
      </div>
    </>
  );
};

export default Auth;