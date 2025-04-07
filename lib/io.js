import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// 获取入口脚本的路径
const entryScriptPath = process.argv[1];
// 将入口脚本的路径转换为文件路径
const entryFilePath = fileURLToPath(`file://${entryScriptPath}`);
// 获取入口 JS 文件所在的目录路径
const __entrypath = path.dirname(entryFilePath);

const io = {
  write(filePath, data) {
    filePath = path.join(__entrypath, filePath)
    fs.writeFileSync(filePath, data, 'utf8');
  },
  writeJSON(filePath, data, formatter) {
    if (formatter == undefined) {
      formatter = '  '
    }
    this.write(filePath, JSON.stringify(data, '', formatter));
  },
  writeYAML(filePath, data) {
    this.write(filePath, yaml.dump(data));
  },
  read(filePath) {
    filePath = path.join(__entrypath, filePath)
    return fs.readFileSync(filePath, 'utf8');
  },
  tryRead(filePath) {
    if (!exists(filePath)) {
      return [null, false]
    }
    return [this.read(filePath), true];
  },
  readJSON(filePath) {
    return JSON.parse(this.read(filePath));
  },
  tryReadJSON(filePath, initData) {
    if (!this.exists(filePath)) {
      if (initData != undefined) {
        this.writeJSON(filePath, initData);
      }
      return [null, false]
    }
    return [this.readJSON(filePath), true];
  },
  readYAML(filePath) {
    return yaml.load(this.read(filePath));
  },
  tryReadYAML(filePath, initData) {
    if (!this.exists(filePath)) {
      if (initData != undefined) {
        this.writeYAML(filePath, initData);
      }
      return [null, false]
    }
    return [this.readYAML(filePath), true];
  },
  exists(filePath) {
    filePath = path.join(__entrypath, filePath)
    return fs.existsSync(filePath)
  },
  mkdir(filePath) {
    filePath = path.join(__entrypath, filePath)
    fs.mkdirSync(filePath, { recursive: true });
  }
}

export default io