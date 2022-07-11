import { Options } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import path from "path";

export default {
    migrations: {
        pathTs: path.join(__dirname, './migrations'), // path to the folder with TS migrations (if used, we should put path to compiled files in `path`)
        glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
    },
    entities: [Post],
    dbName: 'reddit',
    debug: !__prod__,
    type: 'postgresql',
    allowGlobalContext: true
} as Options;