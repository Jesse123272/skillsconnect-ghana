export function resolveUploadMode({
  isVercel,
  hasStorageUrl,
  hasBlobToken,
  isStorageProxyRequest,
  nodeEnv,
}) {
  const isProdVercel = String(isVercel || '') === '1' || String(nodeEnv || '').toLowerCase() === 'production';

  if (isStorageProxyRequest) {
    return { mode: 'proxy', status: 200, message: 'Proxy upload accepted.' };
  }

  if (isProdVercel && hasBlobToken) {
    return { mode: 'blob', status: 200, message: 'Use Vercel Blob upload storage.' };
  }

  if (isProdVercel && !hasStorageUrl) {
    return {
      mode: 'reject',
      status: 503,
      message: 'Upload storage is not configured for this deployment. Set UPLOAD_STORAGE_URL and UPLOAD_PROXY_SECRET in production.',
    };
  }

  if (isProdVercel && hasStorageUrl) {
    return { mode: 'forward', status: 200, message: 'Forward to persistent upload backend.' };
  }

  return { mode: 'local', status: 200, message: 'Use local filesystem upload storage.' };
}
