import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Allowed metric types for creation.
 * - Distance: units like meter, centimeter, inch, feet, yard
 * - Temperature: units like celsius, fahrenheit, kelvin
 */
export enum MetricType {
  Distance = 'Distance',
  Temperature = 'Temperature',
}

/**
 * Pagination parameters for list endpoints.
 * - page: zero-based page index
 * - limit: number of items per page
 */
export class PaginationDto {
  /**
   * Zero-based page index.
   */
  @ApiProperty({
    required: false,
    type: Number,
    minimum: 0,
    default: 0,
    description: 'Zero-based page index',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  page: number = 0;

  /**
   * Items per page.
   */
  @ApiProperty({
    required: false,
    type: Number,
    minimum: 0,
    default: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  limit: number = 10;
}

/**
 * Query parameters for metric analytics/filtering.
 * Extends pagination with:
 * - type: metric type (Distance or Temperature)
 * - period: recent months filter
 * - unit: unit attribute (e.g., meter, celsius)
 */
export class ChartAnalyticsDto extends PaginationDto {
  /**
   * Metric type to filter (e.g., Distance, Temperature).
   */
  @ApiProperty({
    required: false,
    type: String,
    enum: ['Distance', 'Temperature'],
    description: 'Metric type to filter',
  })
  @IsOptional()
  @Type(() => String)
  type: string = '';

  /**
   * Filter by recent months (integer).
   */
  @ApiProperty({
    required: false,
    type: Number,
    minimum: 0,
    description: 'Filter by recent months',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  period: number = 0;

  /**
   * Unit attribute to filter (e.g., meter, celsius).
   */
  @ApiProperty({
    required: false,
    type: String,
    description: 'Unit attribute to filter (e.g., meter, celsius)',
  })
  @IsOptional()
  @Type(() => String)
  unit: string = '';
}

/**
 * DTO used to create a new metric value for a given unit attribute.
 *
 * Usage:
 * - For a distance sample:
 *   { "type": "Distance", "unit": "centimeter", "value": "342.43" }
 *
 * - For a temperature sample:
 *   { "type": "Temperature", "unit": "celsius", "value": "43" }
 *
 * Notes:
 * - `value` is a numeric string (e.g., "12", "12.50", "0.001").
 * - `unit` must be a valid attribute for the provided `type`.
 * - The service layer should validate the unit belongs to the type and persist
 *   the value into the `tb_unit_val` table associated with the attribute.
 */
export class CreateMetricDto {
  /**
   * Metric type (Distance or Temperature).
   */
  @ApiProperty({
    enum: MetricType,
    example: MetricType.Distance,
    description:
      'Metric type. Distance: meter, centimeter, inch, feet, yard. Temperature: celsius, fahrenheit, kelvin.',
  })
  @IsEnum(MetricType)
  type: MetricType;

  /**
   * Unit attribute name corresponding to the provided type.
   * Examples:
   * - Distance: "meter", "centimeter", "inch", "feet", "yard"
   * - Temperature: "celsius", "fahrenheit", "kelvin"
   */
  @ApiProperty({
    type: String,
    example: 'centimeter',
    description:
      'Unit attribute name for the selected type (e.g., "meter", "centimeter", "celsius").',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  /**
   * Numeric string representing the measured value.
   * Accepts integers and decimals (e.g., "43", "342.43", "0.001").
   */
  @ApiProperty({
    type: String,
    example: '342.43',
    description:
      'Numeric value as a string. Accepts integers and decimals (e.g., "43", "12.50").',
  })
  @IsNotEmpty()
  @IsNumberString()
  value: string;
}
