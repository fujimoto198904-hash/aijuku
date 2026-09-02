import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_ROOT = path.join(REPO_ROOT, 'public', 'downloads', 'demo-data');
const NOTICE = '練習用・すべて架空・外部送信禁止';

const EXPECTED_PACKAGES = [
  {
    industry: 'salon',
    label: 'ひだまり美容室',
    company: '株式会社ひだまりデモサロン（架空）',
    business: '美容室2店舗の運営、予約、施術、物販、集客',
    file: 'salon-demo-data-full-v1.zip',
    root: '美容室デモデータ',
    sheets: 44,
    dataRows: 130571,
  },
  {
    industry: 'construction',
    label: '青空デモ建設',
    company: '株式会社青空デモ建設（架空）',
    business: '住宅改修、店舗改修、小規模新築、外構工事',
    file: 'construction-demo-data-full-v1.zip',
    root: '建設業デモデータ',
    sheets: 45,
    dataRows: 99230,
  },
  {
    industry: 'realestate',
    label: 'まちかどデモ不動産',
    company: '株式会社まちかどデモ不動産（架空）',
    business: '賃貸仲介、売買仲介、賃貸管理、修繕受付',
    file: 'real-estate-demo-data-full-v1.zip',
    root: '不動産会社デモデータ',
    sheets: 46,
    dataRows: 100050,
  },
];

const PACKAGE_KEYS = [
  'business',
  'bytes',
  'company',
  'dataRows',
  'docx',
  'file',
  'industry',
  'label',
  'manifestSha256',
  'notice',
  'packageFiles',
  'pdf',
  'sha256',
  'sheets',
  'starterMemos',
  'updatedAt',
  'url',
  'version',
  'workbooks',
].sort();

function fail(message) {
  throw new Error(`[demo-data] ${message}`);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function sha256(payload) {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function findEndOfCentralDirectory(buffer, label) {
  const signature = 0x06054b50;
  const start = Math.max(0, buffer.length - 22 - 0xffff);
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  fail(`${label}: ZIP end-of-central-directory record was not found`);
}

function parseZip(buffer, label) {
  if (buffer.length < 22) fail(`${label}: ZIP is empty or truncated`);
  const eocd = findEndOfCentralDirectory(buffer, label);
  const diskNumber = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const entriesOnDisk = buffer.readUInt16LE(eocd + 8);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) {
    fail(`${label}: multi-disk ZIP is not supported`);
  }
  if (centralOffset + centralSize > buffer.length) {
    fail(`${label}: central directory points outside the ZIP`);
  }

  const entries = [];
  const names = new Set();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (
      cursor + 46 > buffer.length ||
      buffer.readUInt32LE(cursor) !== 0x02014b50
    ) {
      fail(`${label}: invalid central-directory entry ${index + 1}`);
    }
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const end = cursor + 46 + nameLength + extraLength + commentLength;
    if (end > buffer.length)
      fail(`${label}: truncated central-directory entry`);
    const name = buffer
      .subarray(cursor + 46, cursor + 46 + nameLength)
      .toString('utf8');
    if (!name || names.has(name))
      fail(`${label}: empty or duplicate ZIP path ${name}`);
    if (name.startsWith('/') || name.split('/').includes('..')) {
      fail(`${label}: unsafe ZIP path ${name}`);
    }
    if ((flags & 0x1) !== 0) fail(`${label}: encrypted ZIP entry ${name}`);
    if (method !== 0 && method !== 8)
      fail(`${label}: unsupported compression method for ${name}`);
    if (
      localOffset + 30 > buffer.length ||
      buffer.readUInt32LE(localOffset) !== 0x04034b50
    ) {
      fail(`${label}: invalid local header for ${name}`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > buffer.length) {
      fail(`${label}: truncated payload for ${name}`);
    }
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    entries.push({
      name,
      isDirectory: name.endsWith('/'),
      read() {
        const payload =
          method === 0
            ? Buffer.from(compressed)
            : zlib.inflateRawSync(compressed);
        if (payload.length !== uncompressedSize) {
          fail(`${label}: uncompressed byte count mismatch for ${name}`);
        }
        return payload;
      },
    });
    names.add(name);
    cursor = end;
  }
  if (cursor !== centralOffset + centralSize) {
    fail(`${label}: central-directory size mismatch`);
  }
  return entries;
}

function parseShaFile(text) {
  const lines = text.trimEnd().split(/\r?\n/);
  if (lines.length !== EXPECTED_PACKAGES.length) {
    fail(
      `SHA256SUMS.txt: expected exactly ${EXPECTED_PACKAGES.length} lines, got ${lines.length}`,
    );
  }
  const result = new Map();
  for (const [index, line] of lines.entries()) {
    const match = /^([0-9a-f]{64})  ([^/\\\r\n]+\.zip)$/.exec(line);
    if (!match) fail(`SHA256SUMS.txt line ${index + 1} has an invalid format`);
    if (result.has(match[2]))
      fail(`SHA256SUMS.txt has duplicate filename ${match[2]}`);
    result.set(match[2], match[1]);
  }
  return { lines, result };
}

function extractBuildConstant(source, name, label) {
  const expression = new RegExp(
    `(?:const\\s+)?${name}\\s*=\\s*['"]([^'"]+)['"]`,
  );
  const match = expression.exec(source);
  if (!match) fail(`${label}: ${name} was not found`);
  return match[1];
}

function countWorkbookRows(payload, label) {
  const entries = parseZip(payload, label);
  const worksheets = entries.filter((entry) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(entry.name),
  );
  if (worksheets.length === 0) fail(`${label}: no worksheets found`);
  let dataRows = 0;
  for (const worksheet of worksheets) {
    const xml = worksheet.read().toString('utf8');
    for (const match of xml.matchAll(/<(?:[\w.-]+:)?row\b[^>]*\br="(\d+)"/g)) {
      if (Number(match[1]) >= 5) dataRows += 1;
    }
  }
  return { sheets: worksheets.length, dataRows };
}

async function main() {
  const [
    catalogText,
    generatedCatalogText,
    checksumsText,
    dataBuilder,
    documentBuilder,
    directory,
    lessonMaterials,
    publicLessonMaterials,
  ] = await Promise.all([
    fs.readFile(path.join(PUBLIC_ROOT, 'catalog.json'), 'utf8'),
    fs.readFile(
      path.join(REPO_ROOT, 'lib', 'demo-data-catalog.generated.json'),
      'utf8',
    ),
    fs.readFile(path.join(PUBLIC_ROOT, 'SHA256SUMS.txt'), 'utf8'),
    fs.readFile(path.join(REPO_ROOT, 'scripts', 'build_demo_data.mjs'), 'utf8'),
    fs.readFile(
      path.join(REPO_ROOT, 'scripts', 'build_demo_documents.py'),
      'utf8',
    ),
    fs.readdir(PUBLIC_ROOT, { withFileTypes: true }),
    fs.readFile(
      path.join(REPO_ROOT, 'lib', 'demo-task-materials.generated.json'),
    ),
    fs.readFile(path.join(PUBLIC_ROOT, 'task-materials.generated.json')),
  ]);

  assertEqual(
    generatedCatalogText,
    catalogText,
    'generated app catalog matches public catalog',
  );

  assertEqual(
    publicLessonMaterials.equals(lessonMaterials),
    true,
    'public task materials match generated lesson materials',
  );

  const catalog = JSON.parse(catalogText);
  assertEqual(
    Object.keys(catalog).sort().join(','),
    'packages,updatedAt,version',
    'catalog root keys',
  );
  if (!/^\d+\.\d+\.\d+$/.test(catalog.version))
    fail('catalog version is not x.y.z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(catalog.updatedAt))
    fail('catalog updatedAt is not YYYY-MM-DD');
  assertEqual(
    catalog.packages.length,
    EXPECTED_PACKAGES.length,
    'catalog package count',
  );

  for (const [source, label] of [
    [dataBuilder, 'build_demo_data.mjs'],
    [documentBuilder, 'build_demo_documents.py'],
  ]) {
    assertEqual(
      extractBuildConstant(source, 'VERSION', label),
      catalog.version,
      `${label} VERSION`,
    );
    assertEqual(
      extractBuildConstant(source, 'GENERATED_AT', label),
      catalog.updatedAt,
      `${label} GENERATED_AT`,
    );
  }

  const zipNames = directory
    .filter((entry) => entry.isFile() && entry.name.endsWith('.zip'))
    .map((entry) => entry.name)
    .sort();
  assertEqual(
    zipNames.join('\n'),
    EXPECTED_PACKAGES.map((item) => item.file)
      .sort()
      .join('\n'),
    'public ZIP filenames',
  );

  const checksumData = parseShaFile(checksumsText);
  assertEqual(
    checksumData.lines.map((line) => line.slice(66)).join('\n'),
    EXPECTED_PACKAGES.map((item) => item.file).join('\n'),
    'SHA256SUMS.txt filename order',
  );

  for (const [index, expected] of EXPECTED_PACKAGES.entries()) {
    const item = catalog.packages[index];
    assertEqual(
      Object.keys(item).sort().join(','),
      PACKAGE_KEYS.join(','),
      `${expected.industry} catalog keys`,
    );
    for (const field of ['industry', 'label', 'company', 'business', 'file']) {
      assertEqual(
        item[field],
        expected[field],
        `${expected.industry} ${field}`,
      );
    }
    assertEqual(
      item.url,
      `/downloads/demo-data/${expected.file}`,
      `${expected.industry} url`,
    );
    assertEqual(item.version, catalog.version, `${expected.industry} version`);
    assertEqual(
      item.updatedAt,
      catalog.updatedAt,
      `${expected.industry} updatedAt`,
    );
    assertEqual(item.notice, NOTICE, `${expected.industry} notice`);
    assertEqual(item.workbooks, 10, `${expected.industry} workbooks`);
    assertEqual(item.sheets, expected.sheets, `${expected.industry} sheets`);
    assertEqual(
      item.dataRows,
      expected.dataRows,
      `${expected.industry} dataRows`,
    );
    assertEqual(item.docx, 30, `${expected.industry} docx`);
    assertEqual(item.pdf, 100, `${expected.industry} pdf`);
    assertEqual(item.starterMemos, 10, `${expected.industry} starterMemos`);
    assertEqual(item.packageFiles, 156, `${expected.industry} packageFiles`);
    if (!/^[0-9a-f]{64}$/.test(item.sha256))
      fail(`${expected.industry} sha256 is invalid`);
    if (!/^[0-9a-f]{64}$/.test(item.manifestSha256)) {
      fail(`${expected.industry} manifestSha256 is invalid`);
    }

    const zipPath = path.join(PUBLIC_ROOT, expected.file);
    const zipPayload = await fs.readFile(zipPath);
    if (zipPayload.length === 0) fail(`${expected.file} is empty`);
    assertEqual(zipPayload.length, item.bytes, `${expected.industry} bytes`);
    const zipSha = sha256(zipPayload);
    assertEqual(zipSha, item.sha256, `${expected.industry} catalog SHA-256`);
    assertEqual(
      checksumData.result.get(expected.file),
      zipSha,
      `${expected.industry} SHA256SUMS.txt SHA-256`,
    );

    const zipEntries = parseZip(zipPayload, expected.file);
    const files = zipEntries.filter((entry) => !entry.isDirectory);
    assertEqual(
      files.length,
      item.packageFiles,
      `${expected.industry} ZIP file count`,
    );
    if (!files.every((entry) => entry.name.startsWith(`${expected.root}/`))) {
      fail(
        `${expected.file}: a file is outside the expected root ${expected.root}`,
      );
    }
    const byName = new Map(files.map((entry) => [entry.name, entry]));
    const manifest = byName.get(`${expected.root}/manifest.csv`);
    if (!manifest) fail(`${expected.file}: manifest.csv is missing`);
    assertEqual(
      sha256(manifest.read()),
      item.manifestSha256,
      `${expected.industry} manifestSha256`,
    );

    const xlsx = files.filter((entry) => entry.name.endsWith('.xlsx'));
    const docx = files.filter((entry) => entry.name.endsWith('.docx'));
    const pdf = files.filter((entry) => entry.name.endsWith('.pdf'));
    const starters = files.filter(
      (entry) =>
        entry.name.startsWith(`${expected.root}/課題/`) &&
        /^\d{2}[^/]+\.txt$/.test(path.posix.basename(entry.name)),
    );
    assertEqual(xlsx.length, item.workbooks, `${expected.industry} XLSX count`);
    assertEqual(docx.length, item.docx, `${expected.industry} DOCX count`);
    assertEqual(pdf.length, item.pdf, `${expected.industry} PDF count`);
    assertEqual(
      starters.length,
      item.starterMemos,
      `${expected.industry} starter memo count`,
    );

    let actualSheets = 0;
    let actualDataRows = 0;
    for (const workbook of xlsx) {
      const counts = countWorkbookRows(
        workbook.read(),
        `${expected.file}:${workbook.name}`,
      );
      actualSheets += counts.sheets;
      actualDataRows += counts.dataRows;
    }
    assertEqual(
      actualSheets,
      item.sheets,
      `${expected.industry} actual workbook sheets`,
    );
    assertEqual(
      actualDataRows,
      item.dataRows,
      `${expected.industry} actual workbook data rows`,
    );
  }

  console.log(
    `[demo-data] OK: ${EXPECTED_PACKAGES.length} ZIP / ${EXPECTED_PACKAGES.reduce((sum, item) => sum + item.sheets, 0)} sheets / ${EXPECTED_PACKAGES.reduce((sum, item) => sum + item.dataRows, 0)} data rows`,
  );
}

await main();
