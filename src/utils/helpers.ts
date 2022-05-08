export function uuidv4() {
    if (crypto.randomUUID()) return crypto.randomUUID();
    return (1e7 + "-" + 1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => {
        const c2 = parseInt(c);
        return (c2 ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c2 / 4).toString(16);
    });
}