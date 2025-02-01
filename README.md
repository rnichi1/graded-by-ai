# Graded by AI Service

An AI-powered grading service that evaluates student answers using Large Language Models (LLMs) like GPT-4 and Claude.

## Features

- Multiple LLM support (GPT-4, Claude)
- Asynchronous request processing with queuing
- Configurable evaluation parameters
- Rubric-based assessment
- Rate limit handling
- Automatic retries
- Multiple voting system for increased accuracy

## Project setup
Make sure you have the following installed:
- Node.js 16.x or later
- Yarn 1.22.x or later
- Docker and Docker Compose (for Redis)

Install the necessary dependencies
```bash
$ yarn install
```

Update the `.env` file with the following
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
REDIS_HOST=localhost # Use 'redis' if running in Docker
REDIS_PORT=6379
```

3. Start the services:

#### Using Docker (recommended):
```bash
$ docker-compose up -d
```

#### Local Setup 
start Redis separately
```bash
$ redis-server
```

compile and run the project

```bash
# development
$ yarn start

# watch mode
$ yarn dev

# production mode
$ yarn prod
```

## Run tests

### Unit Tests
```bash
# unit tests
$ yarn test
```

### End-to-End Tests
The e2e tests require Redis and test environment configuration. The tests will automatically manage a Redis container on port 6380 to avoid conflicts with your development Redis instance.

1. Create a `.env.test` file in the root directory:
```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# LLM API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# Set environment
NODE_ENV=test
```

2. Make sure Docker is running on your machine

3. Run the e2e tests:
```bash
# e2e tests
$ yarn test:e2e
```

The test runner will:
- Start a Redis container if not already running
- Run the end-to-end tests against the API
- Clean up the test environment when done

To manually clean up the test environment:
```bash
$ yarn test:e2e:clean
```

To view Redis logs during testing:
```bash
$ yarn test:e2e:logs
```

### Coverage
```bash
# test coverage
$ yarn test:cov
```

The app will be running on `http://localhost:4000`

## API Docs

Swagger documentation is available at:
```bash
# Swagger
http://localhost:4000/api-docs#/
```

## Architecture

The service uses:
- NestJS for the backend framework
- Bull for queue management
- Redis for queue storage
- OpenAI and Anthropic APIs for LLM integration

## Error Handling

- Automatic retries for failed LLM calls
- Exponential backoff strategy
- Queue persistence
- Comprehensive error logging

## License

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
