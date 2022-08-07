//Import from typeorm
import { DataSource } from "typeorm";

//Improt entities
import { Post } from "../entities/Post";
import { User } from "../entities/User";

const redditCloneDataSource = new DataSource({
    type: 'postgres',
    database: 'redditClone2',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true,
    entities: [User, Post]
});

export default redditCloneDataSource;