import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Banking API')
    .setDescription('API documentation for the in-memory banking system')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/api');
  });

  await app.listen(process.env.PORT ?? 3000);
  Logger.log(
    `Application running on http://localhost:${process.env.PORT ?? 3000}`,
    'Bootstrap',
  );
  Logger.log(
    `Swagger is available on http://localhost:${process.env.PORT ?? 3000}/api`,
    'Bootstrap',
  );
}
bootstrap();
