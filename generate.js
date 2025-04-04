const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { DEFAULT_CONTEXT, createInitFunction } = require("./lib/expression");

// 数据库连接配置
const config = {
  host: 'localhost',
  user: 'ramony',
  password: '123456',
  database: 'testdb',
  port: '3306'
};

function createData(count, fieldNameList, configData) {
  console.log('生成的行数:', count);
  const result = [];
  const context = { global: {} }
  for (const key in DEFAULT_CONTEXT) {
    context[key] = DEFAULT_CONTEXT[key].bind(context)
  }
  for (let i = 0; i < count; i++) {
    var fieldValueList = [];
    context.row = {}
    for (const field of fieldNameList) {
      context.field = field;

      const expression = configData[field];
      const script = new vm.Script(expression);
      const value = script.runInNewContext(context);
      fieldValueList.push(value);

      context.row[field] = value;
    }
    result.push(fieldValueList);
  }
  return result;
}

async function insertData(connection, table, fieldNameList, data) {
  const fieldString = fieldNameList.join(',')
  let query = `INSERT IGNORE INTO ${table} (${fieldString}) VALUES ?`;
  const [result] = await connection.query(query, [data]);
  console.log('插入的行数:', result.affectedRows);
}

async function main(table) {
  const connection = await mysql.createConnection(config);
  const [fields] = await connection.execute(`DESCRIBE ${table}`, [])
  const tableConfigFile = path.join(__dirname, "config", table + '.json')
  if (!fs.existsSync(tableConfigFile)) {
    const configData = {};
    fields.map(f => {
      configData[f.Field] = createInitFunction(f.Field, f.Type);
    })
    fs.mkdirSync(path.join(__dirname, "config"));
    fs.writeFileSync(tableConfigFile, JSON.stringify(configData, '', '  '), 'utf8');
  } else {
    let configData = JSON.parse(fs.readFileSync(tableConfigFile, 'utf8'));
    const fieldNameList = fields.map(it => it.Field);
    const data = createData(100, fieldNameList, configData);
    // console.log(data)
    await insertData(connection, table, fieldNameList, data);
  }
  await connection.end();
}

main('t_test_task_k1')