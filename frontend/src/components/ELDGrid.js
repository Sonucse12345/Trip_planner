import React from 'react';

const STATUS = {
  OFF: { fill: '#dbeafe', line: '#1d4ed8', label: '1. Off Duty',         labelBg: '#1d4ed8', labelColor: '#fff' },
  SB:  { fill: '#e0e7ff', line: '#4338ca', label: '2. Sleeper\nBerth',   labelBg: '#4338ca', labelColor: '#fff' },
  D:   { fill: '#fed7aa', line: '#c2410c', label: '3. Driving',           labelBg: '#c2410c', labelColor: '#fff' },
  ON:  { fill: '#fde68a', line: '#d97706', label: '4. On Duty\n(not driving)', labelBg: '#d97706', labelColor: '#fff' },
};
const ROW_ORDER = ['OFF', 'SB', 'D', 'ON'];
const HOUR_LABELS = [
  'Mid-\nnight','1','2','3','4','5','6','7','8','9','10','11','Noon',
  '1','2','3','4','5','6','7','8','9','10','11','Mid-\nnight',
];

export default function ELDGrid({ entries = [], dayLog = {}, tripDetails = {} }) {
  // Layout constants
  const LABEL_W = 96;
  const TOTAL_W = 60;
  const GRID_W = 860;
  const ROW_H  = 48;
  const TICK_TOP_H = 20;
  const TICK_BOT_H = 20;
  const HDR_LABEL_H = 18;  // hour label row at top
  const NUM_ROWS = 4;
  const GRID_H = NUM_ROWS * ROW_H;
  const HOUR_W = GRID_W / 24;
  const SVG_W  = LABEL_W + GRID_W + TOTAL_W;
  const REMARKS_H = 80;
  const GRID_Y = HDR_LABEL_H + TICK_TOP_H;
  const TICK_BOT_Y = GRID_Y + GRID_H;
  const LABEL_BOT_Y = TICK_BOT_Y + TICK_BOT_H;
  const REMARKS_Y  = LABEL_BOT_Y + 4;
  const SVG_H  = REMARKS_Y + REMARKS_H;

  const totals = {
    OFF: dayLog.total_off_duty || 0,
    SB:  dayLog.total_sleeper  || 0,
    D:   dayLog.total_driving  || 0,
    ON:  dayLog.total_on_duty  || 0,
  };
  const totalAll = totals.OFF + totals.SB + totals.D + totals.ON;

  function fmt(h) { return (h || 0).toFixed(2); }
  function hX(hour) { return LABEL_W + (hour / 24) * GRID_W; }
  function rowTop(ri) { return GRID_Y + ri * ROW_H; }
  function rowMid(ri) { return rowTop(ri) + ROW_H / 2; }

  // Date parts
  const d = dayLog.date ? new Date(dayLog.date + 'T00:00:00') : null;
  const mm = d ? String(d.getMonth() + 1).padStart(2, '0') : '--';
  const dd = d ? String(d.getDate()).padStart(2, '0') : '--';
  const yy = d ? d.getFullYear() : '----';

  // Sort entries
  const sorted = [...entries].sort((a, b) => (a.start_hour || 0) - (b.start_hour || 0));

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', background: '#fff', border: '2px solid #1e293b', borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>

      {/* ─── MAIN HEADER ─────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)', padding: '12px 20px 10px', display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 12, alignItems: 'start' }}>

        {/* Left: DOT + Date */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#93c5fd', letterSpacing: '0.07em', marginBottom: 5 }}>
            U.S. DEPARTMENT OF TRANSPORTATION
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
            {[{ v: mm, l: 'MONTH' }, { v: dd, l: 'DAY' }, { v: yy, l: 'YEAR' }].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>{item.v}</div>
                <div style={{ fontSize: 9, color: '#93c5fd', fontWeight: 700, letterSpacing: '0.05em' }}>({item.l})</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Title + Miles */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>DRIVER'S DAILY LOG</div>
          <div style={{ fontSize: 10, color: '#93c5fd', fontWeight: 700, marginBottom: 6, letterSpacing: '0.04em' }}>(ONE CALENDAR DAY — 24 HOURS)</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
            {(dayLog.total_miles || 0).toFixed(0)}
          </div>
          <div style={{ fontSize: 10, color: '#93c5fd', fontWeight: 700, letterSpacing: '0.04em' }}>(TOTAL MILES DRIVING TODAY)</div>
        </div>

        {/* Right: Legal + Vehicle */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#93c5fd', fontWeight: 600, lineHeight: 1.6, marginBottom: 6 }}>
            ORIGINAL — Submit to carrier within 13 days<br />
            DUPLICATE — Driver retains possession for 8 days
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
            {tripDetails.truck_number || 'TRK—'}, {tripDetails.trailer_number || 'TRL—'}
          </div>
          <div style={{ fontSize: 9, color: '#93c5fd', fontWeight: 700, letterSpacing: '0.04em' }}>VEHICLE NUMBERS — (SHOW EACH UNIT)</div>
        </div>
      </div>

      {/* ─── CARRIER + SIGNATURE ──────────────────────────────────── */}
      <div style={{ borderBottom: '1.5px solid #e2e8f0', padding: '8px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, background: '#fafbff' }}>
        <div>
          <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, marginBottom: 2 }}>
            I certify that these entries are true and correct
          </div>
          <div style={{ fontSize: 20, fontStyle: 'italic', fontWeight: 800, color: '#1e293b', fontFamily: 'Georgia, serif' }}>
            {tripDetails.carrier_name || 'Carrier Name'}
          </div>
          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 }}>
            (NAME OF CARRIER OR CARRIERS)
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, marginBottom: 2 }}>&nbsp;</div>
          <div style={{ fontSize: 20, fontStyle: 'italic', fontWeight: 800, color: '#1e293b', fontFamily: 'Georgia, serif', borderBottom: '1.5px solid #94a3b8', paddingBottom: 2 }}>
            {tripDetails.driver_name || 'Driver Name'}
          </div>
          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 }}>
            (DRIVER'S SIGNATURE IN FULL)
          </div>
        </div>
      </div>

      {/* ─── OFFICE + CO-DRIVER ───────────────────────────────────── */}
      <div style={{ borderBottom: '2px solid #1e293b', padding: '6px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, background: '#f8faff' }}>
        <div>
          <div style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 800, color: '#1e293b', fontFamily: 'Georgia, serif' }}>
            {tripDetails.main_office_address || 'Main Office Address'}
          </div>
          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 }}>
            (MAIN OFFICE ADDRESS)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: '#374151', fontWeight: 700, borderBottom: '1.5px solid #94a3b8', paddingBottom: 2, minWidth: 140 }}>
              {tripDetails.co_driver || '—'}
            </div>
            <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 }}>(NAME OF CO-DRIVER)</div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#1e293b', background: '#e2e8f0', borderRadius: 6, padding: '2px 12px' }}>
              Day {dayLog.day_number || 1}
            </div>
            <div style={{ fontSize: 10, color: '#374151', fontWeight: 700, marginTop: 2 }}>TOTAL<br />HOURS</div>
          </div>
        </div>
      </div>

      {/* ─── SVG GRID ─────────────────────────────────────────────── */}
      <div style={{ background: '#fff', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: 700 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ── gradient defs ── */}
          <defs>
            {ROW_ORDER.map((s, ri) => (
              <linearGradient key={s} id={`rowGrad${s}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STATUS[s].labelBg} stopOpacity="1"/>
                <stop offset="100%" stopColor={STATUS[s].labelBg} stopOpacity="0.75"/>
              </linearGradient>
            ))}
          </defs>

          {/* ── TOP HOUR LABELS ── */}
          {HOUR_LABELS.map((label, hi) => {
            const cx = LABEL_W + hi * HOUR_W + (hi < 24 ? HOUR_W / 2 : 0);
            const isBig = hi === 0 || hi === 12 || hi === 24;
            const parts = label.split('\n');
            return parts.map((t, li) => (
              <text key={`${hi}-${li}`}
                x={hi === 0 ? LABEL_W + 2 : hi === 24 ? LABEL_W + GRID_W - 2 : cx}
                y={isBig ? 8 + li * 9 : 12 + li * 9}
                textAnchor={hi === 0 ? 'start' : hi === 24 ? 'end' : 'middle'}
                fontSize={isBig ? 9 : 10} fontWeight={isBig ? 800 : 600}
                fill={isBig ? '#1e293b' : '#374151'} fontFamily="Arial"
              >{t}</text>
            ));
          })}

          {/* ── TOP TICK MARKS ── */}
          {Array.from({ length: 24 * 4 + 1 }, (_, ti) => {
            const isHr = ti % 4 === 0;
            const isHalf = ti % 2 === 0;
            const x = LABEL_W + (ti / (24 * 4)) * GRID_W;
            const h = isHr ? 12 : isHalf ? 7 : 4;
            return <line key={ti} x1={x} y1={HDR_LABEL_H + TICK_TOP_H - h} x2={x} y2={HDR_LABEL_H + TICK_TOP_H}
              stroke={isHr ? '#1e293b' : '#6b7280'} strokeWidth={isHr ? 1.5 : 0.7} />;
          })}

          {/* ── ROW BACKGROUNDS ── */}
          {ROW_ORDER.map((s, ri) => (
            <rect key={s} x={LABEL_W} y={rowTop(ri)} width={GRID_W} height={ROW_H}
              fill={STATUS[s].fill} opacity="0.45" />
          ))}

          {/* ── DUTY STATUS FILL BANDS ── */}
          {sorted.map((entry, i) => {
            const si = ROW_ORDER.indexOf(entry.status);
            if (si < 0) return null;
            const x1 = hX(entry.start_hour || 0);
            const x2 = hX(Math.min(entry.end_hour || 24, 24));
            return <rect key={i} x={x1} y={rowTop(si)} width={Math.max(0, x2 - x1)} height={ROW_H}
              fill={STATUS[entry.status].fill} opacity="1" />;
          })}

          {/* ── GRID HORIZONTAL LINES ── */}
          {[0, 1, 2, 3, 4].map(ri => (
            <line key={ri} x1={LABEL_W} y1={rowTop(ri)} x2={LABEL_W + GRID_W} y2={rowTop(ri)}
              stroke={ri === 0 || ri === 4 ? '#1e293b' : '#94a3b8'}
              strokeWidth={ri === 0 || ri === 4 ? 1.5 : 0.8} />
          ))}

          {/* ── HOUR VERTICAL LINES ── */}
          {Array.from({ length: 25 }, (_, hi) => {
            const x = LABEL_W + hi * HOUR_W;
            const isMajor = hi === 0 || hi === 12 || hi === 24;
            return <line key={hi} x1={x} y1={GRID_Y} x2={x} y2={GRID_Y + GRID_H}
              stroke={isMajor ? '#1e293b' : '#d1d5db'}
              strokeWidth={isMajor ? 1.5 : 0.5} />;
          })}

          {/* ── 15-MIN INNER TICKS ── */}
          {Array.from({ length: 24 * 4 + 1 }, (_, ti) => {
            if (ti % 4 === 0) return null;
            const isHalf = ti % 2 === 0;
            const x = LABEL_W + (ti / (24 * 4)) * GRID_W;
            return ROW_ORDER.map((_, ri) => {
              const y = rowTop(ri);
              return <line key={`${ti}-${ri}`} x1={x} y1={y} x2={x} y2={y + (isHalf ? 7 : 4)}
                stroke="#c7d2da" strokeWidth={0.5} />;
            });
          })}

          {/* ── STATUS LINES + VERTICAL CONNECTORS ── */}
          {sorted.map((entry, idx) => {
            const si = ROW_ORDER.indexOf(entry.status);
            if (si < 0) return null;
            const x1 = hX(entry.start_hour || 0);
            const x2 = hX(Math.min(entry.end_hour || 24, 24));
            const my = rowMid(si);
            const color = STATUS[entry.status].line;
            const next = sorted[idx + 1];
            const nsi = next ? ROW_ORDER.indexOf(next.status) : -1;
            return (
              <g key={idx}>
                {/* horizontal */}
                <line x1={x1} y1={my} x2={x2} y2={my} stroke={color} strokeWidth={3} strokeLinecap="square"/>
                {/* vertical connector to next */}
                {nsi >= 0 && nsi !== si && (
                  <line x1={x2} y1={my} x2={x2} y2={rowMid(nsi)}
                    stroke={color} strokeWidth={3} strokeLinecap="square"/>
                )}
              </g>
            );
          })}

          {/* ── ROW LABELS (colored badges on left) ── */}
          {ROW_ORDER.map((s, ri) => {
            const y = rowTop(ri);
            const lines = STATUS[s].label.split('\n');
            return (
              <g key={s}>
                <rect x={0} y={y} width={LABEL_W - 2} height={ROW_H} fill={`url(#rowGrad${s})`} rx="0"/>
                {lines.map((line, li) => (
                  <text key={li}
                    x={LABEL_W - 6}
                    y={y + ROW_H / 2 - ((lines.length - 1) * 6) + li * 12}
                    textAnchor="end"
                    fontSize={11} fontWeight={800}
                    fill="#fff" fontFamily="Arial"
                  >{line}</text>
                ))}
              </g>
            );
          })}

          {/* ── TOTAL HOURS column ── */}
          {/* Header */}
          <rect x={LABEL_W + GRID_W} y={GRID_Y} width={TOTAL_W} height={GRID_H + 22} fill="#f0f4ff" stroke="#c7d2fe" strokeWidth="0.8"/>
          <text x={LABEL_W + GRID_W + TOTAL_W / 2} y={GRID_Y + 10}
            textAnchor="middle" fontSize={10} fontWeight={900} fill="#1e3a8a" fontFamily="Arial">TOTAL</text>
          <text x={LABEL_W + GRID_W + TOTAL_W / 2} y={GRID_Y + 22}
            textAnchor="middle" fontSize={10} fontWeight={900} fill="#1e3a8a" fontFamily="Arial">HOURS</text>

          {ROW_ORDER.map((s, ri) => {
            const y = rowTop(ri);
            return (
              <g key={s}>
                <rect x={LABEL_W + GRID_W} y={y} width={TOTAL_W} height={ROW_H}
                  fill={STATUS[s].fill} stroke={STATUS[s].line} strokeWidth="0.8" opacity="0.9"/>
                <text x={LABEL_W + GRID_W + TOTAL_W / 2} y={y + ROW_H / 2 + 6}
                  textAnchor="middle" fontSize={16} fontWeight={900}
                  fill={STATUS[s].line} fontFamily="Arial">
                  {fmt(totals[s])}
                </text>
              </g>
            );
          })}

          {/* Total row */}
          <rect x={LABEL_W + GRID_W} y={GRID_Y + GRID_H} width={TOTAL_W} height={22}
            fill="#1e293b" rx="0"/>
          <text x={LABEL_W + GRID_W + TOTAL_W / 2} y={GRID_Y + GRID_H + 15}
            textAnchor="middle" fontSize={13} fontWeight={900} fill="#fff" fontFamily="Arial">
            ={fmt(totalAll)}
          </text>

          {/* ── BOTTOM TICK MARKS ── */}
          {Array.from({ length: 24 * 4 + 1 }, (_, ti) => {
            const isHr = ti % 4 === 0;
            const isHalf = ti % 2 === 0;
            const x = LABEL_W + (ti / (24 * 4)) * GRID_W;
            const h = isHr ? 12 : isHalf ? 7 : 4;
            return <line key={ti} x1={x} y1={TICK_BOT_Y} x2={x} y2={TICK_BOT_Y + h}
              stroke={isHr ? '#1e293b' : '#6b7280'} strokeWidth={isHr ? 1.5 : 0.7} />;
          })}

          {/* ── BOTTOM HOUR LABELS ── */}
          {HOUR_LABELS.map((label, hi) => {
            const cx = LABEL_W + hi * HOUR_W + (hi < 24 ? HOUR_W / 2 : 0);
            const isBig = hi === 0 || hi === 12 || hi === 24;
            const parts = label.split('\n');
            return parts.map((t, li) => (
              <text key={`b${hi}-${li}`}
                x={hi === 0 ? LABEL_W + 2 : hi === 24 ? LABEL_W + GRID_W - 2 : cx}
                y={LABEL_BOT_Y + (isBig ? 8 : 12) + li * 9}
                textAnchor={hi === 0 ? 'start' : hi === 24 ? 'end' : 'middle'}
                fontSize={isBig ? 9 : 10} fontWeight={isBig ? 800 : 600}
                fill={isBig ? '#1e293b' : '#374151'} fontFamily="Arial"
              >{t}</text>
            ));
          })}

          {/* ── REMARKS SECTION ── */}
          <line x1={LABEL_W} y1={REMARKS_Y} x2={LABEL_W + GRID_W} y2={REMARKS_Y} stroke="#e2e8f0" strokeWidth="1"/>
          <text x={6} y={REMARKS_Y + 16}
            fontSize={12} fontWeight={800} fill="#374151" fontFamily="Arial">REMARKS</text>

          {sorted.map((entry, i) => {
            if (!entry.location && !entry.remarks) return null;
            const x = hX(entry.start_hour || 0);
            const text = (entry.location || entry.remarks || '').slice(0, 28);
            const color = STATUS[entry.status]?.line || '#374151';
            return (
              <g key={i}>
                <line x1={x} y1={REMARKS_Y} x2={x} y2={REMARKS_Y + 14} stroke={color} strokeWidth={1.5}/>
                <text x={x + 2} y={REMARKS_Y + 16}
                  fontSize={10} fontWeight={700} fill={color} fontFamily="Arial"
                  transform={`rotate(-52, ${x + 2}, ${REMARKS_Y + 16})`}
                >{text}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ─── SHIPPING ROW ──────────────────────────────────────────── */}
      <div style={{ borderTop: '1.5px solid #e2e8f0', padding: '8px 20px', display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: 20, background: '#f8faff', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, marginBottom: 2 }}>Pro or Shipping No.</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b' }}>{tripDetails.shipping_doc_number || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, marginBottom: 2 }}>SHIPPING DOCUMENTS / DVL or Manifest No.</div>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Shipper &amp; Commodity: {tripDetails.carrier_name || '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, lineHeight: 1.7 }}>
            Enter name of place you reported and where released from work<br />
            and when and where each change of duty occurred.<br />
            <strong style={{ color: '#1e293b', fontSize: 12 }}>Use time standard of home terminal.</strong>
          </div>
        </div>
      </div>

      {/* ─── RECAP TABLE ───────────────────────────────────────────── */}
      <div style={{ borderTop: '2px solid #1e293b', padding: '10px 20px', background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 12, alignItems: 'start' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', paddingTop: 22, lineHeight: 1.5 }}>
            Recap:<br />Complete at<br />end of day
          </div>

          {[
            { title: '70 Hour / 8 Day Drivers', cols: ['A.', 'B.', 'C.'], descs: ['On duty hours today,\nTotal lines 3 & 4', 'A. Total hours on duty last 7 days\nincluding today.', 'B. Total hours available tomorrow\n70 hr. minus A*'], vals: [fmt(totals.D + totals.ON), fmt(totals.D + totals.ON), '—'] },
            { title: '60 Hour / 7 Day Drivers',  cols: ['A.', 'B.', 'C.'], descs: ['On duty hours today,\nTotal lines 3 & 4', 'A. Total hours on duty last 6 days\nincluding today.', 'B. Total hours available tomorrow\n60 hr. minus A*'], vals: [fmt(totals.D + totals.ON), '—', '—'] },
          ].map((section, si) => (
            <div key={si}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', marginBottom: 6, textAlign: 'center', background: si === 0 ? '#dbeafe' : '#dcfce7', padding: '3px 8px', borderRadius: 4, border: `1px solid ${si === 0 ? '#93c5fd' : '#86efac'}` }}>
                {section.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {section.cols.map((col, ci) => (
                  <div key={ci} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 6, padding: '6px 4px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#374151', marginBottom: 2 }}>{col}</div>
                    <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4, marginBottom: 4 }}>{section.descs[ci]}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#1e293b' }}>{section.vals[ci]}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 8, borderTop: '1px solid #e5e7eb', paddingTop: 6, fontWeight: 600 }}>
          * If you took 34 consecutive hours off duty you have 60/70 hours available.
        </div>
      </div>

      {/* ─── CERTIFICATION ROW ─────────────────────────────────────── */}
      <div style={{ borderTop: '1.5px solid #e2e8f0', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #f8faff, #fff)', fontSize: 12, color: '#374151' }}>
        <div style={{ fontWeight: 600 }}>
          <strong>Driver's Certification:</strong> "I certify that these entries are true and correct."
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontStyle: 'italic', fontSize: 17, fontFamily: 'Georgia, serif', fontWeight: 800, color: '#1e293b' }}>
            {tripDetails.driver_name || 'Driver'}
          </span>
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 12 }}>Date: {dayLog.date || '—'}</span>
        </div>
      </div>
    </div>
  );
}
