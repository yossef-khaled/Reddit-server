//Import entities
import { Post } from "../entities/Post";

//Import from type-graphql 
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { sleep } from "../utils/sleep";
import { MyContext } from "src/types";

//Improt middlewares
import { isAuth } from "../middleware/isAuth";
import { FieldError } from "./userResolver";

@InputType()
class PostInput {
    @Field()
    title!: string;

    @Field()
    text!: string;

}

@ObjectType()
class CreatePostReturn {
    @Field(() => [FieldError], { nullable: true})
    errors?: FieldError[];

    @Field(() => Post, { nullable: true})
    post?: Post;
}

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
    @Mutation(() => CreatePostReturn)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg('options') options: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<CreatePostReturn> {

        
        if( !options.title || options.title == '' ) {
            return {
                errors: [
                    {
                        field: 'title',
                        message: 'Can not leave title field empty.'
                    }
                ]
            }
        }
        
        if(!options.text || options.text == '') {
            return {
                errors: [
                    {
                        field: 'text',
                        message: 'Can not leave text field empty.'
                    }
                ]
            }
        }
        
        // 2 sql queries
        return {
            post: await Post.create({
                ...options,
                creatorId: req.session?.userId
            })
            .save()
        }
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