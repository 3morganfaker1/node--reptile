<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
        </div>
      </template>
      <el-scrollbar>
        <tableInCard v-for="(item, index) in listData" :key="index" :list-data="item"/>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";
import tableInCard from "./tableInCard.vue";
import {  FormType } from '../type/index';

defineProps<{
  listData: FormType[],
  title: string,
}>();

</script>

<style scoped lang="scss">
.container {
  width: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.box-card {
  width: 100%;
  margin-top: 5px;
}
</style>
