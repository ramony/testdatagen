import path from 'path';

import settings from './settings.js';

import io from './lib/io.js';
import Mysql from './lib/mysql.js';
import { createData, createInitFunction } from "./lib/expression.js";


async function main() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.log('使用方法: node generate.js taskname');
    return;
  }
  io.mkdir("config")
  const [taskConfig, taskConfigExist] = io.tryReadYAML(settings.taskFilePath, settings.defaultTaskSetting);
  if (!taskConfigExist) {
    console.log(`创建任务配置文件${settings.taskFilePath},请配置任务信息`);
  }

  const [dbConfigMap, dbConfigExist] = io.tryReadYAML(settings.databaseJsonFilePath, settings.defaultDatabaseSetting);
  if (!dbConfigExist) {
    console.log(`创建数据库配置文件${settings.databaseJsonFilePath},请配置数据库信息`);
  }

  const [presetConfig, presetConfigExist] = io.tryReadYAML(settings.presetJsonFilePath, settings.defaultPresetSetting);
  if (!presetConfigExist) {
    console.log(`创建数据库预设字段配置文件${settings.databaseJsonFilePath},请配置预设信息`);
  }
  if (!taskConfigExist || !dbConfigExist || !presetConfigExist) {
    return;
  }

  const taskName = args[0];
  const task = taskConfig[taskName];
  if (!task) {
    console.log(`任务${taskName}不存在`);
    return;
  }

  const dbConfig = dbConfigMap[task.database];
  if (!dbConfig) {
    console.log(`数据库定义${task.database}不存在`);
    return;
  }

  const table = task.table;
  console.log(`数据库表      : ${task.database} - ${table}`);
  const db = new Mysql(dbConfig);
  await db.connect();
  const fields = await db.query(`DESCRIBE ${table}`, []);

  const tableConfigPath = `config/table/${table}.yaml`
  let [configData, exist] = io.tryReadYAML(tableConfigPath)
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
    io.writeYAML(tableConfigPath, configData);
  } else {
    const fieldNameList = fields.map(it => it.Field);
    console.log('当前数据条数  :', await db.count(table));
    console.log('生成的行数    :', task.createCount);
    const data = createData(task.createCount, fieldNameList, configData);
    const updates = await db.batchInsert(table, fieldNameList, data);
    console.log('新增行数      :', updates);
    console.log('结束数据条数  :', await db.count(table));

  }
  await db.close();
}

main()
