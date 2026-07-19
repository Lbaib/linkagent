import { renderHook, act } from '@testing-library/react';
import { useChatStore } from './chatStore';

describe('chatStore', () => {
  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useChatStore());
    expect(result.current.wsStatus).toBe('disconnected');
    expect(result.current.sessionStatus).toBe('ai_chat');
    expect(result.current.messages).toHaveLength(1);
  });
  
  it('should append visitor message and update status', () => {
    const { result } = renderHook(() => useChatStore());
    act(() => {
      // simulate internal push
      result.current._pushMessage({
        id: 'msg-1',
        sender: 'visitor',
        text: 'hello',
        timestamp: '10:00'
      });
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe('hello');
  });
});
