import { UnitEntity } from '@/entities/unit.entity';
import { UnitAttributeEntity } from '@/entities/unit_attribute.entity';
import { UnitValEntity } from '@/entities/unit_val.entity';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          entities: [UnitEntity, UnitAttributeEntity, UnitValEntity],
          synchronize: false,
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UnitEntity, UnitAttributeEntity, UnitValEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
