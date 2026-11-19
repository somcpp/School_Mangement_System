import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  RefreshCw,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useChildFees, useSelectedChild } from '../../../hooks';

interface ParentFeeLedgerViewProps {
  user: {
    name?: string;
  };
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo?: string;
}

interface Receipt {
  id: string;
  receiptNumber: string | null;
  amount: number;
  paymentMethod: string;
  transactionRef: string | null;
  paidAt: string;
}

interface InvoiceItem {
  name: string;
  amount: number;
}

interface ParentInvoice {
  id: string;
  invoiceNumber: string;
  feeType: string;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: string;
  items: InvoiceItem[];
  receipts: Receipt[];
}

interface FeeData {
  studentId: string;
  outstandingDues: number;
  invoices: ParentInvoice[];
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);

const dateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'bg-accent-green-subtle text-accent-green border border-emerald-500/20';
    case 'PARTIAL':
      return 'bg-accent-amber-subtle text-accent-amber border border-amber-500/20';
    case 'OVERDUE':
      return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    case 'CANCELLED':
      return 'bg-canvas text-muted border border-border';
    default:
      return 'bg-accent-blue-subtle text-accent-blue border border-sky-500/20';
  }
};

export const ParentFeeLedgerView: React.FC<ParentFeeLedgerViewProps> = ({ user }) => {
  const { childrenQuery, children: linkedChildren, selectedChildId, setSelectedChildId } = useSelectedChild();
  const children = linkedChildren as unknown as Child[];
  const detailQuery = useChildFees<FeeData>(selectedChildId);
  const feeData = detailQuery.data ?? null;
  const loadingChildren = childrenQuery.isLoading;
  const loadingFees = detailQuery.isLoading;
  const error = childrenQuery.error
    ? 'Unable to load linked children. Please try again.'
    : detailQuery.error
      ? 'Unable to load fee details. Please try again.'
      : '';
  const retry = () => {
    void childrenQuery.refetch();
    if (selectedChildId) void detailQuery.refetch();
  };

  const selectedChild = children.find((child) => child.id === selectedChildId);

  if (loadingChildren) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-secondary font-medium">
        <RefreshCw className="animate-spin text-accent-blue" size={20} />
        <span>Loading fee ledger...</span>
      </div>
    );
  }

  const invoices = feeData?.invoices ?? [];
  const totalBilled = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0,
  );
  const totalPaid = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.paidAmount || 0),
    0,
  );
  const outstanding =
    feeData?.outstandingDues ??
    invoices.reduce(
      (sum, invoice) => sum + Math.max(0, Number(invoice.balanceAmount || 0)),
      0,
    );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Fee Ledger</h1>
          <p className="mt-0.5 text-xs text-muted font-medium">
            Welcome{user.name ? `, ${user.name}` : ''}. View invoices, outstanding dues, and payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <div className="inline-flex rounded-2xl border border-border bg-surface p-1 shadow-sm">
              <select
                id="parent-fee-child"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id} className="bg-surface text-primary">
                    {child.firstName} {child.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-xs font-bold text-primary shadow-sm hover:bg-canvas transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => retry()}
            className="font-bold underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {children.length === 0 && !error && (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-card">
          <UserRound className="mx-auto mb-3 text-muted" size={40} />
          <h2 className="text-xl font-bold text-primary">No linked children found</h2>
          <p className="mt-2 text-sm text-secondary max-w-md mx-auto">
            Contact school administration to link your parent account to your child&apos;s student profile.
          </p>
        </div>
      )}

      {children.length > 0 && (
        <>
          {selectedChild && (
            <div className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 shadow-card">
              <div className="rounded-2xl bg-accent-blue-subtle p-3 text-accent-blue">
                <UserRound size={26} />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary">
                  {selectedChild.firstName} {selectedChild.lastName}
                </h2>
                {selectedChild.admissionNo && (
                  <p className="text-xs text-muted font-medium mt-0.5">
                    Admission No: {selectedChild.admissionNo}
                  </p>
                )}
              </div>
            </div>
          )}

          {loadingFees ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-border bg-surface text-secondary shadow-card font-medium">
              <RefreshCw className="animate-spin text-accent-blue" size={20} />
              <span>Loading fee statements...</span>
            </div>
          ) : feeData ? (
            <>
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-border bg-surface p-6 shadow-card flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Billed</span>
                    <div className="p-2 rounded-xl bg-accent-blue-subtle text-accent-blue">
                      <FileText size={18} />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-primary">
                    {currency(totalBilled)}
                  </p>
                  <p className="mt-1 text-xs text-secondary font-medium">Annual tuition &amp; term fees</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-border bg-surface p-6 shadow-card flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Amount Paid</span>
                    <div className="p-2 rounded-xl bg-accent-green-subtle text-accent-green">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-primary">
                    {currency(totalPaid)}
                  </p>
                  <p className="mt-1 text-xs text-secondary font-medium">Verified receipts collected</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-border bg-surface p-6 shadow-card flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Outstanding Dues</span>
                    <div className="p-2 rounded-xl bg-accent-amber-subtle text-accent-amber">
                      <Wallet size={18} />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-primary">
                    {currency(outstanding)}
                  </p>
                  <p className="mt-1 text-xs text-secondary font-medium">Pending balance to clear</p>
                </motion.div>
              </div>

              {/* Invoices List */}
              <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
                <div className="border-b border-border p-5">
                  <h2 className="text-base font-bold text-primary">Itemized Invoices</h2>
                  <p className="mt-0.5 text-xs text-muted font-medium">
                    Invoice balances and item breakdowns provided by Delhi Public Academy.
                  </p>
                </div>

                {invoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted font-medium">
                    No invoices found for this student. All dues are clear! 🎉
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="p-6 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold text-primary">{invoice.feeType}</h3>
                            <p className="mt-0.5 text-xs text-muted">Invoice No: {invoice.invoiceNumber}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(invoice.status)}`}>
                            {invoice.status.replaceAll('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 p-4 rounded-2xl bg-canvas border border-border">
                          <div>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Amount</p>
                            <p className="mt-1 text-sm font-bold text-primary">{currency(invoice.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Discount</p>
                            <p className="mt-1 text-sm font-bold text-primary">{currency(invoice.discountAmount)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Paid Amount</p>
                            <p className="mt-1 text-sm font-bold text-accent-green">{currency(invoice.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Remaining Balance</p>
                            <p className="mt-1 text-sm font-bold text-accent-amber">{currency(invoice.balanceAmount)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-secondary font-medium">
                          <CalendarDays size={15} className="text-muted" />
                          <span>Due date: {dateLabel(invoice.dueDate)}</span>
                        </div>

                        {invoice.items.length > 0 && (
                          <div className="rounded-2xl bg-canvas border border-border p-4">
                            <h4 className="mb-2.5 text-xs font-bold text-primary uppercase tracking-wider">
                              Fee Component Breakdown
                            </h4>
                            <div className="space-y-1.5">
                              {invoice.items.map((item, index) => (
                                <div
                                  key={`${invoice.id}-${item.name}-${index}`}
                                  className="flex justify-between text-xs font-medium"
                                >
                                  <span className="text-secondary">{item.name}</span>
                                  <span className="text-primary font-bold">{currency(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {invoice.receipts.length > 0 && (
                          <div className="pt-2">
                            <h4 className="mb-2.5 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                              <CreditCard size={15} className="text-accent-blue" />
                              Payment Receipts
                            </h4>
                            <div className="space-y-2">
                              {invoice.receipts.map((receipt) => (
                                <div
                                  key={receipt.id}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-canvas border border-border p-3.5"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-primary">
                                      {receipt.receiptNumber || 'Official Receipt'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted">
                                      {receipt.paymentMethod.replaceAll('_', ' ')} · {dateLabel(receipt.paidAt)}
                                    </p>
                                    {receipt.transactionRef && (
                                      <p className="text-[10px] text-secondary font-medium">
                                        Ref: {receipt.transactionRef}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-xs font-extrabold text-accent-green">
                                    {currency(receipt.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-4 text-xs text-secondary shadow-card">
                <Clock size={16} className="mt-0.5 shrink-0 text-accent-blue" />
                <p>
                  This ledger displays official institutional records. To make an online UPI installment or request a duplicate stamp receipt, visit Delhi Public Academy accounts counter.
                </p>
              </div>
            </>
          ) : (
            !error && (
              <p className="rounded-3xl border border-border bg-surface p-6 text-xs text-muted font-medium shadow-card text-center">
                Fee details are not available.
              </p>
            )
          )}
        </>
      )}
    </div>
  );
};

export default ParentFeeLedgerView;
