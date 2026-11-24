const fs = require("fs");
const path = require("path");

const configPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-scripts",
  "config",
  "webpackDevServer.config.js"
);

if (!fs.existsSync(configPath)) {
  console.error(
    "Could not find react-scripts webpackDevServer.config.js. Run npm install in the frontend folder first."
  );
  process.exit(1);
}

let source = fs.readFileSync(configPath, "utf8");
const target = /allowedHosts\s*:\s*disableFirewall\s*\?\s*['"]all['"]\s*:\s*\[\s*allowedHost\s*\]\s*,/;

if (target.test(source)) {
  source = source.replace(
    target,
    "allowedHosts: disableFirewall ? 'all' : [allowedHost || 'localhost'],"
  );
  fs.writeFileSync(configPath, source, "utf8");
  console.log("NexusHire: applied the Create React App allowedHosts compatibility fix.");
} else if (/allowedHosts\s*:\s*disableFirewall\s*\?\s*['"]all['"]\s*:\s*\[\s*allowedHost\s*\|\|\s*['"]localhost['"]\s*\]/.test(source)) {
  console.log("NexusHire: allowedHosts compatibility fix is already applied.");
} else {
  console.warn(
    "NexusHire: the expected CRA allowedHosts line was not found. No dependency file was changed."
  );
}
