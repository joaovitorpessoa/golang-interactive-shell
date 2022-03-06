const { exec: execWithoutPromise } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const TEMPLATE_FILE_PATH = path.join(__dirname, "..", "assets", "template.go");

const template = fs.readFileSync(TEMPLATE_FILE_PATH).toString().split("\n");

const exec = (cmd) =>
  new Promise((resolve, _) =>
    execWithoutPromise(cmd, (_, stdout, stderr) => {
      if (stderr && !stderr.match(/(but)[ ](not)[ ](used)/)) {
        console.log(stderr);
        const indexOfLastStatement = template.length - 2;
        template.splice(indexOfLastStatement, 1); // remove invalid statement
      }

      resolve(stdout);
    })
  );

const input = () => {
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, _) =>
    prompt.question("> ", (code) => {
      prompt.close();
      resolve(code);
    })
  );
};

const getGoLangVersion = async () => {
  const goVersion = await exec("go version");

  return goVersion
    .match(/(\w+[.]?){3}(?=[ ](linux|windows))/)[0]
    .replace(/(go)/, "v");
};

const buildStatement = (code) => {
  if (code === ".exit") {
    process.exit();
  }

  const lineToWriteInTemplate = template.length - 1;

  template.splice(lineToWriteInTemplate, 0, code);

  const timestamp = new Date().toISOString();
  const scriptGoTempPath = path.join(__dirname, "tmp", `${timestamp}.go`);
  fs.writeFileSync(scriptGoTempPath, template.join("\n"));

  return scriptGoTempPath;
};

const runStatement = async (goTempFilePath) =>
  await exec(`go run ${goTempFilePath}`);

const sanitizeTmpFolder = (path) => fs.rm(path, () => {});

let lastStdoutIndex;
const printLastStdout = (newStdout) => {
  if (newStdout) {
    !lastStdoutIndex
      ? console.log(newStdout)
      : console.log(newStdout.slice(lastStdoutIndex));

    lastStdoutIndex = newStdout.length;
  }
};

async function main() {
  console.log(`Welcome to Go Shell (${await getGoLangVersion()})`);

  while (true) {
    const code = await input();
    const goScriptTempFilePath = buildStatement(code);
    const stdout = await runStatement(goScriptTempFilePath);

    printLastStdout(stdout);

    if (!process.env.NODE_ENV) sanitizeTmpFolder(goScriptTempFilePath);
  }
}

main();
