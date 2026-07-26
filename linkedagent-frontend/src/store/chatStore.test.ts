import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from './chatStore';

vi.mock('../api/auth', () => ({
  authApi: {
    getAnonymousToken: vi.fn().mockResolvedValue({ token: 'jwt-token', visitorId: 'visitor_abc' })
  }
}));

class FakeWebSocket {
  static last: FakeWebSocket | null = null;
  url: string;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.last = this;
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
});
