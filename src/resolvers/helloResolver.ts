import { Query, Resolver } from "type-graphql"

@Resolver()
export class HelloResolver {

    @Query(() => String) //** () => String ** is how you define waht the function returns  
    hello() {
        return "Hello World"
    }

}