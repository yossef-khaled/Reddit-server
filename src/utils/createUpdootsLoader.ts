import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

// this function patches and caches all the updoot queries into a single request 
export const createUpdootsLoader = () => new DataLoader<{postId: number, userId: number}, Updoot>( 
    async keys => {
    const updoots = await Updoot.findBy((keys as any));
    const updootsIdsToUpdootMap: Record<string, Updoot> = {};
    updoots.map(updoot => {
        updootsIdsToUpdootMap[`${updoot.postId}|${updoot.userId}`] = updoot;
    })

    return keys.map(key => updootsIdsToUpdootMap[`${key.postId}|${key.userId}`]);
})