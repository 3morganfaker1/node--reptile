export interface FormType {
  ComponentName: string;
  type:string;
  data: FormTypeData[];
}

export interface FormTypeData {
  version?: string;
  value?: string;
  required?: string;
  type?: string;
  tag: string;
  defalutValue?: string;
  illustrate?: string;
  attrs?: FormTypeData[];
  name?: string;
}

export interface placeholder {
  source: string;
  target: string;
}
