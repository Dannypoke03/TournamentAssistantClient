import { TAWebsocket } from "tournament-assistant-client";

const taWS = new TAWebsocket({
    url: "ws://ta.beatsaberleague.com:2053",
    name: "Danny",
});

const packetDiv = document.getElementById("packets");

taWS.taClient.on("packet", p => {
    console.log(p.toObject());
    if (packetDiv) packetDiv.innerHTML = JSON.stringify(p.toObject(), null, 2) + "<br><hr><br>" + packetDiv.innerHTML;
});