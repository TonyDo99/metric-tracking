import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from './infrastructures/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${join(process.cwd(), '.env')}`,
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
