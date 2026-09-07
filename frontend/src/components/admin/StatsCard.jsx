import PropTypes from 'prop-types';

// eslint-disable-next-line no-unused-vars
export default function StatsCard({ title, value, icon: Icon, color, trend }) {
  return (
    <div
      className="card shadow-xl transition-shadow duration-300 hover:shadow-2xl"
      style={{ padding: '1.25rem' }}
      role="group"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm md:text-base font-bold mb-1 truncate" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
          <h3 className="text-2xl md:text-3xl font-black truncate" style={{ color: 'var(--color-text-primary)' }}>{value}</h3>
          {trend != null && (
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center text-xs font-black px-2.5 py-1 rounded-full" style={{
                background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: trend > 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs font-bold hidden sm:inline" style={{ color: 'var(--color-text-muted)' }}>vs last month</span>
            </div>
          )}
        </div>
        <div
          className="p-3 md:p-4 rounded-2xl shadow-lg shrink-0"
          style={{ background: `${color}15`, color: color }}
          aria-hidden="true"
        >
          <Icon size={26} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
  trend: PropTypes.number,
};
