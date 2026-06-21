const fs = require('node:fs');
const path = require('node:path');

module.exports = async function afterPack(context) {
  const unpackedNodeModules = path.join(context.appOutDir, 'resources', 'app.asar.unpacked', 'node_modules');
  removeIfExists(path.join(unpackedNodeModules, '@napi-rs'));
};

function removeIfExists(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}
