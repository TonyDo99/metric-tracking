import { OneToMany } from 'typeorm';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { UnitAttributeEntity } from './unit_attribute.entity';

@Entity({ name: 'tb_unit' })
export class UnitEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => UnitAttributeEntity, (attribute) => attribute.unit)
  attributes: UnitAttributeEntity[];
}
