import express, { RequestHandler, Response } from 'express';
import { AuthenticatedRequest } from '@interface';
import { extractUserId, validateUserIdMiddleware } from '@middlewares';

export function registerRoute(
    app: express.Application,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    controller: any,
    action: string,
    requiresAuth = true,
    extraMiddlewares: RequestHandler[] = [],
) {
    const middlewares: RequestHandler[] = [extractUserId];
    if (requiresAuth) {
        middlewares.push(validateUserIdMiddleware);
    }
    middlewares.push(...extraMiddlewares);

    app[method](path, ...middlewares, (req: AuthenticatedRequest, res: Response) => {
        const controllerInstance = typeof controller === 'function' ? new controller() : controller;

        controllerInstance[action](req, res);
    });
}
