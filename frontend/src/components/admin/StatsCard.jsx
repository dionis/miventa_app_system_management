export default function StatsCard({ title, value, icon: Icon, trend, color }) {
    return (
        <div className="card flex items-start gap-4">
            <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}20`, color }}
            >
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
                {trend && (
                    <p className="text-xs mt-1" style={{ color: trend > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
                    </p>
                )}
            </div>
        </div>
    );
}
