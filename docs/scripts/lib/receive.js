import { log } from "./log.js";
import { opr } from "./db.js";

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const mimes = {};

const setupConn = (id, pub, description) => {
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
                                    onlines[id].textContent = onlineMsg;
                                } else {
                                    const newPeer = { id, name: "", credit: 0 };
                                    opr.crud({ store: "peers", op: "add", rec: newPeer, callback: showAPeer });
                                }
                                break;
                            case "disconnected":
                                onlines[id].textContent = "";
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
                                                    hash: { name: "SHA-384" },
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

export const receive = async (e, pub) => {
    const myId = pub.x + pub.y;
                    switch (typeof e.data) {
                        case "string":
                            const data = JSON.parse(e.data);
                            switch (data.type) {
                                case "peer":
                                    const id = data.body;
                                    if (id == myId) {
                                        break;
                                    }
                                    log("offer");
                                    setupConn(id, pub);
                                    break;
                                case "description":
                                    if (await crypto.subtle.verify(
                                        {
                                            name: "ECDSA",
                                            hash: { name: "SHA-384" },
                                        },
                                        await crypto.subtle.importKey(
                                            "jwk",
                                            data.body.pub,
                                            {
                                                name: "ECDSA",
                                                namedCurve: "P-384",
                                            },
                                            true,
                                            ["verify"],
                                        ),
                                        new Uint8Array(data.body.sign).buffer,
                                        (new TextEncoder()).encode(data.body.descriptionStr),
                                    )) {
                                        const description = JSON.parse(data.body.descriptionStr);
                                        log("answer");
                                        setupConn(data.body.pub.x + data.body.pub.y, pub, description);
                                    };
                                    break;
                                case "mime":
                                    mimes[data.body.cid] = data.body.type;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        default:
                            const id = await cid(e.data);
                            if (mimes[id]) {
                                const blob = new Blob([e.data], { type: mimes[id] });
                                addContent("content", blob);
                            } else log("no mime received");
                            delete mimes[id];
                            break;
                    }
                };