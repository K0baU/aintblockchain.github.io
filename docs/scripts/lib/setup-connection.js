import { log } from "./log.js";
import { onlineMsg, creditOuts } from "./doc.js";
import { opr } from "./db.js";
import { user } from "./connect.js";
import { onlines, showAPeer } from "../peer/show-a-peer.js";
import { socketSend } from "./socket.js";
import {
    receive
} from "./receive.js";

const config = {
    iceServers: [{
        urls: "stun:stun.l.google.com:19302"
    }]
};
export const conns = {};
export const setupConn = (id, pub, description) => {
    if (description && description.type == "answer") {
        conns[id].setRemoteDescription(description);
        return;
    }
    // Create the local connection and its event listeners
    const con = new RTCPeerConnection(config);
    con.onconnectionstatechange = () => {
        log(con.connectionState);
        switch (con.connectionState) {
            case "connected":
                if (creditOuts[id]) {
                    if (onlines[id]) onlines[id].textContent = onlineMsg;
                } else {
                    const newPeer = {
                        id,
                        name: "",
                        credit: 0
                    };
                    opr.crud({
                        store: "peers", op: "add", rec: newPeer, callback: showAPeer
                    });
                }
                break;
            case "disconnected":
                if (onlines[id]) onlines[id].textContent = "";
                break;
        }
    };
    // Set up the ICE candidates for the two peers
    con.onicecandidate = async e => {
        log("ice");
        if (!e.candidate) {
            socketSend({
                type: "transport", body: {
                    payload: {
                        type: "description", body: {
                            descriptionStr: JSON.stringify(con.localDescription),
                            sign: Array.from(new Uint8Array(await crypto.subtle.sign(
                                {
                                    name: "ECDSA",
                                    hash: {
                                        name: "SHA-384"
                                    },
                                },
                                user.privateKey,
                                (new TextEncoder()).encode(JSON.stringify(con.localDescription)),
                            ))),
                            pub
                        }
                    }, to: id
                }
            });
        }
    }
    con.ondatachannel = e => {
        e.channel.onmessage = receive;
    };
    if (!description) {
        conns[id] = con;
        con.createDataChannel("");
        con.createOffer()
        .then(offer => {
            con.setLocalDescription(offer);
    });
} else {
    new Promise(resolve => {
        resolve(description)
    })
    .then(offer => con.setRemoteDescription(offer))
    .then(() => con.createAnswer())
    .then(answer => {
        con.setLocalDescription(answer);
    });
}
};