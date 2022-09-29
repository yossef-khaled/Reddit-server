//Import entities
import { User } from "../entities/User";

//Import types
import { MyContext } from "src/types";

//Import from type-graghql
import { Arg, Ctx, Field, FieldResolver, Mutation, ObjectType, Query, Resolver, Root } from "type-graphql";

//Import argon2
import argon2 from 'argon2';
import { FORGOT_PASSWORD_PREFIX } from "../constants";

//Import UsernamePasswordInput 
import { UsernamePasswordInput } from "./UsernamePasswordInput";

//Import our datasource
import redditCloneDataSource from '../utils/redditCloneDataSource';

//Import validators
import { validateEmail, validateRegister } from "../utils/validators";
import { sendEmail } from "../utils/sendEmail";

//Import from uuid
import {v4} from 'uuid';

@ObjectType()
export class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true})
    errors?: FieldError[];

    @Field(() => User, { nullable: true})
    user?: User;
}

@ObjectType()
class ForgotPasswordReturn {
    @Field(() => FieldError, { nullable: true})
    error: FieldError;

    @Field(() => Boolean, { nullable: true})
    done: boolean;
}

@Resolver(User)
export class UserResolver {

    @Query(() => [User])
    users(): Promise<User[] | null> {
        return User.find({});
        
        // return redditCloneDataSource
        // .query(`
        // SELECT * FROM user;
        // `);
    } 

    @FieldResolver(() => String)
    email(
        @Root() user: User,
        @Ctx() {req} : MyContext
    ) {

        // show the user his email
        if(req.session?.userId === user.id) {
            return user.email;
        }

        // not the current users email
        return '';
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, req } : MyContext
    ): Promise<UserResponse> {
        
        if(newPassword.length < 3) {
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'password must be at least 3 charachters.'
                    }
                ]
            }
        }

        const key = FORGOT_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);
        
        if(!userId) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'Expired token.'
                    }
                ]
            }
        }

        const userIdAsANum = parseInt(userId)
        const user = await User.findOneBy({ id: userIdAsANum });

        if(!user) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'User does not exist any more.'
                    }
                ]
            }
        }

        await User.update(
            {id: userIdAsANum}, 
            {password: await argon2.hash(newPassword)
        });
         
        // Login user after he changed password
        req.session!.userId = user.id;

        await redis.del(key);

        return { user }

    }

    @Mutation(() => ForgotPasswordReturn)
    async forgotPassword( 
        @Arg('email') email: string,
        @Ctx() { redis } : MyContext
    ){

        if(!validateEmail(email)) {
            return {
                error: {
                    field: 'email',
                    message: 'Invalid E-mail' 
                }
            }
        }

        // Where condition is a must here as we are not searching with the primary key
        const user = await User.findOne({
            where: {
                email: email
            }
        });

        if(!user) {

            // No user with this e-mail exists in the db
            // Just return true for security 
            return {done: true};
        }

        const token = v4();
        const key = FORGOT_PASSWORD_PREFIX + token;
 
        await redis.set(
            key, 
            user.id, 
            "EX",
            1000 * 60 * 60 * 3 // 3 hours
        );

        await sendEmail(
            email,
            `
            <div>
                <p>
                    Click the link below to change your password (Make it more clear for you this time). 
                </p>
                <a href="http://${process.env.FRONT_END_HOST}:${process.env.FRONT_END_PORT}/change-password/${token}">Reset password</a>
            </div>
            `
        );  

        return {done: true};

    }

    @Query(() => User, {nullable: true})
    me( @Ctx() { req } : MyContext ) {

        // You are not logged in
        if(!req.session!.userId) {
            return null
        }

        return User.findOneBy({ id: req.session!.userId});
    
    }

    @Mutation(() => UserResponse) // ** () => String ** is how you define what the function returns  
    async register ( 
        @Arg('options') options : UsernamePasswordInput,
        @Ctx() { req } : MyContext
    ): Promise<UserResponse> {

        const errors = validateRegister(options);

        if(errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);
        
        let user;
        
        //This try catch piece of code is to catch any error from the db. 
        try {
            // insert user using query builder
            const result = await redditCloneDataSource
            .createQueryBuilder()
            .insert()
            .into(User)
            .values({
                username: options.username,
                password: hashedPassword,
                email: options.email
            })
            .returning("*")
            .execute()

            user = result.raw[0];
        
        } catch(err) {
            console.log(err);   
            if(err.code === '23505' || err.detail.includes('already exists')) {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'This username already exists.'
                        }
                    ]
                }
            }
        }

        req.session!.userId = user.id;

        return { user }; 
    }

    @Mutation(() => UserResponse) //** () => String ** is how you define what the function returns  
    async login ( 
        @Arg('usernameOrEmail') usernameOrEmail : string,
        @Arg('password') password : string,
        @Ctx() { req } : MyContext
    ): Promise<UserResponse> {
        // Discover whether he is loggin in with username or email 
        const user = await User.findOne(
            validateEmail(usernameOrEmail)  
            ? {where: { email: usernameOrEmail }} 
            : {where: { username: usernameOrEmail }}
        ) 

        // const user = await redditCloneDataSource
        // .query(
        //     `
        //     SELECT * FROM user 
        //     WHERE ${
        //         validateEmail(usernameOrEmail) ? 
        //         'email = $1'
        //         : 'username = $1' 
        //     }
        //     `, [usernameOrEmail]
        // )

        if(!user) {
            return {
                errors: [
                    {
                        field: 'usernameOrEmail',
                        message: 'This user name does not exist'
                    }
                ]
            }   
        } 

        const validPassword = await argon2.verify(user.password ,password);
        if (!validPassword) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'Password is incorrect'
                    }
                ]
            }
        }


        req.session!.userId = user.id;

        return {user};
        
    }

    @Mutation(() => Boolean) 
    logout(
        @Ctx() { req, res }: MyContext
    ) {
        return new Promise((resolve) =>  req.session?.destroy(err => {
            res.clearCookie('redditCloneCookie'); 
            if(err) {
                resolve(false);
                return
            }
            resolve(true);
        }));
    }

}