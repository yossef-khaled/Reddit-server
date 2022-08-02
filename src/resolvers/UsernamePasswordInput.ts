import { Field, InputType } from "type-graphql";

//This is an alternative way to declare arguments by declaring a class with all the arguments we want
//Passing one object from this class instead of multiple '@Arg()'s

@InputType()
export class UsernamePasswordInput {

    @Field()
    email: string;

    @Field()
    username: string;

    @Field()
    password: string;
}
