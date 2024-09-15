## Description

Service for the master thesis "Graded by AI"

## Project setup
Make sure you have the following installed on your machine
- Node.js 16.x or later
- Yarn 1.22.x or later

Install the necessary dependencies
```bash
$ yarn install
```

Update the `.env` file with the following
```bash
ANTHROPIC_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
```

## Compile and run the project

```bash
# development
$ yarn start

# watch mode
$ yarn dev

# production mode
$ yarn prod
```

## Run tests

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## License

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
