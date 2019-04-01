import express from 'express';
import graphqlHTTP from 'express-graphql';
import { GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLString } from 'graphql';

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

const Permission = new GraphQLObjectType({
    name: 'Permission',
    fields: () => ({
        id: { type: GraphQLString },
        party: { type: GraphQLString },
        data: { type: GraphQLString },
        purpose: { type: GraphQLString },
    })
})

const Citizen = new GraphQLObjectType({
    name: 'Citizen',
    fields: () => ({
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        permissions: {
            type: GraphQLList(Permission)
        },
        permission: {
            type: GraphQLList(Permission),
            args: {
                purpose: { type: GraphQLString },
            },
            resolve: (root, { purpose }) => {
                return root.permissions
                    .filter((permission: Permission) => permission.purpose === purpose);
            }
        }
    })
})

const Query = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        citizens: {
            type: GraphQLList(Citizen),
            resolve: () => citizens
        },

        citizen: {
            type: Citizen,
            args: {
                ref: { type: GraphQLString }
            },
            resolve: (root, { ref }, context, info) => {
                return citizens.find(citizen => citizen.reference === ref)
            }
        }
    })
})

const schema = new GraphQLSchema({
    query: Query
})

enum State {
    GRANTED,
    DENIED
}

interface Citizen {
    ref: String
}

interface Permission {
    purpose: String
    state: State
}

const root = {
    citizens: () => citizens,

    citizen: ({ ref }: Citizen) =>
        citizens.find(citizen => citizen.reference === ref),
}

export default async () => {
    const app = express();

    app.use('/graphql', graphqlHTTP({
        schema: schema,
        graphiql: true,
    }))

    return app;
}