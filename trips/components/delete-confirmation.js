/**
 * delete-confirmation.js — reusable delete confirm dialog.
 * Promise-based: resolves true only on explicit Delete, false on
 * cancel/Escape/backdrop. Double-clicking Delete cannot double-resolve.
 */

/**
 * @param {string} tripTitle shown in the confirmation message
 * @returns {Promise<boolean>} true when the user confirms deletion
 */
export function openDeleteConfirmation(tripTitle) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      dialog.close();
      dialog.remove();
      if (opener && document.contains(opener)) opener.focus();
      resolve(value);
    };

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.createElement("dialog");
    dialog.className = "delete-dialog";
    dialog.setAttribute("aria-labelledby", "delete-dialog-title");

    const title = document.createElement("h2");
    title.id = "delete-dialog-title";
    title.textContent = "Delete trip?";

    const msg = document.createElement("p");
    const lead = document.createElement("span");
    lead.textContent = "Delete “";
    const name = document.createElement("strong");
    name.textContent = tripTitle || "this trip";
    const tail = document.createElement("span");
    tail.textContent = "”? This cannot be undone.";
    msg.appendChild(lead);
    msg.appendChild(name);
    msg.appendChild(tail);

    const actions = document.createElement("div");
    actions.className = "delete-dialog__actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn btn--secondary";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => done(false));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn--danger-solid";
    del.textContent = "Delete trip";
    del.addEventListener("click", () => done(true));
    actions.appendChild(cancel);
    actions.appendChild(del);

    dialog.appendChild(title);
    dialog.appendChild(msg);
    dialog.appendChild(actions);
    dialog.addEventListener("cancel", () => done(false)); // Escape
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) done(false); // backdrop
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    // Focus Cancel (safe default), never the destructive action.
    cancel.focus();
  });
}
