import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(repositoryRoot, "src/data/kotlinCodebase.ts");
const androidRoot = resolve(repositoryRoot, "nova2-android");
const checkOnly = process.argv.includes("--check");
const writeFiles = process.argv.includes("--write");

if (checkOnly === writeFiles || process.argv.length !== 3) {
  throw new Error(
    "Choose exactly one mode: --check or --write.",
  );
}

const catalogSource = readFileSync(catalogPath, "utf8");
const declaration =
  "const EMBEDDED_KOTLIN_ANDROID_PROJECT: KotlinSourceFile[] = ";
const declarationStart = catalogSource.indexOf(declaration);

if (declarationStart === -1) {
  throw new Error(`Embedded Android project declaration not found in ${catalogPath}`);
}

const arrayStart = catalogSource.indexOf("[", declarationStart + declaration.length);
const arrayEnd = catalogSource.indexOf("\n];", arrayStart);

if (arrayStart === -1 || arrayEnd === -1) {
  throw new Error("Embedded Android project array is incomplete.");
}

const embeddedArray = catalogSource
  .slice(arrayStart, arrayEnd)
  .trimEnd()
  .replace(/,\s*$/, "");
const files = JSON.parse(`${embeddedArray}]`);
if (!Array.isArray(files) || files.length === 0) {
  throw new Error("Embedded Android project has no source files.");
}

const seenPaths = new Set();
const materializedFiles = files.map((file) => {
  if (
    typeof file.path !== "string" ||
    !file.path.startsWith("app/") ||
    file.path.split("/").some((part) => part === ".." || part === "." || part === "")
  ) {
    throw new Error(`Unsafe embedded Android path: ${String(file.path)}`);
  }
  if (seenPaths.has(file.path)) {
    throw new Error(`Duplicate embedded Android path: ${file.path}`);
  }
  if (typeof file.code !== "string") {
    throw new Error(`Missing source text for embedded file: ${file.path}`);
  }
  seenPaths.add(file.path);

  let code = file.code;
  if (
    file.path ===
    "app/src/main/java/com/nova/anime/nova2/core/session/SessionViewModel.kt"
  ) {
    const invalidReturn = "}.filter { it.isDigit() }.take(6)";
    const validReturn = `${invalidReturn}.joinToString(separator = "")`;
    const occurrences = code.split(invalidReturn).length - 1;

    if (occurrences === 1) {
      code = code.replace(invalidReturn, validReturn);
    } else if (occurrences !== 0 || !code.includes(validReturn)) {
      throw new Error("Embedded verification-code source is not in a known state.");
    }
  }

  return {
    path: file.path,
    fullPath: resolve(androidRoot, file.path),
    code,
  };
});

const isInsideAndroidRoot = (path) => {
  const relativePath = relative(androidRoot, path);
  return relativePath !== "" && relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`);
};

const kotlinSourceRoot = resolve(androidRoot, "app/src/main/java");
const listKotlinFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return listKotlinFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".kt") ? [entryPath] : [];
  });

const expectedKotlinPaths = new Set(
  materializedFiles
    .filter((file) => file.path.endsWith(".kt"))
    .map((file) => file.fullPath),
);
const extraKotlinFiles = listKotlinFiles(kotlinSourceRoot).filter(
  (path) => !expectedKotlinPaths.has(path),
);

if (extraKotlinFiles.length > 0) {
  throw new Error(
    `Android source files are missing from the embedded catalog:\n${extraKotlinFiles
      .map((path) => `- ${relative(androidRoot, path)}`)
      .join("\n")}`,
  );
}

const mismatches = [];
for (const file of materializedFiles) {
  if (!isInsideAndroidRoot(file.fullPath)) {
    throw new Error(`Resolved path escaped Android project: ${file.path}`);
  }

  if (checkOnly) {
    let current;
    try {
      current = readFileSync(file.fullPath, "utf8");
    } catch {
      mismatches.push(file.path);
      continue;
    }
    if (current !== file.code) mismatches.push(file.path);
    continue;
  }

  mkdirSync(dirname(file.fullPath), { recursive: true });
  writeFileSync(file.fullPath, file.code);
}

if (checkOnly && mismatches.length > 0) {
  console.error("Embedded Kotlin sources differ from the Android build tree:");
  for (const path of mismatches) console.error(`- ${path}`);
  process.exitCode = 1;
} else {
  console.log(
    `${checkOnly ? "Verified" : "Materialized"} ${materializedFiles.length} embedded Android files.`,
  );
}
