var fs = require("fs");
var stdinBuffer = fs.readFileSync(0);
for(let line of stdinBuffer.toString().split("\n")) {
	line = line.trim();
	if (line.startsWith("import ")) continue;
	if (line.startsWith("export ")) line = line.substr(7);
	process.stdout.write(line + "\n");
}