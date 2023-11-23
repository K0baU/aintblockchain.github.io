import {
    log
} from "../lib/log.js";
import {
    doc,
    addDOM
} from "../lib/doc.js";
import {
    opr
} from "../lib/db.js";
import {
    encodeId
} from "./id.js";
import {
    aPtn,
    tagPtn
} from "./patterns.js";

const HTMLify = (str, ptns) => {
    return ptns.reduce((prev, ptn) =>
        prev.replaceAll(RegExp(ptn, "g"), match =>
            `<button type="button" onclick="
            arguments[0].stopImmediatePropagation();
            const box=document.getElementById('message');
            box.value += '${match.replaceAll("\n", " ")}';
            box.dispatchEvent(new InputEvent('input'));
            box.focus();">${match}</button>`
        ), str);
};

const show = async (result, sender) => {
    const li = document.createElement("li");
    doc("contentsUl").append(li);
    const senderName = sender ? sender.name || "ななっしー": "自分";
    addDOM(li, [{
        tag: "div", content: (new Date(result.date)).toLocaleString("ja")
    },
        {
            tag: "div", content: senderName
        }]);
    const file = result.body;
    switch (file.type.split("/")[0]) {
        case "text":
            const p = document.createElement("p");
            p.innerHTML = HTMLify(await file.text(), [aPtn, tagPtn]);
            addDOM(li, [p]);
            break;
        case "image":
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
            };
            addDOM(li, [img]);
            break;
        case "video":
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.onload = () => {
                URL.revokeObjectURL(video.src);
            };
            addDOM(li, [video]);
            break;
        default:
            break;
    }
    li.onclick = () => {
        if (getSelection().toString()) return;
        const messageInput = doc("messageInput");
        messageInput.value += `>>${encodeId(result.id)} `;
        messageInput.dispatchEvent(new InputEvent('input'));
        messageInput.focus();
    };
}

export const showAContent = result => {
    if (result.sender) {
        opr.crud({
            store: "peers", op: "get", rec: result.sender,
            callback: sender => show(result, sender)
        });
    } else show(result);
};