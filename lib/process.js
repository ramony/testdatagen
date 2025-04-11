import path from 'path';
import { fileURLToPath } from 'url';

// 获取入口脚本的路径
const entryScriptPath = process.argv[1];
// 将入口脚本的路径转换为文件路径
const entryFilePath = fileURLToPath(`file://${entryScriptPath}`);
// 获取入口 JS 文件所在的目录路径
const appDir = path.dirname(entryFilePath);

const args = process.argv.slice(2)

export { appDir, args }