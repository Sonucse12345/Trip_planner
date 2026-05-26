import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ELDGrid from '../components/ELDGrid';
import { reportAPI } from '../utils/api';

function formatHour(hour) {
  if (hour === undefined || hour === null) return '—';
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dh}:${String(m).padStart(2, '0')} ${period}`;
}

/* ─── Email Modal ─────────────────────────────────────────────────────── */
function EmailModal({ open, onClose, emailInput, setEmailInput, onSend, loading, status }) {
  if (!open) return null;
  const isOk  = status?.startsWith('ok:');
  const isErr = status?.startsWith('error:');
  const needsSetup = status?.startsWith('setup:');
  const msg = status ? status.slice(status.indexOf(':') + 1) : '';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.68)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'32px 36px', width:460, maxWidth:'calc(100vw - 32px)',
        boxShadow:'0 28px 80px rgba(0,0,0,0.28)' }}>

        {/* Header */}
        <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:22 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#7c3aed,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:19, fontWeight:900, color:'#1e293b' }}>Email Trip Report</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>FMCSA-compliant professional ELD report</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none',
            cursor:'pointer', color:'#94a3b8', fontSize:20, padding:4 }}>✕</button>
        </div>

        {/* Status Messages */}
        {msg && (
          <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:18,
            background: isOk ? '#f0fdf4' : needsSetup ? '#fffbeb' : '#fef2f2',
            color: isOk ? '#15803d' : needsSetup ? '#92400e' : '#dc2626',
            fontSize:13, fontWeight:600, lineHeight:1.6,
            border:`1px solid ${isOk ? '#bbf7d0' : needsSetup ? '#fde68a' : '#fecaca'}` }}>
            {isOk ? '✅ ' : needsSetup ? '⚙️ ' : '⚠️ '}{msg}
          </div>
        )}

        {!isOk && (
          <>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:13, fontWeight:700, color:'#374151', display:'block', marginBottom:7 }}>
                Recipient Email Address
              </label>
              <input type="email" value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && onSend()}
                placeholder="driver@company.com or any@gmail.com"
                style={{ width:'100%', padding:'12px 14px', borderRadius:10,
                  border:'1.5px solid #e2e8f0', fontSize:14, outline:'none',
                  boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 16px',
              marginBottom:20, fontSize:12, color:'#64748b', lineHeight:1.8 }}>
              📋 Report includes: route summary, HOS hours, compliance checklist &amp; daily log entries<br/>
              ⚙️ <strong style={{ color:'#374151' }}>To send real emails:</strong> fill <code>EMAIL_HOST_USER</code> &amp;
              &nbsp;<code>EMAIL_HOST_PASSWORD</code> in <code>backend/.env</code>
              (Gmail App Password — see <code>backend/.env.example</code> for instructions)
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose}
                style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e2e8f0',
                  background:'#f8fafc', color:'#374151', fontWeight:700, cursor:'pointer',
                  fontSize:14, fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={onSend} disabled={loading}
                style={{ flex:2, padding:'12px', borderRadius:10, border:'none',
                  background: loading ? '#a78bfa' : 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
                  color:'#fff', fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize:14, fontFamily:'inherit', transition:'opacity 0.2s' }}>
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
                        </path>
                      </svg>Sending…
                    </span>
                  : '✉️  Send Report'}
              </button>
            </div>
          </>
        )}

        {isOk && (
          <button onClick={onClose}
            style={{ width:'100%', padding:'13px', borderRadius:10, border:'none',
              background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff',
              fontWeight:800, cursor:'pointer', fontSize:15, fontFamily:'inherit' }}>
            ✓ Done — Check Your Inbox
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main LogViewer ──────────────────────────────────────────────────── */
export default function LogViewer({ tripData }) {
  const navigate    = useNavigate();
  const gridRef     = useRef(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [emailModal, setEmailModal]     = useState(false);
  const [emailInput, setEmailInput]     = useState('');
  const [emailStatus, setEmailStatus]   = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [pdfLoading, setPdfLoading]     = useState(false);

  /* ── Download PDF (captures exact on-screen colours) ── */
  const handleDownloadPDF = async () => {
    if (!gridRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(gridRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let imgW = pageW - 20;
      let imgH = imgW / ratio;
      if (imgH > pageH - 20) { imgH = pageH - 20; imgW = imgH * ratio; }
      pdf.addImage(imgData, 'PNG', (pageW - imgW) / 2, 10, imgW, imgH);

      const driverName = tripData?.trip_details?.driver_name || 'Driver';
      const day = dailyLogs[currentDay];
      pdf.save(`ELD_Log_${driverName}_Day${day?.day_number || 1}_${day?.date || 'log'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      window.print();
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── Send Email ── */
  const handleSendEmail = async () => {
    if (!emailInput.trim()) {
      setEmailStatus('error:Please enter a recipient email address.');
      return;
    }
    setEmailLoading(true);
    setEmailStatus('');
    try {
      const res = await reportAPI.sendReport({
        trip_id: tripData?.trip_id,
        email: emailInput.trim(),
        driver_name: tripData?.trip_details?.driver_name || 'Driver',
        carrier_name: tripData?.trip_details?.carrier_name || '',
      });
      setEmailStatus('ok:' + (res.data.message || 'Report sent successfully!'));
    } catch (err) {
      const data = err.response?.data;
      if (data?.setup_required) {
        setEmailStatus('setup:' + (data.error || 'Configure email credentials.'));
      } else {
        setEmailStatus('error:' + (data?.error || 'Send failed. Check backend logs.'));
      }
    } finally {
      setEmailLoading(false);
    }
  };

  /* ── No Data State ── */
  if (!tripData?.daily_logs?.length) {
    return (
      <>
        <div className="page-header"><h2>ELD Daily Logs</h2></div>
        <div className="page-content">
          <div className="card">
            <div className="card-body" style={{ textAlign:'center', padding:'60px 40px' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom:16 }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3 style={{ color:'#475569', marginBottom:8 }}>No Log Data</h3>
              <p style={{ color:'#94a3b8', marginBottom:24 }}>Plan a trip first to generate ELD daily logs.</p>
              <button className="btn btn-primary" onClick={() => navigate('/plan')}>Plan a Trip</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const dailyLogs   = tripData.daily_logs;
  const tripDetails = tripData.trip_details || {};
  const log         = dailyLogs[currentDay];

  /* ── Render ── */
  return (
    <>
      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div>
          <h2>ELD Daily Logs</h2>
          <p style={{ color:'#64748b', fontSize:14, marginTop:2 }}>
            {dailyLogs.length} day{dailyLogs.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
            {(tripData.total_miles || 0).toFixed(1)} miles total
          </p>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {/* Back */}
          <button className="btn btn-secondary" onClick={() => navigate('/result')}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>

          {/* Download PDF */}
          <button onClick={handleDownloadPDF} disabled={pdfLoading}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              borderRadius:10, border:'none', fontWeight:700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
              fontSize:14, fontFamily:'inherit',
              background: pdfLoading ? '#94a3b8' : 'linear-gradient(135deg,#0ea5e9,#3b82f6)',
              color:'#fff', opacity: pdfLoading ? 0.75 : 1 }}>
            {pdfLoading
              ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
                    </path>
                  </svg> Generating…</>
              : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg> Download PDF</>}
          </button>

          {/* Email Report */}
          <button onClick={() => { setEmailStatus(''); setEmailModal(true); }}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              borderRadius:10, border:'none', fontWeight:700, cursor:'pointer',
              fontSize:14, fontFamily:'inherit',
              background:'linear-gradient(135deg,#7c3aed,#8b5cf6)', color:'#fff' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email Report
          </button>

          {/* Print */}
          <button onClick={() => window.print()}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              borderRadius:10, border:'1.5px solid #e2e8f0', fontWeight:700, cursor:'pointer',
              fontSize:14, fontFamily:'inherit', background:'#fff', color:'#374151' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* ── Day Navigation ── */}
        <div className="log-pagination no-print" style={{ marginBottom:20 }}>
          <button onClick={() => setCurrentDay(d => Math.max(0, d - 1))} disabled={currentDay === 0}>← Prev</button>
          {dailyLogs.map((dl, idx) => (
            <button key={idx} className={currentDay === idx ? 'active' : ''} onClick={() => setCurrentDay(idx)}>
              Day {dl.day_number}
              <small style={{ display:'block', fontSize:10 }}>{dl.date}</small>
            </button>
          ))}
          <button onClick={() => setCurrentDay(d => Math.min(dailyLogs.length - 1, d + 1))} disabled={currentDay === dailyLogs.length - 1}>Next →</button>
        </div>

        {/* ── Official ELD Grid (captured for PDF) ── */}
        <div ref={gridRef}>
          <ELDGrid entries={log?.entries || []} dayLog={log} tripDetails={tripDetails} />
        </div>

        {/* ── Hours Summary ── */}
        <div className="card" style={{ marginTop:20 }}>
          <div className="card-header">
            <h3>Day {log?.day_number} — Hours Breakdown</h3>
            <span style={{ fontSize:13, color:'#64748b' }}>{log?.date}</span>
          </div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:12, marginBottom:24 }}>
              {[
                { label:'Off Duty',      val: log?.total_off_duty,  c:'#1d4ed8', bg:'#dbeafe' },
                { label:'Sleeper Berth', val: log?.total_sleeper,   c:'#4338ca', bg:'#e0e7ff' },
                { label:'Driving',       val: log?.total_driving,   c:'#c2410c', bg:'#fed7aa' },
                { label:'On Duty',       val: log?.total_on_duty,   c:'#d97706', bg:'#fef3c7' },
                { label:'Total',
                  val:(log?.total_off_duty||0)+(log?.total_sleeper||0)+(log?.total_driving||0)+(log?.total_on_duty||0),
                  c:'#1e293b', bg:'#f1f5f9' },
              ].map((item, i) => (
                <div key={i} style={{ background:item.bg, borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:24, fontWeight:900, color:item.c }}>{(item.val||0).toFixed(2)}</div>
                  <div style={{ fontSize:12, color:item.c, fontWeight:700, marginTop:4 }}>{item.label}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>hours</div>
                </div>
              ))}
            </div>

            {/* Entries Table */}
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                    {['Status','Start','End','Duration','Location','Remarks'].map(h => (
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, color:'#374151', fontSize:12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(log?.entries || []).map((entry, idx) => {
                    const cfg = {
                      OFF:{ label:'Off Duty',      c:'#1d4ed8', bg:'#dbeafe' },
                      SB: { label:'Sleeper Berth', c:'#4338ca', bg:'#e0e7ff' },
                      D:  { label:'Driving',       c:'#c2410c', bg:'#fed7aa' },
                      ON: { label:'On Duty',       c:'#d97706', bg:'#fef3c7' },
                    }[entry.status] || { label:entry.status, c:'#64748b', bg:'#f1f5f9' };
                    return (
                      <tr key={idx} style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{ background:cfg.bg, color:cfg.c, fontWeight:700, padding:'3px 8px', borderRadius:12, fontSize:12 }}>{cfg.label}</span>
                        </td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{formatHour(entry.start_hour)}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{formatHour(entry.end_hour)}</td>
                        <td style={{ padding:'9px 12px', fontWeight:700 }}>{(entry.duration_hours||0).toFixed(2)}h</td>
                        <td style={{ padding:'9px 12px', color:'#475569', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{entry.location||'—'}</td>
                        <td style={{ padding:'9px 12px', color:'#94a3b8', fontSize:12 }}>{entry.remarks||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Email Modal ── */}
      <EmailModal
        open={emailModal}
        onClose={() => { setEmailModal(false); setEmailStatus(''); }}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        onSend={handleSendEmail}
        loading={emailLoading}
        status={emailStatus}
      />
    </>
  );
}
