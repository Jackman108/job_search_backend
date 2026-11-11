import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Market Hunter API',
            version: '1.0.0',
            description: [
                'Backend API for Market Hunter (vacancies, payments, HH automation).',
                'HH routes: POST `/start`, `/refresh`, `/stop`, GET `/jobs/{jobId}`.',
                'Default worker mode is queue (`HH_WORKER_MODE=queue`) → HTTP 202 + poll job status.',
                'Auth: Bearer JWT; mutating routes require a resolved `userId`.',
            ].join(' '),
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description:
                        'Access JWT from auth service. Missing/invalid token → 401; missing userId on guarded routes → 400.',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'HH', description: 'HeadHunter Puppeteer apply / refresh / jobs' },
            { name: 'Health', description: 'Liveness probes' },
        ],
    },
    apis: ['./src/routes/*.ts', './src/swagger/**/*.ts'],
};
