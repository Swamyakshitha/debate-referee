import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DebateStore } from '../debateStore.js';
import { ResultPrinter } from '../resultPrinter.js';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('Debate Referee AI', () => {
  const testDataDir = './test-data';
  let store: DebateStore;
  let printer: ResultPrinter;

  beforeEach(async () => {
    // Use a separate test data directory
    store = new DebateStore(testDataDir);
    printer = new ResultPrinter();
    await store.initialize();
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('DebateStore', () => {
    it('should create a new debate session', async () => {
      const topic = 'Should AI replace human teachers?';
      const session = await store.createSession(topic);
      
      expect(session).toBeDefined();
      expect(session.topic).toBe(topic);
      expect(session.arguments).toHaveLength(0);
      expect(session.id).toBeDefined();
      expect(session.createdAt).toBeDefined();
    });

    it('should add arguments to a session', async () => {
      const session = await store.createSession('Test topic');
      const argument = await store.addArgument(
        session.id,
        'user1',
        'John Doe',
        'This is a test argument with some evidence and logical reasoning.'
      );
      
      expect(argument).toBeDefined();
      expect(argument.userId).toBe('user1');
      expect(argument.userName).toBe('John Doe');
      expect(argument.text).toBe('This is a test argument with some evidence and logical reasoning.');
      
      const updatedSession = await store.getSession(session.id);
      expect(updatedSession?.arguments).toHaveLength(1);
    });

    it('should retrieve sessions', async () => {
      const session1 = await store.createSession('Topic 1');
      const session2 = await store.createSession('Topic 2');
      
      const sessions = await store.getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions.some(s => s.id === session1.id)).toBe(true);
      expect(sessions.some(s => s.id === session2.id)).toBe(true);
    });
  });

  describe('ResultPrinter', () => {
    it('should format text correctly', () => {
      const longText = 'This is a very long text that should be wrapped to fit within the specified width limit for proper display in the console output.';
      const wrapped = printer['wrapText'](longText, 50);
      
      expect(wrapped).toBeDefined();
      expect(wrapped.length).toBeGreaterThan(1);
      expect(wrapped.every(line => line.length <= 50)).toBe(true);
    });

    it('should handle empty text', () => {
      const wrapped = printer['wrapText']('', 50);
      expect(wrapped).toEqual([]);
    });

    it('should handle short text', () => {
      const wrapped = printer['wrapText']('Short text', 50);
      expect(wrapped).toEqual(['Short text']);
    });
  });

  describe('Integration', () => {
    it('should handle a complete debate workflow', async () => {
      // Create session
      const session = await store.createSession('Should we use AI in education?');
      
      // Add arguments
      await store.addArgument(
        session.id,
        'user1',
        'Alice',
        'AI can provide personalized learning experiences and adapt to individual student needs, making education more effective.'
      );
      
      await store.addArgument(
        session.id,
        'user2',
        'Bob',
        'While AI has benefits, it lacks the human touch and emotional intelligence that teachers provide, which is crucial for student development.'
      );
      
      // Verify session has arguments
      const updatedSession = await store.getSession(session.id);
      expect(updatedSession?.arguments).toHaveLength(2);
      
      // Test that we can retrieve the session
      const retrievedSession = await store.getSession(session.id);
      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.arguments).toHaveLength(2);
    });
  });
});
