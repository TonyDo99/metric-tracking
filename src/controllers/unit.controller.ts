import { ChartAnalyticsDto } from '@/dtos/unit.dto';
import { BadRequestException, Get, Inject, Query } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { I_UNIT_SERVICE, UnitService } from 'src/services/unit.service';

export const I_UNIT_CONTROLLER = 'I_UNIT_CONTROLLER';

@ApiTags('metric')
@Controller('metric')
export class UnitController {
  constructor(
    @Inject(I_UNIT_SERVICE) private readonly unitService: UnitService,
  ) {}

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
}
