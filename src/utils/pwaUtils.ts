
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const isMobile = (): boolean => {
  return isIOS() || isAndroid() || window.innerWidth <= 768;
};

export const canInstallPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const getCameraConstraints = () => {
  if (isIOS()) {
    return {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 },
        frameRate: { ideal: 30, min: 15 },
        torch: false,
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous'
      },
      audio: false
    };
  } else if (isAndroid()) {
    return {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30 }
      },
      audio: false
    };
  } else {
    return {
      video: {
        facingMode: { ideal: 'environment' },
        width: { min: 640 },
        height: { min: 480 }
      },
      audio: false
    };
  }
};
