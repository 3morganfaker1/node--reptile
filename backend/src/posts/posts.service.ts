import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { material_info } from './materail.entity';
import { attr_info } from './attribute.entity';
export interface materialDataOptions {
  ComponentName: string;
  introduce: string;
  version: string;
  type: string;
  platform: string;
  name: string;
  key: string;
  attrs?: attrOptions;
}

export interface attrOptions {
  required?: boolean;
  defaultValue?: string;
  version?: string;
  type?: string;
  illustrate?: string;
  name?: string;
  value?: string;
  attrs?: attrOptions;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(material_info)
    private materialRepository: Repository<material_info>,
    @InjectRepository(attr_info)
    private attributeRepository: Repository<attr_info>,
  ) {}

  async createMaterial(materialData: any): Promise<void> {
    //判断该数据是否存在数据库中，没有则添加，有则更新
    const { ComponentName, key, platform, introduce, version } = materialData;

    const materialInfo = await this.materialRepository.findOneBy({
      name: ComponentName,
    });

    if (materialInfo) {
      Object.assign(materialInfo, {
        name: ComponentName,
        key,
        platform,
        introduce,
        version,
      });
      await this.materialRepository.save(materialInfo);
    } else {
      const material = {
        name: ComponentName,
        key,
        platform,
        introduce,
        version,
      };
      await this.materialRepository.save(material);
      const data = [];
      if (!materialData.attrs) {
        return;
      }

      const newMaterialInfo = await this.materialRepository.findOneBy({
        name: ComponentName,
      });

      for (const val in materialData.attrs) {
        const {
          name,
          type,
          defaultValue,
          required,
          value,
          illustrate,
          version,
          args,
          errNo,
          errMsg,
        } = materialData.attrs[val];

        data.push({
          name: name,
          type: type,
          required: required,
          defaultValue: defaultValue,
          value: value,
          illustrate: illustrate,
          version: version,
          args: args,
          attr: newMaterialInfo,
          errNo: errNo,
          errMsg: errMsg,
        });

        if (!Array.isArray(materialData.attrs[val])) {
          await this.attributeRepository.save(data); //再存副表直接子属性信息
        }

        const materialDetail = await this.materialRepository.findOne({
          where: { id: newMaterialInfo.id },
          relations: ['attrs'],
        });
        const attributes = materialDetail.attrs;

        //存完直接子属性，继续存间接子属性,根据外键去找parent_id
        if (materialData.attrs[val].attrs) {
          if (Object.keys(materialData.attrs[val].attrs).length !== 0) {
            materialData.attrs[val].attrs.parent_id =
              attributes[attributes.length - 1].id;
            await this.attributeRepository.save(
              this.changeChildAttr(
                materialData.attrs[val].attrs,
                newMaterialInfo,
              ),
            ); //存副表-间接子属性信息
            //存附属属性的parentid
            for (const detail of materialData.attrs[val].attrs) {
              if (detail.attrs) {
                const parentInfo = await this.attributeRepository.findOneBy({
                  //找到parent属性
                  name: detail.name,
                  illustrate: detail.illustrate,
                });
                detail.attrs.parent_id = parentInfo.id;
                await this.attributeRepository.save(
                  this.changeChildAttr(detail.attrs, newMaterialInfo),
                );
              }
            }
          }
        }
      }
    }
  }

  async getMaterial(id: number): Promise<any> {
    const material = await this.materialRepository.findOneBy({
      id,
    });
    // const attribute = await this.attributeRepository.findOneBy({
    //   id,
    // });
    return {
      id: material.id,
      type: material.type,
      attr: {
        // name: material.attr?.name,
      },
    };
  }

  changeChildAttr(arr: any, info: any) {
    for (const detail of arr) {
      detail.parent_id = arr.parent_id;
      detail.attr = info;
    }
    return arr;
  }
}
