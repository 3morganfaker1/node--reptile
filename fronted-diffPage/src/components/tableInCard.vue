<template>
  <el-card>
    <template #header>
      <div>
        <span>{{ listData.ComponentName }}</span>
      </div>
    </template>
    <div>
      <el-table :data="listData?.data">
        <el-table-column prop="name" label="属性名" width="100" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="illustrate" label="说明" width="180" />
        <el-table-column prop="defalutValue" label="默认值" width="100" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="required" label="是否必填" width="100" />
        <el-table-column prop="value" label="值" width="100" />
        <el-table-column prop="attrs" label="合法值/类型说明">
          <template v-slot="scope">
            <div
              v-for="(item, index) in scope.row.attrs"
              :key="index"
              class="attrs"
            >
              <div>name: {{ item.name }}</div>
              <div>value: {{ item.value }}</div>
              <div>type: {{ item.type }}</div>
              <div>illustrate: {{ item.illustrate }}</div>
              <div>status: {{ item.tag }}</div>
              <div v-for="(attrItem, index) in item.attrs" :key="index">
                <div>
                  <div>attrs-name: {{ attrItem.name }}</div>
                  <div>attrs-type: {{ attrItem.type }}</div>
                  <div>attrs-illustrate: {{ attrItem.illustrate }}</div>
                  <div>attrs-value: {{ attrItem.value }}</div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="tag" label="状态" />
      </el-table>
      <el-divider />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import { FormType } from "@/type";
defineProps<{
  listData: FormType,
}>();
</script>

<style scoped>
.attrs {
  border: 1px solid transparent;
  border-radius: 6px;
  position: relative;
  background-color: rgba(229, 187, 209, 0.8);
  background-clip: padding-box; /*important*/
}
</style>
