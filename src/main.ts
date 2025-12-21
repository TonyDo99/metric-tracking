import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from '@/infrastructures/http/response.interceptor';
import { HttpExceptionFilter } from '@/infrastructures/http/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global response shaping and error handling
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        exposeDefaultValues: true,
      },
    }),
  );

  await app.listen(config.get<string>('PORT'), () => {
    console.log(`Server is running on port ${config.get<string>('PORT')}`);
  });
}
bootstrap();
