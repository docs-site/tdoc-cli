import { input, confirm, select } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const devDependencies: string[] = ['@types/node'];
const dependencies: string[] = [];

export async function cmdInit(dirName?: string) {
  console.log('Welcome to tdoc project initialization\n');

  // Handle directory path and check
  const projectDir = path.resolve(dirName || '');
  if (fs.existsSync(projectDir)) {
    const files = fs.readdirSync(projectDir);
    if (files.length > 0) {
      console.error(`❌ 目录 ${projectDir} 已存在且不为空`);
      process.exit(1);
    }
  } else {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const answers = {
    name: await input({
      message: 'Project name:',
      default: dirName ? path.basename(dirName) : undefined,
      validate: (input: string) => input.trim() !== '' || 'Project name is required',
    }),
    description: await input({
      message: 'Project description:',
      default: '',
    }),
    author: await input({
      message: 'Author:',
      default: '',
    }),
    license: await select({
      message: 'License:',
      choices: [
        { value: 'MIT' },
        { value: 'Apache-2.0' },
        { value: 'GPL-3.0' },
        { value: 'ISC' },
        { value: 'Unlicense' }
      ],
      default: 'MIT',
    }),
    initGit: await confirm({
      message: 'Initialize git repository?',
      default: true,
    }),
    addWorkflow: await confirm({
      message: 'Add GitHub Actions workflow for auto-publish?',
      default: true,
    }),
    installDeps: await (async () => {
      console.log(`\nWill install the following common dependencies:\n  devDependencies: ${devDependencies.join(', ')}\n  dependencies: ${dependencies.join(', ') || 'none'}\n`);
      return await confirm({
        message: '是否安装这些依赖?',
        default: false,
      });
    })(),
  };

  const projectName = path.basename(projectDir);
  process.chdir(projectDir);

  // Create package.json
  const packageJson = {
    name: answers.name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: answers.description,
    main: 'index.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    author: answers.author,
    license: answers.license,
  };

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create basic files
  fs.writeFileSync(
    path.join(projectDir, 'README.md'),
    `# ${answers.name}\n\n${answers.description || 'Project description'}`
  );

  // Initialize git if selected
  if (answers.initGit) {
    try {
      execSync('git init', { stdio: 'inherit' });
      
      // Create .gitignore file
      fs.writeFileSync(
        path.join(projectDir, '.gitignore'),
        'node_modules/\n.DS_Store\n.env\n'
      );
      
      if (answers.addWorkflow) {
        const workflowsDir = path.join(__dirname, '../../.github/workflows');
        if (fs.existsSync(workflowsDir)) {
          const destDir = path.join(projectDir, '.github/workflows');
          fs.ensureDirSync(destDir);
          fs.copySync(workflowsDir, destDir);
          console.log('✅ GitHub Actions workflow files copied');
        } else {
          console.log('ℹ️ No workflow files found in .github/workflows');
        }
      }
    } catch (err) {
      console.error('Failed to initialize git repository:', err);
    }
  }

  // Install dependencies if selected (now at the end)
  if (answers.installDeps) {
    try {
      console.log('Installing dependencies...');
      if (devDependencies.length) {
        execSync(`npm install ${devDependencies.join(' ')} -D`, { 
          stdio: 'inherit' 
        });
      }
      if (dependencies.length) {
        execSync(`npm install ${dependencies.join(' ')}`, { 
          stdio: 'inherit' 
        });
      }
    } catch (err) {
      console.error('Failed to install dependencies:', err);
    }
  }

  console.log(`\nProject ${answers.name} initialized successfully!`);
  console.log(`cd ${answers.name} to get started.`);
}
