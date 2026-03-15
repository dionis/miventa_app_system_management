export default function StatsCard({ title, value, icon: Icon, color, trend }) {
    return (
        <div className="card shadow-xl hover:-translate-y-2 transition-all duration-300 group" style={{ padding: '2rem' }}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-lg font-bold mb-2 transition-colors group-hover:text-primary" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
                    <h3 className="text-4xl font-black" style={{ color: 'var(--color-text-primary)' }}>{value}</h3>

                    {trend && (
                        <div className="flex items-center gap-2 mt-4">
                            <span className="flex items-center text-sm font-black px-3 py-1 rounded-full" style={{
                                background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: trend > 0 ? 'var(--color-success)' : 'var(--color-error)'
                            }}>
                                {trend > 0 ? '+' : ''}{trend}%
                            </span>
                            <span className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>vs last month</span>
                        </div>
                    )}
                </div>
                <div
                    className="p-4 rounded-[1.25rem] shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `${color}15`, color: color }}
                >
                    <Icon size={32} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
}
