'use client';

import { useEffect, useState } from 'react';

const isIOS = (userAgent) => /iphone|ipad|ipod/i.test(userAgent) && !/crios|fxios/i.test(userAgent);
const isAndroid = (userAgent) => /android/i.test(userAgent);

export default function InstallAppPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [deviceHint, setDeviceHint] = useState('');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const ios = isIOS(userAgent);
    const android = isAndroid(userAgent);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (ios) {
      setDeviceHint('Tap the browser Share icon, then select Add to Home Screen to install SkillsConnect.');
      setShowBanner(true);
    } else if (android) {
      setDeviceHint('Use the browser menu and choose Add to Home screen to install SkillsConnect.');
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (installed || !showBanner) {
    return null;
  }

  const handleInstallTap = async () => {
    if (!promptEvent) {
      return;
    }

    promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setInstalled(true);
      setShowBanner(false);
    }
  };

  const buttonLabel = promptEvent ? 'Install App' : 'Add to Home Screen';

  return (
    <div className="position-fixed bottom-0 start-0 end-0 bg-white border-top shadow-lg p-3" style={{ zIndex: 1100 }}>
      <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-start gap-3">
          <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
            <i className="fa-solid fa-download"></i>
          </div>
          <div>
            <h6 className="mb-1 fw-bold">Install SkillsConnect</h6>
            <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
              {promptEvent ? 'Install the PWA for faster access and a better mobile experience.' : deviceHint}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {promptEvent ? (
            <button type="button" className="btn btn-primary btn-sm px-4" onClick={handleInstallTap}>
              {buttonLabel}
            </button>
          ) : (
            <button type="button" className="btn btn-outline-primary btn-sm px-4" onClick={() => setShowBanner(true)}>
              {buttonLabel}
            </button>
          )}
          <button type="button" className="btn btn-link btn-sm text-muted" onClick={() => setShowBanner(false)}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
