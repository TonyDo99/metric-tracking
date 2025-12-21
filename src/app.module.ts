import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from '@/infrastructures/database/database.module';
import { UnitController } from './controllers/unit.controller';
import { I_UNIT_SERVICE, UnitService } from './services/unit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${join(process.cwd(), '.env')}`,
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [UnitController],
  providers: [
    {
      provide: I_UNIT_SERVICE,
      useClass: UnitService,
    },
  ],
})
export class AppModule {}
