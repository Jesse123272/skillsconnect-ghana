import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';

export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { reference } = body;

    if (!reference || reference.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Transaction reference is required for verification' },
        { status: 400 }
      );
    }

    // 1. Fetch matching transaction record to verify user access
    const transactions = await query(
      'SELECT transaction_id, user_id, amount, status, metadata FROM transactions WHERE reference = ?',
      [reference.trim()]
    );

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transaction record not found in system logs' },
        { status: 404 }
      );
    }

    const transaction = transactions[0];

    // Enforce safety: only the user who initiated the payment (or admin) can verify it
    if (transaction.user_id !== payload.user_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not own this transaction.' },
        { status: 403 }
      );
    }

    // 2. Optimization: If already successfully processed or failed, return cached value instantly
    if (transaction.status !== 'pending') {
      return NextResponse.json({
        success: true,
        data: {
          status: transaction.status,
          amount: transaction.amount
        }
      });
    }

    // 3. Query Paystack remote API for live status verification
    let verificationData;
    try {
      verificationData = await verifyTransaction(reference.trim());
    } catch (paystackError) {
      console.error('Paystack verification remote error:', paystackError.message);
      return NextResponse.json(
        { success: false, error: `Paystack verification request failed: ${paystackError.message}` },
        { status: 502 }
      );
    }

    // 4. Extract payment outcomes
    const paystackStatus = verificationData.status; // e.g., 'success', 'failed'
    const channel = verificationData.channel; // e.g., 'mobile_money', 'card'
    let originalMetadata = {};
    try {
      originalMetadata = transaction.metadata
        ? (typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : transaction.metadata)
        : {};
    } catch {
      originalMetadata = {};
    }
    const verifiedMetadata = {
      ...originalMetadata,
      paystack: verificationData.metadata || null,
      paystack_reference: verificationData.reference || reference.trim(),
      gateway_response: verificationData.gateway_response || null,
      paid_at: verificationData.paid_at || null
    };

    let finalStatus = 'failed';
    if (paystackStatus === 'success') {
      finalStatus = 'success';
    }

    // 5. UPDATE transaction row with final outcomes
    await query(
      `UPDATE transactions 
       SET status = ?, channel = ?, verified_at = NOW(), metadata = ? 
       WHERE reference = ?`,
      [finalStatus, channel, JSON.stringify(verifiedMetadata), reference.trim()]
    );

    // 6. Send immediate visual notification alert
    let parsedMeta = {};
    try {
      if (transaction.metadata) {
        parsedMeta = typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : transaction.metadata;
      }
    } catch (e) {
      console.error('Error parsing transaction metadata:', e);
    }

    if (finalStatus === 'success') {
      const title = 'Payment Successful! 🇬🇭🎉';
      const msg = `Medaase! Your payment of GHS ${transaction.amount} was received and verified successfully. Reference: ${reference}`;
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'payment_success', ?, ?, '/dashboard/customer/payments')`,
        [transaction.user_id, title, msg]
      );

      // Notify artisan if payment was made for a specific artisan
      if (parsedMeta && parsedMeta.artisan_id) {
        const artisanTitle = 'Payment Received! 💰';
        const artisanMsg = `Great news! You received a payment of GHS ${transaction.amount} from a customer. Reference: ${reference}`;
        await query(
          `INSERT INTO notifications (user_id, type, title, message, link) 
           VALUES (?, 'payment_received', ?, ?, '/dashboard/artisan/transactions')`,
          [parsedMeta.artisan_id, artisanTitle, artisanMsg]
        );
      }
    } else {
      const title = 'Payment Failed ❌';
      const msg = `Your payment attempt of GHS ${transaction.amount} failed or was cancelled. Reference: ${reference}`;
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'payment_failed', ?, ?, '/dashboard/customer/payments')`,
        [transaction.user_id, title, msg]
      );
    }

    // 7. Log important action to activity_logs table
    const actionName = finalStatus === 'success' ? 'VERIFY_PAYMENT_SUCCESS' : 'VERIFY_PAYMENT_FAILED';
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [transaction.user_id, actionName, 'transactions', transaction.transaction_id, ip]
    );

    return NextResponse.json({
      success: true,
      data: {
        status: finalStatus,
        amount: transaction.amount,
        channel,
        verified_at: new Date()
      }
    });

  } catch (error) {
    console.error('Verify Payment API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred during verification' },
      { status: 500 }
    );
  }
}
