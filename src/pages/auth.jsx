import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Moon, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  toggleBorder:     dark ? 'rgba(255,255,255,0.15)'        : 'rgba(79,70,229,0.2)',
  toggleColor:      dark ? '#a5b4fc'                       : '#4f46e5',
  heading:          dark ? '#ffffff'                       : '#1e1b4b',
  subtext:          dark ? '#475569'                       : '#64748b',
  label:            dark ? '#818cf8'                       : '#4f46e5',
  inputText:        dark ? '#1e1b4b'                       : '#1e1b4b',
  inputPlaceholder: '94a3b8',
  iconDefault:      dark ? '#94a3b8'                       : '#94a3b8',
  switchText:       dark ? '#475569'                       : '#64748b',
  switchLink:       dark ? '#818cf8'                       : '#4f46e5',
  backBtn:          dark ? '#94a3b8'                       : '#64748b',
  forgotColor:      dark ? '#818cf8'                       : '#4f46e5',
  forgotHover:      dark ? '#a78bfa'                       : '#7c3aed',
});

// ─── Left panel BG (always dark) ──────────────────────────────────────────────
const BgCanvas = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div style={{ position:'absolute', top:'-80px', left:'-60px', width:'420px', height:'420px', borderRadius:'0%', background:'radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)' }} />
    <div style={{ position:'absolute', bottom:'-100px', right:'-80px', width:'360px', height:'360px', borderRadius:'0%', background:'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
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
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(15,15,30,0.75)', backdropFilter:'blur(10px)' }}
          onClick={onClose} />
        <motion.div
          initial={{ opacity:0, scale:0.88, y:28 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.88, y:28 }}
          transition={{ type:'spring', stiffness:340, damping:30 }}
          style={{ position:'fixed', zIndex:101, transform:'translate(-50%,-50%)', width:'92vw', maxWidth:400 }}>
          <div style={{ background:'rgba(255,255,255,0.97)', borderRadius:0, padding:'36px 32px', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', textAlign:'center' }}>
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:400, damping:20, delay:0.1 }}
              style={{ width:68, height:68, borderRadius:0, margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', background: notification.type==='success' ? '#ecfdf5' : '#fff1f2', color: notification.type==='success' ? '#059669' : '#e11d48' }}>
              {notification.type==='success' ? <CheckCircle2 size={34}/> : <AlertCircle size={34}/>}
            </motion.div>
            <h3 style={{ fontSize:20, fontWeight:900, color:'#1e1b4b', marginBottom:8 }}>{notification.title}</h3>
            <p style={{ fontSize:14, color:'#64748b', lineHeight:1.6, marginBottom:24 }}>{notification.message}</p>
            <button onClick={onClose}
              style={{ width:'100%', padding:'14px 0', borderRadius:0, fontWeight:900, fontSize:14, border:'none', cursor:'pointer', background: notification.type==='success' ? '#4f46e5' : '#e11d48', color:'white', transition:'opacity 0.2s' }}
              onMouseEnter={e => e.target.style.opacity='0.88'} onMouseLeave={e => e.target.style.opacity='1'}>
              {notification.type==='success' ? 'Lanjutkan →' : 'Coba Lagi'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─── Input Field ───────────────────────────────────────────────────────────────
const AuthInput = ({ icon, type='text', value, onChange, placeholder, T }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={{ position:'relative' }}>
      <div style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color: focused ? '#4f46e5' : T.iconDefault, transition:'color 0.2s', zIndex:1, display:'flex' }}>
        {icon}
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
          color: T.inputText, 
          fontSize:15, fontWeight:600,
          outline:'none', transition:'all 0.2s',
        }}
        className="auth-input-field"
      />
      {isPassword && (
        <button type="button" onClick={() => setShowPassword(v => !v)}
          style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color: T.iconDefault, display:'flex', zIndex:1 }}>
          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
      )}
    </div>
  );
};

// ─── Left panel sub-components ─────────────────────────────────────────────────
const Pill = ({ label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:999, padding:'6px 14px' }}>
    <div style={{ width:6, height:6, borderRadius:'0%', background:'#34d399', flexShrink:0 }} />
    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>{label}</span>
  </div>
);

const StatBadge = ({ value, label }) => (
  <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'14px 20px', textAlign:'center' }}>
    <div style={{ fontSize:22, fontWeight:900, color:'white', lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:4, fontWeight:600 }}>{label}</div>
  </div>
);

// ─── Theme Toggle Button ───────────────────────────────────────────────────────
const ThemeToggle = ({ isDark, onToggle, T }) => (
  <motion.button
    onClick={onToggle}
    whileTap={{ scale:0.90 }}
    style={{
      position:'absolute', top:0, right:0,
      display:'flex', alignItems:'center', gap:7,
      background: T.toggleBg,
      // border: `1px solid ${T.toggleBorder}`,
      // borderRadius:999, 
      padding:'12px 18px',
      cursor:'pointer', zIndex:20,
      transition:'background 0.35s, border-color 0.35s',
    }}
  >
    <AnimatePresence mode="wait">
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ opacity:0, rotate:-30, scale:0.7 }}
        animate={{ opacity:1, rotate:0, scale:1 }}
        exit={{ opacity:0, rotate:30, scale:0.7 }}
        transition={{ duration:0.22 }}
        style={{ display:'flex', color: T.toggleColor }}
      >
        {isDark ? <Moon size={15}/> : <Sun size={15}/>}
      </motion.div>
    </AnimatePresence>
    <span style={{ fontSize:12, fontWeight:800, color: T.toggleColor, letterSpacing:'0.02em', transition:'color 0.35s' }}>
      {isDark ? 'Dark' : 'Light'}
    </span>
  </motion.button>
);

// ─── Main Auth ─────────────────────────────────────────────────────────────────
const Auth = () => {
  const [isDark, setIsDark] = useState(false);
  const T = getTheme(isDark);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username:'', email:'', password:'' });
  const [isForgot, setIsForgot] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  const navigate = useNavigate();

  const [notification, setNotification] = useState({ show:false, title:'', message:'', type:'success' });
  const notify = (title, message, type='success') => setNotification({ show:true, title, message, type });
  const closeNotif = () => setNotification(n => ({ ...n, show:false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`https://server-dukungin-production.up.railway.app${endpoint}`, formData);
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        notify('Berhasil!', res.data.message || 'Login berhasil!', 'success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        notify('Hai Streamer!', 'Akun kamu berhasil dibuat. Silakan login.', 'success');
        setFormData({ username:'', email:'', password:'' });
        setTimeout(() => { closeNotif(); setIsLogin(true); }, 2000);
      }
    } catch (err) {
      notify('Gagal', err.response?.data?.message || 'Koneksi terputus atau server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const res = await axios.post('https://server-dukungin-production.up.railway.app/api/auth/forgot-password', { email: emailReset });
      notify('Berhasil', res.data.message, 'success');
      setIsForgot(false);
    } catch (err) {
      notify('Gagal', err.response?.data?.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isTabActive = (i) => (isLogin && i === 0) || (!isLogin && i === 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .auth-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .auth-input-field::placeholder { color: #94a3b8 !important; font-weight: 400; }
        .tab-btn { transition: all 0.22s cubic-bezier(.4,0,.2,1); }
        .tab-btn:active { transform: scale(0.97); }
        .submit-btn:active { transform: scale(0.97) !important; }
        .submit-btn:hover { filter: brightness(1.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-root { flex-direction: column !important; }
          .auth-left { width: 100% !important; min-height: auto !important; padding: 32px 24px !important; }
        }
      `}</style>

      <div className="auth-root" style={{ minHeight:'100vh', overflow:'hidden', background: T.pageBg, display:'flex', flexDirection:'row', transition:'background 0.35s' }}>
        <NotifModal notification={notification} onClose={closeNotif} />

        {/* ── LEFT: Brand Panel (always dark) ── */}
        <div className="auth-left md:h-[100vh] h-max" style={{
          position:'relative', width:'48%',
          background:'linear-gradient(145deg, #312e81 0%, #4f46e5 45%, #6d28d9 100%)',
          display:'flex', flexDirection:'column', justifyContent:'space-between',
          padding:'48px 44px', overflow:'hidden',
        }}>
          <BgCanvas />

          <div style={{ position:'relative', zIndex:10 }}>
            <div className='md:mb-[48px] mb-0 inline-flex' style={{ alignItems:'center', gap:10, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:0, padding:'8px 16px' }}>
              <div style={{ width:26, height:26, background:'white', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'#4f46e5', fontWeight:900, fontSize:13, fontStyle:'italic' }}>S</span>
              </div>
              <span style={{ color:'white', fontWeight:800, fontSize:13, letterSpacing:'-0.01em' }}>TAPTIPTUP From Indonesia 🚀</span>
            </div>

            <div style={{ position:'relative' }} className='md:mb-[32px] mt-0 md:mt-[-10px] mb-[16px]'>
              <motion.img className='md:block hidden' src="/jellyfish.png" alt=""
                animate={{ y:[0,-10,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:'18%', userSelect:'none', pointerEvents:'none' }} />
              <motion.img className='md:block md:opacity-[0.45] opacity-[0.20]' src="/jellyfish.png" alt=""
                animate={{ y:[0,8,0], rotate:[-45,-38,-45] }} transition={{ duration:5.5, repeat:Infinity, ease:'easeInOut', delay:0.8 }}
                style={{ position:'absolute', top:-60, right:-30, width:'44%', transform:'rotate(-45deg)', userSelect:'none', pointerEvents:'none' }} />
            </div>

            <h1 style={{ fontSize:'clamp(28px,3.2vw,40px)', fontWeight:900, color:'white', lineHeight:1.20, letterSpacing:'-0.02em', marginBottom:14 }}>
              Mulai Terima<br />
              <span style={{ color:'#a5b4fc' }}>Dukungan</span> Real-time.
            </h1>
            <p style={{ color:'rgba(199,210,254,0.8)', lineHeight:1.65 }} className='md:text-[15px] text-[13px] md:w-[90%] w-[98%]'>
              Platform donasi real-time untuk streamer Indonesia dengan overlay OBS custom, pembayaran lokal, dan pencairan cepat.
            </p>
          </div>

          <div style={{ position:'relative', zIndex:10 }} className='md:inline hidden'>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:28 }}>
              <StatBadge value="12K+" label="Streamer Aktif" />
              <StatBadge value="99.9%" label="Uptime" />
              <StatBadge value="<2det" label="Notif Alert" />
            </div>
            {/* <div style={{ height:1, background:'rgba(255,255,255,0.1)', marginBottom:20 }} /> */}
            {/* <div className='hidden md:flex' style={{ flexWrap:'wrap', gap:8 }}>
              <Pill label="Integrasi Midtrans" />
              <Pill label="Overlay OBS Custom" />
              <Pill label="Interface Modern" />
            </div> */}
          </div>

          {/* <p style={{ position:'relative', zIndex:10, color:'rgba(255,255,255,0.28)', fontSize:11, fontWeight:500 }}>
            © 2025 TapTipTup · Made with ❤️ in Indonesia
          </p> */}
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <div 
          className='md:min-h-[100vh] h-max pb-8 md:pb-[40px] md:py-[40px] md:px-[24px] py-[20px]'
          style={{
          flex:1, position:'relative',
          background: T.rightBg,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'background 0.35s',
        }}>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} T={T} />

          <div style={{ width:'100%', maxWidth: '90%', marginTop: 16 }}>
            <AnimatePresence mode="wait">

              {/* FORGOT PASSWORD */}
              {isForgot ? (
                <motion.div key="forgot" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} transition={{ duration:0.22 }}>
                  <button onClick={() => setIsForgot(false)}
                    style={{ background:'none', border:'none', cursor:'pointer', color: T.backBtn, fontSize:14, fontWeight:700, display:'flex', alignItems:'center', gap:6, marginBottom:32, transition:'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color='#4f46e5'}
                    onMouseLeave={e => e.currentTarget.style.color=T.backBtn}>
                    ← Kembali
                  </button>
                  <h2 style={{ fontSize:26, fontWeight:900, color: T.heading, marginBottom:8, transition:'color 0.35s' }}>Lupa Password?</h2>
                  <p style={{ color: T.subtext, fontSize:14, lineHeight:1.6, marginBottom:28, transition:'color 0.35s' }}>
                    Masukkan email kamu dan kami akan kirim link reset.
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <AuthInput icon={<Mail size={18}/>} placeholder="Email kamu" value={emailReset} onChange={setEmailReset} T={T} />
                    <button onClick={handleForgotPassword} disabled={loading} className="submit-btn"
                      style={{ width:'100%', padding:'15px 0', borderRadius:0, fontWeight:900, fontSize:14, border:'none', cursor:'pointer', background:'linear-gradient(135deg, #4f46e5, #7c3aed)', color:'white', opacity: loading ? 0.6 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 8px 32px rgba(79,70,229,0.35)', transition:'all 0.2s' }}>
                      {loading
                        ? <div style={{ width:16, height:16, border:'3px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'0%', animation:'spin 0.7s linear infinite' }} />
                        : 'Kirim Link Reset →'}
                    </button>
                  </div>
                </motion.div>

              ) : (

                /* LOGIN / REGISTER */
                <motion.div key={isLogin ? 'login' : 'register'} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} transition={{ duration:0.22 }}>
                  <div style={{ marginBottom:28 }}>
                    {/* <p style={{ color: T.label, fontSize:13, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6, transition:'color 0.35s' }}>
                      {isLogin ? '👋 Selamat datang kembali' : '✨ Bergabung sekarang'}
                    </p> */}
                    <h2 style={{ fontSize:28, fontWeight:900, color: T.heading, lineHeight:1.2, letterSpacing:'-0.01em', transition:'color 0.35s' }}>
                      {isLogin ? 'Login ke Dashboard' : 'Buat Akun Baru'}
                    </h2>
                    <p style={{ color: T.subtext, fontSize:14, marginTop:8, lineHeight:1.55, transition:'color 0.35s' }}>
                      {isLogin ? 'Masuk untuk mengelola overlay dan donasi kamu.' : 'Daftar sekarang dan mulai kustomisasi alert-mu.'}
                    </p>
                  </div>

                  {/* Tab switcher */}
                  <div className='gap-2.5' style={{ display:'flex', background: T.tabBg, border:`1px solid ${T.tabBorder}`, borderRadius:0, padding:6, marginBottom:28, transition:'all 0.35s' }}>
                    {['Masuk','Daftar'].map((label, i) => (
                      <button key={label} className="tab-btn border border-slate-300" onClick={() => setIsLogin(i === 0)}
                        style={{ flex:1, padding:'10px 0', borderRadius:0, fontWeight:800, fontSize:14, cursor:'pointer',
                          background: isTabActive(i) ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                          color: isTabActive(i) ? 'white' : T.tabInactive,
                          // boxShadow: isTabActive(i) ? '0 4px 16px rgba(79,70,229,0.3)' : 'none',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
                      <AnimatePresence>
                        {!isLogin && (
                          <motion.div key="username" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.2 }}>
                            <AuthInput icon={<User size={18}/>} placeholder="Username" value={formData.username} onChange={v => setFormData(f => ({ ...f, username:v }))} T={T} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <AuthInput icon={<Mail size={18}/>} type="email" placeholder="Alamat Email" value={formData.email} onChange={v => setFormData(f => ({ ...f, email:v }))} T={T} />
                      <AuthInput icon={<Lock size={18}/>} type="password" placeholder="Password" value={formData.password} onChange={v => setFormData(f => ({ ...f, password:v }))} T={T} />
                    </div>

                    {isLogin && (
                      <div style={{ textAlign:'right', marginBottom:20 }}>
                        <button type="button" onClick={() => setIsForgot(true)}
                          style={{ background:'none', border:'none', cursor:'pointer', color: T.forgotColor, fontSize:12, fontWeight:700, transition:'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color=T.forgotHover}
                          onMouseLeave={e => e.currentTarget.style.color=T.forgotColor}>
                          Lupa Password?
                        </button>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="submit-btn"
                      style={{ width:'100%', padding:'15px 0', borderRadius:0, fontWeight:900, fontSize:15, border:'none', cursor:'pointer', background:'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color:'white', opacity: loading ? 0.65 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 8px 32px rgba(79,70,229,0.4)', transition:'all 0.2s' }}>
                      {loading
                        ? <div style={{ width:18, height:18, border:'3px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'0%', animation:'spin 0.7s linear infinite' }} />
                        : <>{isLogin ? 'Login Dashboard' : 'Daftar Sekarang'}<ArrowRight size={16}/></>
                      }
                    </button>
                  </form>

                  <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0' }}>
                    <div style={{ flex:1, height:1, background: T.divider, transition:'background 0.35s' }} />
                    <span style={{ color: T.dividerText, fontSize:12, fontWeight:600, transition:'color 0.35s' }}>atau</span>
                    <div style={{ flex:1, height:1, background: T.divider, transition:'background 0.35s' }} />
                  </div>

                  <p style={{ textAlign:'left', color: T.switchText, fontSize:14, transition:'color 0.35s' }}>
                    {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
                    <button onClick={() => setIsLogin(!isLogin)}
                      style={{ background:'none', border:'none', cursor:'pointer', color: T.switchLink, fontWeight:800, fontSize:14, transition:'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color='#7c3aed'}
                      onMouseLeave={e => e.currentTarget.style.color=T.switchLink}>
                      {isLogin ? 'Daftar Gratis' : 'Masuk'}
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;