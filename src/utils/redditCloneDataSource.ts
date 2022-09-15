//Import from typeorm
import { DataSource } from "typeorm";

//Import entities
import { Post } from "../entities/Post";
import { User } from "../entities/User";
import path from 'path';
import { Updoot } from "../entities/Updoot";

//Import dotenv-safe
import 'dotenv-safe/config'

const redditCloneDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [User, Post, Updoot]
});

export default redditCloneDataSource;