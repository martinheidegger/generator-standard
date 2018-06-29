'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const sanitizeFileName = require('sanitize-filename');

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.projectName = args[0];
    if (!this.projectName) {
      throw new Error('projectName required!');
    }
    this.saneName = sanitizeFileName(this.projectName);
    const root = `${process.cwd()}/${this.saneName}`;
    this.destinationRoot(root);
  }

  async initialize() {
    await this.spawnCommand('git', ['init', '--quiet']);
  }

  async prompting() {
    this.log(
      yosay(
        `Default setup process using ${chalk.red(
          'generator-standard'
        )}! For standard projects`
      )
    );

    /*
    This.log({
      email: this.user.git.email(), 
      github: await this.user.github.username()
    })
    */

    const prompts = [
      /*
      {
        type: 'input',
        name: 'project',
        
      },
      {
        type: 'list',
        name: 'variant',
        choices: [
          'FullStack Library',
          'Basic Library',
          'Browser Library',
          'NodeJS Library',
          'Electron App',
        ]
      },
      */
      {
        type: 'list',
        name: 'license',
        message: 'What license will this project have?',
        choices: ['UNLICENSED', 'MIT', 'BSD-CLAUSE-2']
      }
    ];

    this.props = await this.prompt(prompts);
  }

  writing() {
    this.fs.copy(this.templatePath('index.js'), this.destinationPath('index.js'));
    this.fs.copy(
      this.templatePath('test/index.js'),
      this.destinationPath('test/index.js')
    );
    this.fs.copy(this.templatePath('.gitignore'), this.destinationPath('.gitignore'));
    const pkgJson = {
      name: this.saneName,
      description: this.projectName,
      author: `${this.user.git.name()} <${this.user.git.email()}>`,
      devDependencies: {
        standard: '^11.0.1',
        tap: '^12.0.1'
      },
      license: this.props.license,
      scripts: {
        test: 'npm run test:lint && npm run test:unit',
        'test:lint': 'standard',
        'test:unit': 'tap test/**/*.js',
        ci: 'npm run test -- --coverage'
      }
    };

    if (this.props.license === 'UNLICENSED') {
      pkgJson.private = true;
    } else {
      this.fs.copyTpl(
        this.templatePath(`license/${this.props.license}`),
        this.destinationPath('LICENSE'),
        {
          year: new Date().getFullYear(),
          name: this.user.git.name(),
          email: this.user.git.email()
        }
      );
    }

    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
  }

  install() {
    this.npmInstall();
  }

  async end() {
    await this.spawnCommand('git', ['add', '.']);
    await sleep(100);
    await this.spawnCommand('git', ['commit', '-m', 'Initial Commit.']);
  }
};
