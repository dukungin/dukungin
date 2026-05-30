import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */

const FEATURES = [
  { num: "01", ico: "🎨", name: "Overlay OBS Kustom", desc: "Alert donasi tampil langsung di stream. Tema modern, classic, atau minimal dengan animasi dan warna sesukamu." },
  { num: "02", ico: "🔊", name: "Suara per Nominal", desc: "Sultan dapat sound kenceng! Atur efek suara berbeda untuk setiap tier donasi. 16+ preset siap pakai." },
  { num: "03", ico: "🛡️", name: "Filter Kata Terlarang", desc: "Blokir, sensor, atau ganti kata tidak pantas otomatis. Jagain konten tetap aman dan profesional." },
  { num: "04", ico: "🎯", name: "Milestones & Goals", desc: "Tampilkan progress target donasi di OBS. Donor bisa lihat seberapa dekat goal tercapai." },
  { num: "05", ico: "🖼️", name: "Media Alert", desc: "Izinkan donor kirim gambar atau video saat donasi mencapai nominal tertentu. Sultan alert yang epic." },
  { num: "06", ico: "🗳️", name: "Poll & Subathon", desc: "Voting live untuk penonton dan timer subathon yang bertambah otomatis setiap ada donasi masuk." },
  { num: "07", ico: "🏆", name: "Leaderboard", desc: "Tampilkan top donor di overlay OBS. Gamifikasi donasi bikin penonton makin kompetitif dan seru." },
  { num: "08", ico: "👥", name: "Streamer Community", desc: "Temukan dan follow sesama streamer. Bangun network, kolaborasi, dan berkembang bersama." },
];

const HOW_IT_WORKS = [
  { num: "01", ico: "🚀", title: "Daftar Gratis", desc: "Buat akun dalam hitungan detik. Tidak perlu kartu kredit apapun." },
  { num: "02", ico: "🎨", title: "Konfigurasi Overlay", desc: "Pilih tema, warna, animasi, dan atur suara sesuai brand stream-mu." },
  { num: "03", ico: "📺", title: "Pasang di OBS", desc: "Copy URL overlay, tambahkan sebagai Browser Source di OBS Studio." },
  { num: "04", ico: "💸", title: "Terima Donasi", desc: "Donor bayar via QRIS atau transfer — alert langsung muncul di stream!" },
];

const TESTIMONIALS = [
  { avatar: "R", avatarBg: "#7c5cbf", avatarColor: "#fff", name: "@ZulionZX", role: "Coding Streamer", text: '"Setup-nya gampang banget, 5 menit udah live. Alert-nya keren dan donatur makin semangat karena ada leaderboard!"', statNum: "2026", statLabel: "tahun ini" },
  { avatar: "S", avatarBg: "#e05a3a", avatarColor: "#fff", name: "@Krigatsu", role: "Gaming Streamer", text: '"Fitur filter kata terlarang beneran ngebantu banget. Streamku jadi lebih aman dan aku bisa fokus main."', statNum: "2026", statLabel: "tahun ini" },
  { avatar: "B", avatarBg: "#c8f53a", avatarColor: "#080808", name: "@MinusGamdes", role: "Music Streamer", text: '"Sound tier sultan pakai efek beda — penonton jadi pengen donasi lebih gede biar dapat sound kenceng!"', statNum: "2026", statLabel: "tahun ini" },
];

const PLANS = [
  {
    name: "Gratis", desc: "Mulai tanpa risiko", price: "Rp 0", period: "// selamanya",
    features: ["Overlay OBS basic", "Alert donasi real-time", "1 preset suara", "QR Code donasi", "Dashboard riwayat"],
    cta: "Mulai Gratis", hot: false,
  },
  {
    name: "Pro", desc: "Untuk streamer serius", price: "49rb", period: "// per bulan",
    features: ["Semua fitur Gratis", "Sound tiers tak terbatas", "Filter kata terlarang", "Media alert (gambar/video)", "Poll & Subathon timer", "Milestones & Leaderboard", "Prioritas support"],
    cta: "Coba 14 Hari Gratis", hot: true,
  },
  {
    name: "Partner", desc: "Untuk agency & partner", price: "Custom", period: "// hubungi kami",
    features: ["Semua fitur Pro", "White-label branding", "API akses penuh", "Dedicated support", "Revenue sharing"],
    cta: "Hubungi Kami", hot: false,
  },
];

const MARQUEE_ITEMS = [
  "Alert Real-Time", "Suara Kustom", "QRIS / Transfer", "Filter Kata",
  "Milestones", "Leaderboard", "Poll Langsung", "Subathon Timer", "Media Alert", "Streamer Network",
];

/* ─────────────────────────────────────────
   THEME TOKENS
───────────────────────────────────────── */
const THEMES = {
  dark: {
    bg:    "#0a0b10",
    bg2:   "#12141d",
    bg3:   "#1b1e2b",
    line:  "#232736",
    line2: "#2d334b",
    text:  "#f8fafc",
    muted: "white",
    dim:   "#334155",
    lime:  "#fda4af",
    navBg: "rgba(8,8,8,0.92)",
  },
  light: {
    bg:    "#f5f4f0",
    bg2:   "#eceae3",
    bg3:   "#e0ddd4",
    line:  "#d4d0c8",
    line2: "#b8b4a8",
    text:  "#0a0b10",
    muted: "#4a4a55",
    dim:   "#9a9898",
    lime:  "#e8405a",
    navBg: "rgba(245,244,240,0.92)",
  },
};

/* ─────────────────────────────────────────
   HOOKS
───────────────────────────────────────── */
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCounter(target, duration, start) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round(ease(p) * target));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, start]);
  return count;
}

/* ─────────────────────────────────────────
   THEME TOGGLE BUTTON
───────────────────────────────────────── */
function ThemeToggle({ isDark, onToggle, C }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        width: 74,
        height: 38,
        borderRadius: 0,
        border: `1px solid ${hov ? C.lime : C.line2}`,
        background: isDark ? C.bg3 : C.lime,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        flexShrink: 0,
        padding: 0,
      }}
    >
      {/* Track icons */}
      <span style={{
        position: "absolute",
        left: 7,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: 11,
        opacity: isDark ? 0.5 : 0,
        transition: "opacity 0.2s",
        pointerEvents: "none",
      }}>🌙</span>
      <span style={{
        position: "absolute",
        right: 7,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: 11,
        opacity: isDark ? 0 : 0.8,
        transition: "opacity 0.2s",
        pointerEvents: "none",
      }}>☀️</span>

      {/* Thumb */}
      <span style={{
        position: "absolute",
        top: 3.5,
        left: isDark ? 3 : 35,
        width: 32,
        height: 28,
        borderRadius: "0%",
        background: isDark ? C.lime : C.bg,
        transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s",
        display: "block",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

function Kicker({ children, C }) {
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
      color: C.lime, marginBottom: 16, display: "block",
    }}>
      — {children}
    </span>
  );
}

function BigTitle({ children, style, C }) {
  return (
    <h2 style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "clamp(42px,6vw,72px)",
      lineHeight: 0.95, letterSpacing: "0.01em", color: C.text,
      ...style,
    }}>
      {children}
    </h2>
  );
}

function BtnMain({ children, href, style, C }) {
  return (
    <Link 
      to={href || "/"} 
      className="w-[86vw] sm:w-auto text-center" // Tambahkan class ini
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
        padding: "14px 28px", background: C.lime, color: C.bg,
        border: "none", cursor: "pointer", textDecoration: "none",
        display: "inline-block", // Penting agar width: 100% bekerja
        transition: "background 0.15s, opacity 0.15s",
        boxSizing: "border-box", // Pastikan padding tidak merusak lebar
        ...style,
      }}
      onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
      onMouseOut={e => e.currentTarget.style.opacity = "1"}
    >
      {children}
    </Link>
  );
}

function BtnGhost({ children, href, style, C }) {
  return (
    <Link 
      to={href || "/"} 
      className="w-[86vw] sm:w-auto text-center"
      target="__blank" 
      style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      padding: "13px 24px", border: `1px solid ${C.line2}`,
      color: C.muted, background: "none", cursor: "pointer",
      textDecoration: "none", display: "inline-block", transition: "all 0.15s",
      ...style,
    }}
      onMouseOver={e => { e.currentTarget.style.borderColor = C.dim; e.currentTarget.style.color = C.text; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.color = C.muted; }}
    >
      {children}
    </Link>
  );
}

function AlertPop({ visible, C }) {
  return (
    <div style={{
      position: "absolute", bottom: 12, right: 12,
      background: C.bg2,
      borderLeft: `3px solid ${C.lime}`,
      padding: "10px 14px", maxWidth: 200,
      transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.92)",
      opacity: visible ? 1 : 0,
    }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: C.lime, letterSpacing: "0.05em", marginBottom: 2 }}>@BudiSantoso</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, lineHeight: 1, color: C.text, letterSpacing: "0.02em" }}>Rp 150.000</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>"Semangat terus ngodingnya bang!"</div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTIONS
───────────────────────────────────────── */

function Navbar({ menuOpen, setMenuOpen, isDark, onToggleTheme, C }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 99,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px clamp(27px, 5vw, 40px)",
      background: C.navBg,
      gap: 30,
      backdropFilter: "blur(12px)",
      // borderBottom: `1px solid ${C.line}`,
      transition: "background 0.4s, border-color 0.4s",
    }}>
      <Link to="/" className="w-[33%]" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 16, textDecoration: "none", color: C.text, transition: "color 0.4s" }}>
        <div style={{ width: 38, height: 38, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: C.bg, transition: "background 0.4s" }}>
          <img src="/jellyfish.png" alt="icon" className="w-6" />
        </div>
        TAP-TIP-TUP FOR STREAMER
      </Link>
{/* 
      <p className="italic">
       PLATFORM DONATE MADE WITH FROM INDONESIA
      </p> */}

      <div className="flex w-[33%] justify-end items-center gap-9">

        <div className="md:flex hidden mx-[5x]" style={{ color: C.line2 }}>|</div>

        <div className="flex items-center gap-5 md:gap-4">
          <div style={{ display: "flex", gap: 14 }} className="hide-mobile">
            <Link to="/login" style={{
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 600,
              letterSpacing: "0.05em", textTransform: "uppercase",
              padding: "6px 16px", background: C.lime, color: isDark ? 'black' : C.bg,
              border: `1px solid ${C.lime}`, textDecoration: "none", transition: "opacity 0.15s, background 0.4s",
            }}
              onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
              onMouseOut={e => e.currentTarget.style.opacity = "1"}
            >
              Mulai Sekarang
            </Link>
          </div>
          {/* Theme Toggle */}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} C={C} />

          {/* <div style={{ display: "flex" }} className="hide-mobile">
            <h2 style={{ color: C.muted, fontSize: 13, transition: "color 0.4s" }}>MADE WITH ❤️ FROM INDONESIA</h2>
          </div> */}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: C.bg2, borderBottom: `1px solid ${C.line}`,
          padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12,
          transition: "background 0.4s",
        }}>
          <div style={{ paddingBottom: 12, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {isDark ? "Mode Gelap" : "Mode Terang"}
            </span>
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} C={C} />
          </div>
          <Link to="/register" onClick={() => setMenuOpen(false)}
            style={{ marginTop: 8, padding: "12px 0", textAlign: "center", background: C.lime, color: C.bg, fontWeight: 700, fontSize: 13, textDecoration: "none", letterSpacing: "0.04em", textTransform: "uppercase", transition: "background 0.4s" }}
          >
            Mulai Sekarang
          </Link>
        </div>
      )}
    </nav>
  );
}

function Hero({ C, isDark }) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [ref, inView] = useInView(0.3);

  useEffect(() => {
    const cycle = () => {
      setAlertVisible(false);
      setTimeout(() => setAlertVisible(true), 1200);
    };
    const id = setInterval(cycle, 5000);
    setTimeout(() => setAlertVisible(true), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <section 
      className="hero-wrapper md:py-0 h-[62vh] md:h-[93vh] overflow-hidden relative" 
      style={{ 
        display: "grid", 
        gridTemplateRows: "1fr auto", 
        paddingTop: 70, 
        borderBottom: `1px solid ${C.line}`, 
        transition: "border-color 0.4s",
        background: C.bg 
      }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="crossgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 40" 
                fill="none" 
                stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.6)"} 
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#crossgrid)" />
        </svg>
      </div>

      {/* Aurora Background Effect */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none" 
        style={{ zIndex: 1, opacity: isDark ? 0.3 : 0.5 }}
      >
        <div className="aurora-blob aurora-1" style={{ background: C.lime }} />
        <div className="aurora-blob aurora-2" style={{ background: '#6366f1' }} />
        <div className="aurora-blob aurora-3" style={{ background: '#a855f7' }} />
      </div>

      <div style={{ zIndex: 2, borderBottom: `1px solid ${C.line}`, transition: "border-color 0.4s" }} className="hero-main-grid relative h-full flex items-center">
        <div className="text-center mx-auto w-full flex flex-col justify-center items-center px-6" style={{ paddingBottom: "0px" }}>
          
          {/* Badge Atas */}
          <div style={{ 
            display: "inline-flex", alignItems: "center", gap: 8, 
            fontFamily: "'Space Mono',monospace", fontSize: 10, 
            marginTop: 6,
            letterSpacing: "0.1em", textTransform: "uppercase", 
            color: C.muted, marginBottom: 30, transition: "color 0.4s" 
          }}>
            Platform Donasi Streamer Dari Indonesia
          </div>

          {/* Judul Hero */}
          <h1
            className="hero-title"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(3.5rem, 12vw, 9rem)", // Responsif font size
              lineHeight: 0.85,
              letterSpacing: "-0.01em",
              color: C.text,
              marginBottom: 40,
              textAlign: "center",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.1em",
              transition: "color 0.4s",
            }}
          >
            <span className="flex items-center justify-center gap-[0.1em]">
              UBAH HOBI
              <img
                className="relative top-[-2px] md:top-[-7px] md:inline-block hidden ml-[7px] h-[0.8em] md:h-[0.85em] w-auto"
                src="/jellyfish.png"
                alt="icon"
              />
            </span>
            <span>STREAMING</span>
            <span className="w-full">MENJADI BER-CUAN</span>
          </h1>

          {/* Container Tombol */}
          <div className="w-full max-w-md md:max-w-none px-4">
            <div 
              className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
            >
              <BtnMain href="/register" C={C}>Mulai Sekarang →</BtnMain>
              <BtnGhost href="https://wa.me/6289513093406" C={C}>Hubungi Developer</BtnGhost>
            </div>
          </div>

        </div>
      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .aurora-blob {
          position: absolute;
          width: 50vw;
          height: 50vw;
          min-width: 300px;
          min-height: 300px;
          border-radius: 50%;
          filter: blur(100px);
          mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
          opacity: 0.4;
          animation: move 20s infinite alternate ease-in-out;
        }
        
        .aurora-1 { top: -10%; left: -10%; animation-duration: 18s; }
        .aurora-2 { bottom: -10%; right: -5%; animation-delay: -5s; animation-duration: 25s; }
        .aurora-3 { top: 20%; left: 30%; animation-delay: -2s; animation-duration: 30s; }

        @keyframes move {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(10%, 15%) scale(1.1) rotate(45deg); }
          100% { transform: translate(-5%, 10%) scale(0.9) rotate(-45deg); }
        }

        @media (max-width: 640px) {
          .hero-title span { width: 100%; }
        }
      `}</style>
    </section>
  );
}

function Marquee({ C }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow: "hidden", borderBottom: `1px solid ${C.line}`, background: C.bg2, transition: "background 0.4s, border-color 0.4s" }}>
      <div style={{ display: "flex", animation: "marquee 28s linear infinite", width: "max-content" }}>
        {items.map((item, i) => (
          <div key={i} style={{
            padding: "14px 32px", borderRight: `1px solid ${C.line}`,
            fontFamily: "'Space Mono',monospace", fontSize: 11,
            letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted,
            display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
            transition: "color 0.4s, border-color 0.4s",
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.lime, display: "inline-block", flexShrink: 0, transition: "background 0.4s" }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

const PLATFORMS = [
  { name: "TapTipTup", fee: 2.5, winner: true },
  { name: "Streamlabs", fee: 5.0 },
  { name: "Saweria",    fee: 5.0 },
  { name: "Trakteer",  fee: 5.0 },
];

function FeeComparison({ C }) {
  const maxFee = Math.max(...PLATFORMS.map(p => p.fee));
  const saving = Math.round(((maxFee - 2.5) / 100) * 10_000_000);

  return (
    <section style={{ transition: "border-color 0.4s" }}>
      {/* Header */}
      <div className="text-center flex flex-col justify-center items-center"
        style={{ padding: "100px 40px", borderBottom: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
        <Kicker C={C}>Transparansi Biaya</Kicker>
        <BigTitle C={C}>POTONGAN TERKECIL DI{" "}
          <span style={{ color: C.lime }}>KELASNYA</span>
        </BigTitle>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 16, transition: "color 0.4s" }}>
          Kami hanya ambil 2.5% — sisanya langsung ke kantongmu.
        </p>
      </div>

      {/* Grid perbandingan */}
      <div className="grid grid-cols-2 md:grid-cols-4"
        style={{ borderBottom: `1px solid ${C.line}` }}
        >
        {PLATFORMS.map((p, i) => {
          const barWidth = Math.round((p.fee / maxFee) * 100);
          const isLast = i === PLATFORMS.length - 1;
          
          // ✅ MOBILE CHECK (width < 768px)
          const isMobile = window.innerWidth < 768;
          
          return (
            <div key={p.name}
              style={{
                padding: "32px 24px",
                borderRight: !isLast ? `1px solid ${C.line}` : "none",
                // ✅ BOTTOM BORDER: HANYA MOBILE ATAU !isLast
                borderBottom: (isMobile) ? `1px solid ${C.line}` : "none",
                background: p.winner ? C.bg2 : "transparent",
                transition: "all 0.4s",
              }}>

              {p.winner
                ? <span style={{ display: "inline-block", marginBottom: 10, background: C.lime, color: C.bg, fontSize: 10, padding: "3px 10px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, transition: "background 0.4s" }}>Terkecil</span>
                : <div style={{ height: 24, marginBottom: 10 }} />}
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4, fontFamily: "'Space Grotesk',sans-serif", transition: "color 0.4s" }}>{p.name}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, lineHeight: 1, marginBottom: 12, color: p.winner ? C.lime : p.fee >= 10 ? "#e05a3a" : C.text, transition: "color 0.4s" }}>
                {p.fee.toFixed(1)}%
              </div>
              <div style={{ height: 4, background: C.line2, borderRadius: 2, marginBottom: 8 }}>
                <div style={{ height: 4, width: `${barWidth}%`, background: p.winner ? C.lime : C.dim, borderRadius: 2, transition: "background 0.4s" }} />
              </div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase", transition: "color 0.4s" }}>
                potongan withdraw
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks({ C }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.line}`, transition: "border-color 0.4s" }} id="cara-kerja">
      <div className="text-center flex  flex-col justify-center items-center w-full" style={{ padding: "100px 40px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap", transition: "border-color 0.4s" }}>
        <div>
          <BigTitle C={C}>MULAI LIVE DALAM 5 MENIT</BigTitle>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: C.muted, fontWeight: 400, maxWidth: '80%', transition: "color 0.4s" }}>
          Proses setup yang dirancang seminimal mungkin
        </p>
      </div>
      <div className="grid grid-cols-4 how-steps-grid md:grid flex-col hidden">
        {HOW_IT_WORKS.map((step, i) => (
          <HowStep key={step.num} step={step} last={i === HOW_IT_WORKS.length - 1} C={C} />
        ))}
      </div>
    </section>
  );
}

function HowStep({ step, last, C }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ padding: "40px 32px", borderRight: !last ? `1px solid ${C.line}` : "none", transition: "border-color 0.4s" }}
    >
      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: hov ? C.lime : C.dim, lineHeight: 1, marginBottom: 20, display: "block", transition: "color 0.2s" }}>{step.num}</span>
      <span style={{ fontSize: 22, marginBottom: 14, display: "block" }}>{step.ico}</span>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: C.text, transition: "color 0.4s" }}>{step.title}</div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, fontWeight: 400, transition: "color 0.4s" }}>{step.desc}</div>
    </div>
  );
}

function Testimonials({ C }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
      <div className="text-center justify-center items-center flex flex-col" style={{ padding: "100px 40px", borderBottom: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
        <Kicker C={C}>Kata Mereka</Kicker>
        <BigTitle C={C}>SUDAH TERUJI OLEH STREAMER</BigTitle>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}
        className="testimonials-grid">
        {TESTIMONIALS.map((t, i) => (
          <div key={t.name} style={{ padding: "36px 30px", borderRight: i < 2 ? `1px solid ${C.line}` : "none", display: "flex", flexDirection: "column", transition: "border-color 0.4s" }}>
            <span style={{ fontSize: 12, color: C.lime, letterSpacing: 2, marginBottom: 20, display: "block", transition: "color 0.4s" }}>★★★★★</span>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: C.muted, fontWeight: 400, marginBottom: 24, flex: 1, transition: "color 0.4s" }}>{t.text}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
              <div style={{ width: 36, height: 36, background: t.avatarBg, color: t.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{t.avatar}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, transition: "color 0.4s" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 400, transition: "color 0.4s" }}>{t.role}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.lime, lineHeight: 1, transition: "color 0.4s" }}>{t.statNum}</div>
                <div style={{ fontSize: 10, color: C.muted, transition: "color 0.4s" }}>{t.statLabel}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA({ C, isDark }) {
  return (
    <section id="dashboards" className='relative flex flex-col justify-center h-max items-center text-center pb-12'>
      <div
        className="w-full flex flex-col justify-center items-center"
        style={{
          padding: "120px 40px 80px 40px",
          borderRight: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "border-color 0.4s"
        }}
      >
      <div className="w-max text-center flex flex-col justify-center items-center">
      <h2
        style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(50px,8vw,70px)",
            lineHeight: 0.93,
            letterSpacing: "0.01em",
            color: C.text,
            marginBottom: 24,
            transition: "color 0.4s"
        }}
        >
        SIAP{" "}
        <span style={{ color: C.lime, transition: "color 0.4s" }}>
            NAIK{" "}
            <img
            src="/jellyfish.png"
            alt="icon"
            style={{
                height: "0.8em",
                width: "auto",
                display: "inline-block",
                verticalAlign: "middle",
                position: "relative",
                top: "-0.05em",
            }}
            />
            {" "}LEVEL ?
        </span>
        </h2>
        </div>
        <div style={{ marginTop: 0, marginBottom: 40, zIndex: 99 }}>
          <BtnMain href="/register" style={{ fontSize: 14, padding: "16px 36px" }} C={C}>
            Mulai Dari Sekarang →
          </BtnMain>
        </div>
      </div>

      {/* Stacked images layout */}
      <div
        className="relative w-full flex h-max justify-center items-center"
        style={{ height: "clamp(320px, 50vw, 600px)", marginTop: -170 }}
        >
        {/* Gambar kiri */}
        <div
            className="absolute border border-slate-300 shadow-md overflow-hidden"
            style={{
            width: "clamp(220px, 38vw, 480px)",
            aspectRatio: "16/10",
            transform: "rotate(-6deg)",
            left: "50%",
            top: "50%",
            marginLeft: "clamp(-580px, -52vw, -280px)", // geser jauh ke kiri
            marginTop: "-10%",
            zIndex: 1,
            opacity: 0.85,
            }}
        >
            <img src="/dash2.png" alt="gambar dashboard" className="w-full h-full object-cover" />
        </div>

        {/* Gambar kanan */}
        <div
            className="absolute border border-slate-300 shadow-md overflow-hidden"
            style={{
            width: "clamp(220px, 38vw, 480px)",
            aspectRatio: "16/10",
            transform: "rotate(6deg)",
            left: "50%",
            top: "50%",
            marginLeft: "clamp(40px, 8vw, 80px)", // geser jauh ke kanan
            marginTop: "-10%",
            zIndex: 1,
            opacity: 0.85,
            }}
        >
            <img src="/dash3.png" alt="gambar dashboard" className="w-full h-full object-cover" />
        </div>

        {/* Gambar tengah — paling depan */}
        <div
            className="absolute border border-slate-300 shadow-xl overflow-hidden"
            style={{
            width: "clamp(260px, 46vw, 580px)",
            aspectRatio: "16/10",
            transform: "translateX(-50%) translateY(-50%)",
            left: "50%",
            top: "50%",
            zIndex: 2,
            }}
        >
            <img src="/dash.png" alt="gambar dashboard" className="w-full h-full object-cover" />
        </div>
        </div>
    </section>
  );
}

function Footer({ C }) {
  return (
    <footer className="text-center flex justify-center items-center" style={{ display: "grid", gridTemplateColumns: "1fr", borderTop: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
      <div className="w-full text-center mx-auto flex flex-col justify-between items-center" style={{ padding: "32px 32px", borderRight: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 15, marginTop: 6, marginBottom: 12, color: C.text, transition: "color 0.4s" }}>
          TapTipTup
        </div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1, transition: "color 0.4s" }}>
          Platform donasi streaming terbaik untuk konten kreator Indonesia.<br /><br />
        </div>
        <a href="/privacy-policy" style={{ fontSize: 11, lineHeight: 1.7, color: C.lime, transition: "color 0.4s" }}>
          Kebijakan privasi
        </a>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────── */
function buildGlobalStyles(C) {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { -webkit-font-smoothing: antialiased; overflow-x: hidden; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  .hide-mobile { display: flex !important; }
  .show-mobile { display: none !important; }

  .hero-title {
    width: 100%;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 1024px) {
    .hero-title {
      font-size: 7rem !important;
    }
  }

  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .show-mobile { display: flex !important; }

    .hero-title {
      font-size: 3.5rem !important;
      line-height: 1 !important;
      padding: 0 20px;
      gap: 0.1em !important;
    }
   .hero-title span {
      display: inline-block; /* Gunakan inline-block, jangan block murni */
      width: auto; /* Biarkan lebar mengikuti konten kecuali yang diberi w-full */
    }
    
    /* Hanya span yang merupakan anak langsung dan punya class w-full yang mengambil 1 baris */
    .hero-title > span.w-full {
      display: block;
      width: 100%;
    }
    .hero-main-grid { grid-template-columns: 1fr !important; }
    .how-steps-grid,
    .testimonials-grid,
    .pricing-grid,
    .feat-list-grid {
      grid-template-columns: 1fr !important;
    }
    .how-steps-grid > div,
    .testimonials-grid > div,
    .pricing-grid > div {
      border-right: none !important;
      border-bottom: 1px solid ${C.line} !important;
    }
    .cta-grid {
      grid-template-columns: 1fr !important;
    }
    .cta-grid > div {
      border-right: none !important;
      border-bottom: 1px solid ${C.line} !important;
    }
  }
`;
}


const SHARE_TEMPLATES = {
  1: {
    label: "Alert Donasi Real-Time",
    ig: [
      { platform: "Instagram Caption", text: `🎮 Streamer Indo, dengerin dulu!\n\nTired of potongan donasi gede?\nTapTipTup cuma ambil 2.5% — sisanya buat kamu! 💸\n\n✅ Alert OBS real-time\n✅ QRIS + Transfer langsung\n✅ Sound kustom per tier\n✅ Gratis selamanya (plan basic)\n\nCoba sekarang di taptiptup.com 🔗\n\n#Streamer #StreamingIndonesia #TapTipTup` },
      { platform: "Instagram Story", text: `Hei streamer! 👋\n\nDonasi kamu dipotong berapa?\n5%? 10%?\n\nTapTipTup: cuma 2.5% ✨\nAlert langsung di OBS-mu!\n\nLink di bio → taptiptup.com` }
    ],
    desktop: [
      { platform: "Twitter / X", text: `Streamer Indonesia, ini buat kalian 🧵\n\nTapTipTup = platform donasi lokal dengan potongan TERKECIL. Cuma 2.5%.\n\n✅ Alert OBS real-time\n✅ Sound custom per tier\n✅ QRIS & transfer bank\n✅ Gratis untuk mulai\n\nCoba gratis → taptiptup.com` },
      { platform: "Facebook / Komunitas", text: `Para streamer, pernah ngerasa rugi kena potongan donasi gede?\n\nSaya baru cobain TapTipTup — potongannya cuma 2.5%! Setup OBS-nya juga gampang, kurang dari 5 menit udah live.\n\nCoba gratis di taptiptup.com 🚀` }
    ]
  },
  2: {
    label: "Dashboard & Fitur Lengkap",
    ig: [
      { platform: "Instagram Caption", text: `Level up stream kamu dengan TapTipTup! 🚀\n\nBukan cuma terima donasi —\nDashboard lengkap buat manage semuanya:\n📊 Riwayat donasi real-time\n🏆 Leaderboard top donor\n🎯 Milestone & goal tracker\n🗳️ Poll langsung dari penonton\n\nGratis untuk mulai. Pro mulai 49rb/bulan.\n\ntaptiptup.com ✨\n\n#ContentCreator #StreamerIndonesia #TapTipTup` },
      { platform: "Instagram Story", text: `Dashboard donasi streamer terlengkap 📊\n\n→ Real-time analytics\n→ Top donor leaderboard\n→ Poll & subathon timer\n→ Setup OBS < 5 menit\n\nGratis di taptiptup.com 🔥` }
    ],
    desktop: [
      { platform: "Twitter / X", text: `Nggak nyangka ada platform donasi streamer lokal sekeren ini.\n\nTapTipTup punya:\n📊 Dashboard analytics real-time\n🏆 Leaderboard gamifikasi donor\n🎯 Milestone tracker di OBS\n🗳️ Live poll & subathon timer\n🖼️ Media alert dari donor\n\nDan setupnya literally 5 menit.\nGratis untuk mulai → taptiptup.com` },
      { platform: "Facebook / Komunitas", text: `Sharing pengalaman pakai TapTipTup buat stream:\n\nFitur favoritku? Leaderboard donor langsung muncul di OBS. Penonton jadi kompetitif sendiri, malah bikin donasi naik! 😂\n\nPlus ada poll live yang bisa divotin penonton real-time, dan milestone goal yang keliatan progressnya.\n\ntaptiptup.com` }
    ]
  },
  3: {
    label: "Community & Streamer Network",
    ig: [
      { platform: "Instagram Caption", text: `Gabung komunitas streamer Indonesia bareng TapTipTup! 👥\n\nBukan cuma donasi —\nkamu bisa discover & follow sesama streamer,\nbangun network, dan collab bareng!\n\nMulai gratis, tanpa kartu kredit.\nLink di bio → taptiptup.com\n\nTag temen streamer kamu di sini! 👇\n\n#StreamerIndonesia #KomunitasStreamer #TapTipTup` },
      { platform: "Instagram Story", text: `Streamer Indonesia berkembang bareng! 🤝\n\nTapTipTup punya fitur:\n✅ Temukan sesama streamer\n✅ Bangun network kolaborasi\n✅ Donasi dengan potongan 2.5% aja\n\nTag temen streamer kamu!\ntaptiptup.com` }
    ],
    desktop: [
      { platform: "Twitter / X", text: `Shoutout buat semua streamer Indonesia 🇮🇩\n\nKalian deserve platform donasi yang:\n✅ Buatan lokal, paham kebutuhan kita\n✅ Potongan kecil (cuma 2.5%)\n✅ Ada komunitas sesama streamer\n✅ Setup OBS gampang & cepat\n\nTapTipTup hadir buat itu semua.\nGratis untuk mulai → taptiptup.com\n\nRT kalau bermanfaat! 🙏` },
      { platform: "Facebook / Komunitas", text: `Buat semua streamer di grup ini —\n\nKalau kalian cari platform donasi yang:\n• Buatan Indonesia (paham ekosistem kita)\n• Potongan paling kecil (2.5%)\n• Ada fitur komunitas streamer\n• Setup simpel dan cepat\n\nTapTipTup jawabannya. Saya udah coba dan rekomendasinya 10/10 untuk streamer lokal.\n\nCoba gratis sekarang di taptiptup.com 🙏` }
    ]
  },
};

function SharePromo({ C }) {
  const [format, setFormat] = useState('ig');
  const [selectedCard, setSelectedCard] = useState(1);
  const [copied, setCopied] = useState(false);

  const tpls = SHARE_TEMPLATES[selectedCard][format];

  function copyAll() {
    const all = tpls.map(t => `[${t.platform}]\n${t.text}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(all);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section style={{ borderBottom: `1px solid ${C.line}` }}>
      {/* Header */}
      <div className="text-center flex flex-col justify-center items-center"
        style={{ padding: "100px 40px", borderBottom: `1px solid ${C.line}` }}>
        <Kicker C={C}>Share & Promosi</Kicker>
        <BigTitle C={C}>SEBARKAN KE SESAMA <span style={{ color: C.lime }}>STREAMER</span></BigTitle>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>
          Pilih gambar & salin teks siap pakai untuk Instagram atau media sosial lainnya
        </p>
      </div>

      <br />

      <div style={{ padding: "48px 30px" }}>
        {/* Format tabs */}
        {/* <div className="justify-center items-center" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {['ig', 'desktop'].map(f => (
            <button className="active:scale-[0.98]" key={f} onClick={() => setFormat(f)} style={{
              padding: "8px 20px", fontSize: 13, fontWeight: 600,
              border: `1px solid ${format === f ? C.lime : C.line2}`,
              background: format === f ? C.lime : "transparent",
              color: format === f ? C.bg : C.muted,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {f === 'ig' ? '📸 Instagram (1:1)' : '🖥️ Desktop / Twitter (16:9)'}
            </button>
          ))}
        </div> */}

        {/* Image cards */}
        <div className="grid-cols-1 md:grid-cols-4" style={{ display: "grid", gap: 16, marginBottom: 32 }}>
          {[2,3, 4, 5].map(n => (
            <div 
              key={n} 
              className="bg-white" 
              // onClick={() => setSelectedCard(n)} 
              style={{
                border: `${selectedCard === n ? 2 : 1}px solid ${selectedCard === n ? C.lime : C.line}`,
                // cursor: "pointer", 
                overflow: "hidden", 
                transition: "border-color 0.15s",
                position: "relative",
              }}
            >
              <div 
                className="flex items-center justify-center"
                style={{ 
                  // aspectRatio: format === 'ig' ? '1/1' : '16/9', 
                  background: 'white', 
                  height: 500,
                  overflow: "hidden" 
                }}>
                <img
                  src={`/share-${format === 'ig' ? 'ig' : 'desktop'}-${n}.jpg`}
                  alt={`Template ${n}`}
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: format === 'ig' ? 'cover' : 'cover',
                    objectPosition: "center",
                  }}
                />
              </div>

              {/* Tombol Download */}
              <a
                href={`/share-ig-${n}.jpg`}
                download={`taptiptup-${format}-${n}.jpg`}
                className="w-full text-center mx-auto active:scale-[0.98] hover:brightness-90"
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", 
                  bottom: 0, 
                  right: 0,
                  padding: "11px 12px", fontSize: 16, fontWeight: 600,
                  background: C.lime, color: C.bg,
                  border: "none", cursor: "pointer",
                  textDecoration: "none", display: "inline-block",
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  // opacity: 0.92,
                }}
              >
                ⬇ Download
              </a>
            </div>
          ))}
        </div>

        {/* Text templates */}
          {/* <div style={{ background: C.bg2, border: `1px solid ${C.line}`, padding: 24, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.lime, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Template Teks — Gambar {selectedCard}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="feat-list-grid">
              {tpls.map((t, i) => (
                <div key={i} style={{ background: C.bg, border: `1px solid ${C.line}`, padding: 16, position: "relative" }}>
                  <div style={{ fontSize: 10, fontFamily: "'Space Mono',monospace", color: C.lime, letterSpacing: "0.06em", marginBottom: 8 }}>{t.platform}</div>
                  <pre style={{ fontSize: 12, lineHeight: 1.65, color: C.muted, whiteSpace: "pre-wrap", fontFamily: "'Space Grotesk',sans-serif" }}>{t.text}</pre>
                  <button onClick={() => navigator.clipboard.writeText(t.text)} style={{
                    position: "absolute", top: 8, right: 8, padding: "3px 10px",
                    fontSize: 11, border: `1px solid ${C.line2}`, background: C.bg2,
                    color: C.muted, cursor: "pointer",
                  }}>Salin</button>
                </div>
              ))}
            </div>
          </div> */}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
export default function TapTipTup() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Inisialisasi dari localStorage atau preferensi sistem
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("taptiptup-theme");
      if (saved !== null) return saved === "dark";
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });

  const C = isDark ? THEMES.dark : THEMES.light;

  function handleToggleTheme() {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem("taptiptup-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  }

  return (
    <div
      className="overflow-hidden w-[100vw]"
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Space Grotesk', sans-serif",
        overflowX: "hidden",
        transition: "background 0.4s, color 0.4s",
      }}
    >
      <style>{buildGlobalStyles(C)}</style>
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} isDark={isDark} onToggleTheme={handleToggleTheme} C={C} />
      <Hero C={C} isDark={isDark} />
      <Marquee C={C} />
      <FeeComparison C={C} /> 
      <HowItWorks C={C} />
      <Testimonials C={C} />
      <SharePromo C={C} />   {/* ← tambah di sini */}
      {/* <CTA C={C} isDark={isDark} /> */}
      <Footer C={C} />
    </div>
  );
}