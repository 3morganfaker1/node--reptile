import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { material_info } from './materail.entity';

@Entity('attr_info_test')
export class attr_info {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '1.0.0' })
  version: string;

  @CreateDateColumn()
  create_time: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: null })
  parent_id: number;

  @Column({ default: '' })
  defaultValue: string;

  @Column({ default: '' })
  required: string;

  @Column({ default: '' })
  illustrate: string;

  @Column({ default: '' })
  value: string;

  @Column({ default: '' })
  args: string;

  @Column({ default: '' })
  errNo: string;

  @Column({ default: '' })
  errMsg: string;

  @Column({ default: '' })
  type: string;

  @ManyToOne(() => material_info, (user) => user.attrs)
  // @JoinColumn({ name: 'attr_id' })
  @JoinColumn({ name: 'material_id' })
  attr: material_info;
}
