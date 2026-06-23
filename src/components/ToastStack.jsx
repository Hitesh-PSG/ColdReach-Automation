import { CheckCircle, Info, AlertCircle, X } from 'lucide-react';
import useStore from '../store';

const icons = { success: CheckCircle, info: Info, error: AlertCircle };
const colors = { success: 'var(--color-success)', info: 'var(--color-brand-primary)', error: 'var(--color-danger)' };

export default function ToastStack({ toasts }) {
  const addToast = useStore(s => s.addToast);

  if (!toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map(t => {
        const Icon = icons[t.type] || Info;
        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon size={18} color={colors[t.type]} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', flex: 1 }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}
