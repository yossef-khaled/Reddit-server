//Import entities
import { User } from "../entities/User";

//Import types
import { MyContext } from "src/types";

//Import from type-graghql
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";

//Import argon2
import argon2 from 'argon2';
import { FORGOT_PASSWORD_PREFIX } from "../constants";

//Import form @mikro-orm/postgresql
import { EntityManager } from '@mikro-orm/postgresql'
import { UsernamePasswordInput } from "./UsernamePasswordInput";

//Import validators
import { validateEmail, validateRegister } from "../utils/validators";
import { sendEmail } from "../utils/sendEmail";

//Import from uuid
import {v4} from 'uuid';

@ObjectType()
class FieldError {
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

@Resolver()
export class UserResolver {

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, em, req } : MyContext
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

        const user = await em.findOne(User, { id: parseInt(userId) });

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

        user.password = await argon2.hash(newPassword);

        await em.persistAndFlush(user);
        // Login user after he changed password
        req.session!.userId = user.id;

        await redis.del(key);

        return { user }

    }

    @Mutation(() => ForgotPasswordReturn)
    async forgotPassword( 
        @Arg('email') email: string,
        @Ctx() { em, req, redis } : MyContext
    ){

        if(!validateEmail(email)) {
            return {
                error: {
                    field: 'email',
                    message: 'Invalid E-mail' 
                }
            }
        }

        const user = await em.findOne(User, { email });

        if(!user) {

            // No user with this e-mail exists in the db
            // Just return true for security 
            return {done: true};
        }

        const token = v4();
 
        await redis.set(
            FORGOT_PASSWORD_PREFIX + token, 
            user.id, 
            "EX",
            1000 * 60 * 60 * 24 * 3 // 3 days
        );

        await sendEmail(
            email,
            `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`
        );  
        return {done: true};

    }

    @Query(() => User, {nullable: true})
    async me( @Ctx() { em, req, res } : MyContext ) {

        // You are not logged in
        if(!req.session!.userId) {
            return null
        }

        const user = await em.findOne(User, { id: req.session!.userId});
        return user;
    
    }

    @Mutation(() => UserResponse) // ** () => String ** is how you define what the function returns  
    async register ( 
        @Arg('options') options : UsernamePasswordInput,
        @Ctx() { em, req, res } : MyContext
    ): Promise<UserResponse> {

        const errors = validateRegister(options);

        console.log(errors);

        if(errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);
        
        let user;

        // const user = await em.create(User, {
        //     username: options.username,
        //     password: hashedPassword 
        // });
        
        //This try catch piece of code is to catch any error from the db. 
        try {
            const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert({
                username: options.username,
                email: options.email,
                password: hashedPassword,
                created_at: new Date(),
                updated_at: new Date()
            })
            .returning('*');
            user = result[0];

            // await em.persistAndFlush(user);
        
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
        @Ctx() { em, req, res } : MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, 
            validateEmail(usernameOrEmail) ? { email: usernameOrEmail} 
            : {username: usernameOrEmail}
            )
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