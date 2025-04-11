import settings from './settings.js';

import io from './lib/io.js';
import { appDir, args } from './lib/process.js';
import Mysql from './lib/mysql.js';
import { createData, createInitFunction } from "./lib/expression.js";

async function main() {
  if (args.length < 1) {
    console.log('使用方法: node generate.js taskname');
    return;
  }
  io.mkdir(`config/table`)
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

  let [taskName, createCount] = args;
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
  if (!createCount) {
    createCount = task.createCount;
  }

  const table = task.table;
  let t = new Date().getTime();
  console.log(`数据库表      : ${task.database} - ${table}`);
  const db = new Mysql(dbConfig);
  await db.connect();
  const fields = await db.query(`DESCRIBE ${table}`, []);

  const tableConfigPath = `config/table/${table}.yaml`
  let [configData, exist] = io.tryReadYAML(tableConfigPath)
  if (!exist) {
    configData = {};
    fields.map(f => {
      if (presetConfig[f.Field] != undefined) {
        configData[f.Field] = presetConfig[f.Field];
      } else {
        configData[f.Field] = createInitFunction(f.Field, f.Type);
      }
    })
    io.writeYAML(tableConfigPath, configData);
  } else {
    const fieldNameList = fields.map(it => it.Field);
    console.log('当前数据条数  :', await db.count(table));
    console.log('生成的行数    :', createCount);
    let updates = 0;
    let insertId = -1;
    while (createCount > 0) {
      const data = createData(Math.min(createCount, settings.batchSize), fieldNameList, configData);
      const result = await db.batchInsert(table, fieldNameList, data);
      updates += result.affectedRows;
      createCount -= settings.batchSize;
      if (insertId < 0) {
        insertId = result.insertId;
      }
    }
    console.log('起始ID        :', insertId);

    console.log('新增行数      :', updates);
    console.log('结束数据条数  :', await db.count(table));
    console.log('耗时          :', new Date().getTime() - t);
  }
  await db.close();
}

main()
