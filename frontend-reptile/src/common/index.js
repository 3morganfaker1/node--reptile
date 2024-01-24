const fs = require("fs");
const axios = require("axios");
const chineserExg = /[^\u4e00-\u9fa5a-zA-Z0-9]/g; //仅保留中英文字符
let paraDescribeTitle = null;

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

function matchTitle(obj, data) {
  const objArr = Object.keys(obj);

  for (let val_key of objArr) {
    obj[val_key][`attrs`] = transformData(data["表格信息"][val_key]);
  }
}

function markDownToDSL(obj) {
  const result = {
    ComponentName: obj["标题"],
    version: obj["version"],
    introduce: obj["introduce"],
    attrs: {},
  };
  for (const val_ in obj["表格数据"]) {
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
          }
        }
        newArr.push(attr);
      }
    }
    result.attrs[val_]["name"] = val_;
    result.attrs[val_]["attrs"] = newArr;
  }
  addChildAttr(result);
  return result;
}

function writeFile(path, data) {
  // 将二维数组转换为 JSON 字符串
  const jsonData = JSON.stringify(data, null, 2);

  // 将 JSON 字符串写入本地文件
  fs.writeFile(path, jsonData, function (error) {
    if (error) {
      console.log("写入文件失败：", error);
    } else {
      console.log(`写入${path}文件成功！`);
    }
  });
}

function addChildAttr(data) {
  if (paraDescribeTitle && data["attrs"]["paraDescribe"]) {
    data["attrs"]["paraDescribe"]["attrs"][0].name = paraDescribeTitle; //api的直接属性没有name，这里加上
  }
  const obj = data.attrs;
  if (Object.values(obj).length == 0) return;
  for (const key in obj) {
    let separateArr = key.split("-");
    if (separateArr.length > 3) {
    } else {
      if (
        key.includes("参数说明") &&
        (separateArr.length == 2 || separateArr.length == 3)
      ) {
        putChildAttrToParent("paraDescribe", separateArr, key, obj)
        //代表他的h2标签一定是参数说明
      } else if (key.includes("回调成功") && separateArr.length == 2) {
        putChildAttrToParent("successcallback", separateArr, key, obj)
      } else if (key.includes("错误说明")) {
        //回调失败-错误说明，放到failcallback的errMsg里面
        // putChildAttrToParent("failcallback", separateArr, key, obj)
        for (const detail of obj["failcallback"]["attrs"]) {
          //从直接属性的arr中找到name和
          if ((detail.name = "errMsg")) {
            //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
            detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
            delete obj[key]; //在原table中删掉子属性表格
            return;
          }
        }
      } else if (key.includes("回调失败") && separateArr.length == 2) {
        putChildAttrToParent("failcallback", separateArr, key, obj)
      } else if (key.includes("返回值")) {
        putChildAttrToParent("returnValue", separateArr, key, obj)
      } else if (key.includes("successcallback") && key != "successcallback") {
        //markdown此时已经转成paraDescribe/successallback/failcallback，因此要用英文来匹配
        putChildAttrToParent("successcallback", separateArr, key, obj)
      } else if (key.includes("failcallback") && key != "failcallback") {
        //markdown此时已经转成paraDescribe/successallback/failcallback，因此要用英文来匹配
        putChildAttrToParent("failcallback", separateArr, key, obj)
      }
    }
  }
}

function putChildAttrToParent(parentAttr, separateArr, key, obj) {
  for (const detail of obj[parentAttr]["attrs"]) {
    //从直接属性的arr中找到name和
    if (
      detail.name.replace(/[^a-zA-Z]/g, "").toLowerCase() == //匹配name
        separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase() ||
      detail.type.replace(/[^a-zA-Z]/g, "").toLowerCase() == //匹配type
        separateArr[1].replace(/[^a-zA-Z]/g, "").toLowerCase()
    ) {
      //原标题是通过“xx-xx-xx”的形式，跟直接属性比，只需要取第二个xx的内容做比较。不正则匹配不上。。
      detail["attrs"] = obj[key].attrs; //把对应的子属性表格，放到直接属性的attrs里面
      delete obj[key]; //在原table中删掉子属性表格
    }
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

  matchTitle(obj, obj2);
  addChildAttr(result);
  return result;
}

function sendRequest(data) {
  axios({
    method: "post",
    url: "http://localhost:9020",
    headers: { "Content-Type": "application/json" },
    data: data,
  })
    .then((response) => {
      console.log("success");
    })
    .catch((error) => {
      console.log("error");
    });
}

async function matchTableAndTitleInMarkdown() {
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
    //在这里将中文标题做转换，有些表格无标题，只能保留p标签的innerText
    if (changeTitle(h2Title) == lastTitle && lastTitle) {
      data[`${changeTitle(h2Title)}-${pName}`] = tableObject;
    } else {
      data[changeTitle(h2Title)] = tableObject;
    }
    lastTitle = changeTitle(h2Title);
  });
  return data;
}

function convertTitleName(introduceList) {
  let h3TitleArr = [];
  for (let i = 0; i < introduceList.length; i++) {
    if (introduceList[i].replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") == "回调成功") {
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
  return h3TitleArr;
}

module.exports = {
  changeName,
  transformData,
  matchTitle,
  markDownToDSL,
  writeFile,
  changeToDSL,
  sendRequest,
  matchTableAndTitleInMarkdown,
  convertTitleName,
};
