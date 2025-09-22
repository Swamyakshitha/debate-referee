import { type DebateResult, type DebateSession } from './debateStore.js';

/**
 * Result Printer - Handles console output formatting for debate results
 */
export class ResultPrinter {
  private readonly maxWidth = 80;
  private readonly borderChar = '═';
  private readonly separatorChar = '─';
  private readonly cornerChar = '╔╗╚╝';
  private readonly sideChar = '║';

  /**
   * Print the main debate results in a formatted table
   */
  printDebateResults(result: DebateResult): void {
    console.clear();
    this.printHeader('DEBATE REFEREE AI - RESULTS');
    this.printTopic(result.topic);
    this.printSeparator();
    
    this.printScoresTable(result);
    this.printSeparator();
    
    this.printWinner(result);
    this.printSeparator();
    
    this.printConsensus(result.consensusStatement);
    this.printSeparator();
    
    this.printFooter();
  }

  /**
   * Print a list of available debate sessions
   */
  printSessionsList(sessions: DebateSession[]): void {
    console.clear();
    this.printHeader('AVAILABLE DEBATE SESSIONS');
    
    if (sessions.length === 0) {
      this.printCentered('No debate sessions found.');
      this.printSeparator();
      return;
    }

    sessions.forEach((session, index) => {
      const status = session.processedAt ? '✅ Processed' : '⏳ Pending';
      const argumentCount = session.arguments.length;
      
      console.log(`${this.sideChar} ${index + 1}. ${session.topic}`);
      console.log(`${this.sideChar}    ID: ${session.id}`);
      console.log(`${this.sideChar}    Arguments: ${argumentCount}`);
      console.log(`${this.sideChar}    Status: ${status}`);
      console.log(`${this.sideChar}    Created: ${new Date(session.createdAt).toLocaleString()}`);
      
      if (index < sessions.length - 1) {
        console.log(`${this.sideChar}`);
      }
    });
    
    this.printSeparator();
  }

  /**
   * Print a single debate session details
   */
  printSessionDetails(session: DebateSession): void {
    console.clear();
    this.printHeader('DEBATE SESSION DETAILS');
    this.printTopic(session.topic);
    this.printSeparator();
    
    console.log(`${this.sideChar} Session ID: ${session.id}`);
    console.log(`${this.sideChar} Created: ${new Date(session.createdAt).toLocaleString()}`);
    console.log(`${this.sideChar} Arguments: ${session.arguments.length}`);
    console.log(`${this.sideChar} Status: ${session.processedAt ? '✅ Processed' : '⏳ Pending'}`);
    this.printSeparator();
    
    if (session.arguments.length === 0) {
      this.printCentered('No arguments submitted yet.');
    } else {
      this.printArguments(session.arguments);
    }
    
    this.printSeparator();
  }

  /**
   * Print arguments in a formatted way
   */
  private printArguments(args: any[]): void {
    console.log(`${this.sideChar} ARGUMENTS:`);
    console.log(`${this.sideChar}`);
    
    args.forEach((arg, index) => {
      console.log(`${this.sideChar} ${index + 1}. ${arg.userName} (${arg.userId})`);
      console.log(`${this.sideChar}    ${new Date(arg.timestamp).toLocaleString()}`);
      console.log(`${this.sideChar}`);
      
      // Wrap long text
      const wrappedText = this.wrapText(arg.text, this.maxWidth - 6);
      wrappedText.forEach(line => {
        console.log(`${this.sideChar}    ${line}`);
      });
      
      if (index < args.length - 1) {
        console.log(`${this.sideChar}`);
      }
    });
  }

  /**
   * Print the scores table
   */
  private printScoresTable(result: DebateResult): void {
    console.log(`${this.sideChar} SCORING RESULTS:`);
    console.log(`${this.sideChar}`);
    
    // Table header
    const header = 'User'.padEnd(15) + 'Clarity'.padEnd(8) + 'Logic'.padEnd(8) + 'Evidence'.padEnd(9) + 'Relevance'.padEnd(10) + 'Final';
    console.log(`${this.sideChar} ${header}`);
    console.log(`${this.sideChar} ${this.separatorChar.repeat(header.length)}`);
    
    // Table rows
    Object.entries(result.results).forEach(([userId, userResult]) => {
      const row = 
        userResult.userName.padEnd(15) +
        userResult.scores.clarity.toString().padEnd(8) +
        userResult.scores.logic.toString().padEnd(8) +
        userResult.scores.evidence.toString().padEnd(9) +
        userResult.scores.relevance.toString().padEnd(10) +
        userResult.finalScore.toString();
      
      console.log(`${this.sideChar} ${row}`);
    });
    
    console.log(`${this.sideChar}`);
    console.log(`${this.sideChar} Scoring Weights: Clarity 25%, Logic 30%, Evidence 25%, Relevance 20%`);
  }

  /**
   * Print the winner information
   */
  private printWinner(result: DebateResult): void {
    console.log(`${this.sideChar} WINNER:`);
    console.log(`${this.sideChar}`);
    
    if (result.isTie) {
      this.printCentered('🏆 TIE! Multiple participants scored equally well.');
    } else if (result.winner) {
      this.printCentered(`🏆 WINNER: ${result.winner.userName}`);
      this.printCentered(`Final Score: ${result.winner.finalScore}/10`);
    } else {
      this.printCentered('No winner determined.');
    }
  }

  /**
   * Print the consensus statement
   */
  private printConsensus(consensus: string): void {
    console.log(`${this.sideChar} CONSENSUS STATEMENT:`);
    console.log(`${this.sideChar}`);
    
    const wrappedConsensus = this.wrapText(consensus, this.maxWidth - 6);
    wrappedConsensus.forEach(line => {
      console.log(`${this.sideChar} ${line}`);
    });
  }

  /**
   * Print the topic
   */
  private printTopic(topic: string): void {
    this.printCentered(`Topic: ${topic}`);
  }

  /**
   * Print a header with decorative border
   */
  private printHeader(title: string): void {
    const topBorder = '╔' + this.borderChar.repeat(this.maxWidth - 2) + '╗';
    const titleLine = this.sideChar + ' '.repeat(Math.floor((this.maxWidth - title.length - 2) / 2)) + 
                     title + ' '.repeat(Math.ceil((this.maxWidth - title.length - 2) / 2)) + this.sideChar;
    
    console.log(topBorder);
    console.log(titleLine);
    console.log('╚' + this.borderChar.repeat(this.maxWidth - 2) + '╝');
  }

  /**
   * Print a separator line
   */
  private printSeparator(): void {
    console.log(this.sideChar + this.separatorChar.repeat(this.maxWidth - 2) + this.sideChar);
  }

  /**
   * Print centered text
   */
  private printCentered(text: string): void {
    const padding = Math.max(0, Math.floor((this.maxWidth - text.length - 2) / 2));
    const line = this.sideChar + ' '.repeat(padding) + text + ' '.repeat(this.maxWidth - text.length - padding - 2) + this.sideChar;
    console.log(line);
  }

  /**
   * Print footer
   */
  private printFooter(): void {
    console.log('╚' + this.borderChar.repeat(this.maxWidth - 2) + '╝');
    console.log();
  }

  /**
   * Wrap text to fit within specified width
   */
  private wrapText(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Print a simple message
   */
  printMessage(message: string): void {
    console.log(`\n${message}\n`);
  }

  /**
   * Print an error message
   */
  printError(message: string): void {
    console.error(`\n❌ ERROR: ${message}\n`);
  }

  /**
   * Print a success message
   */
  printSuccess(message: string): void {
    console.log(`\n✅ ${message}\n`);
  }

  /**
   * Print a warning message
   */
  printWarning(message: string): void {
    console.log(`\n⚠️  WARNING: ${message}\n`);
  }

  /**
   * Print help information
   */
  printHelp(): void {
    console.clear();
    this.printHeader('DEBATE REFEREE AI - HELP');
    
    console.log(`${this.sideChar} COMMANDS:`);
    console.log(`${this.sideChar}`);
    console.log(`${this.sideChar} 1. Create new debate session`);
    console.log(`${this.sideChar} 2. View existing sessions`);
    console.log(`${this.sideChar} 3. Add argument to session`);
    console.log(`${this.sideChar} 4. Analyze debate (requires arguments)`);
    console.log(`${this.sideChar} 5. View results`);
    console.log(`${this.sideChar} 6. Help`);
    console.log(`${this.sideChar} 7. Exit`);
    console.log(`${this.sideChar}`);
    console.log(`${this.sideChar} SESSION SELECTION:`);
    console.log(`${this.sideChar} - You can select sessions by number (1, 2, 3...) or by ID`);
    console.log(`${this.sideChar} - Session IDs are long strings like: debate_1758xxx_abc123`);
    console.log(`${this.sideChar} - The system will show you all available sessions first`);
    console.log(`${this.sideChar}`);
    console.log(`${this.sideChar} SCORING CRITERIA:`);
    console.log(`${this.sideChar} - Clarity (25%): How clear and well-structured`);
    console.log(`${this.sideChar} - Logic (30%): How sound the reasoning is`);
    console.log(`${this.sideChar} - Evidence (25%): How well-supported with evidence`);
    console.log(`${this.sideChar} - Relevance (20%): How relevant to the topic`);
    console.log(`${this.sideChar}`);
    console.log(`${this.sideChar} Each criterion is scored 0-10, then weighted.`);
    console.log(`${this.sideChar} Final score is out of 10.`);
    
    this.printSeparator();
  }
}
