//Import entities
import { Post } from "../entities/Post";

//Improt types
import { MyContext } from "src/types";

//Import from type-graphql 
import { Arg, Ctx, Int, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {

    @Query(() => [Post]) //** () => String ** is how you define what the function returns  
    posts(@Ctx() { em } : MyContext): Promise<Post[]> {
        return em.find(Post, {});
    }

    @Query(() => Post, { nullable: true })
    post(
        @Arg('id', () => Int) id: number,
        @Ctx() { em } : MyContext
    ): Promise<Post | null> {
        return em.findOne(Post, { id });
    }

}