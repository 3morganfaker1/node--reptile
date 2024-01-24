// 引入 jsondiffpatch 库
const jsondiffpatch = require('jsondiffpatch');
const fs = require('fs')
const path = require('path')
const { join } = require("path");
// 创建 jsondiffpatch 实例
const diffpatcher = jsondiffpatch.create();

//1.读取2个文件夹的所有文件路径
const folder1Path = "./src/ComponentTabledata";
const folder2Path = "./src/dyComponentTabledata";
// 读取 folder1 文件夹下的所有文件路径
const folder1Files = fs.readdirSync(folder1Path).map(fileName => join(folder1Path, fileName));
// 读取 folder2 文件夹下的所有文件路径
const folder2Files = fs.readdirSync(folder2Path).map(fileName => join(folder2Path, fileName));

//2.比对相同文件名的文件
const filesDict = {};

folder1Files.concat(folder2Files).forEach(filePath => {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const fileName = filePath.split("/").pop();
  filesDict[fileName] = fileContent;
});

const jsonData = JSON.stringify(filesDict, null, 2);

fs.writeFile(`${__dirname}/APIDiffResult/filesDict.json`, jsonData, function (error) {
    if (error) {
      console.log('写入diff文件失败：', error);
    } else {
      console.log('写入diff文件成功！');
    }
  });

//3.
const diffFiles = [];

// Object.entries(filesDict).forEach(([fileName, fileContent]) => {
//   const file1Path = join(folder1Path, fileName);
//   const file2Path = join(folder2Path, fileName);
//   console.log("--path1", file1Path);
//   console.log("--path2", file2Path)
//   // 检查文件是否存在于2个文件夹中
//   // if (!folder1Files.includes(file1Path) || !folder2Files.includes(file2Path)) {
//   //   console.log("--333")
//   //   return;
//   // }

//   const file1Content = filesDict[fileName];
  // console.log("--",file1Content, filesDict[fileName])
  // const diff = diffpatcher.diff(file1Content, fileContent);
  // console.log("---diff",diff)
  // diffFiles.push({
  //   fileName,
  //   diff
  // });

  // const jsonData = JSON.stringify(diff, null, 2);
  // //把diff内容存入本地文件
  // fs.writeFile(`${__dirname}/APIDiffResult/${fileName}.json`, jsonData, function (error) {
  //   if (error) {
  //     console.log('写入diff文件失败：', error);
  //   } else {
  //     console.log('写入diff文件成功！');
  //   }
  // });
// });






// //先读取文某文件夹内的所有文件
// async function readDirFiles(dir) {
//     try {
//       const files = await fs.promises.readdir(dir);
//       const content = await Promise.all(files.map(file => fs.promises.readFile(path.join(dir, file), 'utf8')));
//     //   console.log(content);
//     } catch (err) {
//       console.error(err);
//     }
//   }
// readDirFiles('./src/ApiTabledata');

// //基于promise封装，读取两个文件夹的内容(相同组件下，ks和dy文件)
// function readFile(path) {
//     return new Promise((resolve, reject) => {
//       fs.readFile(path, (err, data) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(data.toString());
//         }
//       });
//     });
//   }
  
//   async function compareFiles(file1, file2) {
//     try {
//       const content1 = await readFile(file1);
//       const content2 = await readFile(file2);
//       console.log("---content",content1)
//       console.log("type",typeof(JSON.parse(content1)))
//       const diff = diffpatcher.diff(JSON.parse(content1), JSON.parse(content2));
//       console.log("diff2---",JSON.stringify(diff))
//     //   if (content1 === content2) {
//     //     console.log(`${file1} and ${file2} have the same content.`);
//     //   } else {
//     //     console.log(`${file1} and ${file2} have different content.`);
//     //   }
//     } catch (err) {
//       console.error(err);
//     }
//   }
  
  //文件比较入口
//   compareFiles('./src/ApiTabledata/AnimationscaleX.json', './src/ApiTabledata/AnimationscaleY.json');

// // 定义两个 JSON 对象
// const obj1 = { name: 'Alice', age: 30 };
// const obj2 = { name: 'Bob', age: 35 };

// // 比较两个 JSON 对象，生成差异对象
// const diff = diffpatcher.diff(obj1, obj2);

// const html = jsondiffpatch.formatters.html.format(diff, obj1);
// // document.getElementById('diff-container').innerHTML = html;

// // 应用差异对象到另一个 JSON 对象，更新它
// const patchedObj = diffpatcher.patch(obj1, diff);

// console.log(patchedObj); // 输出 { name: 'Bob', age: 35 }
