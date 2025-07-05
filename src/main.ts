import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const port = configService.getOrThrow<number>('APP_PORT');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.enableCors({
      origin: configService.getOrThrow<string>('CORS_ORIGIN'),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    const configSwager = new DocumentBuilder()
      .setTitle('NestJS API')
      .setDescription('API documentation for NestJS application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, configSwager);
    SwaggerModule.setup('api', app, document);

    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}/api`);
    console.log(
      `Cors_Orign : ${configService.getOrThrow<string>('CORS_ORIGIN')}`,
    );
  } catch (error) {
    console.error('Ishga tushirishda xatolik yuz berdi:', error); // Xatolikni diagnostika qilish uchun loglash
    process.exit(1);
  }
}
bootstrap();
