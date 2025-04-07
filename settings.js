
const settings = {
  taskFilePath: "config/task.yaml",
  defaultTaskSetting: {
    task1: {
      database: "database1",
      table: "your_table",
      createCount: 10
    }
  },
  // 数据库连接配置
  databaseJsonFilePath: "config/database.yaml",
  defaultDatabaseSetting: {
    database1: {
      host: 'localhost',
      port: '3306',
      user: 'your_user',
      password: 'your_password',
      database: 'your_database'
    }
  },

  // 预设字段规则配置
  presetJsonFilePath: "config/preset.yaml",
  defaultPresetSetting: {
    id: 'null',
  }

}

export default settings;