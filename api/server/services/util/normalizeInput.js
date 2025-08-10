export function normalizeUserInput(task) {
  const s =
    task?.message ??
    task?.content ??
    task?.prompt ??
    task?.text ??
    task?.input?.text ?? "";
  return String(s ?? "").trim();
}