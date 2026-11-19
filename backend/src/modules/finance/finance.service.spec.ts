import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

const { ordersFetch, ordersCreate, verifySignature } = vi.hoisted(() => ({
  ordersFetch: vi.fn(),
  ordersCreate: vi.fn(),
  verifySignature: vi.fn(),
}));

vi.mock('../../config/razorpay.js', () => ({
  razorpayInstance: { orders: { fetch: ordersFetch, create: ordersCreate } },
  verifyRazorpaySignature: verifySignature,
}));

vi.mock('../../config/env.js', () => ({ env: { RAZORPAY_KEY_ID: 'rzp_test_key' } }));

vi.mock('../../db/prisma.js', () => ({
  prisma: {
    student: { findFirst: vi.fn(), findMany: vi.fn() },
    feeInvoice: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    feePayment: { findFirst: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../../db/prisma.js';
import { FinanceService } from './finance.service.js';

const db = vi.mocked(prisma);
const student = { userId: 'student-user', role: UserRole.STUDENT };
const admin = { userId: 'admin-user', role: UserRole.SCHOOL_ADMIN };
const verifyInput = {
  feeInvoiceId: 'inv-1',
  amount: 10000, // what the client claims
  razorpayOrderId: 'order_1',
  razorpayPaymentId: 'pay_1',
  razorpaySignature: 'sig',
};

describe('FinanceService.listInvoices scoping', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.feeInvoice.count.mockResolvedValue(0 as never);
    db.feeInvoice.findMany.mockResolvedValue([] as never);
  });

  it("restricts a student to their own invoices", async () => {
    db.student.findMany.mockResolvedValue([{ id: 'stu-1' }] as never);
    await FinanceService.listInvoices('school-1', { skip: 0, take: 20 } as never, {}, student);
    expect(db.feeInvoice.findMany.mock.calls[0][0]!.where).toMatchObject({
      schoolId: 'school-1',
      studentId: { in: ['stu-1'] },
    });
  });

  it("returns nothing when a student asks for someone else's invoices", async () => {
    db.student.findMany.mockResolvedValue([{ id: 'stu-1' }] as never);
    const res = await FinanceService.listInvoices('school-1', { skip: 0, take: 20 } as never, { studentId: 'stu-2' }, student);
    expect(res).toEqual({ total: 0, invoices: [] });
    expect(db.feeInvoice.findMany).not.toHaveBeenCalled();
  });

  it('lets admins filter by any student', async () => {
    await FinanceService.listInvoices('school-1', { skip: 0, take: 20 } as never, { studentId: 'stu-2' }, admin);
    expect(db.feeInvoice.findMany.mock.calls[0][0]!.where).toMatchObject({ studentId: 'stu-2' });
  });
});

describe('FinanceService.verifyAndCollectOnlinePayment', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    verifySignature.mockReturnValue(true);
  });

  it('rejects an invalid signature before touching anything', async () => {
    verifySignature.mockReturnValue(false);
    await expect(
      FinanceService.verifyAndCollectOnlinePayment('school-1', verifyInput, 'u', admin)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(ordersFetch).not.toHaveBeenCalled();
  });

  it('rejects a payment whose order belongs to a different invoice', async () => {
    ordersFetch.mockResolvedValue({ amount: 100, notes: { invoiceId: 'other-invoice', schoolId: 'school-1' } });
    await expect(
      FinanceService.verifyAndCollectOnlinePayment('school-1', verifyInput, 'u', admin)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects a replayed payment id', async () => {
    ordersFetch.mockResolvedValue({ amount: 1000000, notes: { invoiceId: 'inv-1', schoolId: 'school-1' } });
    db.feeInvoice.findFirst.mockResolvedValue({ studentId: 'stu-1' } as never);
    db.feePayment.findFirst.mockResolvedValue({ id: 'existing' } as never);
    await expect(
      FinanceService.verifyAndCollectOnlinePayment('school-1', verifyInput, 'u', admin)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("credits the order's amount, not the amount the client sent", async () => {
    // Paid ₹1 (100 paise) but claims ₹10,000
    ordersFetch.mockResolvedValue({ amount: 100, notes: { invoiceId: 'inv-1', schoolId: 'school-1' } });
    db.feeInvoice.findFirst.mockResolvedValue({ studentId: 'stu-1' } as never);
    db.feePayment.findFirst.mockResolvedValue(null);
    const collect = vi.spyOn(FinanceService, 'collectPayment').mockResolvedValue({} as never);

    await FinanceService.verifyAndCollectOnlinePayment('school-1', verifyInput, 'u', admin);

    expect(collect).toHaveBeenCalledWith(
      'school-1',
      expect.objectContaining({ feeInvoiceId: 'inv-1', amount: 1, transactionRef: 'pay_1' }),
      'u'
    );
    collect.mockRestore();
  });

  it("stops a student from settling another student's invoice", async () => {
    ordersFetch.mockResolvedValue({ amount: 100, notes: { invoiceId: 'inv-1', schoolId: 'school-1' } });
    db.feeInvoice.findFirst.mockResolvedValue({ studentId: 'someone-else' } as never);
    db.student.findFirst.mockResolvedValue({ userId: 'another-user', parent: null } as never);
    await expect(
      FinanceService.verifyAndCollectOnlinePayment('school-1', verifyInput, 'u', student)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
