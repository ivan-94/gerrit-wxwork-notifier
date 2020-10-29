/**
 * Gerrit commit-msg 安装
 */
const fs = require('fs');
const http = require('http');
const COMMIT_MSG = '.git/hooks/commit-msg';
const COMMIT_MSG_URL = 'http://gerrit.wakedata-inc.com/tools/hooks/commit-msg';

if (process.env.JENKINS_URL) {
  return;
}

console.log('正在安装 commit-msg hooks');
if (!fs.existsSync('.git/hooks')) {
  fs.mkdirSync('.git/hooks');
}

const req = http.request(COMMIT_MSG_URL, (res) => {
  const target = fs.createWriteStream(COMMIT_MSG);
  res.pipe(target);

  target.on('close', () => {
    fs.chmodSync(COMMIT_MSG, '755');

    if (fs.existsSync('node_modules/husky')) {
      console.log('兼容 husky');
      fs.writeFileSync(COMMIT_MSG, `\n\n . "$(dirname "$0")/husky.sh"\n`, { flag: 'a' });
    }

    console.log('安装成功');
  });
});

req.end();
