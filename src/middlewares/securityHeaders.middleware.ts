import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal security headers without adding helmet as a dependency.
 * CSP is intentionally loose for Swagger UI assets when docs are enabled.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // Avoid breaking /api-docs (inline scripts) or JSON APIs with a strict CSP.
    if (!req.path.startsWith('/api-docs')) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }
    next();
}
