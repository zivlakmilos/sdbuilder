import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers'

import { createProject } from './create-project.js';
import { compile } from './compiler.js';

const parseArgumentsIntoOptions = (rawArgs) => {
  const args = yargs(hideBin(rawArgs))
    .usage('Usage: sdbuilder [options]')
    .version('v', '1.0.0')
    .describe('h', 'Show Version')
    .alias('v', 'version')
    .help('h')
    .alias('h', 'help')
    .describe('h', 'Show Help')
    .boolean('c')
    .alias('c', 'create-project')
    .describe('c', 'Create new project')
    .epilog('Copyright (c) 2022 Miloš Zivlak')
    .argv;

  return args;
}

export const cli = async (args) => {
  const options = parseArgumentsIntoOptions(args);

  if (options['create-project']) {
    await createProject();
    return;
  }

  await compile();
}
