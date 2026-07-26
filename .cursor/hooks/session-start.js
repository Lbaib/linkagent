'use strict';

const fs = require('fs');
const path = require('path');

function projectRoot(payload) {
  if (process.env.CURSOR_PROJECT_DIR) return process.env.CURSOR_PROJECT_DIR;
  if (Array.isArray(payload.workspace_roots) && payload.workspace_roots[0]) {
    return payload.workspace_roots[0];
  }
  return process.cwd();
}

function readText(filePath, maxChars) {
  try {
    if (!fs.existsSync(filePath)) return null;
    let text = fs.readFileSync(filePath, 'utf8');
    // Drop YAML frontmatter for injection brevity
    if (text.startsWith('---')) {
      const end = text.indexOf('\n---', 3);
      if (end !== -1) text = text.slice(end + 4).trimStart();
    }
    text = text.replace(/\r\n/g, '\n').trim();
    if (maxChars && text.length > maxChars) {
      return `${text.slice(0, maxChars)}\n\n…（已截断，全文见 ${path.basename(filePath)}）`;
    }
    return text;
  } catch {
    return null;
  }
}

function pendingQuestions(openQuestionsText) {
  if (!openQuestionsText) return '';
  const lines = openQuestionsText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- [ ]'));
  if (lines.length === 0) return '（无未勾选待决，或文件为空）';
  return lines.slice(0, 8).join('\n');
}

function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      raw += chunk;
    });
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', () => resolve(''));
  });
}

async function main() {
  let payload = {};
  try {
    const raw = await readStdin();
    if (raw.trim()) payload = JSON.parse(raw);
  } catch {
    payload = {};
  }

  try {
    // Background agents: still inject a short pointer, keep it lighter
    const root = projectRoot(payload);
    const focusPath = path.join(root, 'brain', '40-working', 'current-focus.md');
    const questionsPath = path.join(root, 'brain', '40-working', 'open-questions.md');
    const mapPath = path.join(root, 'brain', '00-core', 'memory-map.md');

    const focus = readText(focusPath, payload.is_background_agent ? 1200 : 2500);
    const questions = readText(questionsPath, 4000);
    const pending = pendingQuestions(questions);

    const parts = [
      '## LinkAgent 记忆自动注入（sessionStart）',
      '',
      '本段由 `.cursor/hooks/session-start.js` 注入。动手前先对齐焦点；可沉淀结论用 `/沉淀` 或写入 `brain/_inbox/`；实质工作结束用 `/收尾`。',
      '',
      '真相入口：`AGENTS.md` · `brain/00-core/memory-map.md` · `brain/40-working/current-focus.md`',
      '',
    ];

    if (focus) {
      parts.push('### 当前焦点（current-focus.md）', '', focus, '');
    } else {
      parts.push('### 当前焦点', '', `未读到 ${focusPath}`, '');
    }

    parts.push('### 待决问题（摘录）', '', pending || '（无）', '');

    if (!payload.is_background_agent && fs.existsSync(mapPath)) {
      parts.push(
        '### 记忆协议提醒',
        '',
        '- 情景日志只追加：`brain/20-episodic/sessions/`',
        '- 架构决策写 ADR：`brain/10-semantic/decisions/`',
        '- 会话结束会自动在 `brain/_inbox/auto/` 落候选记录（sessionEnd hook），仍需人工或 `/收尾` 做语义整理',
        ''
      );
    }

    process.stdout.write(
      JSON.stringify({
        additional_context: parts.join('\n'),
        env: {
          LINKAGENT_MEMORY_ROOT: path.join(root, 'brain'),
        },
      })
    );
  } catch (err) {
    // Fail open: never block session creation
    process.stdout.write(
      JSON.stringify({
        additional_context: `LinkAgent sessionStart hook 失败（已 fail-open）：${err && err.message ? err.message : String(err)}`,
      })
    );
  }
}

main();
