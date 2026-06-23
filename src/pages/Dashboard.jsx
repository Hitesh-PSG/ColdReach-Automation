import { useNavigate } from 'react-router-dom';
import { Briefcase, Target, Mail, TrendingUp, ArrowRight, Star, Clock, CheckCircle, AlertCircle, Zap, ChevronRight } from 'lucide-react';
import useStore from '../store';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

function ScoreGauge({ score }) {
  const color = score >= 80 ? 'var(--color-success)' : score >= 65 ? 'var(--color-brand-primary)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
  const data = [{ value: score, fill: color }];

  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius={35} outerRadius={48} data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.05)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2
      }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ATS</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const jobs = useStore(s => s.jobs);
  const profile = useStore(s => s.profile);

  const avgScore = Math.round(jobs.reduce((a, j) => a + j.atsScore, 0) / jobs.length);
  const applied = jobs.filter(j => ['applied', 'interview', 'offer'].includes(j.status)).length;
  const interviewing = jobs.filter(j => j.status === 'interview').length;
  const highFit = jobs.filter(j => j.atsScore >= 80).length;

  const statusColors = {
    new: 'var(--color-info)',
    reviewed: 'var(--color-brand-secondary)',
    applied: 'var(--color-warning)',
    interview: 'var(--color-success)',
    offer: '#a3e635',
    rejected: 'var(--color-danger)',
  };

  const statusLabels = {
    new: 'New',
    reviewed: 'Reviewed',
    applied: 'Applied',
    interview: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(56,189,248,0.08) 100%)',
        border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'var(--gradient-glow)', pointerEvents: 'none' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.5rem' }}>👋</span>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Good evening, {profile.name.split(' ')[0]}!
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: 480 }}>
            You have <strong style={{ color: 'var(--color-brand-primary)' }}>3 new job matches</strong> today and <strong style={{ color: 'var(--color-warning)' }}>2 outreach drafts</strong> waiting for review.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/jobs')} style={{ flexShrink: 0 }}>
          <Zap size={18} />
          View Jobs
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid-4 animate-fade-in-up delay-1" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.12)' }}>
              <Briefcase size={20} color="var(--color-brand-primary)" />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>+3 today</span>
          </div>
          <div className="stat-label">Total Jobs</div>
          <div className="stat-value">{jobs.length}</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: 'rgba(34,211,165,0.12)' }}>
              <Target size={20} color="var(--color-success)" />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>+2 this week</span>
          </div>
          <div className="stat-label">High Fit (80+)</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{highFit}</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: 'rgba(56,189,248,0.12)' }}>
              <Mail size={20} color="var(--color-info)" />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600 }}>{applied} applied</span>
          </div>
          <div className="stat-label">Interviewing</div>
          <div className="stat-value" style={{ color: 'var(--color-info)' }}>{interviewing}</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: 'rgba(167,139,250,0.12)' }}>
              <TrendingUp size={20} color="var(--color-brand-secondary)" />
            </div>
            <span style={{ fontSize: '0.75rem', color: avgScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
              {avgScore >= 70 ? 'Good' : 'Improvable'}
            </span>
          </div>
          <div className="stat-label">Avg ATS Score</div>
          <div className="stat-value" style={{ color: 'var(--color-brand-secondary)' }}>{avgScore}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Recent Jobs */}
        <div className="card animate-fade-in-up delay-2">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Job Matches</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Sorted by ATS fit score</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/jobs')}>
              View All <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {jobs.slice(0, 4).map((job, i) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-5) var(--space-6)',
                  borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Company Logo */}
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.1rem', color: 'white', flexShrink: 0,
                }}>
                  {job.companyLogo}
                </div>

                {/* Job Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }} className="truncate">{job.title}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{job.company} · {job.location}</div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <ScoreGauge score={job.atsScore} />
                </div>

                {/* Status + arrow */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span className="badge" style={{
                    background: `${statusColors[job.status]}18`,
                    color: statusColors[job.status],
                    border: `1px solid ${statusColors[job.status]}30`,
                  }}>
                    {statusLabels[job.status]}
                  </span>
                  <ChevronRight size={14} color="var(--color-text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Profile Completion */}
          <div className="card animate-fade-in-up delay-3">
            <div className="card-header">
              <div className="card-title">Profile Completion</div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{profile.completeness}%</span>
            </div>
            <div className="card-body">
              <div className="progress-track" style={{ height: 8, marginBottom: 'var(--space-4)' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${profile.completeness}%`,
                    background: 'var(--gradient-brand)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {[
                  { label: 'Resume uploaded', done: true },
                  { label: 'Skills added', done: true },
                  { label: 'Target roles set', done: true },
                  { label: 'LinkedIn URL', done: true },
                  { label: 'Portfolio URL', done: false },
                  { label: 'Salary range', done: true },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.82rem' }}>
                    {item.done
                      ? <CheckCircle size={14} color="var(--color-success)" />
                      : <AlertCircle size={14} color="var(--color-warning)" />
                    }
                    <span style={{ color: item.done ? 'var(--color-text-secondary)' : 'var(--color-warning)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost w-full" style={{ marginTop: 'var(--space-4)', fontSize: '0.82rem' }} onClick={() => navigate('/profile')}>
                Complete Profile
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card animate-fade-in-up delay-4">
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                { icon: Briefcase, label: 'Search new jobs', sub: 'Refresh job feed', color: 'var(--color-brand-primary)', onClick: () => navigate('/jobs') },
                { icon: Target, label: 'Score your resume', sub: 'ATS analysis', color: 'var(--color-success)', onClick: () => navigate('/jobs/1') },
                { icon: Mail, label: 'Draft cold email', sub: 'Outreach engine', color: 'var(--color-info)', onClick: () => navigate('/jobs/1') },
              ].map(action => (
                <button
                  key={action.label}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-3)', height: 'auto' }}
                  onClick={action.onClick}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <action.icon size={16} color={action.color} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{action.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{action.sub}</div>
                  </div>
                  <ChevronRight size={14} color="var(--color-text-muted)" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
