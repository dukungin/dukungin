// pages/DonationTerminal.jsx
// Khusus superAdmin — terminal log aktivitas donasi real-time

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axiosInstance';

const fetchLogs = async ({ streamer = 'all', limit = 200, status = '', startDate = '', endDate = '' }) => {
  const params = new URLSearchParams({ 
    streamer, 
    limit, 
    status,
    ...(startDate && { startDate }),
    ...(endDate && { endDate })
  });
  return (await api.get(`/api/midtrans/admin/donation-logs?${params}`)).data;
};

const fetchStreamers = async () =>
  (await api.get('/api/midtrans/admin/streamers-list')).data;

const formatRp = (n) =>
  `Rp ${Number(n).toLocaleString('id-ID')}`;

const formatTs = (d) =>
  new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(',', '');

const STATUS_COLOR = {
  PAID:    { dot: '#22c55e', text: '#86efac', label: 'PAID'    },
  PENDING: { dot: '#facc15', text: '#fde68a', label: 'PENDING' },
  EXPIRED: { dot: '#ef4444', text: '#fca5a5', label: 'EXPIRED' },
};

const TYPE_ICON = (d) => {
  if (d.voiceUrl)  return '🎙️';
  if (d.mediaUrl)  return '🎬';
  return '💜';
};

const LogRow = ({ d, idx, highlight }) => {
  const s = STATUS_COLOR[d.status] || STATUS_COLOR.PENDING;
  const mono = "'Courier New', monospace";

  return (
    <motion.div
      initial={highlight ? { opacity: 0, x: -12, backgroundColor: '#22c55e18' } : { opacity: 0 }}
      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
      transition={{ duration: highlight ? 0.5 : 0.15, delay: highlight ? 0 : idx * 0.008 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '7px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontFamily: mono,
        fontSize: 12,
        lineHeight: 1.6,
        transition: 'background 0.2s',
      }}
      className="hover:bg-white/[0.03]"
    >
      {/* Index */}
      <span style={{ color: '#374151', flexShrink: 0, width: 36, textAlign: 'right' }}>
        {String(idx + 1).padStart(4, '0')}
      </span>

      {/* Timestamp */}
      <span style={{ color: '#4b5563', flexShrink: 0, width: 130 }}>
        {formatTs(d.createdAt)}
      </span>

      {/* Type icon */}
      <span style={{ flexShrink: 0, fontSize: 13 }}>{TYPE_ICON(d)}</span>

      {/* Streamer */}
      <span style={{ color: '#818cf8', flexShrink: 0, width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        @{d.userId?.username || '-'}
      </span>

      {/* Donor */}
      <span style={{ color: '#e2e8f0', flexShrink: 0, width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {d.donorName}
      </span>

      {/* Amount */}
      <span style={{ color: '#34d399', fontWeight: 900, flexShrink: 0, width: 110, textAlign: 'right' }}>
        {formatRp(d.amount)}
      </span>

      {/* Status */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, width: 76 }}>
        <span style={{ width: 6, height: 6, borderRadius: 0, background: s.dot, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ color: s.text, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>{s.label}</span>
      </span>

      {/* Message */}
      <span style={{ color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {d.message || <span style={{ color: '#374151' }}>—</span>}
      </span>

      {/* Media indicator */}
      {d.mediaUrl && (
        <a href={d.mediaUrl} target="_blank" rel="noopener noreferrer"
          style={{ color: '#a78bfa', fontSize: 10, flexShrink: 0, textDecoration: 'none' }}
          className="hover:text-violet-300">
          [MEDIA]
        </a>
      )}
    </motion.div>
  );
};

const StatChip = ({ label, value, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${color}30`,
    padding: '8px 14px',
    fontFamily: "'Courier New', monospace",
  }}>
    <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 900, color }}>{value}</div>
  </div>
);

const DonationTerminal = () => {
  const mono = "'Courier New', monospace";
  const [selectedStreamer, setSelectedStreamer] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [limit, setLimit] = useState(200);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchDonor, setSearchDonor] = useState('');
  const [newIds, setNewIds] = useState(new Set());
  const prevIdsRef = useRef(new Set());
  const bottomRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: streamersData } = useQuery({
    queryKey: ['adminStreamersList'],
    queryFn: fetchStreamers,
    staleTime: 60000,
  });

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['adminDonationLogs', selectedStreamer, limit, statusFilter, startDate, endDate],
    queryFn: () => fetchLogs({ 
        streamer: selectedStreamer, 
        limit, 
        status: statusFilter,
        startDate,
        endDate
    }),
    refetchInterval: autoRefresh ? 8000 : false,
    staleTime: 4000,
    });

  const donations = (data?.donations || []).filter(d =>
    !searchDonor || d.donorName?.toLowerCase().includes(searchDonor.toLowerCase())
  );

  // Detect new rows
  useEffect(() => {
    if (!data?.donations?.length) return;
    const currIds = new Set(data.donations.map(d => d._id));
    const fresh = new Set([...currIds].filter(id => !prevIdsRef.current.has(id)));
    if (prevIdsRef.current.size > 0 && fresh.size > 0) {
      setNewIds(fresh);
      setTimeout(() => setNewIds(new Set()), 3000);
    }
    prevIdsRef.current = currIds;
  }, [data]);

  // Auto scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [donations.length, autoScroll]);

  const streamers = streamersData?.users || [];

  // Stats
  const paid    = donations.filter(d => d.status === 'PAID');
  const pending = donations.filter(d => d.status === 'PENDING');
  const expired = donations.filter(d => d.status === 'EXPIRED');
  const totalPaid = paid.reduce((s, d) => s + (d.amount || 0), 0);
  const withMedia = paid.filter(d => d.mediaUrl).length;
  const withVoice = paid.filter(d => d.voiceUrl).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0b10',
      color: '#e2e8f0',
      fontFamily: mono,
      padding: '0 0 40px 0',
    }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(99,102,241,0.05)',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, background: autoRefresh ? '#22c55e' : '#6b7280',
            animation: autoRefresh ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', color: '#818cf8' }}>
            DONATION_TERMINAL
          </span>
          <span style={{ fontSize: 10, color: '#374151', letterSpacing: '0.08em' }}>
            v1.0 · SUPERADMIN
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#4b5563' }}>
          <span>LAST_SYNC:</span>
          <span style={{ color: '#22c55e' }}>
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID') : '—'}
          </span>
          {isFetching && <span style={{ color: '#facc15', animation: 'pulse 1s infinite' }}>FETCHING...</span>}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{
        padding: '14px 20px',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)',
      }}>

        {/* Streamer selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.1em' }}>STREAMER:</span>
          <select
            value={selectedStreamer}
            onChange={e => setSelectedStreamer(e.target.value)}
            style={{
              background: '#111827', border: '1px solid #374151',
              color: '#818cf8', fontFamily: mono, fontSize: 12,
              padding: '5px 10px', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">[ ALL STREAMERS ]</option>
            {streamers.map(u => (
              <option key={u._id} value={u.username}>
                @{u.username} · Rp{Number(u.totalDonations || 0).toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.1em' }}>STATUS:</span>
          <div style={{ display: 'flex' }}>
            {[
              { val: '', label: 'ALL' },
              { val: 'PAID', label: 'PAID' },
              { val: 'PENDING', label: 'PENDING' },
              { val: 'EXPIRED', label: 'EXPIRED' },
            ].map(f => (
              <button key={f.val} onClick={() => setStatusFilter(f.val)}
                style={{
                  padding: '5px 10px', fontFamily: mono, fontSize: 10,
                  fontWeight: 700, letterSpacing: '0.1em', border: 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: statusFilter === f.val ? '#4f46e5' : 'transparent',
                  color: statusFilter === f.val ? '#fff' : '#6b7280',
                  borderRight: '1px solid #1f2937',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search donor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.1em' }}>SEARCH:</span>
          <input
            value={searchDonor}
            onChange={e => setSearchDonor(e.target.value)}
            placeholder="donor name..."
            style={{
              background: '#111827', border: '1px solid #374151',
              color: '#e2e8f0', fontFamily: mono, fontSize: 12,
              padding: '5px 10px', outline: 'none', width: 160,
            }}
          />
        </div>

        {/* Date Range Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.1em' }}>FROM:</span>
        <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{
            background: '#111827', border: '1px solid #374151',
            color: '#e2e8f0', fontFamily: mono, fontSize: 12,
            padding: '5px 8px', outline: 'none'
            }}
        />
        
        <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.1em' }}>TO:</span>
        <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{
            background: '#111827', border: '1px solid #374151',
            color: '#e2e8f0', fontFamily: mono, fontSize: 12,
            padding: '5px 8px', outline: 'none'
            }}
        />

        {(startDate || endDate) && (
            <button 
            onClick={() => { setStartDate(''); setEndDate(''); }}
            style={{
                padding: '5px 10px', fontSize: 10, fontWeight: 700,
                background: '#991b1b', color: '#fda4af', border: 'none', cursor: 'pointer'
            }}
            >
            CLEAR
            </button>
        )}
        </div>

        {/* Limit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.1em' }}>ROWS:</span>
          {[50, 100, 200, 500].map(n => (
            <button key={n} onClick={() => setLimit(n)}
              style={{
                padding: '5px 8px', fontFamily: mono, fontSize: 10,
                fontWeight: 700, border: '1px solid #1f2937', cursor: 'pointer',
                background: limit === n ? '#1e1b4b' : 'transparent',
                color: limit === n ? '#818cf8' : '#6b7280',
              }}>
              {n}
            </button>
          ))}
        </div>

        {/* Auto refresh toggle */}
        <button onClick={() => setAutoRefresh(v => !v)}
          style={{
            padding: '5px 12px', fontFamily: mono, fontSize: 10, fontWeight: 900,
            border: `1px solid ${autoRefresh ? '#22c55e40' : '#374151'}`,
            background: autoRefresh ? '#052e16' : 'transparent',
            color: autoRefresh ? '#22c55e' : '#6b7280',
            cursor: 'pointer', letterSpacing: '0.1em',
          }}>
          {autoRefresh ? '⏸ AUTO:ON' : '▶ AUTO:OFF'}
        </button>

        {/* Manual refresh */}
        <button onClick={() => refetch()}
          style={{
            padding: '5px 12px', fontFamily: mono, fontSize: 10, fontWeight: 900,
            border: '1px solid #374151', background: 'transparent',
            color: '#6b7280', cursor: 'pointer', letterSpacing: '0.1em',
          }}>
          ↺ REFRESH
        </button>

        {/* Auto scroll toggle */}
        <button onClick={() => setAutoScroll(v => !v)}
          style={{
            padding: '5px 12px', fontFamily: mono, fontSize: 10, fontWeight: 900,
            border: `1px solid ${autoScroll ? '#a78bfa40' : '#374151'}`,
            background: autoScroll ? '#1e1b4b' : 'transparent',
            color: autoScroll ? '#a78bfa' : '#6b7280',
            cursor: 'pointer', letterSpacing: '0.1em', marginLeft: 'auto',
          }}>
          {autoScroll ? '↓ SCROLL:ON' : '↓ SCROLL:OFF'}
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'flex', gap: 10, padding: '12px 20px', flexWrap: 'wrap',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <StatChip label="TOTAL ROWS" value={donations.length} color="#818cf8" />
        <StatChip label="PAID" value={paid.length} color="#22c55e" />
        <StatChip label="PENDING" value={pending.length} color="#facc15" />
        <StatChip label="EXPIRED" value={expired.length} color="#ef4444" />
        <StatChip label="TOTAL PAID" value={`Rp ${totalPaid.toLocaleString('id-ID')}`} color="#34d399" />
        <StatChip label="W/MEDIA" value={withMedia} color="#a78bfa" />
        <StatChip label="W/VOICE" value={withVoice} color="#f472b6" />
      </div>

      {/* ── Column headers ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 14px',
        background: 'rgba(99,102,241,0.06)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        fontFamily: mono, fontSize: 10, fontWeight: 900,
        color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        <span style={{ width: 36, textAlign: 'right' }}>#IDX</span>
        <span style={{ width: 130 }}>TIMESTAMP</span>
        <span style={{ width: 18 }}>T</span>
        <span style={{ width: 130 }}>STREAMER</span>
        <span style={{ width: 140 }}>DONOR</span>
        <span style={{ width: 110, textAlign: 'right' }}>AMOUNT</span>
        <span style={{ width: 76 }}>STATUS</span>
        <span style={{ flex: 1 }}>MESSAGE</span>
      </div>

      {/* ── Log rows ── */}
      <div style={{ position: 'relative', minHeight: 200 }}>
        {isLoading ? (
          <div style={{
            padding: 40, textAlign: 'center',
            color: '#22c55e', fontSize: 12, letterSpacing: '0.15em',
            animation: 'pulse 1s infinite',
          }}>
            {'> '} FETCHING LOGS...
          </div>
        ) : donations.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#374151', fontSize: 12, letterSpacing: '0.12em' }}>
            {'> '} NO RECORDS FOUND
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {donations.map((d, i) => (
              <LogRow key={d._id} d={d} idx={i} highlight={newIds.has(d._id)} />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 10, color: '#374151', flexWrap: 'wrap', gap: 8,
      }}>
        <span>SAWER.IN · DONATION_TERMINAL · SUPERADMIN_ONLY</span>
        <span style={{ color: '#1f2937' }}>
          AUTO_REFRESH: {autoRefresh ? `8s` : 'DISABLED'} · SHOWING: {donations.length}/{data?.total || 0}
        </span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        select option { background: #111827; }
      `}</style>
    </div>
  );
};

export default DonationTerminal;