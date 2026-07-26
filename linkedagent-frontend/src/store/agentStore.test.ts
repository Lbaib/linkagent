import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgentStore } from './agentStore';

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

const initialState = useAgentStore.getState();

beforeEach(() => {
  localStorage.clear();
  FakeWebSocket.last = null;
  vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
  useAgentStore.setState({ ...initialState, ws: null, sessions: [] }, true);
});

function connectAndOpen() {
  localStorage.setItem('accessToken', 'agent-jwt');
  act(() => {
    useAgentStore.getState().connect();
    FakeWebSocket.last?.onopen?.();
  });
}

function receive(frame: unknown) {
  act(() => {
    FakeWebSocket.last?.onmessage?.({ data: JSON.stringify(frame) });
  });
}

describe('agentStore', () => {
  it('connects with the agent token and announces readiness', () => {
    connectAndOpen();

    expect(FakeWebSocket.last?.url).toContain('token=agent-jwt');
    expect(FakeWebSocket.last?.sent[0]).toBe(JSON.stringify({ type: 'AGENT_READY' }));
    expect(useAgentStore.getState().wsStatus).toBe('connected');
  });

  it('adds an offered session to the queued list', () => {
    connectAndOpen();

    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });

    expect(useAgentStore.getState().queuedSessions).toHaveLength(1);
    expect(useAgentStore.getState().queuedSessions[0].id).toBe('visitor_abc');
    expect(useAgentStore.getState().activeSessions).toHaveLength(0);
  });

  it('moves a session to active on accept', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });

    act(() => {
      useAgentStore.getState().acceptSession('visitor_abc');
    });

    expect(useAgentStore.getState().activeSessions).toHaveLength(1);
    expect(useAgentStore.getState().selectedSessionId).toBe('visitor_abc');
  });

  it('appends incoming visitor messages to the right session', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });

    receive({ type: 'CHAT', payload: { sender: 'visitor', text: '在吗', visitorId: 'visitor_abc' } });

    const session = useAgentStore.getState().queuedSessions[0];
    expect(session.messages[session.messages.length - 1].text).toBe('在吗');
  });

  it('sends agent replies with the visitor id', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });
    act(() => {
      useAgentStore.getState().acceptSession('visitor_abc');
      useAgentStore.getState().sendAgentMessage('visitor_abc', '您好');
    });

    const sent = FakeWebSocket.last?.sent ?? [];
    expect(sent[sent.length - 1]).toBe(
      JSON.stringify({ type: 'CHAT', payload: { text: '您好', visitorId: 'visitor_abc' } })
    );
    const session = useAgentStore.getState().activeSessions[0];
    expect(session.messages[session.messages.length - 1].sender).toBe('agent');
  });

  it('closes a session on demand', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });
    act(() => {
      useAgentStore.getState().acceptSession('visitor_abc');
      useAgentStore.getState().closeSessionByAgent('visitor_abc');
    });

    expect(useAgentStore.getState().activeSessions).toHaveLength(0);
    expect(useAgentStore.getState().selectedSessionId).toBeNull();
  });
});
