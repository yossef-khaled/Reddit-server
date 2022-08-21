//Import from typeorm
import { DataSource } from "typeorm";

//Import entities
import { Post } from "../entities/Post";
import { User } from "../entities/User";
import path from 'path';
import { Updoot } from "../entities/Updoot";

const redditCloneDataSource = new DataSource({
    type: 'postgres',
    database: 'redditClone2',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [User, Post, Updoot]
});

export default redditCloneDataSource;