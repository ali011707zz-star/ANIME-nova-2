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
const syncFromAndroid = process.argv.includes("--sync-from-android");

if (
  [checkOnly, writeFiles, syncFromAndroid].filter(Boolean).length !== 1 ||
  process.argv.length !== 3
) {
  throw new Error(
    "Choose exactly one mode: --check, --write, or --sync-from-android.",
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
    const validOccurrences = code.split(validReturn).length - 1;
    const invalidOccurrences =
      code.split(invalidReturn).length - 1 - validOccurrences;

    if (invalidOccurrences === 1 && validOccurrences === 0) {
      code = code.replace(invalidReturn, validReturn);
    } else if (invalidOccurrences !== 0 || validOccurrences !== 1) {
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

if (syncFromAndroid) {
  const staleDuplicateEntries = files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => file.path.startsWith("app/app/"));
  const sourceFiles = files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => !file.path.startsWith("app/app/"))
    .map(({ file, index }) => ({
      ...file,
      index,
      code: readFileSync(resolve(androidRoot, file.path), "utf8"),
    }));
  const catalogPaths = new Set(sourceFiles.map((file) => file.path));
  const additionalKotlinFiles = listKotlinFiles(kotlinSourceRoot)
    .map((fullPath) => ({
      fullPath,
      path: relative(androidRoot, fullPath).split(sep).join("/"),
    }))
    .filter((file) => !catalogPaths.has(file.path))
    .map((file) => ({
      name: file.path.split("/").at(-1),
      path: file.path,
      language: "kotlin",
      descriptionAr: "شاشة أصلية ضمن تطبيق Anime NOVA لنظام Android.",
      descriptionEn: "Native screen within the Anime NOVA Android app.",
      code: readFileSync(file.fullPath, "utf8"),
    }));

  const objectRanges = [];
  let cursor = arrayStart + 1;
  while (cursor < arrayEnd) {
    while (cursor < arrayEnd && /[\s,]/.test(catalogSource[cursor])) cursor += 1;
    if (cursor >= arrayEnd) break;
    if (catalogSource[cursor] !== "{") {
      throw new Error("Unable to locate an embedded Android source object.");
    }

    const start = cursor;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let foundEnd = false;
    for (; cursor < arrayEnd; cursor += 1) {
      const char = catalogSource[cursor];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          objectRanges.push({ start, end: cursor + 1 });
          cursor += 1;
          foundEnd = true;
          break;
        }
      }
    }
    if (!foundEnd) throw new Error("An embedded Android source object is incomplete.");
  }

  if (objectRanges.length !== files.length) {
    throw new Error("Embedded Android object count does not match its parsed catalog.");
  }

  const findStringEnd = (source, start) => {
    if (source[start] !== '"') throw new Error("Expected a JSON string value.");
    let escaped = false;
    for (let index = start + 1; index < source.length; index += 1) {
      const char = source[index];
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') return index;
    }
    throw new Error("An embedded JSON string is incomplete.");
  };
  const replaceCodeValue = (objectSource, code) => {
    for (let index = 0; index < objectSource.length;) {
      if (objectSource[index] !== '"') {
        index += 1;
        continue;
      }
      const keyEnd = findStringEnd(objectSource, index);
      const key = JSON.parse(objectSource.slice(index, keyEnd + 1));
      let colon = keyEnd + 1;
      while (/\s/.test(objectSource[colon] ?? "")) colon += 1;
      if (key === "code" && objectSource[colon] === ":") {
        let valueStart = colon + 1;
        while (/\s/.test(objectSource[valueStart] ?? "")) valueStart += 1;
        const valueEnd = findStringEnd(objectSource, valueStart);
        return objectSource.slice(0, valueStart) +
          JSON.stringify(code) +
          objectSource.slice(valueEnd + 1);
      }
      index = keyEnd + 1;
    }
    throw new Error("Could not locate an embedded Kotlin code field.");
  };

  const sourceFilesByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const syncedObjects = objectRanges.flatMap((range, index) => {
    const sourceFile = sourceFilesByPath.get(files[index].path);
    if (!sourceFile) return [];
    const currentObject = catalogSource.slice(range.start, range.end);
    return [replaceCodeValue(currentObject, sourceFile.code)];
  });
  const appendedObjects = additionalKotlinFiles.map(
    (file) => JSON.stringify(file, null, 2).replace(/\n/g, "\n  "),
  );
  const arrayObjects = [
    ...syncedObjects.map((objectSource) => `  ${objectSource}`),
    ...appendedObjects.map((objectSource) => `  ${objectSource}`),
  ];
  const syncedCatalog =
    catalogSource.slice(0, arrayStart + 1) +
    `\n${arrayObjects.join(",\n")}\n` +
    catalogSource.slice(arrayEnd + 1);

  writeFileSync(catalogPath, syncedCatalog);
  console.log(
    `Synchronized ${sourceFiles.length} embedded Android files, added ${additionalKotlinFiles.length} Kotlin files, and removed ${staleDuplicateEntries.length} invalid duplicate entries.`,
  );
  process.exit(0);
}

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
