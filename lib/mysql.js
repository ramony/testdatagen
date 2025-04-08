import mysql from 'mysql2/promise';

class Mysql {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(this.config);
    } catch (error) {
      console.error('Error connecting to the database:', error);
      throw error;
    }
  }

  async query(sql, values) {
    if (!this.connection) {
      throw new Error('Database connection is not established.');
    }
    try {
      const [rows] = await this.connection.query(sql, values);
      return rows;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  async count(table) {
    let query = `select count(1) as qty from ${table}`;
    const result = await this.query(query, []);
    return result[0].qty;
  }

  async batchInsert(table, fields, data) {
    const fieldsString = fields.join(',')
    let query = `INSERT IGNORE INTO ${table} (${fieldsString}) VALUES ?`;
    const result = await this.query(query, [data]);
    return result;
  }

  async close() {
    if (this.connection) {
      try {
        await this.connection.end();
      } catch (error) {
        console.error('Error closing the database connection:', error);
        throw error;
      }
    }
  }
}

export default Mysql;