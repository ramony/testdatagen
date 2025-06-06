import myfaker from "./myfaker.js";
import vm from "vm";

const rand = (min, max) => Math.random() * (max - min) + min
const randPow = (min, max) => {
  const value = Math.random() * (max - min) + min
  if (value < 0) {
    return -1 * Math.pow(10, -value);
  } else {
    return Math.pow(10, value);
  }
}

const getType = (o) => Object.prototype.toString.call(o).match(/^\[object\s(.*)\]$/)[1];

Object.prototype.map = function (fn) {
  return Object.fromEntries(Object.entries(this).map(
    ([k, v], i) => [k, fn(v, k)]
  ));
}

/***
 * Example: 
 * {
 *   "id": "null",
 *   "task_name": "randomString(1,255)",
 *  "start_date": "randomDate(-7,7)",
 *   "end_date": "randomDate(-7,7)",
 *   "priority": "seqInt(0,100)",
 *   "estimated_time": "randomDecimal(-10,10, 30, 2, 'pow')",
 *   "is_important": "randomInt(0,100)",
 *   "task_description": "randomString(1,20)",
 *   "created_at": "randomTimestamp(0,7)",
 *   "updated_at": "randomTimestamp(0,7)",
 *   "assigned_to": "get('task_name') + get('priority')"
 * }
 */
const defaultContext = {
  get(field) {
    return this.row[field];
  },
  randomInt(min, max, type) {
    let result = type == 'pow' ? randPow(min, max) : rand(min, max);
    return Math.floor(result);
  },
  seqInt(min, max) {
    let current = this.global[this.field];
    if (current == undefined || current > max) {
      current = min;
    }
    this.global[this.field] = current + 1;
    return current;
  },
  random(array) {
    return array[Math.floor(rand(0, array.length))];
  },
  seq(array) {
    let current = this.global[this.field];
    if (current == undefined || current > array.length - 1) {
      current = 0;
    }
    this.global[this.field] = current + 1;
    return array[current];
  },
  randomDouble(min, max) {
    return rand(min, max);
  },
  randomDecimal(min, max, maxLen, floatLen, type) {
    const lenMax = Math.pow(10, maxLen) - 1;
    const floatScale = Math.pow(10, floatLen)
    let result = Math.min(type == 'pow' ? randPow(min, max) : rand(min, max), lenMax);
    return Math.floor(result * floatScale) / floatScale
  },
  randomString(min, max) {
    const len = Math.floor(rand(min, max));
    return myfaker.randomChinese(len)
  },
  randomDate(min, max) {
    const time = new Date().getTime();
    const offset = Math.floor(rand(min, max) * 24 * 3600000)
    return new Date(time + offset);
  },
  randomTimestamp(min, max) {
    const time = new Date().getTime();
    const offset = Math.floor(rand(min, max) * 24 * 3600000)
    return new Date(time + offset);
  }
}

const createInitFunction = (field, type) => {
  if (type.includes("int")) {
    return "randomInt(0,100)";
  } else if (type.includes("decimal")) {
    const [_, intLen, floatLen] = type.match(new RegExp("decimal\\(([0-9]+)[ ,]+([0-9]+)"))
    return `randomDecimal(0,5000000000, ${intLen - floatLen}, ${floatLen})`;
  } else if (type.includes("varchar")) {
    const [_, len] = type.match(new RegExp("varchar\\(([0-9]+)\\)"))
    return `randomString(1,${len})`;
  } else if (type.includes("text")) {
    return "randomString(1,99)";
  } else if (type.includes("date")) {
    return "randomDate(-7,7)";
  } else if (type.includes("timestamp")) {
    return "randomTimestamp(-7,7)";
  } else {
    return "'other'"
  }
}

function createData(count, fieldNameList, configData) {
  const result = [];
  const context = { global: {} }
  for (const key in defaultContext) {
    context[key] = defaultContext[key].bind(context)
  }
  for (let i = 0; i < count; i++) {
    var fieldValueList = [];
    context.row = {}
    for (const field of fieldNameList) {
      const expression = configData[field];
      if (expression == undefined) {
        throw new Error(`字段${field}生成规则未定义`);
      }

      context.field = field;
      let value = runIt(expression, context);
      if (['Object', 'Array'].includes(getType(expression))) {
        value = JSON.stringify(value);
      }
      fieldValueList.push(value);
      context.row[field] = value;
    }
    result.push(fieldValueList);
  }
  return result;
}

const runScript = (expression, context) => {
  if (!expression) {
    return expression;
  }
  const script = new vm.Script(expression);
  const result = script.runInNewContext(context);
  return result;
}


function runIt(expression, context) {
  let result;
  switch (getType(expression)) {
    case 'Object':
      const meta = runScript(expression.meta, { meta: (genType, min, max) => ({ genType, min, max }) });
      if (meta?.genType == 'array') {
        const count = Math.floor(rand(meta.min, meta.max));
        result = new Array(count).fill(0).map((_) => runIt(expression['exp'], context));
      } else if (meta?.genType == 'object') {
        const count = rand(meta.min, meta.max);
        result = {};
        for (let i = 0; i < count; i++) {
          const key = runIt(expression['keyExp'], context);
          const value = runIt(expression['keyExp'], context);
          result[key] = value;
        }
      } else {
        result = expression.map(v => runIt(v, context));
      }
      break;
    case 'Array':
      result = expression.map(it => runIt(it, context));
      break;
    default:
      result = runScript(expression, context);
  }
  return result;
}

export { createInitFunction, createData }