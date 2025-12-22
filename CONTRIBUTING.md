# Contributing to Retrui

Thank you for your interest in contributing to Retrui! We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report:

1. Use a clear and descriptive title
2. Describe the exact steps to reproduce the problem
3. Provide specific examples to demonstrate the steps
4. Include screenshots/videos if applicable
5. Describe the behavior you expected and what actually happened
6. Mention your environment (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

1. Use a clear and descriptive title
2. Provide a detailed description of the proposed enhancement
3. Explain why this enhancement would be useful
4. Provide examples of how the enhancement would be used

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or fix
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and write tests if applicable
4. Commit your changes with a clear message
   ```bash
   git commit -m "Add your commit message here"
   ```
5. Push to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
6. Create a Pull Request with a detailed description

### Vercel Preview Deployments

When you open a Pull Request, Vercel will automatically create a preview deployment. This allows you and reviewers to test your changes in a production-like environment before merging.

- Preview URL will be posted as a comment on your PR
- Every push to the PR branch triggers a new preview deployment
- Preview deployments are deleted when the PR is closed

## Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/USERNAME/retrui.git
   cd retrui
   ```

2. Install dependencies
   ```bash
   bun install
   # or
   npm install
   ```

3. Start the development server
   ```bash
   bun run dev
   # or
   npm run dev
   ```

4. Make your changes and test thoroughly

## Coding Style

- Use TypeScript for all new code
- Follow existing code style and conventions
- Write meaningful commit messages
- Add comments for complex logic
- Ensure code is properly formatted (ESLint/Prettier)
- Run `npm run lint` before committing

## Code of Conduct

Be respectful and constructive in all interactions. We're here to create a welcoming environment for everyone.

## Questions?

Feel free to open an issue for any questions about contributing to Retrui.
