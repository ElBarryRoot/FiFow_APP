import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fi Fow API',
      version: '0.1.0',
      description: 'API backend Fi Fow - Sprints 0, 1 et 2'
    },
    servers: [{ url: env.API_PUBLIC_URL }]
  },
  apis: ['./src/**/*.js']
});

export function setupSwagger(app) {
  if (env.SWAGGER_ENABLED) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }
}
