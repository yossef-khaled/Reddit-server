//Import entities
import { Post } from "../entities/Post";

//Import from type-graphql 
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { sleep } from "../utils/sleep";


@Resolver()
export class PostResolver {

    //Query decorator is for getting data
    @Query(() => [Post]) //** () => String ** is how you define what the function returns  
    async posts(): Promise<Post[]> {
        await sleep(3000);
        return Post.find();
    }

    //Query decorator is for getting data
    @Query(() => Post, { nullable: true })
    post(
        @Arg('id') id: number
    ): Promise<Post | null> {
        return Post.findOneBy({id: id});
    }

    //Mutation decorator is for updating, deleting, & inserting data
    @Mutation(() => Post)
    async createPost(
        @Arg('title') title: string
    ): Promise<Post> {
        // 2 sql queries
        return Post.create({title: title}).save();
    }

    //Mutation decorator is for updating, deleting, & inserting data
    @Mutation(() => Post, { nullable: true })
    async upadatePost(
        @Arg('id') id : number,
        @Arg('title', () => String, { nullable : true }) title: string
    ): Promise<Post | null> {
        const post = await Post.findOneBy({id: id});
        if(!post) {
            return null;
        }
        if(title !== 'undefined') {
            await Post.update( {id}, {title} );
        }
        return post;
    }

    //Mutation decorator is for updating, deleting, & inserting data
    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id') id : number
    ): Promise<Boolean> {
        await Post.delete({id});
        return true;
    }

}