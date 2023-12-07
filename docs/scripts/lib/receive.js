import {
    log
} from "./log.js";
import {
    opr
} from "./db.js";
import {
    setupConn
} from "./setup-connection.js";

const mimes = {};

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
                        hash: {
                            name: "SHA-384"
                        },
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
                const blob = new Blob([e.data], {
                    type: mimes[id]
                });
                addContent("content", blob);
            } else log("no mime received");
            delete mimes[id];
            break;
    }
};