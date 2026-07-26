import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/auth';
import { useChatStore } from './chatStore';

vi.mock('../api/auth', () => ({
  authApi: {
    getAnonymousToken: vi.fn().mockResolvedValue({ token: 'jwt-token', visitorId: 'visitor_abc' })
  }
}));

class FakeWebSocket {
  static last: FakeWebSocket | null = null;
  static constructCount = 0;
  url: string;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.last = this;
    FakeWebSocket.constructCount += 1;
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.onclose?.();
  }
}

const initialState = useChatStore.getState();

beforeEach(() => {
  sessionStorage.clear();
  FakeWebSocket.last = null;
  FakeWebSocket.constructCount = 0;
  vi.mocked(authApi.getAnonymousToken).mockReset();
  vi.mocked(authApi.getAnonymousToken).mockResolvedValue({ token: 'jwt-token', visitorId: 'visitor_abc' });
  vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
  useChatStore.setState({ ...initialState, ws: null, messages: initialState.messages.slice(0, 1) }, true);
});

async function connectAndOpen() {
  await act(async () => {
    await useChatStore.getState().connect();
  });
  act(() => {
    FakeWebSocket.last?.onopen?.();
  });
}

function receive(frame: unknown) {
  act(() => {
    FakeWebSocket.last?.onmessage?.({ data: JSON.stringify(frame) });
  });
}

describe('chatStore', () => {
  it('starts disconnected with a welcome message', () => {
    expect(useChatStore.getState().wsStatus).toBe('disconnected');
    expect(useChatStore.getState().sessionStatus).toBe('ai_chat');
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('fetches an anonymous token and connects with it', async () => {
    await connectAndOpen();

    expect(sessionStorage.getItem('visitorToken')).toBe('jwt-token');
    expect(FakeWebSocket.last?.url).toContain('token=jwt-token');
    expect(useChatStore.getState().wsStatus).toBe('connected');
    expect(useChatStore.getState().visitorId).toBe('visitor_abc');
  });

  it('accumulates AI_STREAM frames into one message', async () => {
    await connectAndOpen();

    receive({ type: 'AI_STREAM', payload: { text: '七天', isDone: false } });
    receive({ type: 'AI_STREAM', payload: { text: '七天无理由', isDone: true } });

    const messages = useChatStore.getState().messages;
    const last = messages[messages.length - 1];
    expect(messages).toHaveLength(2);
    expect(last.text).toBe('七天无理由');
    expect(last.isStreaming).toBe(false);
  });

  it('records ERROR frames without faking an answer', async () => {
    await connectAndOpen();

    receive({ type: 'ERROR', payload: { code: 'AI_UNAVAILABLE', message: 'AI 服务暂不可用' } });

    const state = useChatStore.getState();
    expect(state.lastError).toBe('AI 服务暂不可用');
    expect(state.messages[state.messages.length - 1].sender).toBe('system');
  });

  it('applies STATUS_UPDATE frames', async () => {
    await connectAndOpen();

    receive({ type: 'STATUS_UPDATE', payload: { status: 'agent_chat' } });

    expect(useChatStore.getState().sessionStatus).toBe('agent_chat');
  });

  it('sends CHAT and TRANSFER_AGENT frames', async () => {
    await connectAndOpen();

    act(() => {
      useChatStore.getState().sendMessage('你好');
      useChatStore.getState().requestTransfer();
    });

    expect(FakeWebSocket.last?.sent[0]).toBe(JSON.stringify({ type: 'CHAT', payload: { text: '你好' } }));
    expect(FakeWebSocket.last?.sent[1]).toBe(JSON.stringify({ type: 'TRANSFER_AGENT' }));
    expect(useChatStore.getState().sessionStatus).toBe('queuing');
  });

  it('ignores concurrent connect() while still connecting', async () => {
    let resolveToken!: (value: { token: string; visitorId: string }) => void;
    const tokenPromise = new Promise<{ token: string; visitorId: string }>((resolve) => {
      resolveToken = resolve;
    });
    vi.mocked(authApi.getAnonymousToken).mockReturnValue(tokenPromise);

    const first = useChatStore.getState().connect();
    const second = useChatStore.getState().connect();

    expect(useChatStore.getState().wsStatus).toBe('connecting');

    await act(async () => {
      resolveToken({ token: 'jwt-token', visitorId: 'visitor_abc' });
      await Promise.all([first, second]);
    });

    expect(authApi.getAnonymousToken).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.constructCount).toBe(1);
  });

  it('continues AI_STREAM into the in-flight ai message after a mid-stream CHAT', async () => {
    await connectAndOpen();

    receive({ type: 'AI_STREAM', payload: { text: '正在转接', isDone: false } });
    receive({ type: 'CHAT', payload: { sender: 'system', text: '已为您转接人工客服' } });
    receive({ type: 'AI_STREAM', payload: { text: '正在转接，请稍候', isDone: false } });
    receive({ type: 'AI_STREAM', payload: { text: '正在转接，请稍候。', isDone: true } });

    const messages = useChatStore.getState().messages;
    const aiMessages = messages.filter((m) => m.sender === 'ai');
    // welcome + one streaming answer
    expect(aiMessages).toHaveLength(2);
    const streamed = aiMessages[aiMessages.length - 1];
    expect(streamed.text).toBe('正在转接，请稍候。');
    expect(streamed.isStreaming).toBe(false);

    const chatIdx = messages.findIndex((m) => m.text === '已为您转接人工客服');
    const aiIdx = messages.findIndex((m) => m === streamed);
    expect(chatIdx).toBeGreaterThan(-1);
    expect(chatIdx).toBeGreaterThan(aiIdx);
  });

  it('continues AI_STREAM into the in-flight ai message after a mid-stream ERROR', async () => {
    await connectAndOpen();

    receive({ type: 'AI_STREAM', payload: { text: '部分回答', isDone: false } });
    receive({ type: 'ERROR', payload: { code: 'TRANSIENT', message: '中间提示错误' } });
    receive({ type: 'AI_STREAM', payload: { text: '部分回答已更新', isDone: false } });
    receive({ type: 'AI_STREAM', payload: { text: '部分回答已更新完毕', isDone: true } });

    const messages = useChatStore.getState().messages;
    const aiMessages = messages.filter((m) => m.sender === 'ai');
    expect(aiMessages).toHaveLength(2);
    const streamed = aiMessages[aiMessages.length - 1];
    expect(streamed.text).toBe('部分回答已更新完毕');
    expect(streamed.isStreaming).toBe(false);

    const errorIdx = messages.findIndex((m) => m.text === '中间提示错误');
    const aiIdx = messages.findIndex((m) => m === streamed);
    expect(errorIdx).toBeGreaterThan(-1);
    expect(errorIdx).toBeGreaterThan(aiIdx);
    expect(useChatStore.getState().lastError).toBe('中间提示错误');
  });
});
