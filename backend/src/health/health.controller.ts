import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  @Get()
  async check() {
    let dbStatus = 'ok';
    try {
      await this.db.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }

    const status = dbStatus === 'ok' ? 'ok' : 'degraded';
    return {
      status,
      db: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
