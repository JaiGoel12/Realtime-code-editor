# Realtime Code Editor

A collaborative code editor that allows multiple users to edit code in real-time with live synchronization.

## Demo

https://realtime-code-editor-ashen.vercel.app/

## Features

- Real-time collaborative editing
- Multiple language support
- Theme switching
- User authentication via Clerk
- Socket.io for real-time communication

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd realtime-code-editor-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode

1. Start the backend server:
   ```bash
   npm run server:dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run start:front
   ```

The application will be available at `http://localhost:3000`.

#### Production Mode

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm run server:prod
   ```

The application will be available at `http://localhost:3000`.

## Technologies Used

- React
- Node.js
- Express
- Socket.io
- CodeMirror
- Clerk for authentication
- Vercel for frontend deployment
- Render for backend deployment
