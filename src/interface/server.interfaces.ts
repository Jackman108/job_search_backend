import express, { Request } from 'express';

export interface InitializeMiddleware {
    (app: express.Application): void;
}

export interface StartHttpServerParams {
    port: number;
}

export interface StartWebSocketServerParams {
    app: express.Application;
    wsPort: number;
}

export interface AuthenticatedRequest extends Request {
    userId?: string;
} 