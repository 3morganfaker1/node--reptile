const puppeteer = require("puppeteer");
const fs = require("fs");
const chineserExg = /[^\u4e00-\u9fa5a-zA-Z0-9]/g; //仅保留中英文字符
const chinesePattern = /[^\u4e00-\u9fa5]/g; //判断是否仅有中文字符
const axios  = require("axios");
const videoUnuseAttr = ["手势响应亮度与音量", "后台小窗播放", "支持格式封装格式", "支持格式编码格式","受信任的HTML节点及属性"];
const progessUnuseAttr = ["bindactiveend事件对象的detail", "active​"];


//获取overview列表
let urls = [];
let pattern = /open-capacity\/web-view/;
let scrape2 = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(
    "https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/component/overview"
  );
  const tables = await page.$$("table");

  // 遍历表格，将数据存储到一个对象中
  const data = {};
  let tableName = null;
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    tableName = `table${i + 1}`;

    const rows = await table.$$("tr");
    const tableData = [];
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      const cells = await row.$$("td");

      // 使用键值对的方式，将每一行的数据存储到 rowData 对象中
      const rowData = {};
      for (let k = 0; k < cells.length; k++) {
        const cell = cells[k];
        const text = await cell.evaluate((node) => node.innerText);
        const aTags = await cell.$$("a");

        // 迭代每个 a 标签，将 href 值存储到 rowData 中
        for (const aTag of aTags) {
          const href = await aTag.getProperty("href");
          const hrefString = await href.jsonValue();
          if (k == 0) {
            rowData[`组件详情链接`] = hrefString;
          } else {
            rowData[`组件描述链接${k}`] = hrefString;
          }
        }

        // 将单元格文本值存储到 rowData 中
        rowData[`第${k + 1}列`] = text;
      }
      // 将 rowData 存储到数组中
      tableData.push(rowData);
    }
    // 将 tableData 存储到 data 对象中
    data[tableName] = tableData;
  }
  for (const val in data) {
    for (const table of data[val]) {
      if (table["组件详情链接"]) {
        urls.push(table["组件详情链接"]);
      }
    }
  }
  urls.push("https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/component/view-container/mask") //在总列表中未显示蒙层，需要手动把该url加入
  // 将二维数组转换为 JSON 字符串
  const jsonData = JSON.stringify(data, null, 2);

  // 将 JSON 字符串写入本地文件
  fs.writeFile(
    `${__dirname}/dyListData/dyComponentList.json`,
    jsonData,
    function (error) {
      if (error) {
        console.log("写入文件失败：", error);
      } else {
        console.log("写入文件成功！");
      }
    }
  );

  await browser.close();
  return data;
};

//通过overview的列表去遍历单独的信息
scrape2().then(async (value) => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  for (const url of urls) {
      await page.goto(url);
      await page.waitForSelector("body");

    // 使用Page.evaluate方法获取“Text文本”元素的文本内容
    const text = await page.evaluate(() => {
      const div = document.querySelector(
        "div.flex.items-center.justify-between"
      );
      return div.innerText;
    });

    const version = await page.$eval(".ace-line:nth-of-type(1)", (element) => {
      return element.textContent.trim();
    });

    const introduce = await page.$eval(
      ".ace-line:nth-of-type(2)",
      (element) => {
        const result = [];
        result.push(element.textContent.trim());
        let headingElement = element.nextElementSibling;
        while (headingElement) {
          if (
            headingElement.classList.contains("ace-line") &&
            !headingElement.classList.contains("doc-heading")
          ) {
            result.push(headingElement.textContent.trim());
          } else {
            break;
          }
          headingElement = headingElement.nextElementSibling;
        }
        return result;
      }
    );

    const introduceList = await page.$$eval(
      ".ace-line table",
      (tableElementList) => {
        const result = [];
        let h4Title = "";
        for (let tableElement of tableElementList) {
          let headingElement =
            tableElement.closest(".ace-line").previousElementSibling;
          while (headingElement) {
            if (
              headingElement.classList.contains("heading-h4") &&
              headingElement.classList.contains("doc-heading")
            ) {
              if (!h4Title) {
                h4Title = headingElement.textContent.trim();
              }
            } else if (
              headingElement.classList.contains("heading-h3") &&
              headingElement.classList.contains("doc-heading")
            ) {
              if (h4Title) {
                result.push(`${headingElement.textContent.trim()}-${h4Title}`);
              } else {
                result.push(headingElement.textContent.trim());
              }
              h4Title = "";
              break;
            } else if (
              headingElement.classList.contains("heading-h2") &&
              headingElement.classList.contains("doc-heading")
            ) {
              result.push(headingElement.textContent.trim());
              break;
            } else if (
              headingElement.classList.contains("heading-h1") &&
              headingElement.classList.contains("doc-heading")
            ) {
              result.push(headingElement.textContent.trim());
              break;
            }
            headingElement = headingElement.previousElementSibling;
          }
        }
        return result;
      }
    );

    let attribute = {}; //组件详情中的h3标题，如xxx的合法值之类

    attribute["说明"] = introduce.toString();
    let h3TitleArr = [];

    for (let i = 0; i < introduceList.length; i++) {
      if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "回调成功"
      ) {
        introduceList[i] = "successcallback";
      } else if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "回调失败"
      ) {
        introduceList[i] = "failcallback";
      }
      if (introduceList[i] == "属性说明") {
        h3TitleArr.push(introduceList[i]);
      } else {
        h3TitleArr.push(
          introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "")
        );
      }
    }

    attribute["二级表格种类"] = h3TitleArr.filter((item) => item !== "");
    attribute["组件名称"] = text;
    const tables = await page.$$("table");

    // 遍历表格，将数据存储到二维数组中
    const data = {};
    //bug and tip以及3级标题放到数据中
    data["其他信息"] = attribute;
    let index = 0;
    let tempNameIndex = 1;
    let keyDiffNum = 1;
    let formInfo = {};
    for (const table of tables) {
      let tableTitle = "";
      const rows = await table.$$("tr");
      const tableData = {};
      for (let i = 0; i < rows.length; i++) {
        const cells = await rows[i].$$("td");
        const rowData = {};
        for (let j = 0; j < cells.length; j++) {
          const text = await cells[j].evaluate((node) => node.innerText);
          rowData[`第${j + 1}行`] = text;
          if (j == 0) {
            if (i == 0) {
              tableTitle = "表头";
            } else if (pattern.test(url)) {
              if (
                Object.keys(tableData)[
                  Object.keys(tableData).length - 1
                ].replace(chinesePattern, "") ==
                text.replace(chinesePattern, "")
              ) {
                tableTitle = `${text}(${keyDiffNum})`;
                keyDiffNum++;
              } else {
                tableTitle = text;
                keyDiffNum = 1;
              }
            } else {
              tableTitle = text;
            }
          }
        }
        tableData[tableTitle] = rowData;
      }

      if (
        attribute["二级表格种类"][index] == attribute["二级表格种类"][index - 1]
      ) {
        attribute["二级表格种类"][index] = `${attribute["二级表格种类"][
          index - 1
        ].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "")}-${tempNameIndex}`;
        tempNameIndex++;
      } else {
        tempNameIndex = 1;
      }

      formInfo[attribute["二级表格种类"][index]] = tableData;
      index = index + 1;
      data["表格信息"] = formInfo;
    }

    let result = {};
    //dsl转换
    if (data["表格信息"]) {
      result = changeToDSL(data);
      result["introduce"] = introduce.toString();
      result["version"] = version;
      result["platform"] = "douyin";
      result["key"] = result["ComponentName"].replace(/[^a-zA-Z]/g, "");
    } else {
      result["ComponentName"] = data["其他信息"]["组件名称"];
      result["key"] = data["其他信息"]["组件名称"].replace(/[^a-zA-Z]/g, "");
      result["introduce"] = introduce.toString();
      result["version"] = version;
      result["platform"] = "douyin";
      result.attrs = {};
    }

    // 将二维数组转换为 JSON 字符串
    const jsonData = JSON.stringify(result, null, 2);
    axios({
      method: "post",
      url: "http://localhost:9010",
      headers: { "Content-Type": "application/json" },
      data: jsonData,
    })
      .then((response) => {
        console.log('success');
      })
      .catch((error) => {
        console.log('error')
      });
    fs.writeFile(
      `${__dirname}/dyComponentTabledata/${data["其他信息"]["组件名称"]}.json`,
      jsonData,
      function (error) {
        if (error) {
          console.log(`写入${data["其他信息"]["组件名称"]}失败`, error);
        } else {
          console.log(`写入${data["其他信息"]["组件名称"]}成功`);
        }
      }
    );
  }

  await browser.close();
});

function transformData(data) {
  let attrObjKey = [];
  let valObj = data["表头"]; //表头有哪些
  for (let key_ in valObj) {
    attrObjKey.push(changeName(valObj[key_].replace(chineserExg, "")));
  }
  // let attrObj = {};
  let attrObj = [];
  for (let key in data) {
    let index = 0,
      obj = {};
    if (key != "表头") {
      for (let key_ in data[key]) {
        obj[attrObjKey[index]] = data[key][key_];
        index = index + 1;
      }
      // attrObj[key] = obj;
      attrObj.push(obj);
    }
  }
  return attrObj;
}

function changeName(oldName) {
  switch (oldName) {
    case "属性名":
      return "name";
    case "节点":
      return "name";
    case "事件名":
      return "name";  
    case "版本":
      return "version";
    case "最低支持版本":
      return "version";
    case "类型":
      return "type";
    case "必填":
      return "required";
    case "值":
      return "value";
    case "额外支持的属性":
      return "value";
    case "说明":
      return "illustrate";
    case "描述":
      return "illustrate";
    case "默认值":
      return "defalutValue";
    case "参数":
      return "args";
    case "回调参数":
      return "args";
    case "参数类型":
      return "type";
    case "接口类型":
      return "type";
    case "接口名":
      return "name";
    default:
      return oldName;
  }
}

function changeToDSL(data) {
  const obj2 = data;
  const result = {
    ComponentName: obj2["其他信息"]["组件名称"],
    attrs: {},
  };

  let keyName = [];

  for (let key in obj2["表格信息"]) {
    if (key != "属性说明") {
      keyName.push(key);
    }
  }
  for (let key in obj2["表格信息"]["属性说明"]) {
    if (key != "表头") {
      if (Object.keys(obj2["表格信息"]["属性说明"]["表头"]).length == 5) {
        const obj = obj2["表格信息"]["属性说明"][key];
        const type = obj["第1行"].replace(chineserExg, "");
        const defaultValue = obj["第2行"].replace(chineserExg, "");
        const required = obj["第3行"].replace(chineserExg, "");
        const illustrate = obj["第4行"].replace(chineserExg, "");
        const version = obj["第5行"];
        const attrs = {};
        result.attrs[key] = {
          type,
          defaultValue,
          required,
          illustrate,
          version,
          attrs,
        };
      } else if (
        Object.keys(obj2["表格信息"]["属性说明"]["表头"]).length == 6
      ) {
        const obj = obj2["表格信息"]["属性说明"][key];
        const name = obj["第1行"].replace(chineserExg, "");
        const type = obj["第2行"].replace(chineserExg, "");
        const defaultValue = obj["第3行"].replace(chineserExg, "");
        const required = obj["第4行"].replace(chineserExg, "");
        const illustrate = obj["第5行"].replace(chineserExg, "");
        const version = obj["第6行"];
        const attrs = {};
        result.attrs[key] = {
          name,
          type,
          defaultValue,
          required,
          illustrate,
          version,
          attrs,
        };
      } else if (
        Object.keys(obj2["表格信息"]["属性说明"]["表头"]).length == 3
      ) {
        const obj = obj2["表格信息"]["属性说明"][key];
        const method = obj["第1行"].replace(chineserExg, "");
        const illustrate = obj["第2行"].replace(chineserExg, "");
        const version = obj["第3行"];
        const attrs = {};
        result.attrs[key] = {
          method,
          illustrate,
          version,
          attrs,
        };
      } else if (
        Object.keys(obj2["表格信息"]["属性说明"]["表头"]).length == 4
      ) {
        const obj = obj2["表格信息"]["属性说明"][key];
        const name = obj["第1行"].replace(chineserExg, "");
        const type = obj["第2行"].replace(chineserExg, "");
        const illustrate = obj["第3行"].replace(chineserExg, "");
        const version = obj["第4行"];
        const attrs = {};
        result.attrs[key] = {
          name,
          type,
          illustrate,
          version,
          attrs,
        };
      }
    }
  }
  let obj = result.attrs;

  matchTitle(keyName, obj, obj2);

  return result;
}

function matchTitle(titleNameArr, obj, data) {
  const objArr = Object.keys(obj);
  let map = new Map();
  for (let val_key of objArr) {
    for (let val_title of titleNameArr) {

      if (val_title.replace(/[^a-zA-Z]/g, "").toLowerCase() != "") {
        if (
          val_title.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
          val_key.replace(/[^a-zA-Z]/g, "").toLowerCase()
        ) {
          obj[val_key][`attrs`][val_title] = transformData(
            data["表格信息"][val_title]
          );
          removeElement(titleNameArr, val_title);
          map.set(val_title, val_key);
          break;
        } else if (
          val_title
            .replace(/[^a-zA-Z]/g, "")
            .toLowerCase()
            .includes(val_key.replace(/[^a-zA-Z]/g, "").toLowerCase())
        ) {
          if(progessUnuseAttr.includes(val_title) && progessUnuseAttr.includes(val_key)){
            break;
          }
          obj[val_key][`attrs`][val_title] = transformData(
            data["表格信息"][val_title]
          );
          map.set(val_title, val_key);
        } else if (
          val_key
            .replace(/[^a-zA-Z]/g, "")
            .toLowerCase()
            .includes(val_title.replace(/[^a-zA-Z]/g, "").toLowerCase())
        ) {
          obj[val_key][`attrs`][val_title] = transformData(
            data["表格信息"][val_title]
          );
          map.set(val_title, val_key);
        }
      }
    }
  }
  for (let val of titleNameArr) {
    if (!map.has(val) && !videoUnuseAttr.includes(val)) {
      obj[val] = transformData(data["表格信息"][val]);
    }
  }
}

//去掉数组中指定元素
function removeElement(arr, element) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === element) {
      // 判断当前元素是否是要去掉的元素
      arr.splice(i, 1); // 从数组中去掉该元素
      i--; // 指针回退一位，防止遗漏其他元素
    }
  }
  return arr;
}
