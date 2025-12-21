import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './controllers/unit.controller';
import { AppService } from './services/unit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${join(process.cwd(), '.env')}`,
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
