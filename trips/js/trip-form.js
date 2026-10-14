/**
 * trip-form.js — form state + submission coordination.
 * Reads the modal, validates via the service boundary, and reports back.
 * Knows nothing about list rendering; the entry refreshes via onSaved.
 * Static imports only (trip-form-modal.js never imports this file back).
 */
import {
  getTripFormValues,
  setTripFormErrors,
  clearTripFormErrors,
  setTripFormSubmitting,
  closeTripFormModal,
} from "../components/trip-form-modal.js";

/**
 * @param {{ dialog: HTMLDialogElement, service: object,
 *          onSaved?: (mode: "create"|"edit", trip: object) => void,
 *          onError?: (message: string) => void }} deps
 * @returns {{ openCreate: () => void, openEdit: (trip: object|null) => boolean, submit: () => Promise<void> }}
 */
export function initTripForm({ dialog, service, onSaved, onError }) {
  let mode = "create";
  let editingId = null;
  let submitting = false;

  async function submit() {
    if (submitting) return; // prevent duplicate submissions
    submitting = true;
    setTripFormSubmitting(dialog, true);
    clearTripFormErrors(dialog);
    try {
      const values = getTripFormValues(dialog);
      const result = mode === "edit" ? service.update(editingId, values) : service.create(values);
      if (!result.ok) {
        if (result.errors) {
          setTripFormErrors(dialog, result.errors); // values preserved, modal stays open
        } else if (result.error === "not-found") {
          closeTripFormModal(dialog);
          onError?.("That trip no longer exists. Nothing was saved.");
        } else {
          onError?.("Could not save the trip — browser storage is unavailable. Your entries are preserved.");
        }
        return;
      }
      closeTripFormModal(dialog); // close only after a successful save
      onSaved?.(mode, result.trip);
    } finally {
      submitting = false;
      setTripFormSubmitting(dialog, false);
    }
  }

  return {
    openCreate() {
      mode = "create";
      editingId = null;
    },
    /** Returns false when there is nothing to edit (caller shows a status). */
    openEdit(trip) {
      if (!trip || typeof trip.id !== "string") return false;
      mode = "edit";
      editingId = trip.id;
      return true;
    },
    submit,
  };
}
