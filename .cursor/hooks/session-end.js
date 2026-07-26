'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function projectRoot(payload) {
  if (process.env.CURSOR_PROJECT_DIR) return process.env.CURSOR_PROJECT_DIR;
  if (Array.isArray(payload.workspace_roots) && payload.workspace_roots[0]) {
    return payload.workspace_roots[0];
  }
  return process.cwd();
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

function stamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return {
    day: `${y}-${m}-${d}`,
    time: `${hh}${mm}${ss}`,
    iso: date.toISOString(),
  };
}

function gitShortStatus(root) {
  try {
    const out = execFileSync('git', ['status', '--short'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    });
    const lines = out
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter(Boolean)
      .filter((l) => !/[\\/]target[\\/]/.test(l) && !/\.class\b/.test(l));
    if (lines.length === 0) return '（工作区干净，或仅有被过滤的构建产物）';
    const head = lines.slice(0, 40);
    const more = lines.length > 40 ? `\n… 另有 ${lines.length - 40} 行未列出` : '';
    return head.join('\n') + more;
  } catch (err) {
    return `（无法读取 git status：${err && err.message ? err.message : String(err)}）`;
  }
}

function looksLikeSessionLogExists(root, day) {
  const sessionsDir = path.join(root, 'brain', '20-episodic', 'sessions');
  try {
    if (!fs.existsSync(sessionsDir)) return false;
    return fs.readdirSync(sessionsDir).some((name) => name.startsWith(day) && name.endsWith('.md'));
  } catch {
    return false;
  }
}

function redactSecrets(text) {
  return String(text)
    .replace(/(?<=(?:api[_-]?key|token|secret|password|authorization)\s*[:=]\s*)["']?[^\s"'\\]+/gi, '[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .replace(/sk-[A-Za-z0-9]{10,}/g, '[REDACTED]');
}

/**
 * Best-effort excerpt from Cursor transcript.
 * Formats vary; we prefer recent human/assistant turns and fall back to a tail slice.
 */
function extractKeyExcerpts(transcriptPath, maxChars = 1800) {
  if (!transcriptPath) {
    return {
      status: 'missing',
      body: '（无 transcript_path；请在 Cursor 设置中启用 transcripts 后，下次会话结束即可自动摘录）',
    };
  }
  try {
    if (!fs.existsSync(transcriptPath)) {
      return {
        status: 'missing-file',
        body: `（transcript 路径不存在：\`${transcriptPath}\`）`,
      };
    }
    let raw = fs.readFileSync(transcriptPath, 'utf8');
    if (!raw.trim()) {
      return { status: 'empty', body: '（transcript 为空）' };
    }

    // jsonl: one json object per line
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const snippets = [];
    if (lines.length > 0 && lines[0].trim().startsWith('{')) {
      for (let i = lines.length - 1; i >= 0 && snippets.length < 6; i--) {
        try {
          const obj = JSON.parse(lines[i]);
          const role = obj.role || obj.type || obj.speaker || '';
          const content =
            obj.content ||
            obj.text ||
            obj.message ||
            (Array.isArray(obj.parts) ? obj.parts.map((p) => p.text || '').join('') : '') ||
            '';
          const text = String(content).replace(/\s+/g, ' ').trim();
          if (!text || text.length < 20) continue;
          if (/tool|system/i.test(String(role)) && !/user|assistant|human|ai/i.test(String(role))) {
            continue;
          }
          const label = String(role || 'turn').slice(0, 24);
          snippets.unshift(`[${label}] ${text.slice(0, 280)}`);
        } catch {
          // not json line — ignore
        }
      }
    }

    let body;
    if (snippets.length > 0) {
      body = snippets.join('\n\n');
    } else {
      // Plain text / unknown format: take tail
      const tail = raw.slice(Math.max(0, raw.length - maxChars));
      body = tail.trim();
    }

    body = redactSecrets(body);
    if (body.length > maxChars) {
      body = `…\n${body.slice(-maxChars)}`;
    }

    return {
      status: 'ok',
      body: body || '（未能提取有效片段）',
    };
  } catch (err) {
    return {
      status: 'error',
      body: `（读取 transcript 失败：${err && err.message ? err.message : String(err)}）`,
    };
  }
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
    if (payload.is_background_agent) {
      process.stdout.write('{}');
      return;
    }

    const durationMs = Number(payload.duration_ms || 0);
    if (durationMs > 0 && durationMs < 8000) {
      process.stdout.write('{}');
      return;
    }

    const root = projectRoot(payload);
    const autoDir = path.join(root, 'brain', '_inbox', 'auto');
    fs.mkdirSync(autoDir, { recursive: true });

    const { day, time, iso } = stamp();
    const sessionId = payload.session_id || payload.conversation_id || 'unknown';
    const shortId = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12) || 'session';
    const fileName = `${day}-${time}-${shortId}.md`;
    const filePath = path.join(autoDir, fileName);

    const transcript =
      payload.transcript_path ||
      process.env.CURSOR_TRANSCRIPT_PATH ||
      null;

    const hadSessionLog = looksLikeSessionLogExists(root, day);
    const gitStatus = gitShortStatus(root);
    const excerpt = extractKeyExcerpts(transcript);

    const body = [
      '---',
      'type: inbox',
      `created: ${day}`,
      'status: pending',
      'tags: [收件箱, auto, sessionEnd]',
      'source: cursor-hook/sessionEnd',
      '---',
      '',
      `# 自动会话候选 · ${day} ${time}`,
      '',
      '> 由 `.cursor/hooks/session-end.js` 在会话结束时自动写入。**不是**正式会话日志。',
      '> 请用 `/收尾` 或巩固流程提炼；提炼后删除或移出本文件。',
      '',
      '## 元数据',
      '',
      `| 字段 | 值 |`,
      `|---|---|`,
      `| session_id | \`${sessionId}\` |`,
      `| reason | ${payload.reason || 'unknown'} |`,
      `| final_status | ${payload.final_status || ''} |`,
      `| duration_ms | ${payload.duration_ms ?? ''} |`,
      `| model | ${payload.model || payload.model_id || ''} |`,
      `| ended_at | ${iso} |`,
      `| transcript_path | ${transcript ? `\`${transcript}\`` : '（无；需在 Cursor 启用 transcripts）'} |`,
      `| excerpt_status | ${excerpt.status} |`,
      `| same_day_session_log_exists | ${hadSessionLog ? 'yes' : 'no'} |`,
      '',
      '## 关键片段（自动摘录）',
      '',
      '> 用于巩固时核对，勿当作已提炼结论。敏感信息已尽力脱敏。',
      '',
      '```text',
      excerpt.body,
      '```',
      '',
      '## Git 工作区摘要（已过滤 target/.class）',
      '',
      '```',
      gitStatus,
      '```',
      '',
      '## 待提炼清单',
      '',
      '- [ ] 是否产生实质工作？若否，可直接删除本候选。',
      '- [ ] 若是：执行 `/收尾` 写入 `brain/20-episodic/sessions/` 并更新 `current-focus.md`。',
      '- [ ] 有架构取舍？→ `adr-write`（Decision）',
      '- [ ] 有用户纠正 / 调试洞察 / 可复用结论？→ `/沉淀`（Correction / Debug / Insight / Pattern）',
      '',
      '## 错误信息',
      '',
      payload.error_message ? String(payload.error_message) : '（无）',
      '',
    ].join('\n');

    fs.writeFileSync(filePath, body, 'utf8');
  } catch {
    // fail open
  }

  process.stdout.write('{}');
}

main();
