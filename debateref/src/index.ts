#!/usr/bin/env node

import { type IAgentRuntime, logger } from '@elizaos/core';
import { createInterface } from 'readline';
import { DebateStore, type DebateSession, type DebateResult } from './debateStore.js';
import { DebateAnalyzer } from './debateAnalyzer.js';
import { ResultPrinter } from './resultPrinter.js';

/**
 * Main CLI application for Debate Referee AI
 */
class DebateRefereeCLI {
  private store: DebateStore;
  private analyzer: DebateAnalyzer | null = null;
  private printer: ResultPrinter;
  private runtime: IAgentRuntime | null = null;
  private rl: any;

  constructor() {
    this.store = new DebateStore();
    this.printer = new ResultPrinter();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      // Initialize the debate store
      await this.store.initialize();
      
      // Initialize elizaOS runtime
      await this.initializeRuntime();
      
      // Initialize readline interface
      this.rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      this.printer.printSuccess('Debate Referee AI initialized successfully!');
    } catch (error) {
      this.printer.printError(`Failed to initialize: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  /**
   * Initialize elizaOS runtime
   */
  private async initializeRuntime(): Promise<void> {
    try {
      // Import elizaOS components
      const { createAgentRuntime } = await import('@elizaos/core');
      const { openaiPlugin } = await import('@elizaos/plugin-openai');
      
      // Create runtime with OpenAI plugin
      this.runtime = await createAgentRuntime({
        plugins: [openaiPlugin],
        character: {
          name: 'Debate Referee',
          description: 'AI-powered debate analysis system',
        },
      });

      // Initialize the analyzer with runtime
      this.analyzer = new DebateAnalyzer(this.runtime);
      
      logger.info('elizaOS runtime initialized successfully');
    } catch (error) {
      logger.warn(`Failed to initialize elizaOS runtime: ${error instanceof Error ? error.message : String(error)}`);
      logger.warn('Running in fallback mode without AI analysis');
      
      // Create a mock runtime for fallback mode
      this.runtime = {
        generateText: async () => {
          throw new Error('AI not available - using fallback mode');
        },
      } as any;
      
      this.analyzer = new DebateAnalyzer(this.runtime);
    }
  }

  /**
   * Start the main application loop
   */
  async start(): Promise<void> {
    this.printer.printHelp();
    
    while (true) {
      try {
        const choice = await this.promptUser('\nEnter your choice (1-7): ');
        
        switch (choice.trim()) {
          case '1':
            await this.createDebateSession();
            break;
          case '2':
            await this.viewSessions();
            break;
          case '3':
            await this.addArgument();
            break;
          case '4':
            await this.analyzeDebate();
            break;
          case '5':
            await this.viewResults();
            break;
          case '6':
            this.printer.printHelp();
            break;
          case '7':
            this.printer.printMessage('Thank you for using Debate Referee AI!');
            process.exit(0);
          default:
            this.printer.printError('Invalid choice. Please enter 1-7.');
        }
      } catch (error) {
        this.printer.printError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Create a new debate session
   */
  private async createDebateSession(): Promise<void> {
    const topic = await this.promptUser('Enter the debate topic: ');
    
    if (!topic.trim()) {
      this.printer.printError('Topic cannot be empty.');
      return;
    }

    try {
      const session = await this.store.createSession(topic.trim());
      this.printer.printSuccess(`Debate session created successfully!`);
      this.printer.printMessage(`Session ID: ${session.id}`);
      this.printer.printMessage(`Topic: ${session.topic}`);
    } catch (error) {
      this.printer.printError(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * View existing debate sessions
   */
  private async viewSessions(): Promise<void> {
    try {
      const sessions = await this.store.getAllSessions();
      this.printer.printSessionsList(sessions);
      
      if (sessions.length > 0) {
        const viewDetails = await this.promptUser('\nView details for a session? (y/n): ');
        if (viewDetails.toLowerCase() === 'y') {
          await this.viewSessionDetails();
        }
      }
    } catch (error) {
      this.printer.printError(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Display available sessions for user selection
   */
  private async displayAvailableSessions(): Promise<DebateSession[]> {
    const sessions = await this.store.getAllSessions();
    
    if (sessions.length === 0) {
      this.printer.printWarning('No debate sessions found. Create a new session first.');
      return [];
    }

    console.log('\n📋 Available Debate Sessions:');
    console.log('─'.repeat(60));
    
    sessions.forEach((session, index) => {
      const status = session.processedAt ? '✅ Processed' : '⏳ Pending';
      const argumentCount = session.arguments.length;
      
      console.log(`${index + 1}. ${session.topic}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Arguments: ${argumentCount} | Status: ${status}`);
      console.log(`   Created: ${new Date(session.createdAt).toLocaleString()}`);
      console.log();
    });
    
    return sessions;
  }

  /**
   * Get session by user selection (number or ID)
   */
  private async getSessionByUserInput(): Promise<DebateSession | null> {
    const sessions = await this.displayAvailableSessions();
    
    if (sessions.length === 0) {
      return null;
    }

    while (true) {
      const input = await this.promptUser(`\nEnter session number (1-${sessions.length}) or session ID: `);
      
      if (!input.trim()) {
        this.printer.printError('Please enter a valid session number or ID.');
        continue;
      }

      // Check if input is a number (session index)
      const sessionNumber = parseInt(input.trim());
      if (!isNaN(sessionNumber) && sessionNumber >= 1 && sessionNumber <= sessions.length) {
        return sessions[sessionNumber - 1];
      }

      // Check if input is a session ID
      const session = sessions.find(s => s.id === input.trim());
      if (session) {
        return session;
      }

      this.printer.printError(`Invalid session. Please enter a number between 1-${sessions.length} or a valid session ID.`);
    }
  }

  /**
   * View details of a specific session
   */
  private async viewSessionDetails(): Promise<void> {
    try {
      const session = await this.getSessionByUserInput();
      if (!session) {
        return;
      }
      
      this.printer.printSessionDetails(session);
    } catch (error) {
      this.printer.printError(`Failed to load session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add an argument to a debate session
   */
  private async addArgument(): Promise<void> {
    try {
      // First, let user select a session
      const session = await this.getSessionByUserInput();
      if (!session) {
        return;
      }

      // Show session info for confirmation
      console.log(`\n📝 Adding argument to: "${session.topic}"`);
      console.log(`Session ID: ${session.id}`);
      console.log(`Current arguments: ${session.arguments.length}`);
      
      const confirm = await this.promptUser('\nContinue? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        this.printer.printMessage('Operation cancelled.');
        return;
      }

      // Get user details
      const userId = await this.promptUser('Enter your user ID: ');
      if (!userId.trim()) {
        this.printer.printError('User ID is required.');
        return;
      }

      const userName = await this.promptUser('Enter your name: ');
      if (!userName.trim()) {
        this.printer.printError('Name is required.');
        return;
      }

      const argumentText = await this.promptUser('Enter your argument: ');
      if (!argumentText.trim()) {
        this.printer.printError('Argument text is required.');
        return;
      }

      // Add the argument
      const argument = await this.store.addArgument(
        session.id,
        userId.trim(),
        userName.trim(),
        argumentText.trim()
      );
      
      this.printer.printSuccess('Argument added successfully!');
      this.printer.printMessage(`Argument ID: ${argument.id}`);
      this.printer.printMessage(`Session: ${session.topic}`);
      
    } catch (error) {
      this.printer.printError(`Failed to add argument: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze a debate session
   */
  private async analyzeDebate(): Promise<void> {
    try {
      // First, let user select a session
      const session = await this.getSessionByUserInput();
      if (!session) {
        return;
      }

      // Check if session has arguments
      if (session.arguments.length === 0) {
        this.printer.printError('No arguments to analyze. Add arguments first.');
        return;
      }

      // Show session info for confirmation
      console.log(`\n🤖 Analyzing debate: "${session.topic}"`);
      console.log(`Session ID: ${session.id}`);
      console.log(`Arguments to analyze: ${session.arguments.length}`);
      console.log(`Participants: ${[...new Set(session.arguments.map(arg => arg.userName))].join(', ')}`);
      
      const confirm = await this.promptUser('\nStart analysis? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        this.printer.printMessage('Analysis cancelled.');
        return;
      }

      if (!this.analyzer) {
        this.printer.printError('Analyzer not initialized.');
        return;
      }

      this.printer.printMessage('Analyzing debate... This may take a moment.');
      
      // Analyze the debate
      const result = await this.analyzer.analyzeDebate(session);
      
      // Fill in user names from session data
      for (const [userId, userResult] of Object.entries(result.results)) {
        const argument = session.arguments.find(arg => arg.userId === userId);
        if (argument) {
          userResult.userName = argument.userName;
        }
      }
      
      // Save the results
      await this.store.saveResults(result);
      await this.store.markSessionProcessed(session.id);
      
      // Display the results
      this.printer.printDebateResults(result);
      
    } catch (error) {
      this.printer.printError(`Failed to analyze debate: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * View debate results
   */
  private async viewResults(): Promise<void> {
    try {
      // First, let user select a session
      const session = await this.getSessionByUserInput();
      if (!session) {
        return;
      }

      // Check if results exist
      const result = await this.store.getResults(session.id);
      if (!result) {
        this.printer.printError('No results found for this session. Run analysis first.');
        return;
      }
      
      // Show session info for confirmation
      console.log(`\n📊 Viewing results for: "${session.topic}"`);
      console.log(`Session ID: ${session.id}`);
      console.log(`Analysis completed: ${new Date(result.processedAt).toLocaleString()}`);
      
      const confirm = await this.promptUser('\nDisplay results? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        this.printer.printMessage('Operation cancelled.');
        return;
      }
      
      this.printer.printDebateResults(result);
    } catch (error) {
      this.printer.printError(`Failed to load results: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Prompt user for input
   */
  private promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer: string) => {
        resolve(answer);
      });
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.rl) {
      this.rl.close();
    }
    
    if (this.runtime) {
      try {
        await this.runtime.cleanup?.();
      } catch (error) {
        logger.warn('Error during runtime cleanup:', error);
      }
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const app = new DebateRefereeCLI();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down gracefully...');
    await app.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\nShutting down gracefully...');
    await app.cleanup();
    process.exit(0);
  });

  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('Fatal error:', error);
    await app.cleanup();
    process.exit(1);
  }
}

// Run the application
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

export { DebateRefereeCLI };
export { DebateStore } from './debateStore.js';
export { DebateAnalyzer } from './debateAnalyzer.js';
export { ResultPrinter } from './resultPrinter.js';