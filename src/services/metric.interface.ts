import { ChartAnalyticsDto } from '@/dtos/unit.dto';
import { UnitEntity } from '@/entities/unit.entity';

export const I_METRIC_SERVICE = 'I_METRIC_SERVICE';

export interface IMetricService {
  analytics(
    payload: ChartAnalyticsDto,
  ): Promise<Pick<UnitEntity, 'id' | 'name'>[]>;
}
