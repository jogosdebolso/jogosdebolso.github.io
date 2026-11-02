import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const memoryPath = resolve(process.cwd(), ".github/project-memory.md");
const memory = readFileSync(memoryPath, "utf8");

process.stdout.write(
  `${JSON.stringify({ systemMessage: `Project memory:\n${memory}` })}\n`,
);
