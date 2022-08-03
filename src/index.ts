//Import from @mikro-orm
import { MikroORM } from '@mikro-orm/core';

//Import consts
import { __prod__ } from './constants';

//Import micro configuration
import microConfig from './mikro-orm.config'; 

//Import express
import express from 'express';

//Import from apollo
import { ApolloServer } from 'apollo-server-express';

//Import from graphql
import { buildSchema } from 'type-graphql';

//Import cors
import cors from 'cors';

//Import resolvers
import { HelloResolver } from './resolvers/helloResolver';
import { PostResolver } from './resolvers/postResolver';
import { UserResolver } from './resolvers/userResolver';

//Import reflect-metadata
import 'reflect-metadata';

//Import types
import { MyContext } from './types';

import Redis from 'ioredis'

//Improt utils
import { sendEmail } from './utils/sendEmail';

//Improt entities
import { User } from './entities/User';
 
const main = async () => {
    
    const session = require('express-session');
    const RedisStore = require('connect-redis')(session);
    // const { createClient } = require("ioredis");
    const redis = new Redis();
    // const redisClient = createClient({ legacyMode: true });
    // redisClient.connect().catch(console.error);

    const app = express();

    app.set('trust proxy', false);

    app.use(cors({
        origin: ['http://localhost:3000', 'https://studio.apollographql.com'], 
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
                sameSite: 'none', // CSRF. "none" will allow sending cookies
            },
            saveUninitialized: false,
            secret: "keyboard cat",
            resave: false,
        })
    )

    // sendEmail('yossef.k.y333@gmail.com', 'Hello, Yousef');

    const orm = await MikroORM.init(microConfig);
    
    // Delete all the users from db
    // orm.em.nativeDelete(User, {});

    await orm.getMigrator().up();

    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false           
        }),
        csrfPrevention: true,
        cache: 'bounded',
        context: ({ req, res }) : MyContext => ({ em : orm.em, req, res, redis })
    });

    await apolloServer.start();
 
    // Create graphql end point with apollo
    apolloServer.applyMiddleware({ app, cors: false});

    app.listen(4000, () => {
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