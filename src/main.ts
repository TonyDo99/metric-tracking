import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from '@/infrastructures/http/response.interceptor';
import { HttpExceptionFilter } from '@/infrastructures/http/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // Swagger/OpenAPI setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Metric Tracking API')
    .setDescription('OpenAPI documentation for the Metric Tracking service')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  await app.listen(config.get<string>('PORT'), () => {
    console.log(`Server is running on port ${config.get<string>('PORT')}`);
    console.log(
      `Swagger docs available at http://localhost:${config.get<string>(
        'PORT',
      )}/api-docs`,
    );
  });
}
bootstrap();
