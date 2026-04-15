# LangEdge Backend

A backend service for the AI-powered language learning and translation platform.

## Overview

LangEdge Backend provides the API services and server-side logic that powers the LangEdge language learning and translation platform. It handles user authentication, translation requests, data persistence, and communication with external AI services.

## Features

- **RESTful API**: Well-structured endpoints for frontend communication
- **AI Integration**: Connects to language model services for translation and NLP features
- **Authentication**: Secure user authentication and authorization
- **Database Operations**: Efficient data storage and retrieval
- **Error Handling**: Robust error management and logging
- **Containerization**: Docker support for easy deployment

## Links

- **Live Website**: [langedge.kritapas.dev](https://langedge.kritapas.dev)
- **Frontend Repository**: [LangEdge-Frontend](https://github.com/KritapasSuwannawin/LangEdge-Frontend)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: NestJS with TypeScript
- **Authentication**: Firebase
- **Database**: PostgreSQL, TypeORM
- **Testing**: Jest
- **Containerization**: Docker

## Architecture

This project is built using **Clean Architecture** principles to enforce a robust separation of concerns, ensuring high testability and independence from any specific framework or UI layer. The layers include:

- `domain/` — Contains enterprise business rules and pure entities without any external dependencies.
- `use-cases/` — Contains application-specific business rules, orchestrating the flow of data.
- `repositories/` — Abstract data-access contracts required by use-cases to fetch data.
- `controllers/` — Receives HTTP requests, calls use-cases, and handles external communication boundaries.
- `infrastructure/` — Implements frameworks, databases, and external infrastructure (e.g., TypeORM repositories, external APIs).
- `shared/` — Global configurations, exceptions, and utility types shared across layers.

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables

```
OPENAI_API_KEY="sk-..."
DATABASE_CONNECTION_STRING="postgresql://..."
FIREBASE_API_KEY="..."
FIREBASE_SERVICE_ACCOUNT={...}
```

4. Start the development server:

```bash
pnpm start:dev
```

## Building for Production

Build the Docker image:

```bash
OPENAI_API_KEY="sk-..." sh ./build.sh
```

Run the Docker container:

```bash
sh ./run.sh ${PORT}
```

## Copyright

© 2025 Kritapas Suwannawin. All rights reserved.
