import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    creatorId: number;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({ type: 'int', default: 0 })
    points!: number;

    @ManyToOne(() => User, user => user.posts)
    creator: User;

    @Field(() => String)
    @CreateDateColumn()
    createdAt : Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt : Date;

    @Field() //@Field() decorator declares whether this property is a db property or not. If it is not, then it will be hidden from graphql schema
    @Column()
    title!: string;

}