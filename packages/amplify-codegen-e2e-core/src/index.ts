import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { spawnSync, execSync } from 'child_process';
import { v4 as uuid } from 'uuid';
import * as ini from 'ini';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { getCommandPath, sleep } from './utils';

export * from './configure/';
export * from './init/';
export * from './utils/';
export * from './categories';
export * from './utils/sdk-calls';
export { addFeatureFlag } from './utils/feature-flags';

declare global {
  namespace NodeJS {
    interface Global {
      getRandomId: () => string;
    }
  }
}

const amplifyTestsDir = 'amplify-codegen-e2e-tests';

export function getCLIPath(testingWithLatestCodebase = false) {
  let commandName = 'amplify-dev';
  if (isCI() && !testingWithLatestCodebase) {
    commandName = 'amplify';
  }

  return getCommandPath(commandName);
}

export function getScriptRunnerPath(testingWithLatestCodebase = false) {
  if (!testingWithLatestCodebase) {
    return process.platform === 'win32' ? 'node.exe' : 'exec';
  }

  // nodejs executable
  return process.execPath;
}

export function isCI(): boolean {
  return process.env.CI && process.env.CODEBUILD ? true : false;
}

export function injectSessionToken(profileName: string) {
  const credentialsContents = ini.parse(fs.readFileSync(pathManager.getAWSCredentialsFilePath()).toString());
  credentialsContents[profileName] = credentialsContents[profileName] || {};
  credentialsContents[profileName].aws_session_token = process.env.AWS_SESSION_TOKEN;
  fs.writeFileSync(pathManager.getAWSCredentialsFilePath(), ini.stringify(credentialsContents));
}

export function npmInstall(cwd: string) {
  spawnSync('npm', ['install'], { cwd });
}

export async function installAmplifyCLI(version: string = 'latest') {
  spawnSync('npm', ['install', '-g', `@aws-amplify/cli@${version}`], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
}

export async function createNewProjectDir(
  projectName: string,
  prefix = path.join(fs.realpathSync(os.tmpdir()), amplifyTestsDir),
): Promise<string> {
  const currentHash = execSync('git rev-parse --short HEAD', { cwd: __dirname })
    .toString()
    .trim();
  let projectDir;
  do {
    const randomId = await global.getRandomId();
    projectDir = path.join(prefix, `${projectName}_${currentHash}_${randomId}`);
  } while (fs.existsSync(projectDir));

  fs.ensureDirSync(projectDir);
  if (!process.env.SKIP_CREATE_PROJECT_DIR_INITIAL_DELAY) {
    // createProjectDir(..) is something that nearly every test uses
    // Commands like 'init' would collide with each other if they occurred too close to one another.
    // Especially for nexpect output waiting
    // This makes it a perfect candidate for staggering test start times
    const initialDelay = Math.floor(Math.random() * 180 * 1000); // between 0 to 3 min
    console.log(`Waiting for ${initialDelay} ms`);
    await sleep(initialDelay);
  }
  console.log(projectDir);
  return projectDir;
}

export const createTempDir = () => {
  const osTempDir = fs.realpathSync(os.tmpdir());
  const tempProjectDir = path.join(osTempDir, amplifyTestsDir, uuid());

  fs.mkdirsSync(tempProjectDir);

  return tempProjectDir;
};
