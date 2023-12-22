import { showAPeer } from "./show-a-peer.js";
import { opr } from "../lib/db.js";

opr.for({ store: "peers", f: value => {
    if (value.name == "" && value.credit == 0) {
        opr.crud({ store: "peers", op: "delete", rec: value.id });
    }
}, end: () => opr.for({ store: "peers", f: showAPeer }) });