import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

export async function setupTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply the same global pipes and configuration as in main.ts
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Set up API prefix if any
  // app.setGlobalPrefix('api'); // Uncomment if your API has a prefix

  await app.init();

  return app;
}
