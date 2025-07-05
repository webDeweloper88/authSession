import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * NestJS ilovasini ishga tushirish uchun bootstrap funksiyasi.
 *
 * Ushbu funksiya quyidagi vazifalarni bajaradi:
 * - NestJS ilovasini yaratadi va konfiguratsiya xizmatini oladi.
 * - Global validatsiya quvurlarini (ValidationPipe) o‘rnatadi.
 * - CORS sozlamalarini konfiguratsiya qiladi.
 * - Swagger yordamida API hujjatlarini yaratadi va sozlaydi.
 * - Ilovani belgilangan portda ishga tushiradi va konsolga kerakli ma’lumotlarni chiqaradi.
 * - Xatolik yuz bersa, uni konsolga chiqaradi va jarayonni to‘xtatadi.
 *
 * @async
 * @function
 * @returns {Promise<void>} Hech qanday qiymat qaytarmaydi, faqat ilovani ishga tushiradi.
 */
async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule); // NestJS ilovasini yaratish
    const configService = app.get(ConfigService); // ConfigService orqali konfiguratsiya xizmatini olish
    const port = configService.getOrThrow<number>('APP_PORT'); // Konfiguratsiyadan port raqamini olish

    app.useGlobalPipes(
      // Global validatsiya quvurlarini o‘rnatish
      new ValidationPipe({
        transform: true, // So‘rovlarni avtomatik ravishda DTO'ga o‘zgartirish
        whitelist: true, // Faqat ruxsat berilgan maydonlarni qabul qilish
        forbidNonWhitelisted: true, // Ruxsat berilmagan maydonlar bo‘lsa, xatolik qaytarish
      }),
    );

    app.enableCors({
      // CORS sozlamalarini yoqish
      origin: configService.getOrThrow<string>('CORS_ORIGIN'),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    const configSwager = new DocumentBuilder()
      .setTitle('NestJS API') // Swagger hujjatlari uchun sarlavha
      .setDescription('API documentation for NestJS application') // Swagger hujjatlari uchun tavsif
      .setVersion('1.0') // Swagger hujjatlari uchun versiya
      .addTag('nestjs') // Swagger hujjatlari uchun teg
      .addBearerAuth() // Bearer autentifikatsiya qo‘shish
      .build(); // Swagger konfiguratsiyasini yaratish
    const document = SwaggerModule.createDocument(app, configSwager);
    SwaggerModule.setup('api', app, document); // Swagger hujjatlarini '/api' yo‘nalishida sozlash

    await app.listen(port); // Ilovani belgilangan portda ishga tushirish
    console.log(`Application is running on: http://localhost:${port}/api`); // Ilova ishga tushirilganda konsolga chiqarish
    console.log(
      `Cors_Orign : ${configService.getOrThrow<string>('CORS_ORIGIN')}`, // CORS origin konfiguratsiyasini konsolga chiqarish
    );
  } catch (error) {
    console.error('Ishga tushirishda xatolik yuz berdi:', error); // Xatolikni diagnostika qilish uchun loglash
    process.exit(1);
  }
}
bootstrap();
