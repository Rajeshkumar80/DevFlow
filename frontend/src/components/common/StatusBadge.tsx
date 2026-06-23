interface StatusBadgeProps {
  status: 'draft' | 'open' | 'approved' | 'changes_requested' | 'merged' | 'scheduled' | 'active' | 'paused' | 'ended';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const config: Record<string, { classes: string; label: string }> = {
    approved: { classes: 'badge-green', label: 'Approved' },
    active: { classes: 'badge-green', label: 'Active' },
    merged: { classes: 'badge-green', label: 'Merged' },
    open: { classes: 'badge-amber', label: 'Open' },
    scheduled: { classes: 'badge-amber', label: 'Scheduled' },
    changes_requested: { classes: 'badge-rose', label: 'Changes' },
    paused: { classes: 'badge-rose', label: 'Paused' },
    ended: { classes: 'badge-slate', label: 'Ended' },
    draft: { classes: 'badge-slate', label: 'Draft' },
  };

  const c = config[status] || { classes: 'badge-slate', label: status };
  const sizeClasses = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-0.5 text-xs', lg: 'px-3 py-1 text-sm' };

  return <span className={`${c.classes} ${sizeClasses[size]}`}>{c.label}</span>;
};