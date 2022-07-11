//Import from @mikro-orm
import { MikroORM } from '@mikro-orm/core';

//Import consts
import { __prod__ } from './constants';

//Import entities
import { Post } from './entities/Post';

//Import micro configuration
import microConfig from './mikro-orm.config'; 

const main = async () => {

    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    //Ignore the error happening in the following line, just TS trusting issues
    const post = orm.em.create(Post, {title: 'My first post'});
    await orm.em.persistAndFlush(post);

    //See all the posts out there
    const posts = await orm.em.find(Post, {});
    console.log(posts);

    console.log('Hello world from TS');   
}

main().catch((err) => {
    console.log(err);
});