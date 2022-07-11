import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {

    @Query(() => [Post]) //** () => String ** is how you define waht the function returns  
    posts(@Ctx() ctx : MyContext) {
        return ctx.em.find(Post, {});
    }

}