import { useState } from "react";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────
   COLORS (Konsisten dengan TapTipTup)
───────────────────────────────────────── */
const C = {
  bg: "#0a0b10",
  bg2: "#12141d",
  line: "#232736",
  line2: "#2d334a",
  text: "#f8fafc",
  muted: "#64748b",
  dim: "#334155",
  lime: "#fda4af", // Soft Rose Pink
};

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <h3 style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 32,
      color: C.lime,
      marginTop: 48,
      marginBottom: 16,
      letterSpacing: "0.02em"
    }}>
      {children}
    </h3>
  );
}

function PolicyText({ children }) {
  return (
    <p style={{
      fontSize: 15,
      lineHeight: 1.8,
      color: "rgba(248, 250, 252, 0.8)",
      marginBottom: 16,
      fontWeight: 400
    }}>
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Navbar Minimalis */}
      <nav style={{
        padding: "24px 40px",
        borderBottom: `1px solid ${C.line}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(10, 11, 16, 0.8)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <Link to="/" style={{ textDecoration: "none", color: C.text, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, background: C.lime, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>🪼</div>
          TAP-TIP-TUP
        </Link>
        <Link to="/" style={{ fontSize: 12, color: C.muted, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Kembali ke Beranda →
        </Link>
      </nav>

      {/* Header Halaman */}
      <header style={{ padding: "80px 40px 40px", textAlign: "center", borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.lime, textTransform: "uppercase", letterSpacing: "0.2em" }}>Legal Document</span>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 8vw, 80px)", lineHeight: 1, marginTop: 16 }}>
          KEBIJAKAN <span style={{ color: C.lime }}>PRIVASI</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 12 }}>Terakhir diperbarui: 12 Mei 2026</p>
      </header>

      {/* Konten Utama */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 40px" }}>
        <PolicyText>
          Selamat datang di TapTipTup. Kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi Anda saat Anda menggunakan platform kami.
        </PolicyText>

        <SectionTitle>1. Informasi yang Kami Kumpulkan</SectionTitle>
        <PolicyText>
          Kami mengumpulkan informasi yang Anda berikan langsung kepada kami saat mendaftar, seperti:
        </PolicyText>
        <ul style={{ color: C.muted, fontSize: 14, paddingLeft: 20, marginBottom: 20, lineHeight: 2 }}>
          <li>Nama lengkap dan nama pengguna (username).</li>
          <li>Alamat email untuk verifikasi dan notifikasi.</li>
          <li>Data akun bank atau e-wallet (untuk pencairan donasi).</li>
          <li>Informasi profil media sosial yang Anda hubungkan (seperti Twitch atau YouTube).</li>
        </ul>

        <SectionTitle>2. Penggunaan Data</SectionTitle>
        <PolicyText>
          Data yang kami kumpulkan digunakan untuk tujuan berikut:
        </PolicyText>
        <ul style={{ color: C.muted, fontSize: 14, paddingLeft: 20, marginBottom: 20, lineHeight: 2 }}>
          <li>Memproses transaksi donasi secara real-time.</li>
          <li>Menampilkan alert donasi pada overlay OBS Anda.</li>
          <li>Mengelola sistem leaderboard dan milestone donasi.</li>
          <li>Meningkatkan keamanan akun dan mencegah tindakan penipuan (fraud).</li>
        </ul>

        <SectionTitle>3. Berbagi Informasi dengan Pihak Ketiga</SectionTitle>
        <PolicyText>
          Kami tidak menjual data pribadi Anda. Namun, kami berbagi data dengan mitra penyedia layanan untuk operasional:
        </PolicyText>
        <ul style={{ color: C.muted, fontSize: 14, paddingLeft: 20, marginBottom: 20, lineHeight: 2 }}>
          <li><strong>Payment Gateway:</strong> Untuk memproses pembayaran via QRIS dan transfer bank.</li>
          <li><strong>Penyedia Cloud:</strong> Untuk menyimpan data overlay dan aset media Anda dengan aman.</li>
        </ul>

        <SectionTitle>4. Keamanan Data</SectionTitle>
        <PolicyText>
          Kami menerapkan standar keamanan industri untuk melindungi informasi Anda dari akses tidak sah. Semua transaksi keuangan dienkripsi dan kami secara rutin memantau sistem kami dari kerentanan.
        </PolicyText>

        <SectionTitle>5. Hak Anda</SectionTitle>
        <PolicyText>
          Anda memiliki hak untuk mengakses, mengoreksi, atau menghapus data pribadi Anda kapan saja melalui dashboard pengaturan akun. Jika Anda ingin menutup akun secara permanen, Anda dapat menghubungi tim dukungan kami.
        </PolicyText>

        <div style={{ 
          marginTop: 80, 
          padding: 32, 
          background: C.bg2, 
          borderLeft: `4px solid ${C.lime}`,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.lime }}>Pertanyaan atau Masukan?</div>
          <PolicyText>
            Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi kami di: 
            <br />
            <strong style={{ color: C.text }}>legal@taptiptup.com</strong>
          </PolicyText>
        </div>
      </main>

      {/* Footer Sederhana */}
      <footer style={{ padding: "40px", borderTop: `1px solid ${C.line}`, textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.05em" }}>
          © 2026 TAP-TIP-TUP. DIBUAT DENGAN SEMANGAT UNTUK KREATOR INDONESIA.
        </p>
      </footer>
    </div>
  );
}