# React + NestJS + AWS SQS Sample

This sample application shows a simple support queue workflow:

- `frontend/`: React + Vite UI for submitting support jobs and viewing queue activity
- `backend/`: NestJS API that sends jobs to AWS SQS and polls the queue every 5 seconds

## Flow

1. The React form posts a support request to `POST /jobs`.
2. NestJS validates the payload and sends it to SQS.
3. A scheduled NestJS consumer polls SQS, records processed messages, and deletes them.
4. The React UI polls `GET /jobs` to show recent submitted and processed messages.

## Prerequisites

- Node.js 20+
- An AWS SQS queue, or LocalStack with SQS enabled

## Environment setup

Copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env`:

- `AWS_REGION`: your AWS region
- `AWS_SQS_QUEUE_URL`: your queue URL
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: credentials if you are not using existing AWS environment configuration
- `AWS_SQS_ENDPOINT`: optional for LocalStack, for example `http://localhost:4566`

If you are using LocalStack, a queue URL often looks like:

```text
http://localhost:4566/000000000000/support-demo-queue
```

## Install and run

The generated apps already have their dependencies installed.

Run the backend:

```bash
npm run dev:backend
```

In a second terminal, run the frontend:

```bash
npm run dev:frontend
```

Open the Vite URL shown in the terminal, usually [http://localhost:5173](http://localhost:5173).

## Helpful commands

```bash
npm run build
npm run lint
npm run test
```

## API endpoints

- `GET /`: health message
- `GET /jobs`: current queue configuration plus recent submitted and processed messages
- `POST /jobs`: submit a new support job to SQS

Example request:

```json
{
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "priority": "high",
  "message": "Checkout is failing for orders created from mobile."
}
```
