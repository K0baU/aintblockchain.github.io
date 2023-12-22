import { cid } from "./id.js";
import { opr } from "../lib/db.js";
import { tagPtn } from "./patterns.js";
import { showContents } from "./show-contents.js";
import { send } from "./send.js";
import { conns } from "../lib/setup-connection.js";

export const addContent = async (type, body, sender) => {
                const id = await cid(body);
                opr.crud({ store: "contents", op: "get", rec: id, callback: async rec => {
                    if (rec) return;
                    const newRec = { id, body, date: Date.now(), sender };
                    if (body.type == "text/plain")
                        newRec.tag = Array.from((await body.text()).matchAll(tagPtn))
                            .map(result => result[1]);
                    opr.crud({ store: "contents", op: "add", rec: newRec, callback: showContents });
                    for (const id in conns) send(conns[id], body);
                } });
    };