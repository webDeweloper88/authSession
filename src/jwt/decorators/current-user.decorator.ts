import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  //**bu dekorator foydalanuvchi ma'lumotlarini olish uchun ishlatiladi */
  (field: string | undefined, ctx: ExecutionContext) => {
    // field - optional, agar berilsa, faqat shu maydonni qaytaradi
    const request = ctx.switchToHttp().getRequest(); // HTTP so'rovini olish
    const user = request.user; // foydalanuvchi ma'lumotlarini olish

    if (!field) return user; // agar field berilmasa, butun foydalanuvchi obyektini qaytaradi
    return user?.[field]; // agar field berilgan bo'lsa, faqat shu maydonni qaytaradi
  },
);
// CurrentUser dekoratori, foydalanuvchi ma'lumotlarini olish uchun ishlatiladi.
