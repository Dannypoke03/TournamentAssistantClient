const Client = require("tournament-assistant-client").Client;

const taWS = new Client("BSL", {
    url: "ws://tournamentassistant.net:2053"
});

setTimeout(() => {
    taWS.close();
    throw new Error("Timeout Error");
}, 10000);

taWS.on("packet", p => {
    if (p.has_response && p.response.has_connect) {
        if (p.response.type === 1) {
            console.log(p.response.connect.message);
            taWS.close();
            process.exit(0);
        } else {
            throw new Error("Connection was not successful");
        }
    }
});

taWS.on("error", e => {
    throw e;
});
