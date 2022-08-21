import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, OneToMany } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class User extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToMany(() => Post, post => post.creator)
    posts: Post[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt : Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt : Date;

    @Field(() => Updoot)
    @OneToMany(() => Updoot, updoot => updoot.user)
    updoots: Updoot[];

    @Field() // @Field() decorator declares whether this property is a db property or not. If it is not, then it will be hidden from graphql schema
    @Column({ unique: true })
    username!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

}