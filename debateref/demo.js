#!/usr/bin/env node

/**
 * Demo script for Debate Referee AI
 * This script demonstrates the core functionality without requiring user input
 */

import { DebateStore, DebateAnalyzer, ResultPrinter } from './dist/index.js';

// Mock runtime for demo purposes
const mockRuntime = {
  generateText: async ({ prompt }) => {
    // Simulate AI response based on prompt content
    if (prompt.includes('AI replace human teachers')) {
      return JSON.stringify({
        scores: {
          "user1": {
            clarity: 8,
            logic: 7,
            evidence: 6,
            relevance: 9,
            reasoning: "Clear argument with good structure and relevant points about AI benefits"
          },
          "user2": {
            clarity: 7,
            logic: 8,
            evidence: 7,
            relevance: 8,
            reasoning: "Well-reasoned counter-argument highlighting human elements in education"
          }
        },
        consensusStatement: "Both arguments present valid points about AI in education. The debate centers on balancing technological efficiency with human emotional intelligence in learning environments."
      });
    }
    
    // Fallback response
    return JSON.stringify({
      scores: {
        "user1": {
          clarity: 6,
          logic: 6,
          evidence: 5,
          relevance: 7,
          reasoning: "Basic argument structure with some relevant points"
        }
      },
      consensusStatement: "The arguments present different perspectives on the topic, each with valid considerations."
    });
  }
};

async function runDemo() {
  console.log('🎯 Debate Referee AI - Demo Mode\n');
  
  try {
    // Initialize components
    const store = new DebateStore('./demo-data');
    const analyzer = new DebateAnalyzer(mockRuntime);
    const printer = new ResultPrinter();
    
    await store.initialize();
    
    // Create a demo debate session
    console.log('📝 Creating debate session...');
    const session = await store.createSession('Should AI replace human teachers?');
    console.log(`✅ Session created: ${session.id}\n`);
    
    // Add demo arguments
    console.log('💬 Adding arguments...');
    
    const arg1 = await store.addArgument(
      session.id,
      'user1',
      'Alice Johnson',
      'AI can provide personalized learning experiences that adapt to each student\'s pace and learning style. With machine learning algorithms, AI can identify knowledge gaps and provide targeted interventions. Studies show that AI tutoring systems can improve learning outcomes by 30-40% compared to traditional methods. Additionally, AI can provide 24/7 availability and consistent quality of instruction.'
    );
    
    const arg2 = await store.addArgument(
      session.id,
      'user2',
      'Bob Smith',
      'While AI has technological advantages, it lacks the human touch that is crucial for education. Teachers provide emotional support, motivation, and social learning opportunities that AI cannot replicate. Human teachers can read non-verbal cues, provide encouragement during difficult times, and foster critical thinking through dialogue. The relationship between teacher and student is fundamental to the learning process and cannot be replaced by algorithms.'
    );
    
    console.log(`✅ Added ${arg1.userName}'s argument`);
    console.log(`✅ Added ${arg2.userName}'s argument\n`);
    
    // Get the updated session with arguments
    const updatedSession = await store.getSession(session.id);
    if (!updatedSession) {
      throw new Error('Session not found');
    }
    
    // Analyze the debate
    console.log('🤖 Analyzing debate with AI...');
    const result = await analyzer.analyzeDebate(updatedSession);
    
    // Fill in user names
    for (const [userId, userResult] of Object.entries(result.results)) {
      const argument = updatedSession.arguments.find(arg => arg.userId === userId);
      if (argument) {
        userResult.userName = argument.userName;
      }
    }
    
    // Save results
    await store.saveResults(result);
    await store.markSessionProcessed(updatedSession.id);
    
    console.log('✅ Analysis complete!\n');
    
    // Display results
    printer.printDebateResults(result);
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\nTo run the interactive version:');
    console.log('1. Set up your OpenAI API key in .env file');
    console.log('2. Run: npm run debate:dev');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
runDemo().catch(console.error);
