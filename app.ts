import express, { Application } from 'express';
import graphqlHTTP from 'express-graphql';
import axios from 'axios';
import { makeExecutableSchema } from 'graphql-tools';

const typeDefs = `
    enum State {
        GRANTED
        DENIED
    }

    type Permission {
        id: String
        party: String
        data: String
        purpose: String
        state: State
    }

    type Choice {
        reference: String
        label: String
    }

    type Preference {
        reference: String
        label: String
        choices: [Choice]
    }

    type Citizen {
        id: String
        name: String
        email: String
        reference: String
        preferences: [Preference]
    }

    type Query {
        citizens: [Citizen]
        citizen (reference: String!): Citizen
    }

    schema {
        query: Query
    }
`

interface Citizen {
    id: string;
    reference: string;
    permissions: Permission[]
}

interface CitizenQueryParams {
    reference: string;
}

interface PermissionsQueryParams {
    state: State;
}

interface Permission {
    state: State;
}

interface AppConfig {
    AUTH0_CLIENT_ID: string;
    AUTH0_CLIENT_SECRET: string;
    AUTH0_HOST: string;
    AUTH0_AUDIENCE: string;
    CONSENTRIC_HOST: string;
}

interface Auth0Config {
    clientId: string;
    clientSecret: string;
    host: string;
    audience: string;
}

interface AppContext {
    req: Express.Request;
    res: Express.Response;
    config: AppConfig;
}

interface AppDependencies {
    config: AppConfig;
}

enum State {
    GRANTED,
    DENIED,
}

interface Locals {
    access_token?: string;
}

declare global {
    namespace Express {
        interface Response {
            locals: Locals;
        }
    }
}

const resolvers = {
    Query: {
        citizens: async (obj: any, args: any, { req, res, config }: AppContext) => {
            try {
                const { data } = await axios.get(`${config.CONSENTRIC_HOST}/v1/citizens`, {
                    headers: {
                        Authorization: `Bearer ${res.locals.access_token}`
                    },
                    params: {
                        externalRef: 'dan',
                        applicationId: 'jLBayYgGVuG',
                    }
                })

                return data.map(({ applicationDetails }: any) => {
                    return {
                        email: applicationDetails[0].email,
                        reference: applicationDetails[0].externalRef,
                    };
                });
            } catch (e) {
                if (e.response) {
                    console.log(e.response.data);
                }

                console.log(e);
            }
        },
        
        citizen: async (_: any, { reference }: CitizenQueryParams, { res, config }: AppContext) => {
            try {
                const { data } = await axios.get(`${config.CONSENTRIC_HOST}/v1/citizens`, {
                    headers: {
                        Authorization: `Bearer ${res.locals.access_token}`
                    },
                    params: {
                        externalRef: reference,
                        applicationId: 'jLBayYgGVuG',
                    }
                })

                return data.map(({ citizenId, applicationDetails }: any) => {
                    return {
                        id: citizenId,
                        email: applicationDetails[0].email,
                        reference: applicationDetails[0].externalRef,
                    };
                })[0];
            } catch (e) {
                if (e.response) {
                    return console.log(e.response.data);
                }

                console.log(e);
            }
        }
            
    },

    Citizen: {
        preferences: async ({ id }: Citizen, args: any, { res, config }: AppContext) => {
            try {
                const { data } = await axios.get(`${config.CONSENTRIC_HOST}/v1/preferences`, {
                    headers: {
                        Authorization: `Bearer ${res.locals.access_token}`
                    },
                    params: {
                        citizenId: id,
                        applicationId: 'jLBayYgGVuG',
                    }
                });

                return data.preferences;
            } catch (e) {
                if (e.response) {
                    return console.log(e.response.data);
                }

                console.log(e);
            }
        }
        // permissions: ({ permissions }: Citizen, { state }: PermissionsQueryParams) =>
        //     state ? permissions.filter(permission => permission.state === state) : permissions
    }
}

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
})

const fetchAccessToken = ({ host, clientId, clientSecret, audience }: Auth0Config) => async (req: any, res: any, next: any) => {
    try {
        const { data } = await axios.post(`${host}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience,
            applicationId: 'jLBayYgGVuG',
        })
        
        res.locals.access_token = data.access_token;

        return next();
    } catch (e) {
        return next(e);
    }
}

export default async ({ config }: AppDependencies): Promise<Application> => {
    const app = express();

    app.get(
        '/graphql',

        fetchAccessToken({
            clientId: config.AUTH0_CLIENT_ID,
            clientSecret: config.AUTH0_CLIENT_SECRET,
            host: config.AUTH0_HOST,
            audience: config.AUTH0_AUDIENCE,
        }),

        graphqlHTTP((req, res, params) => ({
            schema,
            graphiql: true,
            context: { req, res, config },
        }))
    )

    return app;
}