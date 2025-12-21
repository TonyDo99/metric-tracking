import { ManyToOne } from 'typeorm';
import { OneToMany } from 'typeorm';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { UnitEntity } from './unit.entity';
import { UnitValEntity } from './unit_val.entity';

@Entity({ name: 'tb_unit_attribute' })
export class UnitAttributeEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'bool', default: false })
  base: boolean;

  @ManyToOne(() => UnitEntity, (ref) => ref.attributes)
  unit: UnitEntity;

  @OneToMany(() => UnitValEntity, (ref) => ref.attribute)
  attributes: UnitValEntity[];
}
