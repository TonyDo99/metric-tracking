import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from '@/infrastructures/database/database.module';
import { MetricController } from '@/controllers/metric.controller';
import { I_METRIC_SERVICE } from '@/services/metric.interface';
import { MetricService } from '@/services/metric.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${join(process.cwd(), '.env')}`,
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [MetricController],
  providers: [
    {
      provide: I_METRIC_SERVICE,
      useClass: MetricService,
    },
  ],
})
export class AppModule {}
