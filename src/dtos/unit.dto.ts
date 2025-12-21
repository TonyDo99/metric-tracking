import { IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  page: number = 0;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  limit: number = 10;
}

export class ChartAnalyticsDto extends PaginationDto {
  @IsOptional()
  @Type(() => String)
  type: string = '';

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  period: number = 0;

  @IsOptional()
  @Type(() => String)
  unit: string = '';
}
