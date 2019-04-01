import app from './app';

const run = () =>
    app()
        .then(app => app.listen(4000));

run();