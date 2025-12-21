import { ChartAnalyticsDto, CreateMetricDto } from '@/dtos/unit.dto';
import { UnitEntity } from '@/entities/unit.entity';
import { UnitAttributeEntity } from '@/entities/unit_attribute.entity';
import { UnitValEntity } from '@/entities/unit_val.entity';
import { ServiceException } from '@/exceptions/service.exception';
import { convertDistance, convertTempature } from '@/utils/transform';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUnitService } from './unit.interface';

export const I_UNIT_SERVICE = 'I_UNIT_SERVICE';

@Injectable()
export class UnitService implements IUnitService {
  /**
   * Constructs the UnitService with injected repositories.
   *
   * @param unitEntity Repository for UnitEntity (types such as Distance, Temperature)
   * @param unitAttributeEntity Repository for UnitAttributeEntity (unit attributes like meter, celsius)
   */
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitEntity: Repository<UnitEntity>,
    @InjectRepository(UnitAttributeEntity)
    private readonly unitAttributeEntity: Repository<UnitAttributeEntity>,
    @InjectRepository(UnitValEntity)
    private readonly unitValEntity: Repository<UnitValEntity>,
  ) {}

  /**
   * Validates business rules for the requested type and unit.
   * - Ensures the type exists (e.g., Distance, Temperature)
   * - Ensures the unit exists (e.g., meter, celsius)
   * - Ensures the unit belongs to the given type
   *
   * @param payload ChartAnalyticsDto containing `type` and `unit`
   * @throws ServiceException when validation fails
   */
  private async validationBiz(
    payload: Pick<CreateMetricDto | ChartAnalyticsDto, 'type' | 'unit'>,
  ): Promise<{ type: string; unit: string }> {
    const { type, unit } = payload;

    const isExistType = await this.unitEntity.findOne({
      select: ['id'],
      where: { name: type },
    });
    if (!isExistType) {
      throw new ServiceException('This type does not exist !');
    }

    const isExistUnit = await this.unitAttributeEntity.findOne({
      select: ['id'],
      where: { name: unit },
    });
    if (!isExistUnit) {
      throw new ServiceException('This unit does not exist !');
    }

    const isBelong = await this.unitAttributeEntity.findOneBy({
      unitId: isExistType.id,
      id: isExistUnit.id,
    });

    if (!isBelong) {
      throw new ServiceException(
        `The unit "${unit}" does not belong to this "${type}" !`,
      );
    }

    return {
      type: isExistType.id,
      unit: isExistUnit.id,
    };
  }

  /**
   * Finds units filtered by provided conditions and transforms values to the requested unit.
   * - Filters by type name
   * - Optionally filters by created_at period (in months)
   * - Optionally filters by specific unit attribute
   * - Joins attribute values and applies convertDistance/convertTempature
   *
   * @param payload ChartAnalyticsDto with filters: type, unit, period
   * @returns Array of units (id, name) including matched attribute name and transformed value
   * @throws ServiceException for query or transform errors
   */
  private async findByConditions(
    payload: ChartAnalyticsDto,
  ): Promise<Pick<UnitEntity, 'id' | 'name'>[]> {
    try {
      const queryBuilder = this.unitEntity
        .createQueryBuilder('u')
        .where('u.name = :name', { name: payload.type });

      if (payload.period) {
        queryBuilder.andWhere(
          `u.created_at >= NOW() - INTERVAL '${payload.period}' MONTH`,
        );
      }

      if (payload.unit) {
        queryBuilder
          .leftJoin('u.attributes', 'ua')
          .andWhere('ua.name = :unit', { unit: payload.unit });
      }

      const results = await queryBuilder
        .select(['u.id', 'u.name', 'u.created_at'])
        .addSelect(['ua.name'])
        .addSelect(['val.value'])
        .leftJoin('ua.values', 'val')
        .getMany();

      const transformedResults = JSON.parse(
        JSON.stringify(results),
        (key, value) => {
          if (key === 'value') {
            value =
              payload.type === 'Distance'
                ? convertDistance(payload.unit, value)
                : convertTempature(payload.unit, value);
          }
          return value;
        },
      );

      return transformedResults;
    } catch (error) {
      throw new ServiceException(error.message);
    }
  }

  /**
   * Lists all units with their attributes and values.
   * - Selects unit id/name
   * - Joins attributes and their values
   *
   * @returns Array of UnitEntity with attributes and values
   * @throws ServiceException if the query fails
   */
  private async listAll(
    payload: Pick<ChartAnalyticsDto, 'limit' | 'page'>,
  ): Promise<UnitEntity[]> {
    try {
      const { limit, page } = payload;

      return await this.unitEntity
        .createQueryBuilder('u')
        .select(['u.id', 'u.name', 'u.created_at'])
        .addSelect(['ua.name', 'ua.base'])
        .addSelect(['val.value'])
        .leftJoin('u.attributes', 'ua')
        .leftJoin('ua.values', 'val')
        .limit(limit)
        .offset(page * limit)
        .getMany();
    } catch (error) {
      throw new ServiceException(error.message);
    }
  }

  /**
   * Entry point for fetching units based on filters.
   * - Returns all units when no filters are provided
   * - Validates type/unit pairing when both are provided
   * - Delegates to findByConditions for filtered results
   *
   * @param payload ChartAnalyticsDto with optional type, unit, and period
   * @returns Unit list (either all or filtered) with attributes and values
   * @throws ServiceException if validation or queries fail
   */
  public async analytics(
    payload: ChartAnalyticsDto,
  ): Promise<Pick<UnitEntity, 'id' | 'name'>[]> {
    try {
      if (!payload.type && !payload.period && !payload.unit) {
        return await this.listAll(payload);
      }

      if (payload.type && payload.unit) {
        await this.validationBiz(payload);
      }

      return await this.findByConditions(payload);
    } catch (error) {
      throw new ServiceException(error.message);
    }
  }

  /**
   * Creates a new metric value entry in tb_unit_val for the given type and unit.
   * - Validates that the metric `type` exists (e.g., Distance, Temperature)
   * - Validates that the `unit` attribute exists (e.g., meter, celsius)
   * - Ensures the unit belongs to the provided type
   * - Persists the numeric string `value` associated with the attribute
   *
   * Example payloads:
   * { type: MetricType.Distance, unit: 'centimeter', value: '342.43' }
   * { type: MetricType.Temperature, unit: 'celsius', value: '43' }
   *
   * @param payload CreateMetricDto containing type, unit, and numeric string value
   * @returns The created UnitValEntity record
   * @throws ServiceException when validation fails or insertion errors occur
   */
  public async createMetric(payload: CreateMetricDto): Promise<UnitValEntity> {
    try {
      const { unit: unitId } = await this.validationBiz(payload);

      return await this.unitValEntity.save(
        this.unitValEntity.create({
          value: payload.value,
          attributeId: unitId,
        } as unknown as UnitValEntity),
      );
    } catch (error) {
      throw new ServiceException(error.message);
    }
  }
}
