import { FastifyInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { Logger } from 'pino';

export type FastifyServer = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger>;
