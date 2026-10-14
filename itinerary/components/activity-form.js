/**
 * activity-form.js — reusable create/edit dialog (visual structure only).
 * Never persists. Submit reaches the app via onSubmit; warnings render
 * non-blocking in the warnings slot (scheduling overlaps are warnings).
 */
import { ACTIVITY_CATEGORIES } from "../js/activity-validation.js";

const FIELDS = ["title", "date", "startTime", "endTime", "location", "category", "estimatedCost", "estimatedDurationMinutes", "notes"];

function shell(name, labelText, control, hint) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const label = document.createElement("label");
  label.className = "field__label";
  label.setAttribute("for", `act-${name}`);
  label.textContent = labelText;
  control.id = `act-${name}`;
  control.name = name;
  const error = document.createElement("p");
  error.className = "field__error";
  error.id = `act-${name}-error`;
  error.hidden = true;
  control.setAttribute("aria-describedby", error.id);
  wrap.appendChild(label);
  wrap.appendChild(control);
  if (hint) {
    const h = document.createElement("p");
    h.className = "field__hint";
    h.textContent = hint;
    wrap.appendChild(h);
  }
  wrap.appendChild(error);
  return wrap;
}

export function createActivityFormDialog({ onSubmit } = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "activity-form-dialog";
  dialog.setAttribute("aria-labelledby", "activity-form-title");

  const title = document.createElement("h2");
  title.id = "activity-form-title";
  const form = document.createElement("form");
  form.noValidate = true;
  form.className = "activity-form";

  const input = (type) => {
    const c = document.createElement("input");
    c.type = type;
    c.className = "field__control";
    return c;
  };

  form.appendChild(shell("title", "Activity title *", input("text")));

  const dateSel = document.createElement("select");
  dateSel.className = "field__control";
  form.appendChild(shell("date", "Day *", dateSel, "Activities stay within the trip dates."));

  const times = document.createElement("div");
  times.className = "field-row";
  const st = input("time");
  const et = input("time");
  times.appendChild(shell("startTime", "Start time", st));
  times.appendChild(shell("endTime", "End time", et, "Must be later than start. No overnight spans."));
  form.appendChild(times);

  form.appendChild(shell("location", "Location", input("text")));
  const cat = document.createElement("select");
  cat.className = "field__control";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Select a category (optional)";
  cat.appendChild(blank);
  for (const c of ACTIVITY_CATEGORIES) {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    cat.appendChild(o);
  }
  form.appendChild(shell("category", "Category", cat));

  const moneyRow = document.createElement("div");
  moneyRow.className = "field-row";
  const cost = input("number");
  cost.min = "0";
  cost.step = "any";
  moneyRow.appendChild(shell("estimatedCost", "Estimated cost", cost));
  const cur = document.createElement("select");
  cur.className = "field__control";
  for (const code of ["INR", "USD", "EUR", "GBP"]) {
    const o = document.createElement("option");
    o.value = code;
    o.textContent = code;
    cur.appendChild(o);
  }
  moneyRow.appendChild(shell("currency", "Currency", cur));
  form.appendChild(moneyRow);

  const dur = input("number");
  dur.min = "0";
  dur.step = "1";
  form.appendChild(shell("estimatedDurationMinutes", "Estimated duration (minutes)", dur));

  const notes = document.createElement("textarea");
  notes.className = "field__control";
  notes.rows = 2;
  form.appendChild(shell("notes", "Notes", notes));

  const warnings = document.createElement("div");
  warnings.className = "activity-form__warnings";
  warnings.setAttribute("role", "note");
  warnings.hidden = true;
  form.appendChild(warnings);

  const actions = document.createElement("div");
  actions.className = "activity-form__actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn--ghost";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => closeActivityForm(dialog));
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "btn btn--primary";
  save.textContent = "Save activity";
  actions.appendChild(cancel);
  actions.appendChild(save);
  form.appendChild(actions);

  dialog.appendChild(title);
  dialog.appendChild(form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    onSubmit?.();
  });
  return dialog;
}

/** Day options shown as "Day N — Weekday, D Mon". */
export function setActivityFormDays(dialog, days) {
  const sel = dialog.querySelector('[name="date"]');
  if (!sel) return;
  while (sel.firstChild) sel.removeChild(sel.firstChild);
  const fmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
  for (const d of days) {
    const o = document.createElement("option");
    o.value = d.date;
    const [y, m, day] = d.date.split("-").map(Number);
    o.textContent = `Day ${d.dayNumber} — ${fmt.format(new Date(y, m - 1, day))}`;
    sel.appendChild(o);
  }
}

export function getActivityFormValues(dialog) {
  const q = (n) => dialog.querySelector(`[name="${n}"]`)?.value ?? "";
  return {
    title: q("title"),
    date: q("date"),
    startTime: q("startTime"),
    endTime: q("endTime"),
    location: q("location"),
    category: q("category"),
    estimatedCost: q("estimatedCost"),
    currency: q("currency"),
    estimatedDurationMinutes: q("estimatedDurationMinutes"),
    notes: q("notes"),
  };
}

export function setActivityFormValues(dialog, values = {}) {
  const set = (n, v) => {
    const c = dialog.querySelector(`[name="${n}"]`);
    if (c) c.value = v ?? "";
  };
  for (const n of [...FIELDS, "currency"]) set(n, values[n]);
  if (!dialog.querySelector('[name="currency"]').value) dialog.querySelector('[name="currency"]').value = "INR";
}

export function setActivityFormErrors(dialog, errors = {}) {
  clearActivityFormErrors(dialog);
  let first = null;
  for (const [name, msg] of Object.entries(errors)) {
    const control = dialog.querySelector(`[name="${name}"]`);
    const slot = dialog.querySelector(`#act-${name}-error`);
    if (control) {
      control.setAttribute("aria-invalid", "true");
      first ??= control;
    }
    if (slot && msg) {
      slot.textContent = msg;
      slot.hidden = false;
    }
  }
  first?.focus();
}

export function clearActivityFormErrors(dialog) {
  for (const s of dialog.querySelectorAll(".field__error")) {
    s.textContent = "";
    s.hidden = true;
  }
  for (const c of dialog.querySelectorAll("[aria-invalid]")) c.removeAttribute("aria-invalid");
  const w = dialog.querySelector(".activity-form__warnings");
  if (w) {
    while (w.firstChild) w.removeChild(w.firstChild);
    w.hidden = true;
  }
}

export function setActivityFormWarnings(dialog, warnings = []) {
  const w = dialog.querySelector(".activity-form__warnings");
  if (!w) return;
  while (w.firstChild) w.removeChild(w.firstChild);
  if (!warnings.length) {
    w.hidden = true;
    return;
  }
  for (const item of warnings) {
    const p = document.createElement("p");
    p.textContent = `⚠ ${item.message}`;
    w.appendChild(p);
  }
  w.hidden = false;
}

export function setActivityFormSubmitting(dialog, submitting, mode = "create") {
  const save = dialog.querySelector('button[type="submit"]');
  if (save) {
    save.disabled = submitting;
    save.textContent = submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Save activity";
  }
}

let opener = null;

export function openActivityForm(dialog, { mode = "create", values = {}, days = [] } = {}) {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.dataset.mode = mode;
  dialog.querySelector("#activity-form-title").textContent = mode === "edit" ? "Edit activity" : "Add activity";
  setActivityFormDays(dialog, days);
  clearActivityFormErrors(dialog);
  setActivityFormValues(dialog, mode === "edit" ? values : { date: values.date ?? days[0]?.date ?? "" });
  setActivityFormSubmitting(dialog, false, mode);
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('[name="title"]')?.focus();
}

export function closeActivityForm(dialog) {
  if (dialog?.open) dialog.close();
  if (opener && document.contains(opener)) {
    opener.focus();
    opener = null;
  }
}
