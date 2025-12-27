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

## Roadmap / Future Plans

1. **Microservices Architecture**: Modularize for scalability
2. **Performance Optimizations**: Improve response times and resource usage
3. **Enhanced API Documentation**: Provide comprehensive API docs

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables
4. Start the development server:

```bash
npm run start:dev
```

## Building for Production

Build the Docker container:

```bash
sh ./build.sh
```

Run the Docker container:

```bash
sh ./run.sh
```

## Copyright

© 2025 Kritapas Suwannawin. All rights reserved.
