const fs = require('fs');
const path = require('path');

const __entrypath = path.dirname(require.main.filename)

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
  tryReadJSON(filePath) {
    if (!this.exists(filePath)) {
      return [null, false]
    }
    return [this.readJSON(filePath), true];
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

module.exports = io