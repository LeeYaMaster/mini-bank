import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许前端本地跨域
  app.enableCors({ origin: true });

  // 全局 DTO 校验：白名单 + 类型转换
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`迷你银行后端已启动: http://localhost:${port}`);
  console.log(`健康检查: http://localhost:${port}/health`);
}
bootstrap();
