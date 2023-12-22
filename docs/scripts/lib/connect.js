import {
    log
} from "./log.js";
import {
    doc
} from "./doc.js";
import {
    opr
} from "./db.js";
import {
    socketSend
} from "./socket.js";
import {
    cid
} from "../content/id.js";
import {
    showAPeer
} from "../peer/show-a-peer.js";
import {
    addContent
} from "../content/add.js";

export let user;
export let pub;
export let sendName = ()=> {};
opr.for({
    store: "keypairs", f: rec => user = rec, end: async () => {
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
        crypto.subtle.exportKey("jwk", user.publicKey).then(pubKey => {
            pub = pubKey;
            const myId = pub.x + pub.y;
            if (isNew)
                opr.crud({
                store: "keypairs",
                op: "add",
                rec: {
                    body: user, id: myId
                }
            });
            doc("idSummary").append(myId.slice(0, 4) + "...");
            doc("idDetails").append(myId);
            sendName = ()=> {
                socketSend({
                    type: "id", body: pub.x + pub.y
                });
            }
        });
    }
});