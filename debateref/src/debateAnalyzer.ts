import { type IAgentRuntime, logger, ModelType } from '@elizaos/core';
import { type DebateSession, type DebateResult } from './debateStore.js';

/**
 * Interface for AI scoring response
 */
interface AIScoringResponse {
  scores: {
    [userId: string]: {
      clarity: number;
      logic: number;
      evidence: number;
      relevance: number;
      reasoning: string;
    };
  };
  consensusStatement: string;
}

/**
 * Interface for fallback scoring data
 */
interface FallbackScoringData {
  [userId: string]: {
    clarity: number;
    logic: number;
    evidence: number;
    relevance: number;
    reasoning: string;
  };
}

/**
 * Debate Analyzer - Handles AI processing and scoring of arguments
 */
export class DebateAnalyzer {
  private runtime: IAgentRuntime;
  private readonly scoringWeights = {
    clarity: 0.25,
    logic: 0.30,
    evidence: 0.25,
    relevance: 0.20,
  };

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Analyze a debate session and return results
   */
  async analyzeDebate(session: DebateSession): Promise<DebateResult> {
    try {
      logger.info(`Analyzing debate session: ${session.id}`);
      
      if (session.arguments.length === 0) {
        throw new Error('No arguments to analyze');
      }

      // Try AI analysis first
      let aiResponse: AIScoringResponse;
      try {
        aiResponse = await this.performAIAnalysis(session);
      } catch (error) {
        logger.warn(`AI analysis failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
        aiResponse = this.performFallbackAnalysis(session);
      }

      // Calculate final scores and determine winner
      const results = this.calculateFinalScores(aiResponse.scores);
      const winner = this.determineWinner(results);

      const debateResult: DebateResult = {
        sessionId: session.id,
        topic: session.topic,
        results,
        winner: winner.winner,
        isTie: winner.isTie,
        consensusStatement: aiResponse.consensusStatement,
        processedAt: Date.now(),
      };

      logger.info(`Debate analysis completed for session: ${session.id}`);
      return debateResult;

    } catch (error) {
      logger.error({ error }, 'Error analyzing debate');
      throw new Error(`Failed to analyze debate: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Perform AI analysis using OpenAI plugin
   */
  private async performAIAnalysis(session: DebateSession): Promise<AIScoringResponse> {
    const prompt = this.constructAnalysisPrompt(session);
    
    try {
      const response = await this.runtime.generateText({
        model: ModelType.TEXT_LARGE,
        prompt,
        maxTokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent scoring
      });

      return this.parseAIResponse(response, session);
    } catch (error) {
      logger.error({ error }, 'OpenAI API call failed');
      throw error;
    }
  }

  /**
   * Construct the analysis prompt for AI
   */
  private constructAnalysisPrompt(session: DebateSession): string {
    const argumentsText = session.arguments
      .map((arg, index) => 
        `Argument ${index + 1} (User: ${arg.userName}):\n${arg.text}\n`
      )
      .join('\n');

    return `You are an expert debate judge. Analyze the following arguments for the topic "${session.topic}" and score each argument on four criteria (0-10 scale):

CRITERIA:
- Clarity: How clear and well-structured is the argument?
- Logic: How sound is the logical reasoning?
- Evidence: How well-supported is the argument with evidence?
- Relevance: How relevant is the argument to the topic?

ARGUMENTS:
${argumentsText}

Please respond with a JSON object in this exact format:
{
  "scores": {
    "${session.arguments[0].userId}": {
      "clarity": 8,
      "logic": 7,
      "evidence": 6,
      "relevance": 9,
      "reasoning": "Brief explanation of the scoring"
    }
  },
  "consensusStatement": "A neutral summary of the key points and overall consensus"
}

IMPORTANT:
- Score each argument on a 0-10 scale for each criterion
- Provide brief reasoning for each score
- Create a neutral consensus statement
- Ensure all user IDs from the arguments are included in the scores object
- Return ONLY valid JSON, no additional text`;
  }

  /**
   * Parse AI response and validate structure
   */
  private parseAIResponse(response: string, session: DebateSession): AIScoringResponse {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate that all arguments are scored
      for (const arg of session.arguments) {
        if (!parsed.scores[arg.userId]) {
          throw new Error(`Missing score for user ${arg.userId}`);
        }
        
        const score = parsed.scores[arg.userId];
        if (typeof score.clarity !== 'number' || score.clarity < 0 || score.clarity > 10) {
          throw new Error(`Invalid clarity score for user ${arg.userId}`);
        }
        if (typeof score.logic !== 'number' || score.logic < 0 || score.logic > 10) {
          throw new Error(`Invalid logic score for user ${arg.userId}`);
        }
        if (typeof score.evidence !== 'number' || score.evidence < 0 || score.evidence > 10) {
          throw new Error(`Invalid evidence score for user ${arg.userId}`);
        }
        if (typeof score.relevance !== 'number' || score.relevance < 0 || score.relevance > 10) {
          throw new Error(`Invalid relevance score for user ${arg.userId}`);
        }
      }

      return parsed as AIScoringResponse;
    } catch (error) {
      logger.error({ error, response }, 'Failed to parse AI response');
      throw new Error(`Invalid AI response format: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Perform fallback analysis when AI is unavailable
   */
  private performFallbackAnalysis(session: DebateSession): AIScoringResponse {
    logger.info('Performing fallback analysis');
    
    const scores: FallbackScoringData = {};
    
    // Simple fallback scoring based on argument length and basic heuristics
    for (const arg of session.arguments) {
      const wordCount = arg.text.split(/\s+/).length;
      const hasEvidence = this.detectEvidence(arg.text);
      const hasStructure = this.detectStructure(arg.text);
      
      // Basic scoring algorithm
      const clarity = Math.min(10, Math.max(5, hasStructure ? 8 : 6));
      const logic = Math.min(10, Math.max(4, wordCount > 50 ? 7 : 5));
      const evidence = Math.min(10, Math.max(3, hasEvidence ? 8 : 4));
      const relevance = Math.min(10, Math.max(6, this.calculateRelevance(arg.text, session.topic)));

      scores[arg.userId] = {
        clarity,
        logic,
        evidence,
        relevance,
        reasoning: `Fallback scoring: ${hasStructure ? 'Well-structured' : 'Basic structure'}, ${hasEvidence ? 'Contains evidence' : 'Limited evidence'}, ${wordCount} words`,
      };
    }

    const consensusStatement = `Fallback analysis: ${session.arguments.length} arguments analyzed using basic heuristics. Results may vary from AI analysis.`;

    return {
      scores,
      consensusStatement,
    };
  }

  /**
   * Detect if argument contains evidence indicators
   */
  private detectEvidence(text: string): boolean {
    const evidenceIndicators = [
      'according to', 'research shows', 'studies indicate', 'data suggests',
      'statistics show', 'evidence shows', 'proven', 'demonstrated',
      'example', 'for instance', 'case study', 'survey', 'poll'
    ];
    
    const lowerText = text.toLowerCase();
    return evidenceIndicators.some(indicator => lowerText.includes(indicator));
  }

  /**
   * Detect if argument has good structure
   */
  private detectStructure(text: string): boolean {
    const structureIndicators = [
      'first', 'second', 'third', 'furthermore', 'moreover', 'additionally',
      'however', 'therefore', 'consequently', 'in conclusion', 'to summarize'
    ];
    
    const lowerText = text.toLowerCase();
    return structureIndicators.some(indicator => lowerText.includes(indicator));
  }

  /**
   * Calculate relevance score based on topic keywords
   */
  private calculateRelevance(text: string, topic: string): number {
    const topicWords = topic.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);
    
    const matches = topicWords.filter(word => 
      textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
    );
    
    const relevanceRatio = matches.length / topicWords.length;
    return Math.min(10, Math.max(5, relevanceRatio * 10 + 5));
  }

  /**
   * Calculate final weighted scores
   */
  private calculateFinalScores(scores: FallbackScoringData): DebateResult['results'] {
    const results: DebateResult['results'] = {};
    
    for (const [userId, score] of Object.entries(scores)) {
      const finalScore = 
        (score.clarity * this.scoringWeights.clarity) +
        (score.logic * this.scoringWeights.logic) +
        (score.evidence * this.scoringWeights.evidence) +
        (score.relevance * this.scoringWeights.relevance);
      
      results[userId] = {
        userName: '', // Will be filled by caller
        scores: {
          clarity: Math.round(score.clarity * 10) / 10,
          logic: Math.round(score.logic * 10) / 10,
          evidence: Math.round(score.evidence * 10) / 10,
          relevance: Math.round(score.relevance * 10) / 10,
        },
        finalScore: Math.round(finalScore * 100) / 100,
        reasoning: score.reasoning,
      };
    }
    
    return results;
  }

  /**
   * Determine the winner of the debate
   */
  private determineWinner(results: DebateResult['results']): { winner: DebateResult['winner']; isTie: boolean } {
    const entries = Object.entries(results);
    
    if (entries.length === 0) {
      return { winner: null, isTie: false };
    }
    
    if (entries.length === 1) {
      const [userId, result] = entries[0];
      return { 
        winner: { userId, userName: result.userName, finalScore: result.finalScore }, 
        isTie: false 
      };
    }
    
    // Sort by final score
    entries.sort(([, a], [, b]) => b.finalScore - a.finalScore);
    
    const [winnerUserId, winnerResult] = entries[0];
    const [, secondResult] = entries[1];
    
    // Check for tie (within 0.1 points)
    const isTie = Math.abs(winnerResult.finalScore - secondResult.finalScore) < 0.1;
    
    return {
      winner: isTie ? null : { 
        userId: winnerUserId, 
        userName: winnerResult.userName, 
        finalScore: winnerResult.finalScore 
      },
      isTie,
    };
  }
}
