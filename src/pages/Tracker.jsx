import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { ChevronRight, ExternalLink } from 'lucide-react';

const COLUMNS = [
  { id: 'new',       label: 'New',          color: '#38bdf8' },
  { id: 'reviewed',  label: 'Reviewed',     color: '#a78bfa' },
  { id: 'applied',   label: 'Applied',      color: '#f59e0b' },
  { id: 'interview', label: 'Interviewing', color: '#22d3a5' },
  { id: 'offer',     label: 'Offer',        color: '#a3e635' },
  { id: 'rejected',  label: 'Rejected',     color: '#f87171' },
];

function KanbanCard({ job, onDrop }) {
  const navigate = useNavigate();
  const updateJobStatus = useStore(s => s.updateJobStatus);

  return (
    <div
      className="card card-hover"
      draggable
      onDragStart={e => e.dataTransfer.setData('jobId', job.id)}
      style={{ cursor: 'grab', marginBottom: 'var(--space-3)' }}
    >
      <div className="card-body" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.8rem', color: 'white', flexShrink: 0,
          }}>
            {job.companyLogo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 1 }} className="truncate">{job.title}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{job.company}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{job.workType} · {job.salary}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{
              background: `${job.atsScore >= 80 ? '#22d3a5' : job.atsScore >= 65 ? '#6c63ff' : '#f59e0b'}15`,
              color: job.atsScore >= 80 ? '#22d3a5' : job.atsScore >= 65 ? '#6c63ff' : '#f59e0b',
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
            }}>
              {job.atsScore}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 5px' }}
              onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
            >
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, jobs }) {
  const updateJobStatus = useStore(s => s.updateJobStatus);

  const handleDrop = (e) => {
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) updateJobStatus(jobId, column.id);
  };

  return (
    <div
      style={{ minWidth: 220, flex: 1 }}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        background: `${column.color}12`,
        border: `1px solid ${column.color}30`,
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: column.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: column.color }}>{column.label}</span>
        <span style={{
          marginLeft: 'auto', background: `${column.color}25`, color: column.color,
          fontSize: '0.72rem', fontWeight: 700, padding: '1px 8px', borderRadius: '20px',
        }}>{jobs.length}</span>
      </div>

      {/* Cards */}
      <div style={{ minHeight: 120 }}>
        {jobs.map(job => <KanbanCard key={job.id} job={job} />)}
        {jobs.length === 0 && (
          <div style={{
            border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)', textAlign: 'center',
            color: 'var(--color-text-muted)', fontSize: '0.78rem',
          }}>
            Drop jobs here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tracker() {
  const jobs = useStore(s => s.jobs);

  const jobsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = jobs.filter(j => j.status === col.id);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Application Tracker</h2>
          <p className="section-subtitle">Drag & drop jobs between stages to update their status</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {COLUMNS.map(col => (
          <div key={col.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{col.label}</span>
            <span style={{ fontWeight: 700, color: col.color, fontSize: '0.85rem' }}>{jobsByStatus[col.id].length}</span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-4)' }}>
        {COLUMNS.map(col => (
          <KanbanColumn key={col.id} column={col} jobs={jobsByStatus[col.id]} />
        ))}
      </div>
    </div>
  );
}
