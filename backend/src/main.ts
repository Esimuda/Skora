import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable verbose NestJS logger in production to reduce I/O overhead
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['log', 'error', 'warn', 'debug'],
    // We set our own body-size limits below (school logos and student
    // passport photos are sent as base64 strings in the JSON body, which
    // inflates roughly 33% over the original file size — well past
    // Express's 100kb default).
    bodyParser: false,
  });

  // ── Body size limits ────────────────────────────────────────────────────────
  // School logos and student passport photos are uploaded as base64 data URLs
  // inside JSON, not multipart file uploads. A 2MB image becomes ~2.7MB of
  // base64 text, so the limit needs enough headroom above that.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

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
  // Allow all origins — API is secured by JWT bearer tokens on every endpoint
  app.enableCors({
    origin: true,
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
