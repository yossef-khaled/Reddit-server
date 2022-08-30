import { Request, Response } from "express"
import { Redis } from "ioredis";
import { createUsersLoader } from "./utils/createUsersLoader";

export type MyContext = {
    redis: Redis;
    req: Request;
    res: Response;
    userLoader: ReturnType<typeof createUsersLoader>;
}