export const getUnixTimestamp = () => Math.round(Date.now() / 1000);

export const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
