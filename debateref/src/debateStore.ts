import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Interface for a single argument submitted by a user
 */
export interface Argument {
  id: string;
  userId: string;
  userName: string;
  topic: string;
  text: string;
  timestamp: number;
}

/**
 * Interface for a complete debate session
 */
export interface DebateSession {
  id: string;
  topic: string;
  arguments: Argument[];
  createdAt: number;
  processedAt?: number;
}

/**
 * Interface for debate results after AI analysis
 */
export interface DebateResult {
  sessionId: string;
  topic: string;
  results: {
    [userId: string]: {
      userName: string;
      scores: {
        clarity: number;
        logic: number;
        evidence: number;
        relevance: number;
      };
      finalScore: number;
      reasoning: string;
    };
  };
  winner: {
    userId: string;
    userName: string;
    finalScore: number;
  } | null;
  isTie: boolean;
  consensusStatement: string;
  processedAt: number;
}

/**
 * Debate Store - Handles JSON file persistence for arguments and results
 */
export class DebateStore {
  private readonly dataDir: string;
  private readonly sessionsFile: string;
  private readonly resultsFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.sessionsFile = join(dataDir, 'sessions.json');
    this.resultsFile = join(dataDir, 'results.json');
  }

  /**
   * Initialize the data directory and files
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize sessions file if it doesn't exist
      try {
        await fs.access(this.sessionsFile);
      } catch {
        await fs.writeFile(this.sessionsFile, JSON.stringify([], null, 2));
      }

      // Initialize results file if it doesn't exist
      try {
        await fs.access(this.resultsFile);
      } catch {
        await fs.writeFile(this.resultsFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      throw new Error(`Failed to initialize debate store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new debate session
   */
  async createSession(topic: string): Promise<DebateSession> {
    const session: DebateSession = {
      id: this.generateId(),
      topic,
      arguments: [],
      createdAt: Date.now(),
    };

    const sessions = await this.loadSessions();
    sessions.push(session);
    await this.saveSessions(sessions);

    return session;
  }

  /**
   * Get a debate session by ID
   */
  async getSession(sessionId: string): Promise<DebateSession | null> {
    const sessions = await this.loadSessions();
    return sessions.find(session => session.id === sessionId) || null;
  }

  /**
   * Get all debate sessions
   */
  async getAllSessions(): Promise<DebateSession[]> {
    return await this.loadSessions();
  }

  /**
   * Add an argument to a debate session
   */
  async addArgument(sessionId: string, userId: string, userName: string, argumentText: string): Promise<Argument> {
    const sessions = await this.loadSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const argument: Argument = {
      id: this.generateId(),
      userId,
      userName,
      topic: sessions[sessionIndex].topic,
      text: argumentText,
      timestamp: Date.now(),
    };

    sessions[sessionIndex].arguments.push(argument);
    await this.saveSessions(sessions);

    return argument;
  }

  /**
   * Save debate results
   */
  async saveResults(result: DebateResult): Promise<void> {
    const results = await this.loadResults();
    results.push(result);
    await this.saveResults(results);
  }

  /**
   * Get debate results by session ID
   */
  async getResults(sessionId: string): Promise<DebateResult | null> {
    const results = await this.loadResults();
    return results.find(result => result.sessionId === sessionId) || null;
  }

  /**
   * Get all debate results
   */
  async getAllResults(): Promise<DebateResult[]> {
    return await this.loadResults();
  }

  /**
   * Mark a session as processed
   */
  async markSessionProcessed(sessionId: string): Promise<void> {
    const sessions = await this.loadSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error(`Session ${sessionId} not found`);
    }

    sessions[sessionIndex].processedAt = Date.now();
    await this.saveSessions(sessions);
  }

  /**
   * Load sessions from JSON file
   */
  private async loadSessions(): Promise<DebateSession[]> {
    try {
      const data = await fs.readFile(this.sessionsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save sessions to JSON file
   */
  private async saveSessions(sessions: DebateSession[]): Promise<void> {
    try {
      await fs.writeFile(this.sessionsFile, JSON.stringify(sessions, null, 2));
    } catch (error) {
      throw new Error(`Failed to save sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load results from JSON file
   */
  private async loadResults(): Promise<DebateResult[]> {
    try {
      const data = await fs.readFile(this.resultsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load results: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save results to JSON file
   */
  private async saveResults(results: DebateResult[]): Promise<void> {
    try {
      await fs.writeFile(this.resultsFile, JSON.stringify(results, null, 2));
    } catch (error) {
      throw new Error(`Failed to save results: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `debate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
