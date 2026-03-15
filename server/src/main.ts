import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configSwagger } from './configs/swagger.config';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from './pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configSwagger(app);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
