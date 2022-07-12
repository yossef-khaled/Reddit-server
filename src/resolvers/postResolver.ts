//Import entities
import { Post } from "../entities/Post";

//Improt types
import { MyContext } from "src/types";

//Import from type-graphql 
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {

    //Query decorator is for getting data
    @Query(() => [Post]) //** () => String ** is how you define what the function returns  
    posts(@Ctx() { em } : MyContext): Promise<Post[]> {
        return em.find(Post, {});
    }

    //Query decorator is for getting data
    @Query(() => Post, { nullable: true })
    post(
        @Arg('id') id: number,
        @Ctx() { em } : MyContext
    ): Promise<Post | null> {
        return em.findOne(Post, { id });
    }

    //Mutation decorator is for updating, deleting, & inserting data
    @Mutation(() => Post)
    async createPost(
        @Arg('title') title: string,
        @Ctx() { em } : MyContext
    ): Promise<Post> {
        const post = em.create(Post, { title })
        await em.persistAndFlush(post);
        return post;
    }

    //Mutation decorator is for updating, deleting, & inserting data
    @Mutation(() => Post, { nullable: true })
    async upadatePost(
        @Arg('id') id : number,
        @Arg('title', () => String, { nullable : true }) title: string,
        @Ctx() { em } : MyContext
    ): Promise<Post | null> {
        const post = await em.findOne(Post, { id })
        if(!post) {
            return null;
        }
        if(title !== 'undefined') {
            post.title = title;
            post.updatedAt = new Date();
            await em.persistAndFlush(post)
        }
        return post;
    }

    //Mutation decorator is for updating, deleting, & inserting data
    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id') id : number,
        @Ctx() { em } : MyContext
    ): Promise<Boolean> {
        await em.nativeDelete(Post, { id });
        return true;
    }

}