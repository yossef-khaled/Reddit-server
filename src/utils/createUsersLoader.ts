import DataLoader from "dataloader";
import { In } from "typeorm";
import { User } from "../entities/User";

// this function patches and caches all the user queries in a single request 
export const createUsersLoader = () => new DataLoader<number, User>( async usersIds => {
    const users = await User.findBy({ id: In(usersIds as number[])});
    const usersIdToUserMap: Record<number, User> = {};
    users.map(user => {
        usersIdToUserMap[user.id] = user;
    })

    return usersIds.map(id => usersIdToUserMap[id]);
})