export const supportedLocales = ['en', 'tw'];

export const paymentGateway = 'paystack';

export const providerStatus = {
  paymentGateway: 'paystack',
  whatsapp: {
    name: 'WhatsApp Business',
    status: 'pending-provider-setup',
    note: 'Requires Meta account verification and approved business credentials before live automation.'
  },
  ussd: {
    name: 'USSD gateway',
    status: 'pending-provider-setup',
    note: 'Requires telecom approval and a registered shortcode.'
  },
  escrow: {
    name: 'Marketplace escrow',
    status: 'milestone-ready',
    note: 'The app holds the schema and flow boundary ready; full release requires Paystack subaccount and legal approval.'
  }
};

export const providerDetails = {
  paymentGateway: {
    name: 'Paystack',
    status: 'ready',
    note: 'Server-side validation and webhook signing are implemented.'
  },
  whatsapp: providerStatus.whatsapp,
  ussd: providerStatus.ussd,
  escrow: providerStatus.escrow
};

export function getProviderStatus(providerName) {
  const key = providerName?.toLowerCase();
  if (!key) return { status: 'unknown', note: 'No provider selected.' };
  return providerStatus[key] || { status: 'not-configured', note: 'Provider not yet configured.' };
}
