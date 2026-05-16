import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  // Liveness probe — must respond instantly so Render's deploy health check
  // succeeds even when the Supabase pooler is still cold-starting. Do NOT touch
  // the database here; if you do, Supabase's first-query wake-up will time out
  // the deploy and the new build is rolled back.
  @Get()
  check() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  // Readiness probe — actually checks DB connectivity. Use this to debug
  // outages; not wired to Render's automatic health check.
  @Get('db')
  async checkDb() {
    let dbStatus = 'ok';
    try {
      await this.db.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }
    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      db: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
