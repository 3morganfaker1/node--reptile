import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { attr_info } from './attribute.entity';

@Entity('material_info_test')
export class material_info {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  version: string;

  @CreateDateColumn()
  create_time: string;

  @Column({ default: '' })
  key: string;

  @Column({ default: '' })
  type: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  platform: string;

  @Column({ default: '' })
  introduce: string;

  @OneToMany(() => attr_info, (attr) => attr.attr)
  attrs: attr_info[];
}
