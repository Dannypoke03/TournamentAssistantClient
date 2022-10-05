import { Client } from "tournament-assistant-client";

const taWS = new Client("Danny", {
    url: "ws://ta.beatsaberleague.com:2053"
});

const packetDiv = document.getElementById("packets");

taWS.on("packet", p => {
    console.log(p.toObject());
    if (packetDiv) packetDiv.innerHTML = JSON.stringify(p.toObject(), null, 2) + "<br><hr><br>" + packetDiv.innerHTML;
});

taWS.on("error", e => {
    throw e;
});
