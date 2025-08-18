# LangEdge Backend

A backend service for the AI-powered language learning and translation platform.

## Overview

LangEdge Backend provides the API services and server-side logic that powers the LangEdge language learning and translation platform. It handles user authentication, translation requests, data persistence, and communication with external AI services.

## Features

- **RESTful API**: Well-structured API endpoints for frontend communication
- **AI Integration**: Connections to language model services for translation functionality
- **Authentication Services**: Secure user authentication and authorization
- **Database Operations**: Efficient data storage and retrieval
- **Error Handling**: Robust error management and logging

## Links

- **Live Website**: [langedge.kritapas.dev](https://langedge.kritapas.dev)
- **Frontend Repository**: [LangEdge-Frontend](https://github.com/KritapasSuwannawin/LangEdge-Frontend)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Authentication**: Firebase
- **Testing**: Mocha, Chai, Sinon
- **Containerization**: Docker

## Roadmap / Future Plans

1. **Refactor to Clean Architecture**: Implement a more maintainable code structure with clear separation of concerns
2. **Performance Optimizations**: Improve response times and reduce resource usage
3. **Enhanced API Documentation**: Provide comprehensive API documentation

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables
4. Start the development server:

```bash
npm run dev
```

## Building for Production

Build the Docker container:

```bash
./build.sh
```

Run the Docker container:

```bash
./run.sh
```

## Copyright

© 2025 Kritapas Suwannawin. All rights reserved.
