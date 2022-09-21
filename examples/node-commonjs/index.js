const TAWebsocket = require("tournament-assistant-client").TAWebsocket;

const taWS = new TAWebsocket({
    url: "ws://ta.beatsaberleague.com:2053",
    name: "Danny",
});

setTimeout(() => {
    taWS.close();
    throw new Error("Timeout Error");
}, 10000);

taWS.taClient.on("packet", p => {
    if (p.connect_response) {
        if (p.connect_response.response.type === 1) {
            console.log(p.connect_response.response.message);
            taWS.close();
            process.exit(0);
        } else {
            throw new Error("Connection was not successful");
        }
    }
});