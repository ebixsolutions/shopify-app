export function isResponseLike(error) {
  if (!error || typeof error !== "object") return false;


  if (typeof Response !== "undefined" && error instanceof Response) {
    return true;
  }

  return (
    typeof error.status === "number" &&
    error.headers &&
    typeof error.headers.get === "function"
  );
}