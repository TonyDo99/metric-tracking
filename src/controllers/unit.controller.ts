import { ChartAnalyticsDto } from '@/dtos/unit.dto';
import {
  BadRequestException,
  Get,
  Inject,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I_UNIT_SERVICE, UnitService } from 'src/services/unit.service';

export const I_UNIT_CONTROLLER = 'I_UNIT_CONTROLLER';

@Controller('metric')
export class UnitController {
  constructor(
    @Inject(I_UNIT_SERVICE) private readonly unitService: UnitService,
  ) {}

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
      );

      return await this.unitService.analytics(serializedPayload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
