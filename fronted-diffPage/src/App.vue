<template>
  <div class="home">
    <el-container>
      <el-header height="80px">
        <el-row :gutter="20">
          <el-col :span="24">
            <h2>竞品差异对比</h2>
          </el-col>
        </el-row>
      </el-header>
      <el-container>
        <el-aside width="150px">
          <el-menu
            active-text-color="#ffd04b"
            background-color="#545c64"
            :default-active="active"
            text-color="#fff"
            router
          >
            <el-menu-item
              :index="item.path"
              v-for="item in list"
              :key="item.path"
            >
              <span>{{ item.meta.title }}</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main><router-view></router-view></el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();
const active = route.path;
const list = router.getRoutes();
</script>
<style lang="scss" scoped>
* {
  margin: 0px;
  padding: 0px;
}
html,
body,
#app {
  width: 100%;
  height: 100%;
}
.el-header {
  background-color: #666;

  h2 {
    text-align: center;
    height: 80px;
    line-height: 80px;
    color: #fff;
  }
}
.el-aside {
  .el-menu {
    height: 100%;
  }
}
</style>
