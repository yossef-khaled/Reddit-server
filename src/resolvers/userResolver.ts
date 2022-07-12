//Import entities
import { User } from "../entities/User";

//Import types
import { MyContext } from "src/types";

//Import from type-graghql
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";

//Import argon2
import argon2 from 'argon2';

//This is an alternative way to declare arguments by declaring a class with all the arguments we want
//Passing one object from this class instead of multiple '@Arg()'s
@InputType()
class UsernamePasswordInput {
    @Field()
    username: string

    @Field()
    password: string
}

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

    @Mutation(() => UserResponce) //** () => String ** is how you define waht the function returns  
    async register ( 
        @Arg('options') options : UsernamePasswordInput,
        @Ctx() { em } : MyContext
    ): Promise<UserResponce> {
        if(options.username.length < 2) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'Username must be greater than 1 charachter.'
                    }
                ]
            }
        }

        if(options.password.length <= 8) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'password must be at least 8 charachters.'
                    }
                ]
            }
        }

        const hashedPassword = await argon2.hash(options.password);
        const user = await em.create(User, { 
            username: options.username, 
            password: hashedPassword 
        });  
        em.persistAndFlush(user);

        return { user }; 
    }

    @Mutation(() => UserResponce) //** () => String ** is how you define waht the function returns  
    async login ( 
        @Arg('options') options : UsernamePasswordInput,
        @Ctx() { em } : MyContext
    ): Promise<UserResponce> {
        const user = await em.findOne(User, { username: options.username })
        if(!user) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'This user name does not exist'
                    }
                ]
            }   
        } 

        const validPassword = await argon2.verify(user.password ,options.password);
        if (validPassword) {
            return {user};
        }
        return {
            errors: [
                {
                    field: 'password',
                    message: 'Password is incorrect'
                }
            ]
        }
        
    }

}