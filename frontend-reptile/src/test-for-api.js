const puppeteer = require("puppeteer");
const fs = require("fs");
const chineserExg = /[^\u4e00-\u9fa5a-zA-Z0-9]/g; //仅保留中英文字符
let pattern = /open-capacity\/web-view/;
const axios = require("axios");
const regex = /\boffTimeUpdate\b|\boffTimeUpdate\(|\boffTimeUpdate\./; //去掉offTimeUpdate的api
const chinesePattern = /[^\u4e00-\u9fa5]/g; //判断是否仅有中文字符
let paraDescribeTitle = null;
let errorTitle = ["referrerInfo"];

let urls = [];
let url =
  "https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/network/http/tt-request/";
//获取overview列表
let scrape2 = async () => {};

scrape2().then(async (value) => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  //两种结构下，title是一致的
  await page.goto(url);
  await page.waitForSelector("body");

  //标题
  const title = await page.evaluate(() => {
    const div = document.querySelector("div.flex.items-center.justify-between");
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
      function changeTitle(oldName) {
        switch (oldName) {
          case "参数说明":
            return "paraDescribe";
          case "回调成功":
            return "successcallback";
          case "回调失败":
            return "failcallback";
          case "返回值":
            return "returnValue";
          case "属性":
            return "attritube";
          case "方法":
            return "method";
          default:
            return oldName;
        }
      }

      const tables = document.querySelectorAll("table");
      const data = {};
      let lastTitle = null; //用来保存标题名，在出现同样标题名的时候做“-1”处理
      tables.forEach((table) => {
        let titleIndex = 1,
          pName = null;
        let previousSibling = table.previousElementSibling;
        let h3Title = "",
          h2Title = "",
          h4Title = "";
        while (previousSibling) {
          if (previousSibling.tagName == "H4") {
            if (!h4Title) {
              h4Title = previousSibling.textContent.trim();
            }
          } else if (previousSibling.tagName == "H3") {
            if (h4Title) {
              h3Title = `${previousSibling.textContent.trim()}-${h3Title}`;
            } else if (!h3Title) {
              h3Title = previousSibling.textContent.trim();
            }
          } else if (previousSibling.tagName == "P") {
            if (titleIndex == 1) {
              pName = previousSibling.textContent
                .trim()
                .replace(/[^A-Za-z]/g, "")
                .toLowerCase(); //P标签仅保留英文字符
            }
            console.log("ppp", pName);
          } else if (previousSibling.tagName == "H2") {
            if (h3Title) {
              h2Title = `${previousSibling.textContent.trim()}-${h3Title}`;
            } else if (h4Title) {
              h2Title = `${previousSibling.textContent.trim()}-${h4Title}`;
            } else {
              h2Title = previousSibling.textContent.trim();
            }
            break;
          }
          titleIndex++;
          previousSibling = previousSibling.previousElementSibling;
        }
        const rows = Array.from(table.querySelectorAll("tr"));
        const tableObject = rows.map((row) => {
          const rowData = Array.from(row.querySelectorAll("td, th")).reduce(
            (acc, cell, index) => {
              const header = rows[0]
                .querySelectorAll("th")
                [index].textContent.trim();
              const content = cell.textContent.trim();
              acc[header] = content;
              return acc;
            },
            {}
          );
          return rowData;
        });
        //在这里将中文标题做转换
        if (changeTitle(h2Title) == lastTitle && lastTitle) {
          data[`${changeTitle(h2Title)}-${pName}`] = tableObject;
        } else {
          data[changeTitle(h2Title)] = tableObject;
        }
        lastTitle = changeTitle(h2Title);
      });
      return data;
    });

    data["表格数据"] = tableData;

    const jsonData = JSON.stringify(data, null, 2);
    // console.log("--爬取数据结果", jsonData);

    if (data["表格信息"] || data["表格数据"]) {
      result = markDownToDSL(data);
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
    //   const jsonData = JSON.stringify(result, null, 2);
    //   axios({
    //     method: "post",
    //     url: "http://localhost:9080",
    //     headers: { "Content-Type": "application/json" },
    //     data: jsonData,
    //   })
    //     .then((response) => {
    //       console.log("success");
    //     })
    //     .catch((error) => {
    //       console.log("error");
    //     });
    //   fs.writeFile(
    //     `${__dirname}/dyAPITabledata/${title}.json`,
    //     jsonData,
    //     function (error) {
    //       if (error) {
    //         console.log(`写入${title}失败`, error);
    //       } else {
    //         console.log(`写入${title}成功`);
    //       }
    //     }
    //   );
  } else {
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
        headingElement.querySelector("h2");
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
    console.log("titleList---", introduceList);

    let attribute = {}; //组件详情中的h3标题，如xxx的合法值之类

    attribute["说明"] = introduce;
    let h3TitleArr = [];

    for (let i = 0; i < introduceList.length; i++) {
      if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "回调成功"
      ) {
        introduceList[i] = "successcallback";
        h3TitleArr.push(introduceList[i]);
      } else if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "回调失败"
      ) {
        introduceList[i] = "failcallback";
        h3TitleArr.push(introduceList[i]);
      } else if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "参数说明"
      ) {
        introduceList[i] = "paraDescribe";
        h3TitleArr.push(introduceList[i]);
      } else if (
        introduceList[i]
          .replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "")
          .includes("参数说明") &&
        i == 0
      ) {
        let separateArr = introduceList[i].split("-");
        paraDescribeTitle = separateArr[1]; //单入参的api，保留name，后续手动加入
        introduceList[i] = "paraDescribe";
        h3TitleArr.push(introduceList[i]);
      } else if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "方法"
      ) {
        introduceList[i] = "method";
        h3TitleArr.push(introduceList[i]);
      } else if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "属性"
      ) {
        introduceList[i] = "attribute";
        h3TitleArr.push(introduceList[i]);
      } else if (
        introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "返回值"
      ) {
        introduceList[i] = "returnValue";
        h3TitleArr.push(introduceList[i]);
      } else {
        h3TitleArr.push(introduceList[i]);
      }
    }

    attribute["二级表格种类"] = h3TitleArr.filter((item) => item !== "");
    console.log("二级表格种类--", attribute["二级表格种类"]);
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

    const jsonData = JSON.stringify(data, null, 2);
    console.log("--爬取数据结果", jsonData);

    let result = {};
    //dsl转换
    if (data["表格信息"]) {
      result = changeToDSL(data);
      // result["introduce"] = introduce.toString();
      result["introduce"] = "test-introduce";
      result["version"] = version;
      result["platform"] = "douyin";
      result["key"] = result["ComponentName"].replace(/[^a-zA-Z]/g, "");
    } else {
      result["ComponentName"] = data["其他信息"]["组件名称"];
      result["key"] = data["其他信息"]["组件名称"].replace(/[^a-zA-Z]/g, "");
      // result["introduce"] = introduce.toString();
      result["introduce"] = "test-introduce";
      result["version"] = version;
      result["platform"] = "douyin";
      result.attrs = {};
    }

    //   // 将二维数组转换为 JSON 字符串
    //   const jsonData = JSON.stringify(result, null, 2);
    //   axios({
    //     method: "post",
    //     url: "http://localhost:9010",
    //     headers: { "Content-Type": "application/json" },
    //     data: result,
    //   })
    //     .then((response) => {
    //       console.log("success");
    //     })
    //     .catch((error) => {
    //       console.log("error");
    //     });
    //   fs.writeFile(
    //     `${__dirname}/dyAPITabledata/${data["其他信息"]["组件名称"]}.json`,
    //     jsonData,
    //     function (error) {
    //       if (error) {
    //         console.log(`写入${data["其他信息"]["组件名称"]}失败`, error);
    //       } else {
    //         console.log(`写入${data["其他信息"]["组件名称"]}成功`);
    //       }
    //     }
    //   );
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
    case "属性":
      return "name";
    case "属性名":
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
    case "说明":
      return "illustrate";
    case "默认值":
      return "defalutValue";
    case "参数":
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

function markDownToDSL(obj) {
  console.log("11111", JSON.stringify(obj, null, 2));
  const result = {
    ComponentName: obj["标题"],
    version: obj["version"],
    introduce: obj["introduce"],
    attrs: {},
  };
  for (let val_ in obj["表格数据"]) {
    let newArr = [];
    result.attrs[val_] = {};
    let arr = obj["表格数据"][val_];
    for (const val of arr) {
      if (arr.indexOf(val) == 0) {
      } else {
        let attr = {};
        for (const key in val) {
          if (key.replace(chinesePattern, "") == "方法名") {
            attr["name"] = val[key];
          } else if (key.replace(chinesePattern, "") == "属性名") {
            attr["name"] = val[key];
          } else if (key.replace(chinesePattern, "") == "说明") {
            attr["illustrate"] = val[key];
          } else if (key.replace(chinesePattern, "") == "最低支持版本") {
            attr["version"] = val[key];
          } else if (key.replace(chinesePattern, "") == "类型") {
            attr["type"] = val[key];
          } else if (key.replace(chinesePattern, "") == "默认值") {
            attr["defaultValue"] = val[key];
          } else if (key.replace(chinesePattern, "") == "必填") {
            attr["required"] = val[key];
          } else if (key.replace(chinesePattern, "") == "参数") {
            attr["args"] = val[key];
          } else if (key.replace(chinesePattern, "") == "描述") {
            attr["illustrate"] = val[key];
          } else {
            attr[key] = val[key];
          }
        }
        newArr.push(attr);
      }
    }
    result.attrs[val_]["name"] = val_;
    result.attrs[val_]["attrs"] = newArr;
  }
  console.log("3333", JSON.stringify(result, null, 2));
  addChildAttr(result);
  console.log("555", JSON.stringify(result, null, 2));
  return result;
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
  for (let key_ in obj2["表格信息"]) {
    for (let key in obj2["表格信息"][key_]) {
      if (key != "表头") {
        if (Object.keys(obj2["表格信息"][key_]["表头"]).length == 5) {
          const obj = obj2["表格信息"][key_][key];
          const type = obj["第1行"].replace(chineserExg, "");
          const defaultValue = obj["第2行"].replace(chineserExg, "");
          const required = obj["第3行"].replace(chineserExg, "");
          const illustrate = obj["第4行"].replace(chineserExg, "");
          const version = obj["第5行"].replace(chineserExg, "");
          const attrs = {};
          result.attrs[key_] = {
            type,
            defaultValue,
            required,
            illustrate,
            version,
            attrs,
          };
        } else if (Object.keys(obj2["表格信息"][key_]["表头"]).length == 6) {
          const obj = obj2["表格信息"][key_][key];
          const name = obj["第1行"].replace(chineserExg, "");
          const type = obj["第2行"].replace(chineserExg, "");
          const defaultValue = obj["第3行"].replace(chineserExg, "");
          const required = obj["第4行"].replace(chineserExg, "");
          const illustrate = obj["第5行"].replace(chineserExg, "");
          const version = obj["第6行"].replace(chineserExg, "");
          const attrs = {};
          result.attrs[key_] = {
            name,
            type,
            defaultValue,
            required,
            illustrate,
            version,
            attrs,
          };
        } else if (Object.keys(obj2["表格信息"][key_]["表头"]).length == 3) {
          const obj = obj2["表格信息"][key_][key];
          const method = obj["第1行"].replace(chineserExg, "");
          const illustrate = obj["第2行"].replace(chineserExg, "");
          const version = obj["第3行"].replace(chineserExg, "");
          const attrs = {};
          result.attrs[key_] = {
            method,
            illustrate,
            version,
            attrs,
          };
        } else if (Object.keys(obj2["表格信息"][key_]["表头"]).length == 4) {
          const obj = obj2["表格信息"][key_][key];
          const name = obj["第1行"].replace(chineserExg, "");
          const type = obj["第2行"].replace(chineserExg, "");
          const illustrate = obj["第3行"].replace(chineserExg, "");
          const version = obj["第4行"].replace(chineserExg, "");
          const attrs = {};
          result.attrs[key_] = {
            name,
            type,
            illustrate,
            version,
            attrs,
          };
        }
      }
    }
  }
  for (const detail in result.attrs) {
    for (const val in result.attrs[detail]) {
      if (val != "attrs" && val != "name") {
        delete result.attrs[detail][val];
      }
      result.attrs[detail]["name"] = detail;
    }
  }
  let obj = result.attrs;

  matchTitle(keyName, obj, obj2);
  //   console.log('--match', JSON.stringify(matchTitle(keyName, obj, obj2), null, 2))
  addChildAttr(result);
  return result;
}

function matchTitle(titleNameArr, obj, data) {
  console.log(">>>", data);
  const objArr = Object.keys(obj);
  let delobj = null;

  for (let val_key of objArr) {
    obj[val_key][`attrs`] = transformData(data["表格信息"][val_key]);
  }
}

function addChildAttr(data) {
  if (paraDescribeTitle && data["attrs"]["paraDescribe"]) {
    data["attrs"]["paraDescribe"]["attrs"][0].name = paraDescribeTitle; //api的直接属性没有name，这里加上
  }
  const obj = data.attrs;
  if (Object.values(obj).length == 0) return;
  for (const key in obj) {
    console.log("key", key);
    let separateArr = key.split("-");
    console.log("separateArr", separateArr);
    if (separateArr.length > 3) {
    } else {
      if (key.includes("参数说明") && (separateArr.length == 3 || separateArr.length == 2)) {
        //代表他的h2标签一定是参数说明
        for (const detail of obj["paraDescribe"]["attrs"]) {
          console.log("detail--", detail);
          //从直接属性的arr中找到name和
          if (
            detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
            separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
          ) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
          }
        }
      } else if (key.includes("参数说明") && separateArr.length == 6) {
        //代表他的h2标签一定是参数说明
        for (const detail of obj["paraDescribe"]["attrs"]) {
          console.log("detail--", detail);
          //从直接属性的arr中找到name和
          if (
            detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
            separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
          ) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
          }
        }
      } else if (key.includes("回调成功") && separateArr.length == 2) {
        for (const detail of obj["successcallback"]["attrs"]) {
          //从直接属性的arr中找到name和
          if (
            detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
            separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
          ) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            console.log("---result-detail", detail);
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
          }
        }
      } else if (key.includes("错误说明")) {
        //回调失败-错误说明，放到failcallback的errMsg里面
        for (const detail of obj["failcallback"]["attrs"]) {
          //从直接属性的arr中找到name和
          if ((detail.name = "errMsg")) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            console.log("---result-detail", detail, obj[key]);
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
            return;
          }
        }
      } else if (key.includes("回调失败") && separateArr.length == 2) {
        for (const detail of obj["failcallback"]["attrs"]) {
          //从直接属性的arr中找到name和
          if (
            detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
            separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
          ) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            console.log("---result-detail", detail);
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
          }
        }
      } else if (key.includes("返回值")) {
        for (const detail of obj["returnValue"]["attrs"]) {
          //从直接属性的arr中找到name和
          if (
            detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
            separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
          ) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            console.log("---result-detail", detail);
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
          }
        }
      } else if (key.includes("successcallback") && key != "successcallback") {
        //markdown此时已经转成paraDescribe/successallback/failcallback，因此要用英文来匹配
        for (const detail of obj["successcallback"]["attrs"]) {
          //从直接属性的arr中找到name和
          if (
            detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
              separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase() ||
            detail.type.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
              separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
          ) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            console.log("---result-detail", detail);
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
          }
        }
      } else if (key.includes("failback") && key != "failback") {
        //markdown此时已经转成paraDescribe/successallback/failcallback，因此要用英文来匹配
        for (const detail of obj["successcallback"]["attrs"]) {
          //从直接属性的arr中找到name和
          if (
            detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
              separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase() ||
            detail.type.replace(/[^a-zA-Z]/g, "").toLowerCase() ==
              separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
          ) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            console.log("---result-detail", detail);
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
          }
        }
      }
    }
  }
  console.log("---data", JSON.stringify(data, null, 2));
}

//附属属性的附属属性
function addSecondChild(data) {
  let obj = data["attrs"]["paraDescribe"]["attrs"][0]["attrs"];
  if (!obj) return;
  for (const detail in data) {
    console.log("detail--", detail);
  }
}
