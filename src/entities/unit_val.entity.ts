import { Column } from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm';
import { ManyToOne } from 'typeorm';
import { Entity } from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { UnitAttributeEntity } from './unit_attribute.entity';

@Entity({ name: 'tb_unit_val' })
export class UnitValEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @ManyToOne(() => UnitAttributeEntity, (ref) => ref.attributes)
  attribute: UnitAttributeEntity;
}
