import { ChartAnalyticsDto } from '@/dtos/unit.dto';
import { UnitEntity } from '@/entities/unit.entity';

export interface IUnitService {
  analytics(
    payload: ChartAnalyticsDto,
  ): Promise<Pick<UnitEntity, 'id' | 'name'>[]>;
}
