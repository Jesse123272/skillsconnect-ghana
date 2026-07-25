'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'scg_notification_prompt_dismissed';

export default function NotificationPermissionPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = window.setTimeout(() => {
      const hasNotifications = 'Notification' in window;
      setIsSupported(hasNotifications);
      if (!hasNotifications) return;

      const savedDismissed = window.localStorage.getItem(STORAGE_KEY) === 'true';
      setDismissed(savedDismissed);
      setPermission(Notification.permission);

      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'notifications' }).then((status) => {
          setPermission(status.state);
          status.onchange = () => setPermission(status.state);
        }).catch(() => {
          // Ignore permission query failures.
        });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (permission === 'granted' && !dismissed) {
      const timer = window.setTimeout(() => {
        setDismissed(true);
        window.localStorage.setItem(STORAGE_KEY, 'true');
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [permission, dismissed]);

  const handleEnableNotifications = async () => {
    if (!isSupported) return;
    setIsRequesting(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        window.localStorage.setItem(STORAGE_KEY, 'true');
        setDismissed(true);
      }
    } catch (err) {
      console.error('Notification permission request failed:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  if (!isSupported || dismissed || permission === 'granted') {
    return null;
  }

  const isBlocked = permission === 'denied';
  const statusMessage = isBlocked
    ? 'Browser notifications are blocked for this site. Allow them in your browser settings to receive live alerts from SkillsConnect Ghana.'
    : 'Enable browser notifications so you can receive enquiry replies, approval updates, and status alerts while using the site.';

  return (
    <div className={`alert ${isBlocked ? 'alert-warning' : 'alert-info'} rounded-3 shadow-sm mb-0`} role="alert">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <p className="mb-1 fw-semibold text-dark">{isBlocked ? 'Enable browser alerts' : 'Turn on browser notifications'}</p>
          <p className="mb-0 text-secondary small">{statusMessage}</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {!isBlocked && (
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-pill px-4 py-2"
              disabled={isRequesting}
              onClick={handleEnableNotifications}
            >
              {isRequesting ? 'Requesting…' : 'Enable notifications'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-4 py-2"
            onClick={handleDismiss}
          >
            {isBlocked ? 'Dismiss' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>
  );
}
