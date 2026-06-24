import React from 'react';
import { ExternalLink, Calendar, BookOpen, Star, Compass, AlertTriangle } from 'lucide-react';

export default function SkillRoadmap({ roadmap }) {
  if (!roadmap) return null;

  const { overallReadiness, strongSkills = [], skillGaps = [], suggestedOrder = [], summary } = roadmap;

  // Map overall readiness to color theme
  const readinessColors = {
    'Ready': {
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      border: '1px solid rgba(34, 211, 165, 0.2)'
    },
    'Almost Ready': {
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      border: '1px solid rgba(245, 158, 11, 0.2)'
    },
    'Needs Development': {
      bg: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      border: '1px solid rgba(248, 113, 113, 0.2)'
    }
  };

  const readinessStyle = readinessColors[overallReadiness] || {
    bg: 'var(--color-info-bg)',
    color: 'var(--color-info)',
    border: '1px solid rgba(56, 189, 248, 0.2)'
  };

  // Map priority to badge color class
  const getPriorityBadgeClass = (priority) => {
    const p = String(priority).toLowerCase();
    if (p === 'high') return 'badge badge-danger';
    if (p === 'medium') return 'badge badge-warning';
    return 'badge badge-info';
  };

  // Sort skillGaps based on suggestedOrder
  const sortedGaps = [...skillGaps].sort((a, b) => {
    const indexA = suggestedOrder.indexOf(a.skill);
    const indexB = suggestedOrder.indexOf(b.skill);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const isUrl = (str) => /^https?:\/\//i.test(str);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Overview Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.06) 0%, rgba(16,22,42,0.8) 100%)',
        border: '1px solid var(--color-border)'
      }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={20} color="var(--color-brand-primary)" />
              Learning Roadmap & Skill Gap Analysis
            </h3>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: readinessStyle.bg,
              color: readinessStyle.color,
              border: readinessStyle.border
            }}>
              Readiness: {overallReadiness}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {summary}
          </p>
        </div>
      </div>

      {/* Strong Skills Section */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <h4 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
            <Star size={16} color="var(--color-success)" />
            Strong Skills & Matching Qualifications
          </h4>
        </div>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 'var(--space-4)' }}>
          {strongSkills.length > 0 ? (
            strongSkills.map(skill => (
              <span key={skill} className="skill-chip skill-chip-matched">
                {skill}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No strong skills identified for this role yet.</span>
          )}
        </div>
      </div>

      {/* Skill Gaps Timeline */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <h4 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
            <AlertTriangle size={16} color="var(--color-brand-primary)" />
            Prioritized Learning Roadmap (Skill Gaps)
          </h4>
        </div>
        <div className="card-body" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
          {sortedGaps.length > 0 ? (
            <div style={{
              position: 'relative',
              paddingLeft: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-6)'
            }}>
              {/* Vertical line helper */}
              <div style={{
                position: 'absolute',
                left: 7,
                top: 8,
                bottom: 8,
                width: 2,
                background: 'linear-gradient(to bottom, var(--color-brand-primary), var(--color-border))'
              }} />

              {sortedGaps.map((gap, index) => (
                <div key={gap.skill} style={{ position: 'relative' }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-23px',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-brand-primary)',
                    border: '3px solid var(--color-bg-card)',
                    boxShadow: '0 0 0 2px rgba(108, 99, 255, 0.25)',
                    zIndex: 2
                  }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: 'var(--color-text-primary)'
                        }}>
                          {index + 1}. {gap.skill}
                        </span>
                        <span className={getPriorityBadgeClass(gap.priority)}>
                          {gap.priority} Priority
                        </span>
                      </div>
                      
                      {gap.estimatedWeeks && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.8rem',
                          color: 'var(--color-text-muted)',
                          fontWeight: 500
                        }}>
                          <Calendar size={13} />
                          Est. {gap.estimatedWeeks} {gap.estimatedWeeks === 1 ? 'week' : 'weeks'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.825rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                      <span><strong>Current Level:</strong> {gap.currentLevel || 'None'}</span>
                      <span>•</span>
                      <span><strong>Target Level:</strong> {gap.targetLevel || 'Required'}</span>
                    </div>

                    {/* Resources */}
                    {gap.learningResources && gap.learningResources.length > 0 && (
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <div style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <BookOpen size={12} /> Recommended Resources
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                          {gap.learningResources.map((resource, i) => {
                            const destinationUrl = isUrl(resource)
                              ? resource
                              : `https://www.google.com/search?q=${encodeURIComponent(resource)}`;

                            return (
                              <a
                                key={i}
                                href={destinationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                {resource}
                                <ExternalLink size={11} />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
              No skill gaps identified. You match all required skills for this job!
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
