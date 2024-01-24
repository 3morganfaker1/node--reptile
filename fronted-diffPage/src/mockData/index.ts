import { FormType } from "../type/index";
export const mockData = [
  {
    ComponentName: "button组件",
    type: "component",
    data: [
      {
        name: "selectable",
        type: "boolean",
        defalutValue: "false",
        required: "否",
        illustrate: "是否可以选中文字",
        version: "1.0.0​",
        tag: "update",
        value: "test value",
      },
      {
        name: "space",
        type: "string",
        defalutValue: "",
        required: "否",
        illustrate: "是否显示连续的空格可以取值enspemspnbsp详见space的合法值",
        version: "1.0.0​",
        tag: "new",
        value: "test value",
      },
    ],
  },
  {
    ComponentName: "text组件",
    type: "component",
    data: [
      {
        name: "selectable",
        type: "boolean",
        defalutValue: "false",
        required: "否",
        illustrate: "是否可以选中文字",
        version: "1.0.0​",
        tag: "update",
        value: "test value",
      },
      {
        name: "space",
        type: "string",
        defalutValue: "",
        required: "否",
        illustrate: "是否显示连续的空格可以取值enspemspnbsp详见space的合法值",
        version: "1.0.0​",
        tag: "new",
        attrs: [
          {
            name: "children name",
            value: "children value",
            illustrate: "children illustrate",
            attrs:[
              {
                name:"child-child-name",
                tag:"new"
              }
            ],
            tag: "new",
          },
          {
            name: "children1 name",
            value: "children2 value",
            illustrate: "children3 illustrate",
            tag: "update",
          },
        ],
        value: "test value",
      },
    ],
  },
  {
    ComponentName: "tt.onAppShow",
    type: "api",
    data: [
      {
        version: "1.1.0",
        value: "test value",
        required: "是",
        type: "string",
        tag: "new",
        defalutValue: "test defalut",
        illustrate: "test introduce",
        name: "schma",
      },
      {
        version: "1.0.0",
        value: "test value2",
        required: "是",
        type: "string",
        tag: "new",
        defalutValue: "test defalut",
        illustrate: "test introduce",
        name: "space",
      },
    ],
  },
];

// export function dslFlatten(data) {
//   const arr = [];
//   //把dsl转换成flatten arr的形式，在页面中引用
//   return arr;
// }

//在组件中分类
export function classifyData(data: FormType[], type: string) {
  const apiArr = [],
    componentArr = [];
  for (const detail of data) {
    if (detail.type == "api") {
      apiArr.push(detail);
    } else {
      componentArr.push(detail);
    }
  }
  return type == "api" ? apiArr : componentArr;
}
