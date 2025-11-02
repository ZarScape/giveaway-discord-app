# Contributing to giveaway-discord-app

First off, thank you for considering contributing to giveaway-discord-app! It's people like you that make this Discord bot even better.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue list](https://github.com/ZarScape/giveaway-discord-app/issues) as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include any error messages or logs

### Suggesting Enhancements

If you have a suggestion for the bot, we'd love to hear it! Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* A clear and descriptive title
* A detailed description of the proposed functionality
* Any possible drawbacks or considerations
* If relevant, include mock-ups or examples of similar features in other bots

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code follows the existing style (use ESLint)
4. Make sure your commit messages are clear and descriptive
5. Include screenshots or examples if you've changed the UI/UX

## Development Setup

1. Install Node.js (>=16.9.0, Node 18 LTS recommended)
2. Fork and clone the repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with your Discord bot credentials
5. Run the bot in development mode:
   ```bash
   npm start
   ```

## Coding Standards

* Use ESLint with the project's configuration
* Follow the existing code style
* Write clear, commented code
* Keep functions focused and modular
* Add JSDoc comments for new functions
* Test your changes thoroughly

## File Structure

```
src/
  ├── config/        # Configuration files
  ├── console/       # Console utilities
  ├── events/        # Discord event handlers
  ├── handlers/      # Command and event handlers
  └── slashCommands/ # Bot slash commands
```

## Testing

* Test your changes locally before submitting a PR
* Ensure all existing tests pass
* Add new tests for new functionality
* Test edge cases and error handling

## Documentation

* Update the README.md if you change functionality
* Add JSDoc comments for new functions
* Update the changelog with your changes

## Questions?

Join our [Discord server](https://discord.gg/6YVmxA4Qsf) for quick help or to discuss features.

## License

By contributing, you agree that your contributions will be licensed under the same license as the original project.