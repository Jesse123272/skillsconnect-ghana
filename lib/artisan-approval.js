export async function getArtisanApprovalMode(queryFn = async () => []) {
  try {
    const rows = await queryFn(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'artisan_approval_mode' LIMIT 1"
    );
    const mode = rows?.[0]?.setting_value;
    return mode === 'manual' ? 'manual' : 'auto';
  } catch (error) {
    console.warn('Artisan approval mode lookup failed; using automatic approval:', error?.message || error);
    return 'auto';
  }
}

export async function getInitialArtisanApprovalState(queryFn = async () => []) {
  const mode = await getArtisanApprovalMode(queryFn);
  return mode === 'manual' ? 0 : 1;
}
