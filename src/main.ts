import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
      ];
      const envOrigin = process.env.FRONTEND_URL;
      const isAllowed = allowedOrigins.includes(origin) || 
                        (envOrigin && origin === envOrigin) ||
                        origin.endsWith('.vercel.app');
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT || 3001);
}
bootstrap();