import app from './app';
import assert from 'assert';

assert.ok(process.env.AUTH0_CLIENT_ID, 'Missing AUTH0_CLIENT_ID');
assert.ok(process.env.AUTH0_CLIENT_SECRET, 'Missing AUTH0_CLIENT_SECRET');
assert.ok(process.env.AUTH0_HOST, 'Missing AUTH0_HOST');
assert.ok(process.env.AUTH0_AUDIENCE, 'Missing AUTH0_AUDIENCE');
assert.ok(process.env.CONSENTRIC_HOST, 'Missing CONSENTRIC_HOST');

const run = () =>
    app({
        config: {
            AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID!,
            AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET!,
            AUTH0_HOST: process.env.AUTH0_HOST!,
            AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE!,
            CONSENTRIC_HOST: process.env.CONSENTRIC_HOST!,
        }
    }).then(app => app.listen(4000));

run();