/**
 * Retrieve Paystack Secret Key from environment
 * @returns {string|null}
 */
function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || key.trim() === '' || key === 'MY_PAYSTACK_SECRET_KEY') {
    return null;
  }
  return key.trim();
}

/**
 * Initialize a transaction via Paystack Ghana
 * Supports Mobile Money (MTN, Telecel, AT) and Cards in GHS
 * 
 * @param {Object} params
 * @param {string} params.email - Customer email address
 * @param {number} params.amount_ghs - Amount in Ghana Cedis (GHS)
 * @param {string} [params.reference] - Unique transaction reference
 * @param {string} [params.callback_url] - Redirect URL after payment completion
 * @returns {Promise<{authorization_url: string, access_code: string, reference: string}>}
 */
export async function initializeTransaction({ email, amount_ghs, reference, callback_url }) {
  const secretKey = getPaystackSecretKey();
  
  if (!email) {
    throw new Error('Email address is required to initialize a transaction.');
  }
  if (!amount_ghs || isNaN(amount_ghs) || amount_ghs <= 0) {
    throw new Error('A valid positive amount in GHS is required.');
  }

  // Convert amount to pesewas (Paystack expects smallest currency unit, e.g. 100 pesewas = 1 GHS)
  const amountInPesewas = Math.round(Number(amount_ghs) * 100);

  // If Paystack Secret Key is configured, make real Paystack API request
  if (secretKey) {
    const payload = {
      email,
      amount: amountInPesewas,
      currency: 'GHS',
      channels: ['mobile_money', 'card'],
    };

    if (reference) payload.reference = reference;
    if (callback_url) payload.callback_url = callback_url;

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Paystack initialisation failed');
      }

      return {
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      };
    } catch (error) {
      console.error('Paystack Initialization Error:', error.message);
      throw error;
    }
  }

  // Fallback Sandbox Mode when PAYSTACK_SECRET_KEY is not set in environment
  const generatedRef = reference || `SCG-SANDBOX-${Date.now()}`;
  const sandboxCallback = callback_url || '/payments/verify';
  const targetUrl = `${sandboxCallback}?trxref=${generatedRef}&reference=${generatedRef}&status=success`;

  console.log('PAYSTACK_SECRET_KEY not found. Using Paystack Sandbox simulation mode.');

  return {
    authorization_url: targetUrl,
    access_code: `sandbox_access_${Date.now()}`,
    reference: generatedRef,
    is_sandbox: true
  };
}

/**
 * Verify a transaction using its reference
 * 
 * @param {string} reference - Unique Paystack transaction reference
 * @returns {Promise<Object>} - Decoded transaction data from Paystack
 */
export async function verifyTransaction(reference) {
  const secretKey = getPaystackSecretKey();

  if (!reference) {
    throw new Error('Transaction reference is required for verification.');
  }

  if (secretKey) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Paystack verification failed');
      }

      return result.data;
    } catch (error) {
      console.error('Paystack Verification Error:', error.message);
      throw error;
    }
  }

  // Fallback Sandbox Verification
  console.log('PAYSTACK_SECRET_KEY not set. Verifying sandbox transaction reference:', reference);
  return {
    status: 'success',
    reference,
    amount: 10000,
    currency: 'GHS',
    channel: 'mobile_money',
    gateway_response: 'Successful (Sandbox Demo)',
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    metadata: {
      mode: 'sandbox_simulation',
      provider: 'Paystack Ghana (MTN MoMo / Telecel / Card)'
    }
  };
}

