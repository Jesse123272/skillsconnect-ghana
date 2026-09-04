import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function isValidSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const received = Buffer.from(String(signature), 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
}

export async function POST(req) {
  const rawBody = await req.text();
  if (!isValidSignature(rawBody, req.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ success: false, error: 'Invalid Paystack signature.' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event.event !== 'charge.success' && event.event !== 'charge.failed') {
      return NextResponse.json({ success: true, ignored: true });
    }

    const data = event.data || {};
    const reference = String(data.reference || '').trim();
    if (!reference) return NextResponse.json({ success: false, error: 'Webhook reference is missing.' }, { status: 400 });

    const transactions = await query(
      'SELECT transaction_id, amount, status, metadata FROM transactions WHERE reference = ? LIMIT 1',
      [reference]
    );
    const transaction = transactions?.[0];
    if (!transaction) return NextResponse.json({ success: true, ignored: true });
    if (transaction.status !== 'pending') return NextResponse.json({ success: true, already_processed: true });

    const finalStatus = event.event === 'charge.success' && data.status === 'success' ? 'success' : 'failed';
    let originalMetadata = {};
    try {
      originalMetadata = transaction.metadata
        ? (typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : transaction.metadata)
        : {};
    } catch {
      originalMetadata = {};
    }

    await query(
      `UPDATE transactions
       SET status = ?, channel = ?, verified_at = CURRENT_TIMESTAMP, metadata = ?
       WHERE reference = ? AND status = 'pending'`,
      [finalStatus, data.channel || null, JSON.stringify({
        ...originalMetadata,
        paystack: data.metadata || null,
        paystack_reference: reference,
        gateway_response: data.gateway_response || null,
        paid_at: data.paid_at || null,
        webhook_event: event.event
      }), reference]
    );

    return NextResponse.json({ success: true, status: finalStatus });
  } catch (error) {
    console.error('Paystack webhook error:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Invalid Paystack webhook payload.' }, { status: 400 });
  }
}
