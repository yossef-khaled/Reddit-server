//Import from @mikro-orm
import { MikroORM } from '@mikro-orm/core';

//Import consts
import { __prod__ } from './constants';

//Import entities
import { Post } from './entities/Post';

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

const main = async () => {

    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false           
        }),
        context: () => ({ em : orm.em })
    });

    await apolloServer.start();

    //Create graphql end point with apollo
    apolloServer.applyMiddleware({ app });

    app.listen(3000, () => {
        console.log('RUNNING ON PORT 3000....');
    })

    //Ignore the error happening in the following line, just TS trusting issues
    // const post = orm.em.create(Post, {title: 'My first post'});
    // await orm.em.persistAndFlush(post);

    //See all the posts out there in the db
    // const posts = await orm.em.find(Post, {});
    // console.log(posts);

    console.log('Hello world from TS');   
}

main().catch((err) => {
    console.log(err);
});