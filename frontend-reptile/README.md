
### 项目简介

本项目是基于nodejs-puppeteer实现的一系列爬虫程序集合，将抖音官方小程序的组件/API文档，以DSL的结构进行存储。
表格与dsl映射关系如下
属性名<-------->name
类型<-------->type
默认值<-------->defalutValue
说明<-------->illustrate
必填<-------->required
版本<-------->version
值<-------->value
合法值/子属性<-------->attrs
参数<-------->args
参数属性<-------->argsType

### 程序实现

#### 1. 单页面的爬虫测试

代码路径：src/test-dy-pupeteer.js
用于单页面的数据爬取测试

#### 2. 组件信息爬取
代码路径：src/getDYComponent.js
用于组件信息的数据爬取测试
爬取的json文件将存储到本地的dyComponentTabledata目录下

#### 3. API信息爬取
代码路径：src/getDYAPI.js
用于API信息的数据爬取测试
爬取的json文件将存储到本地的dyAPITabledata目录下

#### 4. json文件diff单测
代码路径：src/diffJson.js

### 项目本地预览

### Clone repo

```bash
git clone git@git.corp.kuaishou.com:mfe/mp/analysis-tools.git
cd my-project
```

#### 安装依赖

```shell
yarn install
```

#### 运行爬虫指令

```shell
yarn getdyComponentList // 爬取抖音组件信息

yarn getdyapi // 爬取抖音API信息

```

### 其他
无
