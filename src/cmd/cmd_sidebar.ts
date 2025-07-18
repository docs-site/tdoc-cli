import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

interface SidebarOptions {
  directory: string;
  depth: number;
}

const DIRECTORY_ICON = '📂';
const FILE_ICON = '📝';
const EXCLUDE_DIRS = ['.git', '.github', 'img', '_sidebar.md', '.docsify'];

function generateSidebar(
  rootDir: string,
  currentDir: string = '',
  currentDepth: number = 0,
  maxDepth: number = Infinity
): string[] {
  if (currentDepth > maxDepth) return [];

  const items: string[] = [];
  const fullPath = path.join(rootDir, currentDir);
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDE_DIRS.includes(entry.name)) continue;

    const relativePath = path.posix.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      const subEntries = fs.readdirSync(path.join(fullPath, entry.name));
      const hasContent = subEntries.some(e =>
        e.endsWith('.md') ||
        (fs.statSync(path.join(fullPath, entry.name, e)).isDirectory() &&
          !EXCLUDE_DIRS.includes(e))
      );

      if (hasContent) {
        const indent = '\t'.repeat(currentDepth);
        items.push(`${indent}- [${DIRECTORY_ICON} ${entry.name}](/${relativePath}/)`);

        const subItems = generateSidebar(
          rootDir,
          relativePath,
          currentDepth + 1,
          maxDepth
        );
        items.push(...subItems);
      }
    } else if (entry.isFile() && 
               entry.name.endsWith('.md') && 
               !['README.md', 'index.md'].includes(entry.name)) {
      const indent = '\t'.repeat(currentDepth);
      const displayName = entry.name.replace('.md', '');
      items.push(`${indent}- [${FILE_ICON} ${displayName}](/${relativePath})`);
    }
  }

  return items;
}

function createSidebarCommand() {
  const program = new Command('sidebar')
    .description('Generate a sidebar markdown file for documentation')
    .option('-d, --directory <path>', 'directory to scan', process.cwd())
    .option('-L, --depth <number>', 'scan depth level', Number.MAX_SAFE_INTEGER.toString())
    .action((options: SidebarOptions) => {
      try {
        const rootDir = path.isAbsolute(options.directory) 
          ? options.directory 
          : path.join(process.cwd(), options.directory);

        const maxDepth = options.depth === Number.MAX_SAFE_INTEGER 
          ? Infinity 
          : options.depth;

        const allItems = [
          `- [${DIRECTORY_ICON} 首页](/)`,
          `- [${DIRECTORY_ICON} 目录](/_sidebar.md)`,
          ...generateSidebar(rootDir, '', 0, maxDepth)
        ];

        fs.writeFileSync('_sidebar.md', allItems.join('\n') + '\n');
        console.log('Sidebar generated successfully!');
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error generating sidebar:', error.message);
        } else {
          console.error('Unknown error occurred while generating sidebar');
        }
        process.exit(1);
      }
    });

  return program;
}

export default createSidebarCommand;
