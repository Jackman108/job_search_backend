import express, { Response } from 'express';
import { AuthenticatedRequest } from '../interface/index.js';
import { extractUserId, validateUserIdMiddleware } from './auth.middleware.js';

export function registerRoute(
    app: express.Application,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    controller: any,
    action: string,
    requiresAuth = true,
) {
    const middlewares = [extractUserId];
    if (requiresAuth) {
        middlewares.push(validateUserIdMiddleware);
    }

    app[method](path, ...middlewares, (req: AuthenticatedRequest, res: Response) => {
        const controllerInstance = new controller();
        controllerInstance[action](req, res);
    });
} 