import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
}

export default function StatCard({ title, value, subtitle, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-muted-foreground text-xs font-medium">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}
