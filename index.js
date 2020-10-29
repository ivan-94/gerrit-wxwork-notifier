const fs = require('fs');
const ch = require('child_process');
const https = require('https');

const config = JSON.parse(fs.readFileSync('./config.json'));
const env = process.env;

if (!('GERRIT_NAME' in env)) {
  console.error('请在 Jenkins 上配合 Gerrit Trigger 插件执行');
  return;
}

const EVENT_TYPE_PATCHSET_CREATED = 'patchset-created';
const EVENT_TYPE_DRAFT_PUBLISHED = 'draft-published';
const EVENT_TYPE_CHANGE_MERGED = 'change-merged';

const SUPPORTED_EVENT_TYPE = [EVENT_TYPE_PATCHSET_CREATED, EVENT_TYPE_DRAFT_PUBLISHED, EVENT_TYPE_CHANGE_MERGED];

if (env.GERRIT_EVENT_TYPE == null || SUPPORTED_EVENT_TYPE.indexOf(env.GERRIT_EVENT_TYPE) == -1) {
  console.log('跳过事件', env.GERRIT_EVENT_TYPE);
  return;
}

if (env.GERRIT_CHANGE_WIP_STATE === 'true' || env.GERRIT_CHANGE_PRIVATE_STATE === 'true') {
  console.log('跳过 private change 或  WIP change');
}

const PROJECT = env.GERRIT_PROJECT;
const BRANCH = env.GERRIT_BRANCH;
const EVENT_TYPE = env.GERRIT_EVENT_TYPE;
const DEFAULT_EVENT_TYPE = [EVENT_TYPE_PATCHSET_CREATED];
let failed = false;

/**
 *
 * @param {string} url
 * @param {string} content
 */
function send(url, content) {
  const req = https.request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  req.write(
    JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        content,
      },
    })
  );
  req.end();
  console.log('正在发送通知到: ', url, content);
}

function getProjectUrl() {
  if (env.GERRIT_CHANGE_URL) {
    const url = new URL(env.GERRIT_CHANGE_URL);
    url.pathname = `/q/project:${PROJECT}`;
    return url.href;
  }
  return '';
}

config.list.forEach((item, index) => {
  try {
    const regexp = new RegExp(item.project);
    const url = item.webhook;
    if (!PROJECT.match(regexp)) {
      return;
    }

    if (item.branch && !BRANCH.match(new RegExp(item.branch))) {
      return;
    }

    if ((item.eventType || DEFAULT_EVENT_TYPE).indexOf(EVENT_TYPE) === -1) {
      return;
    }

    // 开始通知
    if (EVENT_TYPE === EVENT_TYPE_PATCHSET_CREATED) {
      const content = `# 🤖 Gerrit Review 请求
> <font color="comment"></font>
> <font color="comment"> Project: [${PROJECT}](${getProjectUrl()}) </font>
> <font color="comment"> Branch: ${BRANCH} </font>
> <font color="comment"></font>
 @${env.GERRIT_PATCHSET_UPLOADER_NAME} 新增了一个 [Patch Set (${env.GERRIT_PATCHSET_NUMBER})](${env.GERRIT_CHANGE_URL}):
<font color="comment"></font>
<font color="info">\t${env.GERRIT_CHANGE_SUBJECT}</font>
<font color="comment"></font>
  
 赶紧过来 [Review](${env.GERRIT_CHANGE_URL}) 吧!
`;
      send(url, content);
    } else {
      send(
        url,
        `# Gerrit Review
待适配事件 ${EVENT_TYPE}:
${JSON.stringify(
  Object.keys(env).reduce((prev, cur) => {
    if (cur.startsWith('GERRIT_')) {
      prev[cur] = env[cur];
    }
    return prev;
  }, {}),
  undefined,
  2
)}
      `
      );
    }
  } catch (err) {
    failed = true;
    console.error(`list[${index}] 执行失败`, err);
  }
});

if (failed) {
  process.exit(1);
}
