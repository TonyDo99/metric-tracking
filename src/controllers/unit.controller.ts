import { ChartAnalyticsDto, CreateMetricDto } from '@/dtos/unit.dto';
import {
  BadRequestException,
  Get,
  Inject,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { I_UNIT_SERVICE, UnitService } from 'src/services/unit.service';

@ApiTags('metric')
@Controller('metric')
export class UnitController {
  constructor(
    @Inject(I_UNIT_SERVICE) private readonly unitService: UnitService,
  ) {}

  /**
   * GET /metric/filter
   * Returns filtered metrics by type/unit/period with pagination.
   * Query params:
   * - type: 'Distance' | 'Temperature'
   * - unit: e.g., 'meter', 'celsius'
   * - period: recent months to filter
   * - page: pagination page (0-based)
   * - limit: items per page
   */
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['Distance', 'Temperature'],
    description: 'Metric type to filter',
  })
  @ApiQuery({
    name: 'unit',
    required: false,
    description: 'Unit attribute to filter (e.g., meter, celsius)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    type: Number,
    description: 'Filter by recent months',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Pagination page',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Pagination limit',
  })
  @ApiOkResponse({ description: 'Filtered metrics returned successfully' })
  @ApiBadRequestResponse({ description: 'Validation or processing error' })
  @Get('/filter')
  async analytics(
    @Query('type') type: string,
    @Query('unit') unit: string,
    @Query('period') period: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    try {
      const serializedPayload: ChartAnalyticsDto = plainToInstance(
        ChartAnalyticsDto,
        {
          type,
          period,
          unit,
          page,
          limit,
        },
        {
          exposeDefaultValues: true,
        },
      );

      return await this.unitService.analytics(serializedPayload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * POST /metric/create
   * Creates a new metric sample value for a given type and unit attribute.
   * Request body:
   * - type: 'Distance' | 'Temperature'
   * - unit: e.g., 'centimeter', 'celsius'
   * - value: numeric string (e.g., "342.43", "43")
   * - note?: optional note/source
   */
  @ApiBody({ type: CreateMetricDto })
  @ApiCreatedResponse({ description: 'Metric value created successfully' })
  @ApiBadRequestResponse({ description: 'Validation or processing error' })
  @Post('/create')
  async create(@Body() payload: CreateMetricDto) {
    try {
      const serializedPayload = plainToInstance(CreateMetricDto, payload);
      return await this.unitService.createMetric(serializedPayload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
