import assert from 'node:assert/strict';
import { resolveUploadMode } from '../lib/upload-config.js';

const rejectMode = resolveUploadMode({
  isVercel: '1',
  hasStorageUrl: false,
  isStorageProxyRequest: false,
  nodeEnv: 'production',
});

assert.equal(rejectMode.mode, 'reject');
assert.equal(rejectMode.status, 503);
assert.match(rejectMode.message, /UPLOAD_STORAGE_URL/i);

const forwardMode = resolveUploadMode({
  isVercel: '1',
  hasStorageUrl: true,
  isStorageProxyRequest: false,
  nodeEnv: 'production',
});
assert.equal(forwardMode.mode, 'forward');

const blobMode = resolveUploadMode({
  isVercel: '1',
  hasStorageUrl: false,
  hasBlobToken: true,
  isStorageProxyRequest: false,
  nodeEnv: 'production',
});
assert.equal(blobMode.mode, 'blob');

const localMode = resolveUploadMode({
  isVercel: undefined,
  hasStorageUrl: false,
  isStorageProxyRequest: false,
  nodeEnv: 'development',
});
assert.equal(localMode.mode, 'local');

console.log('Upload config checks passed.');
