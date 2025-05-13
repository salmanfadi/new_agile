export const setupConsoleLogger = () => {
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    originalConsoleError(...args);
    console.error('Error logged:', new Date().toISOString(), args);
  };

  // Log any uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event);
  });

  // Log any rejected promises
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
  });
};

// Initialize the logger when the app starts
setupConsoleLogger();
