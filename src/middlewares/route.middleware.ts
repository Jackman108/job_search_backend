import express, { Response } from 'express';
import { AuthenticatedRequest } from '@interface';
import { extractUserId, validateUserIdMiddleware } from '@middlewares';

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