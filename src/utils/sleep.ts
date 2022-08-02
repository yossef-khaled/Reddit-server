//Create a pseudo delay fetching data 
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
