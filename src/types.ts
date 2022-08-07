import { Request, Response } from "express"
import { Redis } from "ioredis";

export type MyContext = {
    redis: Redis;
    req: Request;
    res: Response;
}