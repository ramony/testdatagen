import path from 'path';

import io from './lib/io.js';
import Mysql from './lib/mysql.js';
import { createData, createInitFunction } from "./lib/expression.js";

// 数据库连接配置
const databaseJsonFilePath = "config/database.json";
const defaultDatabaseSetting = {
  host: 'localhost',
  port: '3306',
  user: 'your_user',
  password: 'your_password',
  database: 'your_database'
};

// 预设字段规则配置
const presetJsonFilePath = "config/preset.json";
const defaultPresetSetting = {
  id: 'null',
};

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.log('使用方法: node generate.js table_name create_count');
    return;
  }
  const table = args[0];
  let createCount = 20;
  if (args.length > 1) {
    createCount = parseInt(args[1])
  }

  const [databaseConfig, dbConfigExist] = io.tryReadJSON(databaseJsonFilePath);
  let ok = true;
  if (!dbConfigExist) {
    io.writeJSON(databaseJsonFilePath, defaultDatabaseSetting);
    console.log(`创建数据库配置文件${databaseJsonFilePath},请配置数据库信息`);
    ok = false;
  }

  const [presetConfig, presetConfigExist] = io.tryReadJSON(presetJsonFilePath);
  if (!presetConfigExist) {
    io.writeJSON(presetJsonFilePath, defaultPresetSetting);
    console.log(`创建数据库预设字段配置文件${databaseJsonFilePath},请配置预设信息`);
    ok = false;
  }
  if (!ok) {
    return;
  }

  const db = new Mysql(databaseConfig);
  await db.connect();
  const fields = await db.query(`DESCRIBE ${table}`, []);

  const tableConfigPath = path.join("tableConfig", table + '.json')
  let [configData, exist] = io.tryReadJSON(tableConfigPath)
  if (!exist) {
    configData = {};
    fields.map(f => {
      if (presetConfig[f.Field]) {
        configData[f.Field] = presetConfig[f.Field];
      } else {
        configData[f.Field] = createInitFunction(f.Field, f.Type);
      }
    })
    io.mkdir(path.dirname(tableConfigPath));
    io.writeJSON(tableConfigPath, configData);
  } else {
    const fieldNameList = fields.map(it => it.Field);
    console.log('表数据条数    :', await db.count(table));
    console.log('生成的行数    :', createCount);
    const data = createData(createCount, fieldNameList, configData);
    io.writeJSON("create.log", data, '');
    const updates = await db.batchInsert(table, fieldNameList, data);
    console.log('插入的行数    :', updates);
  }
  await db.close();
}

main()