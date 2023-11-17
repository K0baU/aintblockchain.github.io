import { doc } from "./doc.js";

export const log = (text) => {
    const p = document.createElement("p");
    p.append(text);
    doc("logOutput").append(p);
};

window.onerror = log;