import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, DollarSign, Briefcase, ChevronRight, RefreshCw, Zap } from 'lucide-react';
import useStore from '../store';

const STATUS_OPTIONS = ['all', 'new', 'reviewed', 'applied', 'interview', 'offer', 'rejected'];
const WORKTYPE_OPTIONS = ['all', 'Remote', 'Hybrid', 'Onsite'];
const SOURCE_OPTIONS = ['all', 'LinkedIn', 'Indeed', 'Dice', 'ZipRecruiter'];

const statusColors = {
  new: '#38bdf8', reviewed: '#a78bfa', applied: '#f59e0b',
  interview: '#22d3a5', offer: '#a3e635', rejected: '#f87171',
};

function ScorePill({ score }) {
  const color = score >= 80 ? '#22d3a5' : score >= 65 ? '#6c63ff' : score >= 50 ? '#f59e0b' : '#f87171';
  const label = score >= 80 ? 'Great' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Low';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: `${color}15`, border: `1px solid ${color}30`,
      borderRadius: '20px', padding: '4px 12px',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontWeight: 700, color, fontSize: '0.8rem' }}>{score}</span>
      <span style={{ color, fontSize: '0.72rem', fontWeight: 600, opacity: 0.8 }}>{label}</span>
    </div>
  );
}

function JobCard({ job }) {
  const navigate = useNavigate();
  const updateJobStatus = useStore(s => s.updateJobStatus);

  return (
    <div
      className="card card-hover"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <div className="card-body">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 46, height: 46, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.2rem', color: 'white',
            }}>
              {job.companyLogo}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>{job.title}</h3>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{job.company}</div>
            </div>
          </div>
          <ScorePill score={job.atsScore} />
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <MapPin size={13} /> {job.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <DollarSign size={13} /> {job.salary}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <Clock size={13} /> {job.postedDate}
          </div>
        </div>

        {/* Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-4)' }}>
          {job.requiredSkills.slice(0, 5).map(s => (
            <span key={s} className="skill-chip" style={{ fontSize: '0.72rem', padding: '2px 9px' }}>{s}</span>
          ))}
          {job.requiredSkills.length > 5 && (
            <span className="badge badge-neutral">+{job.requiredSkills.length - 5} more</span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{job.source}</span>
            <span className="badge" style={{
              fontSize: '0.7rem',
              background: `${statusColors[job.status]}15`,
              color: statusColors[job.status],
              border: `1px solid ${statusColors[job.status]}30`,
            }}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-brand-primary)', fontWeight: 600 }}>
            View Details <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Jobs() {
  const jobs = useStore(s => s.jobs);
  const jobFilter = useStore(s => s.jobFilter);
  const setJobFilter = useStore(s => s.setJobFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredJobs = jobs.filter(j => {
    if (jobFilter.search && !j.title.toLowerCase().includes(jobFilter.search.toLowerCase()) && !j.company.toLowerCase().includes(jobFilter.search.toLowerCase())) return false;
    if (jobFilter.workType !== 'all' && j.workType !== jobFilter.workType) return false;
    if (jobFilter.status !== 'all' && j.status !== jobFilter.status) return false;
    if (jobFilter.source !== 'all' && j.source !== jobFilter.source) return false;
    if (j.atsScore < jobFilter.minScore) return false;
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1800);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Job Feed</h2>
          <p className="section-subtitle">{filteredJobs.length} jobs matched your profile · Last updated 2 minutes ago</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={15} /> Filters
          </button>
          <button className={`btn btn-secondary`} onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-5)',
        marginBottom: 'var(--space-5)',
        transition: 'all var(--transition-fast)',
      }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-active)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
      >
        <Search size={18} color="var(--color-text-muted)" />
        <input
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}
          placeholder="Search job titles, companies, skills…"
          value={jobFilter.search}
          onChange={e => setJobFilter({ search: e.target.value })}
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label">Work Type</label>
              <select className="form-select" value={jobFilter.workType} onChange={e => setJobFilter({ workType: e.target.value })}>
                {WORKTYPE_OPTIONS.map(o => <option key={o} value={o}>{o === 'all' ? 'All Types' : o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={jobFilter.status} onChange={e => setJobFilter({ status: e.target.value })}>
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o === 'all' ? 'All Status' : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={jobFilter.source} onChange={e => setJobFilter({ source: e.target.value })}>
                {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o === 'all' ? 'All Sources' : o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Min ATS Score: {jobFilter.minScore}</label>
              <input
                type="range" min={0} max={90} step={5}
                value={jobFilter.minScore}
                onChange={e => setJobFilter({ minScore: +e.target.value })}
                style={{ width: '100%', accentColor: 'var(--color-brand-primary)' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setJobFilter({ search: '', workType: 'all', status: 'all', source: 'all', minScore: 0 })}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Job Grid */}
      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Briefcase size={28} /></div>
          <div className="empty-state-title">No jobs match your filters</div>
          <div className="empty-state-desc">Try adjusting your search or filters to see more results.</div>
          <button className="btn btn-secondary" onClick={() => setJobFilter({ search: '', workType: 'all', status: 'all', source: 'all', minScore: 0 })}>Reset Filters</button>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 'var(--space-5)' }}>
          {filteredJobs.map((job, i) => (
            <div key={job.id} className={`animate-fade-in-up delay-${Math.min(i + 1, 5)}`}>
              <JobCard job={job} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
