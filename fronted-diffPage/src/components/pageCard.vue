<template>
  <div class="container">
    <el-card class="box-card">
      <el-form :model="form" label-width="120px">
        <el-form-item :label="label" class="form">
          <el-col :span="4">
            <el-select
              v-model="form.dateBefore"
              :placeholder="placeHolder.source"
            >
              <el-option
                v-for="item in sourceOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="form.dateAfter"
              :placeholder="placeHolder.target"
            >
              <el-option
                v-for="item in targetOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="submit">查询</el-button>
          </el-col>
        </el-form-item>
      </el-form>
    </el-card>
    <diffResultTable
      title="Component"
      :list-data="componentData"
    ></diffResultTable>
    <diffResultTable title="API" :list-data="apiData"></diffResultTable>
  </div>
</template>

<script lang="ts" setup>
import { reactive, defineProps, computed } from "vue";
import { FormType, placeholder } from "@/type";
import diffResultTable from "../../src/components/diffResultTable.vue";
import { classifyData } from "../mockData/index";
const props = defineProps<{
  data: FormType[];
  isDiedai: boolean;
  tags: string;
}>();

const form = reactive({
  dateBefore: "",
  dateAfter: "",
});

const submit = () => {
  console.log("submit");
};

const mockOptions = {
  dataOptions: [
    {
      value: "2023.10.01",
      label: "2023.10.01",
    },
    {
      value: "2023.10.15",
      label: "2023.10.15",
    },
    {
      value: "2023.10.30",
      label: "2023.10.30",
    },
  ],
  targetCompanyOptions: [
    {
      value: "dy",
      label: "抖音",
    },
    {
      value: "wx",
      label: "微信",
    },
  ],
  sourceCompanyOptions: [
    {
      value: "ks",
      label: "快手",
    },
  ],
};

//调classifyData处理，分成component和api传给不同的子组件
const apiData = computed(() => {
  return classifyData(props.data!, "api");
});

const componentData = computed(() => {
  return classifyData(props.data!, "component");
});

const label = computed(() => {
  return props.isDiedai ? "选择迭代范围" : "选择对比竞品";
});

const placeHolder = computed(() => {
  const newPlaceholder: placeholder = {
    source: "",
    target: "",
  };
  if (props.isDiedai) {
    newPlaceholder.source = "选择前入库日期";
    newPlaceholder.target = "选择后入库日期";
  } else {
    newPlaceholder.source = "source";
    newPlaceholder.target = "target";
  }
  return newPlaceholder;
});

const sourceOptions = computed(() => {
  return props.isDiedai ? mockOptions.dataOptions : mockOptions.sourceCompanyOptions;
});

const targetOptions = computed(() => {
  return props.isDiedai ? mockOptions.dataOptions : mockOptions.targetCompanyOptions;
});
</script>

<style scoped>
.form {
  height: 10px;
}
</style>
