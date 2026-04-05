import type { OrderStatus, PaymentStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/30' },
  preparing: { label: 'Preparing', className: 'bg-info/15 text-info border-info/30' },
  ready: { label: 'Ready', className: 'bg-success/15 text-success border-success/30' },
  served: { label: 'Served', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const paymentConfig: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-success/15 text-success border-success/30' },
  unpaid: { label: 'Unpaid', className: 'bg-warning/15 text-warning border-warning/30' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config = paymentConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
