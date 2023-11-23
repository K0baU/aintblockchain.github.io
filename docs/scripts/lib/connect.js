import { log } from "./log.js";
import { doc } from "./doc.js";
import { opr } from "./db.js";
import { receive } from "./receive.js";
import { setupWs } from "./socket.js";
import { cid } from "../content/id.js";
import { showAPeer } from "../peer/show-a-peer.js";
import { addContent } from "../content/add.js";

const onlineMsg = "🟢オンライン";
export let conns = {};
let creditOuts = {}, onlines = {};

let user;
opr.for({ store:"keypairs", f: rec => user = rec, end: async () => {
    let isNew;
    if (!user) {                
        user = await crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-384",
            },
            true,
            ["sign", "verify"],
        );
        isNew = true;
    }
    crypto.subtle.exportKey("jwk", user.publicKey).then(pub => {
        const myId = pub.x + pub.y;
        if (isNew)
            opr.crud({
                store: "keypairs",
                op: "add",
                rec: { body: user, id: myId }
            });
        doc("idSummary").append(myId.slice(0, 4) + "...");
        doc("idDetails").append(myId);
        con.ondatachannel = e => {
            e.channel.onmessage = () => receive(e, pub);
        };
        if (!description) {
            conns[id] = con;
            con.createDataChannel("");
            con.createOffer()
                .then(offer => {
                    con.setLocalDescription(offer);
                });
        } else {
            log("createAnswer");
            new Promise(resolve => { resolve(description) })
                .then((offer) => con.setRemoteDescription(offer))
                .then(() => con.createAnswer())
                .then(answer => {
                    con.setLocalDescription(answer);
                });
        }
        setupWs(pub);
    });
} });