//Import entities
import { Post } from "../entities/Post";

//Import from type-graphql 
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { sleep } from "../utils/sleep";
import { MyContext } from "src/types";

//Improt middlewares
import { isAuth } from "../middleware/isAuth";
import { FieldError } from "./userResolver";

//Import our data source
import redditCloneDataSource from '../utils/redditCloneDataSource';

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

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[];

    @Field(() => Boolean)
    hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(
        @Root() post: Post
    ) {
        if(post.text.length < 50) {
            return post.text;
        }

        else {
            return `${post.text.slice(0, 50)}...`;
        }
        
    }


    //Query decorator is for getting data
    @Query(() => PaginatedPosts) //** () => String ** is how you define what the function returns  
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null
    ): Promise<PaginatedPosts> {

        const realLimit = Math.min(10, limit);
        const realLimitPlusOne = realLimit + 1;

        const replacements: (number | object)[] = [realLimitPlusOne]

        if(cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await redditCloneDataSource.query(
            `
                select p.*, 
                json_build_object(
                    'id', u.id,
                    'username', u.username,
                    'email', u.email,
                    'createdAt', u."createdAt",
                    'updatedAt', u."updatedAt"
                ) creator
                from post p 
                inner join public.user u on u.id = p."creatorId"
                ${cursor ? `where p."createdAt" < $2` : ''}
                order by p."createdAt" DESC
                limit $1
            `
        , replacements)
        .catch((error) => console.log(error)); 

        // const qb = redditCloneDataSource
        // .getRepository(Post)
        // .createQueryBuilder("p")
        // .innerJoinAndSelect(
        //     "p.creator",
        //     "creator",
        //     'creator.id = p."creatorId"' // notice the douple quotes around creatorId for camel-case
        // )
        // .orderBy('p."createdAt"', 'DESC') // need to wrap column with douple quotes for capitale case
        // .take(realLimitPlusOne)

        // if(cursor) {
        //     qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
        // }

        // const posts = await qb.getMany();
        const hasMore =  posts.length === realLimitPlusOne;
        
        posts.pop();
        return {
            posts,
            hasMore
        };
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

        if(!options.title) {
            return {
                errors: [
                    {
                        field: 'title',
                        message: 'Can not leave title field empty.'
                    }
                ]
            }
        }
        
        if(!options.text) {
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