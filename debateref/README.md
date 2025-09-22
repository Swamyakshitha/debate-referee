# Debate Referee AI

A console-based AI-powered debate analysis system built with elizaOS framework. The system collects arguments from multiple users, analyzes them using a comprehensive scoring rubric, and determines a winner with detailed reasoning.

## Features

- **Multi-user Argument Collection**: Users can submit arguments for any debate topic
- **AI-Powered Analysis**: Uses OpenAI's GPT models to score arguments on four criteria
- **Comprehensive Scoring**: Clarity (25%), Logic (30%), Evidence (25%), Relevance (20%)
- **Fallback Mode**: Works without AI when OpenAI API is unavailable
- **JSON Storage**: Local file-based storage for arguments and results
- **Beautiful Console Output**: Formatted tables and results display
- **Modular Architecture**: Easy to extend with database or web UI

## Installation

1. **Clone and navigate to the project**:
   ```bash
   cd debateref
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

## Configuration

### Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (get from https://platform.openai.com/api-keys)

### Optional Environment Variables

- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4)
- `OPENAI_TEMPERATURE`: Temperature for AI responses (default: 0.3)
- `OPENAI_MAX_TOKENS`: Maximum tokens for AI responses (default: 2000)
- `DATA_DIR`: Directory for storing JSON files (default: ./data)
- `LOG_LEVEL`: Logging level (default: info)

## Usage

### Running the Application

```bash
npm start
# or
node dist/src/index.js
```

### Console Commands

1. **Create new debate session** - Start a new debate topic
2. **View existing sessions** - List all debate sessions
3. **Add argument to session** - Submit an argument for analysis
4. **Analyze debate** - Process arguments with AI scoring
5. **View results** - Display formatted results and winner
6. **Help** - Show command reference
7. **Exit** - Quit the application

### Example Workflow

1. Create a debate session with topic: "Should AI replace human teachers?"
2. Add arguments from different users
3. Run analysis to get AI-powered scoring
4. View results with winner determination and consensus statement

## Scoring Rubric

The system evaluates arguments on four criteria:

- **Clarity (25%)**: How clear and well-structured is the argument?
- **Logic (30%)**: How sound is the logical reasoning?
- **Evidence (25%)**: How well-supported is the argument with evidence?
- **Relevance (20%)**: How relevant is the argument to the topic?

Each criterion is scored 0-10, then weighted to produce a final score out of 10.

## Architecture

### Core Modules

- **`debateStore.ts`**: JSON file persistence for arguments and results
- **`debateAnalyzer.ts`**: AI processing and scoring logic with fallback
- **`resultPrinter.ts`**: Console output formatting and display
- **`index.ts`**: Main CLI application and user interface

### Data Storage

- **Sessions**: `./data/sessions.json` - Debate sessions and arguments
- **Results**: `./data/results.json` - Analysis results and scores

### Error Handling

- Graceful fallback when OpenAI API is unavailable
- Comprehensive error messages and logging
- Input validation and data integrity checks

## Development

### Project Structure

```
src/
├── debateStore.ts      # Data persistence layer
├── debateAnalyzer.ts   # AI analysis and scoring
├── resultPrinter.ts    # Console output formatting
├── index.ts           # Main CLI application
└── __tests__/         # Test files
```

### Building

```bash
npm run build          # Build TypeScript to JavaScript
npm run type-check     # Type checking
npm run lint          # Code formatting
```

### Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Fallback Mode

When OpenAI API is unavailable, the system automatically switches to fallback mode:

- Uses heuristic-based scoring algorithms
- Analyzes argument length, structure, and evidence indicators
- Provides basic relevance scoring based on topic keywords
- Maintains full functionality without AI dependency

## Extensibility

The modular architecture makes it easy to extend:

- **Database Integration**: Replace JSON storage with SQL/NoSQL database
- **Web Interface**: Add REST API endpoints and web UI
- **Additional AI Models**: Support for other AI providers
- **Custom Scoring**: Modify or add new scoring criteria
- **Real-time Features**: WebSocket support for live debates

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**: Ensure your API key is correctly set in `.env`
2. **Permission Errors**: Check file permissions for the `./data` directory
3. **Module Not Found**: Run `npm run build` to compile TypeScript
4. **Port Conflicts**: The application doesn't use network ports (console-only)

### Logs

Check console output for detailed error messages and debugging information.

## License

This project is part of the elizaOS framework ecosystem.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review elizaOS documentation
- Open an issue in the repository