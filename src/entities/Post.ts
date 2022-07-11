import { PrimaryKey, Property, Entity } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Post {

    @Field()
    @PrimaryKey()
    id!: number;

    @Field(() => String)
    @Property({type: 'date'})
    createdAt = new Date();

    @Field(() => String)
    @Property({type: 'date', onUpdate: () => new Date() })
    updatedAt = new Date();

    @Field() //@Field() decorator declares whether this property is a db property or not. If it is not, then it will be hidden from graphql schema
    @Property({type: 'text'})
    title!: string;

}