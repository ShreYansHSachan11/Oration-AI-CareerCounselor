import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Basic application metrics for monitoring
    const metrics: {
      timestamp: string;
      uptime: number;
      memory: NodeJS.MemoryUsage;
      version: string;
      environment: string | undefined;
      database?: {
        users: number;
        sessions: number;
        messages: number;
      };
    } = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
    };

    // Database metrics (if accessible)
    try {
      const [userCount, sessionCount, messageCount] = await Promise.all([
        prisma.user.count(),
        prisma.chatSession.count(),
        prisma.message.count(),
      ]);

      metrics.database = {
        users: userCount,
        sessions: sessionCount,
        messages: messageCount,
      };
    } catch (dbError) {
      console.warn('Could not fetch database metrics:', dbError);
      Object.assign(metrics, {
        database: {
          status: 'unavailable',
        },
      });
    }

    // Return metrics in Prometheus format if requested
    const headersList = await headers();
    const acceptHeader = headersList.get('accept') || '';
    if (acceptHeader.includes('text/plain')) {
      const prometheusMetrics = `
# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds ${metrics.uptime}

# HELP app_memory_usage_bytes Memory usage in bytes
# TYPE app_memory_usage_bytes gauge
app_memory_usage_bytes{type="rss"} ${metrics.memory.rss}
app_memory_usage_bytes{type="heapTotal"} ${metrics.memory.heapTotal}
app_memory_usage_bytes{type="heapUsed"} ${metrics.memory.heapUsed}
app_memory_usage_bytes{type="external"} ${metrics.memory.external}

# HELP app_database_records_total Total number of database records
# TYPE app_database_records_total gauge
app_database_records_total{table="users"} ${metrics.database?.users || 0}
app_database_records_total{table="sessions"} ${metrics.database?.sessions || 0}
app_database_records_total{table="messages"} ${metrics.database?.messages || 0}
      `.trim();

      return new Response(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Return JSON metrics by default
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Metrics endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
