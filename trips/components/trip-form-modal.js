/**
 * trip-form-modal.js — reusable create/edit dialog (visual structure only).
 * Never saves trips or touches storage. Submission reaches the app via
 * the onSubmit callback wired in createTripFormModal({ onSubmit }).
 * Field errors render under their inputs with aria-describedby linkage.
 */

const FIELDS = ["title", "destinations", "startDate", "endDate", "plannedBudget", "status"];

function fieldShell(doc, name, labelText, control, hint) {
  const wrap = doc.createElement("div");
  wrap.className = "field";
  const label = doc.createElement("label");
  label.className = "field__label";
  label.setAttribute("for", `trip-${name}`);
  label.textContent = labelText;
  control.id = `trip-${name}`;
  control.name = name;
  const error = doc.createElement("p");
  error.className = "field__error";
  error.id = `trip-${name}-error`;
  error.hidden = true;
  control.setAttribute("aria-describedby", error.id);
  wrap.appendChild(label);
  wrap.appendChild(control);
  if (hint) {
    const h = doc.createElement("p");
    h.className = "field__hint";
    h.textContent = hint;
    wrap.appendChild(h);
  }
  wrap.appendChild(error);
  return wrap;
}

export function createTripFormModal({ onSubmit } = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "trip-form-dialog";

  const title = document.createElement("h2");
  title.className = "trip-form-dialog__title";
  title.id = "trip-form-title";
  dialog.setAttribute("aria-labelledby", "trip-form-title");

  const form = document.createElement("form");
  form.method = "dialog"; // enhanced below; we preventDefault on submit
  form.noValidate = true;
  form.className = "trip-form";

  const mk = (tag, type) => {
    const c = document.createElement(tag);
    if (type) c.type = type;
    c.className = "field__control";
    return c;
  };

  form.appendChild(fieldShell(document, "title", "Trip title *", mk("input", "text")));
  form.querySelector("#trip-title").placeholder = "e.g. Rajasthan Getaway";
  form.appendChild(
    fieldShell(document, "destinations", "Destinations *", mk("input", "text"), "Separate multiple places with commas.")
  );
  form.querySelector("#trip-destinations").placeholder = "e.g. Jaipur, Udaipur";

  const dates = document.createElement("div");
  dates.className = "field-row";
  dates.appendChild(fieldShell(document, "startDate", "Start date *", mk("input", "date")));
  dates.appendChild(fieldShell(document, "endDate", "End date *", mk("input", "date")));
  form.appendChild(dates);

  const money = document.createElement("div");
  money.className = "field-row";
  money.appendChild(fieldShell(document, "plannedBudget", "Planned budget *", mk("input", "number")));
  form.querySelector("#trip-plannedBudget").min = "0";
  form.querySelector("#trip-plannedBudget").step = "any";
  const currency = mk("select");
  for (const code of ["INR", "USD", "EUR", "GBP"]) {
    const o = document.createElement("option");
    o.value = code;
    o.textContent = code;
    currency.appendChild(o);
  }
  money.appendChild(fieldShell(document, "currency", "Currency", currency));
  form.appendChild(money);

  const status = mk("select");
  for (const [value, label] of [["auto", "Auto (from dates)"], ["upcoming", "Upcoming"], ["ongoing", "Ongoing"], ["completed", "Completed"], ["cancelled", "Cancelled"]]) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    status.appendChild(o);
  }
  form.appendChild(fieldShell(document, "status", "Status", status, "Cancelled stays cancelled regardless of dates."));

  const desc = mk("textarea");
  desc.rows = 2;
  form.appendChild(fieldShell(document, "description", "Description (optional)", desc));
  form.appendChild(
    fieldShell(document, "companions", "Companions (optional)", mk("input", "text"), "Separate names with commas.")
  );
  const notes = mk("textarea");
  notes.rows = 2;
  form.appendChild(fieldShell(document, "notes", "Notes (optional)", notes));

  const formError = document.createElement("p");
  formError.className = "trip-form__error";
  formError.setAttribute("role", "alert");
  formError.hidden = true;
  form.appendChild(formError);

  const actions = document.createElement("div");
  actions.className = "trip-form__actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn--ghost";
  cancel.dataset.action = "form-cancel";
  cancel.textContent = "Cancel";
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "btn btn--primary";
  save.textContent = "Save trip";
  actions.appendChild(cancel);
  actions.appendChild(save);
  form.appendChild(actions);

  dialog.appendChild(title);
  dialog.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // stay open; trip-form.js decides when to close
    onSubmit?.();
  });
  cancel.addEventListener("click", () => closeTripFormModal(dialog));

  return dialog;
}

/** Read raw field values (normalization happens in trip-validation.js). */
export function getTripFormValues(dialog) {
  const q = (name) => dialog.querySelector(`[name="${name}"]`)?.value ?? "";
  return {
    title: q("title"),
    destinations: q("destinations"),
    startDate: q("startDate"),
    endDate: q("endDate"),
    plannedBudget: q("plannedBudget"),
    currency: q("currency"),
    status: q("status"),
    description: q("description"),
    companions: q("companions"),
    notes: dialog.querySelector('[name="notes"]')?.value ?? "",
  };
}

export function setTripFormValues(dialog, values = {}) {
  const set = (name, v) => {
    const c = dialog.querySelector(`[name="${name}"]`);
    if (c) c.value = v ?? "";
  };
  set("title", values.title);
  set("destinations", Array.isArray(values.destinations) ? values.destinations.map((d) => d?.name ?? d).join(", ") : values.destinations);
  set("startDate", values.startDate);
  set("endDate", values.endDate);
  set("plannedBudget", values.plannedBudget);
  set("currency", values.currency || "INR");
  set("status", values.status || "auto");
  set("description", values.description);
  set("companions", Array.isArray(values.companions) ? values.companions.join(", ") : values.companions);
  set("notes", values.notes);
}

export function setTripFormErrors(dialog, errors = {}) {
  clearTripFormErrors(dialog);
  let first = null;
  for (const name of FIELDS) {
    const msg = errors[name];
    if (!msg) continue;
    const control = dialog.querySelector(`[name="${name}"]`);
    const slot = dialog.querySelector(`#trip-${name}-error`);
    if (control) {
      control.setAttribute("aria-invalid", "true");
      if (!first) first = control;
    }
    if (slot) {
      slot.textContent = msg;
      slot.hidden = false;
    }
  }
  for (const key of Object.keys(errors)) {
    if (FIELDS.includes(key)) continue;
    const formError = dialog.querySelector(".trip-form__error");
    if (formError) {
      formError.textContent = errors[key];
      formError.hidden = false;
    }
  }
  first?.focus();
}

export function clearTripFormErrors(dialog) {
  for (const slot of dialog.querySelectorAll(".field__error")) {
    slot.textContent = "";
    slot.hidden = true;
  }
  for (const c of dialog.querySelectorAll("[aria-invalid]")) c.removeAttribute("aria-invalid");
  const formError = dialog.querySelector(".trip-form__error");
  if (formError) {
    formError.textContent = "";
    formError.hidden = true;
  }
}

export function setTripFormSubmitting(dialog, submitting) {
  const save = dialog.querySelector('button[type="submit"]');
  if (save) {
    save.disabled = submitting;
    save.textContent = submitting ? "Saving…" : dialog.dataset.mode === "edit" ? "Save changes" : "Save trip";
  }
}

let opener = null;

export function openTripFormModal(dialog, { mode = "create", values = {} } = {}) {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.dataset.mode = mode;
  dialog.querySelector(".trip-form-dialog__title").textContent =
    mode === "edit" ? "Edit trip" : "Create a new trip";
  clearTripFormErrors(dialog);
  setTripFormValues(dialog, mode === "edit" ? values : {});
  setTripFormSubmitting(dialog, false);
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('[name="title"]')?.focus();
}

export function closeTripFormModal(dialog) {
  if (dialog?.open) dialog.close();
  if (opener && document.contains(opener)) {
    opener.focus();
    opener = null;
  }
}
