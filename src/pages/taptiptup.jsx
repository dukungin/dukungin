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
  { avatar: "B", avatarBg: 'white', avatarColor: "#080808", name: "@MinusGamdes", role: "Music Streamer", text: '"Sound tier sultan pakai efek beda — penonton jadi pengen donasi lebih gede biar dapat sound kenceng!"', statNum: "2026", statLabel: "tahun ini" },
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
    lime:  "azure",  // teal/toska — dark mode
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
    lime:  "azure",  // teal/toska lebih gelap agar kontras di light mode
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
   SUB-COMPONENTS
───────────────────────────────────────── */

function Kicker({ children, C }) {
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
      color: C.lime, marginBottom: 16, display: "block",
    }}>
      {children}
    </span>
  );
}

function BigTitle({ children, style, C }) {
  return (
    <h2 style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "clamp(32px,6vw,72px)",
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
      draggable={false}
      className="select-none w-[90vw] relativeflex justify-center items-center md:w-[18vw] text-center" // Tambahkan class ini
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
      draggable={false}
      to={href || "/"} 
      className="select-none w-[86vw] md:w-auto text-center"
      target="__blank" 
      style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      padding: "14px 24px", border: `1px solid ${C.line2}`,
      background: "white", cursor: "pointer",
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
    <section id="home"
      className="select-none hero-wrapper md:py-0 min-h-max md:h-[89vh] overflow-hidden relative"
      style={{
        display: "grid",
        gridTemplateRows: "1fr auto",
        paddingTop: 70,
        borderBottom: `1px solid ${C.line}`,
        transition: "border-color 0.4s",
        background: C.bg,
      }}
    >
      {/* ===== VIDEO BACKGROUND ===== */}
      <video
        className="select-none md:flex hidden pointer-events-none absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        src="/live2.mp4"
        autoPlay
        loop
        muted
        playsInline
        draggable={false}
      />

      {/* ===== DARK OVERLAY ===== */}
      <div
        className="select-none pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          background: isDark
            ? "rgba(0,0,0,0.94)"
            : "rgba(0,0,0,0.9)",
        }}
      />

      {/* Grid Background */}
      <div className="select-none md:hidden flex absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="crossgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#crossgrid)" />
        </svg>
      </div>

      {/* Aurora Background Effect */}
      <div
        className="select-none absolute inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 3, opacity: 0.2 }}
      >
        {/* <div className="select-none aurora-blob aurora-1" style={{ background: C.lime }} /> */}
        <div className="select-none aurora-blob aurora-2" style={{ background: "#6366f1" }} />
        <div className="select-none aurora-blob aurora-3" style={{ background: "#a855f7" }} />
      </div>

      <div
        style={{ zIndex: 4, borderBottom: `1px solid ${C.line}`, transition: "border-color 0.4s" }}
        className="select-none relative top-[-23px] hero-main-grid relative h-full flex items-center"
      >
        <div
          className="select-none text-center mx-auto w-full flex flex-col justify-center items-center px-6"
          style={{ paddingBottom: "0px" }}
        >
        {/* Judul Hero */}
         <h1
            className="select-none hero-title font-['Bebas_Neue'] leading-[0.85] tracking-[-0.01em] text-white mb-4 text-center flex flex-wrap items-center justify-center gap-[0.1em] transition-colors duration-400"
          >
            <p className="text-5xl md:text-8xl select-none md:hidden flex items-center justify-center gap-[0.1em]">
              AMBIL UNTUNG LEBIH BANYAK BERSAMA TAPTIPTUP
              <img
                draggable={false}
                className="select-none relative top-[-2px] md:top-[-7px] md:inline-block hidden h-[0.8em] md:h-[0.85em] w-auto"
                src="/jellyfish.png"
                alt="icon"
              />
            </p>
            <p className="text-5xl lg:text-8xl 2xl:text-9xl select-none hidden md:flex items-center justify-center gap-[0.1em]">
              UBAH HOBI 
              <img
                draggable={false}
                className="select-none relative top-[-2px] md:top-[-7px] md:inline-block hidden h-[0.8em] md:h-[0.85em] w-auto"
                src="/jellyfish.png"
                alt="icon"
              />
            </p>
            <p className="text-5xl lg:text-8xl 2xl:text-9xl hidden md:inline">LIVE STREAMING</p>
            <p className="text-5xl lg:text-8xl 2xl:text-9xl hidden md:inline select-none w-full">MENJADI BER-CUAN</p>
          </h1>

          <br className="md:hidden flex" />

          {/* Deskripsi */}
          <p
            className="select-none w-[86vw] md:max-w-[50vw]"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(13px, 1.5vw, 16px)",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              marginBottom: 36,
              textAlign: "center",
            }}
          >
            Platform donasi streamer asal Indonesia dengan potongan terkecil yaitu 2.5%. 
          </p>

          {/* Container Tombol */}
          <div className="select-none mb-20 w-full max-w-md md:max-w-none px-4">
            <div className="select-none flex flex-col md:flex-row items-center gap-4 w-full justify-center">
              <BtnMain href="/register" C={C}>
                <p draggable={false} className="select-none w-full flex justify-center items-center mx-auto text-center flex items-center gap-2">
                  Mulai Sekarang 
                </p>
              </BtnMain>
            </div>
          </div>
          <br className="md:hidden flex" />
        </div>
      </div>

      {/* Global CSS */}
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
          mix-blend-mode: screen;
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

const MARQUEE_ITEMS = [
  { name: "BudiSantoso",    amount: "150.000" },
  { name: "RizkyGamer",     amount: "50.000"  },
  { name: "SultanStream",   amount: "500.000" },
  { name: "AnonymDonatur",  amount: "25.000"  },
  { name: "FansSetia99",    amount: "100.000" },
  { name: "GacorBanget",    amount: "250.000" },
  { name: "StreamerBro",    amount: "75.000"  },
  { name: "BudiGamer11",     amount: "1.000.000" },
];

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
            <span style={{ color: C.text, fontWeight: 700 }}>{item.name}</span>
            <span>mengirim</span>
            <span style={{ color: C.lime, fontWeight: 700 }}>Rp.{item.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLATFORMS = [
  { name: "Saweria",    feeDonate: 5.0,  feeWd: 5000,  feeWdLabel: "Rp 5.000" },
  { name: "TapTipTup", feeDonate: 2.5,  feeWd: 1500,  feeWdLabel: "Rp 1.500", winner: true },
  { name: "Sociabuzz",  feeDonate: 5.0,  feeWd: 4500,  feeWdLabel: "Rp 4.500" },
];

function FeeComparison({ C }) {
  const maxFee = Math.max(...PLATFORMS.map(p => p.fee));

  return (
    <section id="biaya" className="flex flex-col justify-center items-center relative overflow-hidden"
      style={{ transition: "border-color 0.4s", background: C.bg }}>

      {/* ===== GALAXY / BLACKHOLE EFFECT ===== */}
      <div className="pointer-events-none select-none absolute inset-0" style={{ zIndex: 0 }}>
        {/* Bintang-bintang */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 80 }).map((_, i) => (
            <circle
              key={i}
              cx={`${Math.random() * 100}%`}
              cy={`${Math.random() * 100}%`}
              r={Math.random() * 1.5 + 0.3}
              fill="white"
              opacity={Math.random() * 0.6 + 0.1}
            />
          ))}
        </svg>

        {/* Aurora galaxy di sudut */}
        <div style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: "50vw", height: "50vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)",
          filter: "blur(60px)",
          animation: "aurora-drift 15s ease-in-out infinite alternate",
        }} />
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: "50vw", height: "50vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%)",
          filter: "blur(60px)",
          animation: "aurora-drift 18s ease-in-out infinite alternate-reverse",
        }} />
      </div>

      <style>{`
        @keyframes blackhole-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.85; }
        }
        @keyframes disk-spin {
          from { transform: translate(-50%, -50%) rotateX(70deg) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotateX(70deg) rotate(360deg); }
        }
        @keyframes aurora-drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(5%, 8%) scale(1.1); }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.2; }
        }
      `}</style>

      {/* ===== KONTEN (z-index di atas efek) ===== */}

      {/* Header */}
      <div className="select-none text-center flex flex-col justify-center items-center !py-11 !md:py-20 !px-5 transition-colors duration-400 relative z-[2]">
        <Kicker C={C}>Transparansi Biaya</Kicker>
        <BigTitle C={C}>POTONGAN TERKECIL DI{" "}
          <span style={{ color: C.lime }}>KELASNYA</span>
        </BigTitle>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 16, transition: "color 0.4s" }}>
          Kami hanya ambil 2.5% — sisanya langsung ke kantongmu.
        </p>
      </div>

      <div className="relative w-full hidden md:flex justify-center items-center" style={{ zIndex: 2 }}>
        <img src="/man.png" alt="image" className="w-[50%] md:w-[20%] mx-auto relative top-2.5 left-1" style={{ zIndex: 33 }} />
      </div>

      {/* Grid perbandingan */}
      <div className="select-none w-[90vw] grid grid-cols-1 bg-white relative md:grid-cols-3"
        style={{ borderBottom: `1px solid ${C.line}`, zIndex: 40 }}>
          {PLATFORMS.map((p, i) => {
            const barWidth = Math.round((p.feeDonate / maxFee) * 100);
            const isLast = i === PLATFORMS.length - 1;
            const isMobile = window.innerWidth < 768;

            return (
              <div key={p.name}
                style={{
                  padding: "32px 24px",
                  borderRight: !isLast ? `1px solid ${C.line}` : "none",
                  borderBottom: isMobile ? `1px solid ${C.line}` : "none",
                  background: p.winner ? C.bg2 : "transparent",
                  transition: "all 0.4s",
                }}>
                {p.winner
                  ? <span style={{ display: "inline-block", marginBottom: 10, background: "orange", color: C.bg, fontSize: 10, padding: "3px 10px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>Terkecil</span>
                  : <div style={{ height: 24, marginBottom: 10 }} />}

                <div style={{ fontSize: 20, fontWeight: 700, color: p.winner ? C.text : "#000000", marginBottom: 4, fontFamily: "'Space Grotesk',sans-serif" }}>
                  {p.name}
                </div>

                {/* Progress bar */}
                <div style={{ height: 1, background: C.line2, borderRadius: 2, marginBottom: 16, marginTop: 14 }}>
                  <div style={{ height: 1, width: `${barWidth}%`, background: p.winner ? C.lime : C.dim, borderRadius: 2 }} />
                </div>

                {/* Fee donate */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, lineHeight: 1, color: p.winner ? C.lime : "#000000" }}>
                    {p.feeDonate.toFixed(1)}% + {p.feeWdLabel || '—'}
                  </div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: p.winner ? C.muted : "black", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 10 }}>
                    {p.winner ? 'potongan per donasi + WD semua metode' : 'potongan per donasi + WD Bank'}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function Footer({ C }) {
  return (
    <footer className="select-none text-center flex justify-center items-center" style={{ display: "grid", gridTemplateColumns: "1fr", borderTop: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
      <div className="select-none w-full text-center mx-auto flex flex-col justify-between items-center" style={{ padding: "32px 32px", borderRight: `1px solid ${C.line}`, transition: "border-color 0.4s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 15, marginTop: 6, marginBottom: 12, color: C.text, transition: "color 0.4s" }}>
          TapTipTup
        </div>
        <div className="md:flex items-center gap-1">
          <span style={{ fontSize: 11, color: C.muted, transition: "color 0.4s" }}>
            Platform donasi streaming terbaik untuk konten kreator Indonesia.
          </span>
          <a href="/privacy-policy" style={{ fontSize: 11, color: '#38bdf8', transition: "color 0.4s", whiteSpace: "nowrap" }}>
            Kebijakan privasi
          </a>
        </div>
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
    max-width: 90vw;
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
    <section id="promo" className="select-none md:block hidden" style={{ borderBottom: `1px solid ${C.line}` }}>
      {/* Header */}
      <div className="select-none text-center flex flex-col justify-center items-center"
        style={{ padding: "80px 20px", borderBottom: `1px solid ${C.line}` }}>
        <Kicker C={C}>Share & Promosi</Kicker>
        <BigTitle C={C}>SEBARKAN KE SESAMA <span style={{ color: C.lime }}>STREAMER</span></BigTitle>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>
          Pilih gambar & salin teks siap pakai untuk Instagram atau media sosial lainnya
        </p>
      </div>

      <br />

      <div style={{ padding: "48px 30px" }}>
        {/* Image cards */}
        <div className="select-none grid-cols-1 md:grid-cols-4" style={{ display: "grid", gap: 16, marginBottom: 32 }}>
          {[2,3, 4, 5].map(n => (
            <div 
              key={n} 
              className="select-none bg-white" 
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
                className="select-none flex items-center justify-center"
                style={{ 
                  // aspectRatio: format === 'ig' ? '1/1' : '16/9', 
                  background: 'white', 
                  height: 500,
                  overflow: "hidden" 
                }}>
                <img
                draggable={false}
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
                className="select-none w-full text-center mx-auto active:scale-[0.98] hover:brightness-90"
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
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
export default function TapTipTup() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Inisialisasi dari localStorage atau preferensi sistem
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("taptiptup-theme");
      if (saved !== null) return saved === "dark";
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });

  const C = isDark ? THEMES.dark : THEMES.light;

  // Modal Intro Logic
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setShowModal(true);
    }
  }, []);

  const closeModal = () => {
    setShowModal(false);
    localStorage.setItem("hasSeenIntro", "true");
  };

  function handleToggleTheme() {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem("taptiptup-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  }

  return (
    <div
      className="select-none overflow-hidden w-[100vw]"
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
      <Marquee C={C} />
      <Hero C={C} isDark={isDark} />
      <Marquee C={C} />
      <FeeComparison C={C} /> 
      <Footer C={C} />

      {/* ==================== INTRO MODAL ==================== */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}>
          <div style={{
            background: C.bg2,
            border: `1px solid ${C.line}`,
            borderRadius: "16px",
            maxWidth: "860px",
            width: "100%",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}>
            {/* Header Modal */}
            <div style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${C.line}`,
              display: "flex",
              justifyContent: "space-center",
              alignItems: "center",
              textAlign: 'center'
            }}>
              <div style={{ fontSize: "18px", width: '100%', fontWeight: 700, color: C.text, textAlign: 'center' }}>
                Selamat Datang di TapTipTup
              </div>
            </div>

            {/* Video */}
            <div style={{ padding: "20px 20px 0" }}>
              <video
                src="./ttt.mp4"
                controls
                autoPlay
                muted
                loop
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  background: "#000",
                  height: '40vh'
                }}
              />
            </div>

            {/* Content */}
            <div style={{
              textAlign: "center",
              padding: "32px 40px 40px",
            }}>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(24px, 5vw, 36px)",
                lineHeight: 1.1,
                marginBottom: "14px",
                color: C.text,
              }}>
                Ubah Streaming Kamu
                Menjadi <span style={{ color: C.lime }}>Cuan</span>
              </h2>

              <p style={{
                fontSize: "15.5px",
                lineHeight: 1.4,
                color: C.muted,
                maxWidth: "580px",
                margin: "0 auto",
              }}>
                Platform donasi lokal terbaik untuk streamer Indonesia. 
                Potongan hanya 2.5%
              </p>

              <button
                onClick={closeModal}
                style={{
                  marginTop: "32px",
                  padding: "14px 42px",
                  background: C.lime,
                  color: C.bg,
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
              >
                Mulai Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
