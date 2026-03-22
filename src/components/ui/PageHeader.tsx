import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, onBack, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="btn btn-ghost p-2 rounded-xl"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
