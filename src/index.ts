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


//Import resolvers
import { HelloResolver } from './resolvers/helloResolver';
import { PostResolver } from './resolvers/postResolver';
import { UserResolver } from './resolvers/userResolver';

//Import reflect-metadata
import 'reflect-metadata';

//Import types
import { MyContext } from './types';

const main = async () => {
    
    const session = require('express-session');
    const RedisStore = require('connect-redis')(session);
    const { createClient } = require("redis");
    const redisClient = createClient({ legacyMode: true });
    redisClient.connect().catch(console.error);

    const app = express();

    app.set('trust proxy', false);

    app.use(
        session({
            name: 'redditCloneCookie',
            store: new RedisStore({ 
                client: redisClient,
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

    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false           
        }),
        context: ({ req, res }) : MyContext => ({ em : orm.em, req, res })
    });

    await apolloServer.start();

    //Create graphql end point with apollo
    apolloServer.applyMiddleware({ app, cors: {
        credentials: true,
        origin: [
            "https://studio.apollographql.com",
            "http://localhost:4000/graphql",
        ]
    } });

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