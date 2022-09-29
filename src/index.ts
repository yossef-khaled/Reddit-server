// Import reflect-metadata
// NOTE: this import should be on top of all other imports
import 'reflect-metadata';

//Import consts
import { __prod__ } from './constants';

//Import express
import express from 'express';

//Import from apollo
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';

//Import from graphql
import { buildSchema } from 'type-graphql';

//Import cors
import cors from 'cors';

//Import resolvers
import { HelloResolver } from './resolvers/helloResolver';
import { PostResolver } from './resolvers/postResolver';
import { UserResolver } from './resolvers/userResolver';

//Import types
import { MyContext } from './types';

import Redis from 'ioredis'
import redditCloneDataSource from './utils/redditCloneDataSource';
import { createUsersLoader } from './utils/createUsersLoader';
import { createUpdootsLoader } from './utils/createUpdootsLoader';

//Import dotenv-safe
import 'dotenv-safe/config'

const main = async () => {     
    
    const session = require('express-session');
    const RedisStore = require('connect-redis')(session);
    
    const redis = new Redis({
        port: parseInt(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
    }); 

    const app = express();

    app.set('trust proxy', false);

    app.use(cors({
        origin: [process.env.CORS_ORIGIN_1, process.env.CORS_ORIGIN_2], 
        credentials: true, // Should be true if the front-end requires credintials
    }))

    app.use(
        session({
            name: 'redditCloneCookie',
            store: new RedisStore({ 
                client: redis,
                disableTouch: true 
              }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 356 * 10, // 10 years
                httpOnly: true, // This won't make the frontend able to access the cookies
                secure: false, // Cookie only works with HTTPS
                sameSite: 'lax', // CSRF. "none" will allow sending cookies
                // domain: __prod__ ? '.aws.com' : undefined // Need to uncomment this when hosting the API 
            },
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: false,
        })
    )

    await redditCloneDataSource.initialize();
    await redditCloneDataSource.runMigrations();

    // await Post.delete({});

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false           
        }),
        introspection: __prod__,
        csrfPrevention: true,
        cache: 'bounded',
        plugins: [
            ApolloServerPluginLandingPageLocalDefault({ embed: true }),
        ],
        context: ({ req, res }) : MyContext => 
        ({ 
            req, 
            res, 
            redis,
            userLoader: createUsersLoader(),
            updootLoader: createUpdootsLoader(),
        })
    });

    await apolloServer.start();
 
    // Create graphql end point with apollo
    apolloServer.applyMiddleware({ app, cors: false});

    app.listen(process.env.PORT, () => {
        console.log('RUNNING ON PORT 4000....');
    })

    // Ignore the error happening in the following line, just TS trusting issues
    // const post = orm.em.create(Post, {title: 'My first post'});
    // await orm.em.persistAndFlush(post);

    // See all the posts out there in the db
    // const posts = await orm.em.find(Post, {});
    // console.log(posts);

    console.log('Hello world from TS');   
}

main().catch((err) => {
    console.log(err);
});