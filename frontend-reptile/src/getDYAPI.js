const puppeteer = require("puppeteer");
const fs = require("fs");
let pattern = /open-capacity\/web-view/;
const axios = require("axios");
const regex = /\boffTimeUpdate\b|\boffTimeUpdate\(|\boffTimeUpdate\./; //去掉offTimeUpdate的api
const chinesePattern = /[^\u4e00-\u9fa5]/g; //判断是否仅有中文字符
const module2 = require("../src/common/index")

let urls = [];
//获取overview列表
let scrape2 = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(
    "https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/overview"
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
            rowData[`API详情链接`] = hrefString;
          } else {
            rowData[`API描述链接${k}`] = hrefString;
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
      if (table["API详情链接"] && !regex.test(table["API详情链接"])) {
        urls.push({
          url: table["API详情链接"],
          describe: table["第2列"],
        });
      }
    }
  }
  // 将二维数组转换为 JSON 字符串
  // const jsonData = JSON.stringify(data, null, 2);
  //写入本地文件
  module2.writeFile(`${__dirname}/dyListData/dyAPIList.json`,data);


  await browser.close();
  return data;
};

scrape2().then(async (value) => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();

  for (const urlDetail of urls) {
    //两种结构下，title是一致的
    await page.goto(urlDetail.url);
    await page.waitForSelector("body");

    //标题
    const title = await page.evaluate(() => {
      const div = document.querySelector(
        "div.flex.items-center.justify-between"
      );
      if (!div) {
        return;
      }
      return div.innerText;
    });
    if (!title) {
      return;
    }

    const hasElement = await page.evaluate(
      () => document.querySelector("div.markdown-body") !== null
    );

    //判断是否为markdown结构
    if (hasElement) {
      //api的基础库支持版本
      const version = await page.evaluate(() => {
        const div = document.querySelector("blockquote");
        if (!div) {
          return;
        }
        return div.innerText;
      });
      //markdown下的api说明
      const markDownIntroduce = await page.$eval(
        "p:nth-of-type(2)",
        (element) => {
          return element.textContent.trim();
        }
      );

      //markdown结构
      let data = {};
      data["标题"] = title;
      data["version"] = version;
      data["introduce"] = markDownIntroduce;

      const tableData = await page.evaluate(() => {
        module2.matchTableAndTitleInMarkdown();
      });

      data["表格数据"] = tableData;

      // const jsonData = JSON.stringify(markDownToDSL(data), null, 2);

      if (data["表格信息"] || data["表格数据"]) {
        result = module2.markDownToDSL(data);
        result["introduce"] = data["introduce"];
        result["version"] = version;
        result["platform"] = "douyin";
        result["key"] = result["ComponentName"].replace(/[^a-zA-Z]/g, "");
      } else {
        result["ComponentName"] = data["其他信息"]["组件名称"];
        result["key"] = data["其他信息"]["组件名称"].replace(/[^a-zA-Z]/g, "");
        result["introduce"] = data["其他信息"]["说明"];
        result["version"] = version;
        result["platform"] = "douyin";
        result.attrs = {};
      }

      // 将二维数组转换为 JSON 字符串
      // const jsonData = JSON.stringify(result, null, 2);
      // module2.sendRequest(result);
      module2.writeFile(`${__dirname}/dyAPITabledata/${title}.json`,result);
    } else {
      // 使用Page.evaluate方法获取“Text文本”元素的文本内容
      const text = await page.evaluate(() => {
        const div = document.querySelector(
          "div.flex.items-center.justify-between"
        );
        return div.innerText;
      });
      const version = await page.$eval(
        ".ace-line:nth-of-type(1)",
        (element) => {
          return element.textContent.trim();
        }
      );

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
          for (let tableElement of tableElementList) {
            let h4Title = "",
              h3Title = "",
              h5Title = "",
              h2Title = "";
            let headingElement =
              tableElement.closest(".ace-line").previousElementSibling;
            while (headingElement) {
              if (
                headingElement.classList.contains("heading-h5") &&
                headingElement.classList.contains("doc-heading")
              ) {
                if (!h5Title) {
                  h5Title = headingElement.textContent.trim();
                }
              } else if (
                headingElement.classList.contains("heading-h4") &&
                headingElement.classList.contains("doc-heading")
              ) {
                if (h5Title) {
                  h4Title = `${headingElement.textContent.trim()}-${h5Title}`;
                  h5Title = "";
                } else if (!h4Title) {
                  h4Title = headingElement.textContent.trim();
                }
              } else if (
                headingElement.classList.contains("heading-h3") &&
                headingElement.classList.contains("doc-heading")
              ) {
                if (h4Title) {
                  h3Title = `${headingElement.textContent.trim()}-${h4Title}`;
                  h4Title = "";
                } else if (!h3Title) {
                  h3Title = headingElement.textContent.trim();
                }
              } else if (
                headingElement.classList.contains("heading-h2") &&
                headingElement.classList.contains("doc-heading")
              ) {
                if (h3Title) {
                  h2Title = `${headingElement.textContent.trim()}-${h3Title}`;
                  h3Title = "";
                } else {
                  h2Title = headingElement.textContent.trim();
                }
                result.push(h2Title);
                (h2Title = ""), (h3Title = ""), (h4Title = ""), (h5Title = "");
                break;
              }
              headingElement = headingElement.previousElementSibling;
            }
          }
          return result;
        }
      );

      let attribute = {}; //组件详情中的h3标题，如xxx的合法值之类

      attribute["说明"] = introduce;
      const h3TitleArr = module2.convertTitleName(introduceList);

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
        if (text == "tt.getLocation" && tables.indexOf(table) === 0) {
          continue;
        }
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
              } else if (pattern.test(urlDetail.url)) {
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
          attribute["二级表格种类"][index] ==
            attribute["二级表格种类"][index - 1] ||
          attribute["二级表格种类"][index] ==
            attribute["二级表格种类"][index - 2]
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
        result = module2.changeToDSL(data);
        // result["introduce"] = introduce.toString();
        result["introduce"] = urlDetail.describe;
        result["version"] = version;
        result["platform"] = "douyin";
        result["key"] = result["ComponentName"].replace(/[^a-zA-Z]/g, "");
      } else {
        result["ComponentName"] = data["其他信息"]["组件名称"];
        result["key"] = data["其他信息"]["组件名称"].replace(/[^a-zA-Z]/g, "");
        // result["introduce"] = introduce.toString();
        result["introduce"] = urlDetail.describe;
        result["version"] = version;
        result["platform"] = "douyin";
        result.attrs = {};
      }

      // 将二维数组转换为 JSON 字符串
      // const jsonData = JSON.stringify(result, null, 2);
      // module2.sendRequest(result);
      module2.writeFile(`${__dirname}/dyAPITabledata/${data["其他信息"]["组件名称"]}.json`, result);
    }
  }

  await browser.close();
});

