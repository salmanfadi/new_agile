
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not supported');
      return false;
    }

    // For iOS, we need to request permission in a user gesture context
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment'
      }
    });

    // Stop the stream immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error: any) {
    console.error('Camera permission request failed:', error);
    
    if (error.name === 'NotAllowedError') {
      console.error('User denied camera permission');
    } else if (error.name === 'NotFoundError') {
      console.error('No camera found');
    } else if (error.name === 'NotReadableError') {
      console.error('Camera already in use');
    }
    
    return false;
  }
};

export const checkCameraPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    if (!navigator.permissions) {
      return 'prompt';
    }

    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return 'prompt';
  }
};
