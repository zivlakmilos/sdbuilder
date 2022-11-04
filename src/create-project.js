import fse from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

import { getDirName } from './utils.js';

const DEFAULT_TEMPLATE = 'paper';

const getAllTemplates = () => {
  return fse.readdirSync(path.join(getDirName(), '..', 'templates'));
}

export const createProject = async (name) => {
  const templates = getAllTemplates();

  const questions = [
    {
      name: 'name',
      type: 'input',
      message: 'Enter project name',
      default: '',
    },
    {
      name: 'template',
      type: 'list',
      message: 'Choose template',
      choices: templates,
      default: DEFAULT_TEMPLATE,
    },
  ]

  const answares = await inquirer.prompt(questions);

  const dirFrom = path.join(getDirName(), '..', 'templates', answares.template);
  const dirTo = path.resolve(answares.name);
  fse.copySync(dirFrom, dirTo);

  console.log('Project created');
}
