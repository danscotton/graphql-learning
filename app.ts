import express from 'express';
import graphqlHTTP from 'express-graphql';
import { makeExecutableSchema } from 'graphql-tools';

const citizens = [
    {
        name: 'dan',
        reference: 'dan',
        email: 'dan@dan.com',
        permissions: [
            { id: 'opt1', party: 'Me', data: 'Email', purpose: 'Newsletter', state: 'GRANTED' },
        ]
    },
    {
        name: 'dan2',
        reference: 'dan2',
        email: 'dan2@dan.com',
        permissions: [
            { id: 'opt1', party: 'Me', data: 'Email', purpose: 'Fundraising', state: 'DENIED' },
            { id: 'opt1', party: 'Me', data: 'Email', purpose: 'Newsletter', state: 'GRANTED' },
        ]
    },
];

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

    type Citizen {
        name: String
        email: String
        reference: String
        permissions: [Permission]
        permission (state: State!): [Permission]
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
    reference: string;
    permissions: Permission[]
}

interface Permission {
    state: State;
}

enum State {
    GRANTED,
    DENIED,
}

const resolvers = {
    Query: {
        citizens: () => citizens,
        
        citizen: (_: any, { reference }: Citizen) =>
            citizens.find(citizen => citizen.reference === reference)
    },

    Citizen: {
        permission: ({ permissions }: Citizen, { state }: Permission) =>
            permissions.filter(permission => permission.state === state)
    }
}

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
})

export default async () => {
    const app = express();

    app.use('/graphql', graphqlHTTP({ schema, graphiql: true }))

    return app;
}