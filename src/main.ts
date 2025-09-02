import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler/dist/throttler.guard';
import { APP_GUARD} from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { truncate } from 'fs';
import { join } from 'path';
import { UsuarioSeeder } from './usuario/seeder/usuario-seeder';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const seeder=app.get(UsuarioSeeder); //verificar si no existen usuarios
  await seeder.run()
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials:true,
  });
  
  app.useStaticAssets(join(__dirname, '..', 'usuarios'), {
    prefix: '/usuarios/', 
  });
  app.useStaticAssets(join(__dirname, '..', 'productos'), {
    prefix: '/productos/', 
  });
  
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
