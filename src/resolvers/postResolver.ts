//Import entities
import { Post } from "../entities/Post";

//Import from type-graphql 
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "src/types";

//Improt middlewares
import { isAuth } from "../middleware/isAuth";
import { FieldError } from "./userResolver";

//Import our data source
import redditCloneDataSource from '../utils/redditCloneDataSource';
import { Updoot } from "../entities/Updoot";

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

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Ctx() {req} : MyContext,
        @Arg('postId', () => Number) postId: number,
        @Arg('value', () => Int) value: number
    ): Promise<boolean> {

        const userId = req.session?.userId;

        const realValue = value > 0 ? +1 : -1;

        // await Updoot.insert({
        //     value,
        //     postId,
        //     userId
        // })

        const [oldVote] = await Updoot.query(
            `
            SELECT * from updoot
            WHERE "userId" = ${userId} AND "postId" = ${postId};
            `
        )

        if(oldVote) {
            if(oldVote.value != realValue) {
                redditCloneDataSource.transaction(async (tm) => {
                    await tm.query(
                    `
                    UPDATE updoot
                    SET value = $1
                    WHERE "userId" = $2 AND "postId" = $3
                    `, [realValue, userId, postId]);
    
                    await tm.query(
                    `
                    UPDATE post
                    set points = points + $1
                    WHERE id = $2;
                    `, [2 * realValue, postId]);
                })
    
                return true;    
            }
            else {
                return false;
            }
                
        } 
        else {
            redditCloneDataSource.transaction(async (tm) => {
                await tm.query(
                `
                INSERT INTO updoot ("userId", "postId", value)
                values($1, $2, $3);
                `, [userId, postId, realValue]);

                await tm.query(
                `
                UPDATE post
                set points = points + $1
                WHERE id = $2;
                `, [realValue, postId]);
            })

            return true;
        }
    }

    //Query decorator is for getting data
    @Query(() => PaginatedPosts) //** () => String ** is how you define what the function returns  
    async posts(
        @Ctx() { req }: MyContext,
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null
    ): Promise<PaginatedPosts> {

        const userId = req.session?.userId;
        const realLimit = Math.min(10, limit);
        const realLimitPlusOne = realLimit + 1;

        const replacements: (number | object)[] = [realLimitPlusOne]

        if(userId) {
            replacements.push(userId);
        }

        let cursorIndex = 3;
        if(cursor) {
            replacements.push(new Date(parseInt(cursor)));
            cursorIndex = replacements.length;
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
                ) creator,
                ${
                    userId ?
                    '(SELECT value FROM updoot WHERE "userId" = $2 AND "postId" = p.id) "voteStatus"'
                    : 'null as "voteStatus"'
                }
                from post p 
                inner join public.user u on u.id = p."creatorId"
                ${cursor ? `where p."createdAt" < $${cursorIndex}` : ''}
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
        if(hasMore) {
            posts.pop();
        }
        
        return {
            posts,
            hasMore,
        };
    }

    //Query decorator is for getting data
    @Query(() => Post)
    async post(
        @Arg('id', () => Int) id: number
    ): Promise<Post> {
        const response = await redditCloneDataSource
        .getRepository(Post)
        .createQueryBuilder('post')
        .where('post.id = :id', {id})
        .leftJoinAndSelect('post.creator', 'user')
        .getMany();

        return response[0];
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
    async updatePost(
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