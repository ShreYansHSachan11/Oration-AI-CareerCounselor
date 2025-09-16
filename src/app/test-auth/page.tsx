'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const [networkTest, setNetworkTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testNetwork = async () => {
    setLoading(true);
    try {
      // Test Google OAuth endpoints
      const googleTest = await fetch('https://accounts.google.com/.well-known/openid-configuration', {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      const result = {
        google: googleTest.ok,
        googleStatus: googleTest.status,
        timestamp: new Date().toISOString(),
      };

      setNetworkTest(result);
    } catch (error) {
      setNetworkTest({
        google: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Auth Configuration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={testNetwork} disabled={loading}>
              {loading ? 'Testing...' : 'Test Network Connectivity'}
            </Button>
          </div>

          {networkTest && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Network Test Results:</h3>
              <pre className="text-sm">
                {JSON.stringify(networkTest, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Environment Check:</h3>
            <p className="text-sm">
              Google Client ID configured: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Yes' : 'No'}
            </p>
            <p className="text-sm">
              NextAuth URL: {process.env.NEXTAUTH_URL || 'Not set'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}