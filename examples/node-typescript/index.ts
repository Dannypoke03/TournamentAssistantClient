import { TAWebsocket } from "tournament-assistant-client";

const taWS = new TAWebsocket({
    url: "ws://localhost:2053",
    name: "Danny",
});

setTimeout(() => {
    taWS.close();
    throw new Error("Timeout Error");
}, 10000);

taWS.taClient.on("packet", p => {
    if (p.response.connect) {
        if (p.response.type === 1) {
            console.log(p.response.connect.message);
            taWS.close();
            process.exit(0);
        } else {
            throw new Error("Connection was not successful");
        }
    }
});