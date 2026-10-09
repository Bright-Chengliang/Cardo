// app/api/fs/tool/route.ts - 服务端文件系统与多模态图像读取 Tooling 基础套件接口

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 忽略的大型或衍生目录
const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.cache',
  'coverage',
  '.vscode',
  '.idea',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]);

const IMAGE_EXTENSIONS: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
};

const BINARY_NON_IMAGE_EXTENSIONS = new Set([
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.exe', '.dll', '.so',
  '.dylib', '.mp3', '.mp4', '.woff', '.woff2', '.ttf', '.eot',
]);

interface ReadFileArgs {
  path: string;
  limit?: number;
  offset?: number;
}

interface ReadImageArgs {
  path: string;
}

interface ListDirectoryArgs {
  path: string;
  depth?: number;
  limit?: number;
}

interface SearchFilesArgs {
  path: string;
  query: string;
  extension?: string;
  limit?: number;
}

interface FindByNameArgs {
  path: string;
  pattern: string;
  limit?: number;
}

interface InspectProjectArgs {
  path: string;
}

/** 规范化并解析安全绝对路径 */
function resolveSafePath(inputPath: string): string {
  if (!inputPath) return process.cwd();
  let resolved = inputPath.trim();
  if (!path.isAbsolute(resolved)) {
    resolved = path.resolve(process.cwd(), resolved);
  }
  return path.normalize(resolved);
}

/** 1. 读取指定文本文件 (read_file) */
function handleReadFile({ path: targetPath, limit = 300, offset = 1 }: ReadFileArgs) {
  const fullPath = resolveSafePath(targetPath);
  if (!fs.existsSync(fullPath)) {
    return { error: `File not found: ${fullPath}` };
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    return { error: `Target path is a directory, not a file: ${fullPath}` };
  }

  const ext = path.extname(fullPath).toLowerCase();
  if (IMAGE_EXTENSIONS[ext]) {
    return {
      path: fullPath,
      isImage: true,
      message: `[Image file detected (${ext}). Please use read_image tool to inspect this visual asset]`,
    };
  }

  if (BINARY_NON_IMAGE_EXTENSIONS.has(ext)) {
    return {
      path: fullPath,
      isBinary: true,
      sizeBytes: stat.size,
      message: `[Binary or archive file with extension ${ext}, size: ${stat.size} bytes]`,
    };
  }

  const raw = fs.readFileSync(fullPath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const startIdx = Math.max(0, offset - 1);
  const endIdx = Math.min(lines.length, startIdx + limit);
  const sliced = lines.slice(startIdx, endIdx);

  const numberedContent = sliced
    .map((line, idx) => `${startIdx + idx + 1}: ${line}`)
    .join('\n');

  return {
    path: fullPath,
    totalLines: lines.length,
    offset: startIdx + 1,
    limit,
    content: numberedContent,
    isTruncated: endIdx < lines.length,
  };
}

/** 2. 读取图像与视觉资源 (read_image - 支持 PNG, JPG, WebP, SVG, GIF) */
function handleReadImage({ path: targetPath }: ReadImageArgs) {
  const fullPath = resolveSafePath(targetPath);
  if (!fs.existsSync(fullPath)) {
    return { error: `Image file not found: ${fullPath}` };
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    return { error: `Target path is a directory, not an image file: ${fullPath}` };
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mimeType = IMAGE_EXTENSIONS[ext];
  if (!mimeType) {
    return { error: `Unsupported image format (${ext}). Supported formats: ${Object.keys(IMAGE_EXTENSIONS).join(', ')}` };
  }

  const buffer = fs.readFileSync(fullPath);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  let svgText: string | undefined;
  if (ext === '.svg') {
    try {
      svgText = buffer.toString('utf-8');
    } catch {}
  }

  return {
    path: fullPath,
    mimeType,
    extension: ext,
    sizeBytes: stat.size,
    dataUrl,
    svgText,
    summary: `Image asset [${ext.toUpperCase()}, ${(stat.size / 1024).toFixed(1)} KB] loaded successfully.`,
  };
}

/** 3. 列出指定目录文件列表 (list_directory) */
function handleListDirectory({ path: targetPath, depth = 2, limit = 100 }: ListDirectoryArgs) {
  const rootPath = resolveSafePath(targetPath);
  if (!fs.existsSync(rootPath)) {
    return { error: `Directory not found: ${rootPath}` };
  }

  const stat = fs.statSync(rootPath);
  if (!stat.isDirectory()) {
    return { error: `Path is a file, not a directory: ${rootPath}` };
  }

  const results: Array<{ relativePath: string; isDirectory: boolean; isImage?: boolean; size?: number }> = [];

  function scan(currentDir: string, currentDepth: number) {
    if (currentDepth > depth || results.length >= limit) return;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((a, b) => {
      if (a.isDirectory() === b.isDirectory()) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory() ? -1 : 1;
    });

    for (const entry of entries) {
      if (results.length >= limit) break;
      if (IGNORED_NAMES.has(entry.name) || entry.name.startsWith('.')) continue;

      const fullEntryPath = path.join(currentDir, entry.name);
      const relative = path.relative(rootPath, fullEntryPath);

      if (entry.isDirectory()) {
        results.push({ relativePath: relative + '/', isDirectory: true });
        scan(fullEntryPath, currentDepth + 1);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const isImg = !!IMAGE_EXTENSIONS[ext];
        let size = 0;
        try {
          size = fs.statSync(fullEntryPath).size;
        } catch {}
        results.push({ relativePath: relative, isDirectory: false, isImage: isImg, size });
      }
    }
  }

  scan(rootPath, 1);

  return {
    rootPath,
    count: results.length,
    entries: results.map((r) => (r.isImage ? `[IMAGE] ${r.relativePath}` : r.relativePath)),
    truncated: results.length >= limit,
  };
}

/** 4. 搜索文件内容 (search_files / grep) */
function handleSearchFiles({ path: targetPath, query, extension, limit = 30 }: SearchFilesArgs) {
  const rootPath = resolveSafePath(targetPath);
  if (!fs.existsSync(rootPath)) {
    return { error: `Path not found: ${rootPath}` };
  }

  if (!query || !query.trim()) {
    return { error: 'Search query is required' };
  }

  const q = query.toLowerCase();
  const extFilter = extension ? (extension.startsWith('.') ? extension.toLowerCase() : '.' + extension.toLowerCase()) : null;
  const matches: Array<{ file: string; line: number; text: string }> = [];

  function searchInFile(filePath: string) {
    if (matches.length >= limit) return;
    const ext = path.extname(filePath).toLowerCase();
    if (IMAGE_EXTENSIONS[ext] && ext !== '.svg') return;
    if (BINARY_NON_IMAGE_EXTENSIONS.has(ext)) return;
    if (extFilter && ext !== extFilter) return;

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const lines = raw.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (matches.length >= limit) break;
        const line = lines[i];
        if (line.toLowerCase().includes(q)) {
          matches.push({
            file: path.relative(rootPath, filePath),
            line: i + 1,
            text: line.trim().slice(0, 200),
          });
        }
      }
    } catch {}
  }

  function walk(currentDir: string) {
    if (matches.length >= limit) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (matches.length >= limit) break;
      if (IGNORED_NAMES.has(entry.name) || entry.name.startsWith('.')) continue;

      const fullEntryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullEntryPath);
      } else {
        searchInFile(fullEntryPath);
      }
    }
  }

  const stat = fs.statSync(rootPath);
  if (stat.isDirectory()) {
    walk(rootPath);
  } else {
    searchInFile(rootPath);
  }

  return {
    rootPath,
    query,
    matchCount: matches.length,
    matches,
    truncated: matches.length >= limit,
  };
}

/** 5. 按文件名模式查找文件 (find_by_name) */
function handleFindByName({ path: targetPath, pattern, limit = 50 }: FindByNameArgs) {
  const rootPath = resolveSafePath(targetPath);
  if (!fs.existsSync(rootPath)) {
    return { error: `Directory not found: ${rootPath}` };
  }

  if (!pattern) return { error: 'Pattern is required' };
  const p = pattern.toLowerCase();
  const matchedFiles: string[] = [];

  function walk(currentDir: string) {
    if (matchedFiles.length >= limit) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (matchedFiles.length >= limit) break;
      if (IGNORED_NAMES.has(entry.name) || entry.name.startsWith('.')) continue;

      const fullEntryPath = path.join(currentDir, entry.name);
      const relative = path.relative(rootPath, fullEntryPath);

      if (entry.name.toLowerCase().includes(p) || relative.toLowerCase().includes(p)) {
        matchedFiles.push(entry.isDirectory() ? relative + '/' : relative);
      }

      if (entry.isDirectory()) {
        walk(fullEntryPath);
      }
    }
  }

  walk(rootPath);

  return {
    rootPath,
    pattern,
    count: matchedFiles.length,
    files: matchedFiles,
    truncated: matchedFiles.length >= limit,
  };
}

/** 6. 综合扫描项目整体结构与元文档 (inspect_project_structure) */
function handleInspectProjectStructure({ path: targetPath }: InspectProjectArgs) {
  const rootPath = resolveSafePath(targetPath);
  if (!fs.existsSync(rootPath)) {
    return { error: `Project directory not found: ${rootPath}` };
  }

  const keyFiles = [
    'README.md',
    'package.json',
    'AGENTS.md',
    'CLAUDE.md',
    'tsconfig.json',
    'Cargo.toml',
    'requirements.txt',
    'pom.xml',
    'go.mod',
    'pyproject.toml',
  ];

  const foundDocs: Record<string, string> = {};
  for (const filename of keyFiles) {
    const filePath = path.join(rootPath, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        foundDocs[filename] = content.slice(0, 3000);
      } catch {}
    }
  }

  const dirScan = handleListDirectory({ path: rootPath, depth: 2, limit: 60 });

  return {
    rootPath,
    keyFiles: Object.keys(foundDocs),
    manifests: foundDocs,
    directoryTree: dirScan.entries,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool, args = {} } = body;

    let result: any = null;

    switch (tool) {
      case 'read_file':
        result = handleReadFile(args as ReadFileArgs);
        break;
      case 'read_image':
        result = handleReadImage(args as ReadImageArgs);
        break;
      case 'list_directory':
        result = handleListDirectory(args as ListDirectoryArgs);
        break;
      case 'search_files':
        result = handleSearchFiles(args as SearchFilesArgs);
        break;
      case 'find_by_name':
        result = handleFindByName(args as FindByNameArgs);
        break;
      case 'inspect_project_structure':
        result = handleInspectProjectStructure(args as InspectProjectArgs);
        break;
      default:
        return NextResponse.json(
          {
            error: `Unknown tool name: ${tool}. Supported tools: list_directory, read_file, read_image, search_files, find_by_name, inspect_project_structure`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, tool, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Tool execution failed' },
      { status: 500 }
    );
  }
}
