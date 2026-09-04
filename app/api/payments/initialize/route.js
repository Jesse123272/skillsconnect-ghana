import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';

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
    const { amount, enquiry_id, artisan_id, note } = body;
    const amountGhs = parseFloat(amount);
    const enquiryId = parseInt(enquiry_id, 10);
    const artisanId = parseInt(artisan_id, 10);

    // Validate positive payment amount
    if (isNaN(amountGhs) || amountGhs <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid positive payment amount is required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(enquiryId) || !Number.isInteger(artisanId) || enquiryId <= 0 || artisanId <= 0) {
      return NextResponse.json({ success: false, error: 'A valid enquiry and artisan are required for payment.' }, { status: 400 });
    }

    const enquiries = await query(
      'SELECT enquiry_id, customer_id, artisan_id, status FROM enquiries WHERE enquiry_id = ? LIMIT 1',
      [enquiryId]
    );
    const enquiry = enquiries?.[0];
    if (!enquiry || enquiry.customer_id !== payload.user_id || enquiry.artisan_id !== artisanId) {
      return NextResponse.json({ success: false, error: 'You can only pay for your own enquiry and its assigned artisan.' }, { status: 403 });
    }

    // 1. Generate unique platform-compliant transaction reference
    const reference = `SCG-${payload.user_id}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Set callback verification URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'http://localhost:3000';
    const cleanBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const callbackUrl = `${cleanBaseUrl}/payments/verify`;

    // 3. Request Paystack API initialization
    let paystackResponse;
    try {
      paystackResponse = await initializeTransaction({
        email: payload.email,
        amount_ghs: amountGhs,
        reference,
        callback_url: callbackUrl
      });
    } catch (paystackError) {
      console.error('Paystack initialization integration error:', paystackError.message);
      return NextResponse.json(
        { success: false, error: `Paystack initialization failed: ${paystackError.message}` },
        { status: 502 }
      );
      if (!paystackResponse?.reference || paystackResponse.reference !== reference) {
        throw new Error('Paystack returned an unexpected transaction reference.');
      }
    }

    const metadataObj = {
      enquiry_id: enquiryId,
      artisan_id: artisanId,
      note: note || 'Trade Service Payment',
      customer_email: payload.email,
      customer_name: payload.full_name
    };

    // 4. Save pending payment transaction row inside database table
    await query(
      `INSERT INTO transactions (user_id, reference, amount, currency, status, metadata) 
       VALUES (?, ?, ?, 'GHS', 'pending', ?)`,
      [payload.user_id, reference, amountGhs, JSON.stringify(metadataObj)]
    );

    // 5. Log the initial payment intent
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'INITIALIZE_PAYMENT', 'transactions', null, ip]
    );

    // 6. Return standard Paystack response payload
    return NextResponse.json({
      success: true,
      data: {
        authorization_url: paystackResponse.authorization_url,
        reference
      }
    });

  } catch (error) {
    console.error('Initialize Payment API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while initializing payment' },
      { status: 500 }
    );
  }
}
