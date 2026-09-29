import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ADMIN_KEY_SECURITY } from './common/auth-decorators';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  if (process.env.SWAGGER_ENABLED !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('Velo API')
      .setDescription(
        'Login: call /auth/otp/request, read the code from the server console, ' +
          'call /auth/otp/verify, then paste accessToken into "Authorize" (bearer). ' +
          'Admin endpoints need ADMIN_API_KEY in "Authorize" (admin-key).',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey(
        { type: 'apiKey', in: 'header', name: 'x-admin-key' },
        ADMIN_KEY_SECURITY,
      )
      .build();
    SwaggerModule.setup(
      'docs',
      app,
      SwaggerModule.createDocument(app, config),
      {
        swaggerOptions: { persistAuthorization: true },
      },
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
