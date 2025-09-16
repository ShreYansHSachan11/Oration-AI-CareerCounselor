// Utility to test network connectivity to OAuth providers
export async function testGoogleConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://accounts.google.com/.well-known/openid-configuration', {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Google connectivity test failed:', error);
    return false;
  }
}

export async function testNetworkConnectivity(): Promise<{
  google: boolean;
  general: boolean;
}> {
  const results = {
    google: false,
    general: false,
  };

  // Test general internet connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    results.general = response.ok;
  } catch (error) {
    console.error('General connectivity test failed:', error);
  }

  // Test Google OAuth endpoints
  results.google = await testGoogleConnectivity();

  return results;
}