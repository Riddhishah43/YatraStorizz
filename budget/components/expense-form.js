/**
 * expense-form.js — reusable add/edit dialog (visual structure only).
 * Never persists. Submit reaches the app via onSubmit; the entry runs
 * manager flows and re-renders. Values survive validation failures.
 */
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../js/expense-manager.js";

const FIELDS = ["description", "amount", "category", "date", "paymentMethod", "notes"];

function shell(name, labelText, control, hint) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const label = document.createElement("label");
  label.className = "field__label";
  label.setAttribute("for", `exp-${name}`);
  label.textContent = labelText;
  control.id = `exp-${name}`;
  control.name = name;
  const error = document.createElement("p");
  error.className = "field__error";
  error.id = `exp-${name}-error`;
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

export function createExpenseFormDialog({ onSubmit } = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "expense-form-dialog";
  dialog.setAttribute("aria-labelledby", "expense-form-title");

  const title = document.createElement("h2");
  title.id = "expense-form-title";
  const form = document.createElement("form");
  form.noValidate = true;
  form.className = "expense-form";

  const input = (type) => {
    const c = document.createElement("input");
    c.type = type;
    c.className = "field__control";
    return c;
  };

  form.appendChild(shell("description", "Description *", input("text")));
  form.querySelector("#exp-description").placeholder = "e.g. Hotel booking, Jaipur";

  const row = document.createElement("div");
  row.className = "field-row";
  const amount = input("number");
  amount.min = "0";
  amount.step = "any";
  row.appendChild(shell("amount", "Amount *", amount, "Must be greater than zero."));
  const date = input("date");
  row.appendChild(shell("date", "Expense date *", date));
  form.appendChild(row);

  const cat = document.createElement("select");
  cat.className = "field__control";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Select a category";
  cat.appendChild(blank);
  for (const c of EXPENSE_CATEGORIES) {
    const o = document.createElement("option");
    o.value = c.value;
    o.textContent = `${c.icon} ${c.label}`;
    cat.appendChild(o);
  }
  form.appendChild(shell("category", "Category *", cat));

  const pay = document.createElement("select");
  pay.className = "field__control";
  const payBlank = document.createElement("option");
  payBlank.value = "";
  payBlank.textContent = "Select payment method (optional)";
  pay.appendChild(payBlank);
  for (const p of PAYMENT_METHODS) {
    const o = document.createElement("option");
    o.value = p;
    o.textContent = p;
    pay.appendChild(o);
  }
  form.appendChild(shell("paymentMethod", "Payment method", pay));

  const notes = document.createElement("textarea");
  notes.className = "field__control";
  notes.rows = 2;
  form.appendChild(shell("notes", "Notes", notes));

  const actions = document.createElement("div");
  actions.className = "expense-form__actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn--ghost";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => closeExpenseForm(dialog));
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "btn btn--primary";
  save.textContent = "Save expense";
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

function todayYMD() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function getExpenseFormValues(dialog) {
  const q = (n) => dialog.querySelector(`[name="${n}"]`)?.value ?? "";
  return {
    description: q("description"),
    amount: q("amount"),
    category: q("category"),
    date: q("date"),
    paymentMethod: q("paymentMethod"),
    notes: q("notes"),
  };
}

export function setExpenseFormValues(dialog, values = {}) {
  const set = (n, v) => {
    const c = dialog.querySelector(`[name="${n}"]`);
    if (c) c.value = v ?? "";
  };
  for (const n of FIELDS) set(n, values[n]);
}

export function setExpenseFormErrors(dialog, errors = {}) {
  clearExpenseFormErrors(dialog);
  let first = null;
  for (const [name, msg] of Object.entries(errors)) {
    const control = dialog.querySelector(`[name="${name}"]`);
    const slot = dialog.querySelector(`#exp-${name}-error`);
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

export function clearExpenseFormErrors(dialog) {
  for (const s of dialog.querySelectorAll(".field__error")) {
    s.textContent = "";
    s.hidden = true;
  }
  for (const c of dialog.querySelectorAll("[aria-invalid]")) c.removeAttribute("aria-invalid");
}

export function setExpenseFormSubmitting(dialog, submitting, mode = "create") {
  const save = dialog.querySelector('button[type="submit"]');
  if (save) {
    save.disabled = submitting;
    save.textContent = submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Save expense";
  }
}

let opener = null;

export function openExpenseForm(dialog, { mode = "create", values = {} } = {}) {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.dataset.mode = mode;
  dialog.querySelector("#expense-form-title").textContent = mode === "edit" ? "Edit expense" : "Add expense";
  clearExpenseFormErrors(dialog);
  if (mode === "create" && !values.date) values = { ...values, date: todayYMD() };
  setExpenseFormValues(dialog, mode === "edit" ? values : values);
  setExpenseFormSubmitting(dialog, false, mode);
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('[name="description"]')?.focus();
}

export function closeExpenseForm(dialog) {
  if (dialog?.open) dialog.close();
  if (opener && document.contains(opener)) {
    opener.focus();
    opener = null;
  }
}
