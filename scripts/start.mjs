import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const flags = process.argv.slice(2);
const network = ['--lan', '--localhost', '--tunnel', '--offline'].some(flag => flags.includes(flag)) ? [] : ['--tunnel'];
const runtime = flags.includes('--dev-client') || flags.includes('--go') ? [] : ['--go'];
const server = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', ...runtime, ...network, ...flags], {
  stdio: 'inherit',
  env: { ...process.env, EXPO_NO_REDIRECT_PAGE: '1' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.on('exit', code => { process.exitCode = code ?? 0; });
