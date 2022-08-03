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
class UserResponce {
    @Field(() => [FieldError], { nullable: true})
    errors?: FieldError[];

    @Field(() => User, { nullable: true})
    user?: User;
}

@Resolver()
export class UserResolver {

    @Mutation(() => Boolean)
    async forgotPassword( 
        @Arg('email') email: string,
        @Ctx() { em, req, redis } : MyContext
    ){
        const user = await em.findOne(User, { email });

        if(!user) {

            // The e-mail does not exist in the db
            return true;
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

        return true;

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

    @Mutation(() => UserResponce) // ** () => String ** is how you define what the function returns  
    async register ( 
        @Arg('options') options : UsernamePasswordInput,
        @Ctx() { em, req, res } : MyContext
    ): Promise<UserResponce> {

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

    @Mutation(() => UserResponce) //** () => String ** is how you define what the function returns  
    async login ( 
        @Arg('usernameOrEmail') usernameOrEmail : string,
        @Arg('password') password : string,
        @Ctx() { em, req, res } : MyContext
    ): Promise<UserResponce> {
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