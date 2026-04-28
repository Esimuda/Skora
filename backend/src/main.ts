import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable verbose NestJS logger in production to reduce I/O overhead
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['log', 'error', 'warn', 'debug'],
  });

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false, // We manage CSP at the CDN/proxy level
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── Compression ─────────────────────────────────────────────────────────────
  // Gzip all responses > 1 KB — critical for large result payloads on slow links
  app.use(compression({ threshold: 1024 }));

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, '')); // strip trailing slashes

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow non-browser clients
      const normalised = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalised)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Swagger (dev only) ──────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Skora RMS API')
      .setDescription('Result Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Skora API running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
}

bootstrap();
