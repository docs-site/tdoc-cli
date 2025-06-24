import { input, confirm, select } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

let devDependencies: string[] = ['@types/node'];
let dependencies: string[] = [];

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

  const answers: {
    name: string;
    description: string;
    author: string;
    license: string;
    initGit: boolean;
    addWorkflow: boolean;
    addEditorConfig: boolean;
    addVscodeConfig: boolean;
    addPrettierConfig: boolean;
    installDeps: boolean;
  } = {
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
    addEditorConfig: await confirm({
      message: 'Add .editorconfig configuration file?',
      default: true,
    }),
    addVscodeConfig: await confirm({
      message: 'Add .vscode project configuration?',
      default: true,
    }),
    addPrettierConfig: await confirm({
      message: 'Add Prettier configuration (will install prettier package)?',
      default: true,
    }),
    installDeps: await (async () => {
      // Initialize dependencies array
      const showDevDeps = [...devDependencies];
      const showDeps = [...dependencies];
      
      console.log('\nWill install the following basic common dependencies:');
      console.log(`  devDependencies: ${showDevDeps.join(', ')}`);
      console.log(`  dependencies: ${showDeps.join(', ') || 'none'}`);
      console.log();
      return await confirm({
        message: '是否自动安装依赖?',
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
      ...(answers.addPrettierConfig ? {
        'format:check': 'prettier . --check',
        'format:fix': 'prettier . --write'
      } : {})
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

  // Copy .editorconfig if selected
  if (answers.addEditorConfig) {
    const editorConfigPath = path.join(__dirname, '../../.editorconfig');
    if (fs.existsSync(editorConfigPath)) {
      fs.copyFileSync(editorConfigPath, path.join(projectDir, '.editorconfig'));
      console.log('✅ .editorconfig copied');
    }
  }

  // Copy .vscode directory if selected
  if (answers.addVscodeConfig) {
    const vscodePath = path.join(__dirname, '../../.vscode');
    if (fs.existsSync(vscodePath)) {
      fs.copySync(vscodePath, path.join(projectDir, '.vscode'));
      console.log('✅ .vscode configuration copied');
    }
  }

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

  // Copy Prettier config files if selected
  if (answers.addPrettierConfig) {
    const prettierRcPath = path.join(__dirname, '../../.prettierrc');
    const prettierIgnorePath = path.join(__dirname, '../../.prettierignore');
    
    if (fs.existsSync(prettierRcPath)) {
      fs.copyFileSync(prettierRcPath, path.join(projectDir, '.prettierrc'));
      console.log('✅ .prettierrc copied');
    }
    if (fs.existsSync(prettierIgnorePath)) {
      fs.copyFileSync(prettierIgnorePath, path.join(projectDir, '.prettierignore'));
      console.log('✅ .prettierignore copied');
    }
  }

  // Install dependencies if selected (now at the end)
  if (answers.installDeps) {
    try {
      console.log('Installing dependencies...');
      const installDevDeps = [...devDependencies];
      const installDeps = [...dependencies];
      
      if (answers.addPrettierConfig) {
        installDevDeps.push('prettier');
      }

      if (installDevDeps.length) {
        console.log(`  devDependencies: ${installDevDeps.join(', ')}`);
        execSync(`npm install ${installDevDeps.join(' ')} -D`, { 
          stdio: 'inherit' 
        });
      }
      if (installDeps.length) {
        console.log(`  dependencies: ${installDeps.join(', ')}`);
        execSync(`npm install ${installDeps.join(' ')}`, { 
          stdio: 'inherit' 
        });
      }
    } catch (err) {
      console.error('Failed to install dependencies:', err);
    }
  }

  console.log(`\n✅ Project ${answers.name} initialized successfully!`);
  console.log(`cd ${answers.name} to get started.`);
}
