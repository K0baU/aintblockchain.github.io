import { doc } from "../lib/doc.js";

const increaseCredit = (multiplier) => {
            const id = (new FormData(doc("peersForm"))).get("target");
            const amount = Number(doc("amountInput").value);
            opr.crud({ store: "peers", op: "get", rec: id, callback: rec => {
                const newRec = rec;
                newRec.credit += amount * multiplier;
                opr.crud({ store: "peers", op: "put", rec: newRec, callback: () => {
                    log(
                        `${rec.name}: ${rec.credit} => ${newRec.credit} (${multiplier >= 0 ? "+" : "-"}${amount})`
                    );
                    creditOuts[id].value = newRec.credit;
                } });
            } });
        };
        doc('plus').onclick = () => {
            increaseCredit(1);
        };
        doc('minus').onclick = () => {
            increaseCredit(-1);
        };