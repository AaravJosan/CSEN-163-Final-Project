// Turns technical failures (network, expired session, database internals) into
// plain messages. Messages written for students in the database functions
// ("Only 2 Caesar Salad left…") pass through unchanged.
const NETWORK = /failed to fetch|networkerror|load failed|network request failed|timeout|ECONN/i;
const SESSION = /jwt|refresh token|not authenticated|invalid claim|auth session/i;
const INTERNAL = /permission denied|row-level security|violates|duplicate key|syntax error|column .* does not exist|relation .* does not exist|function .* does not exist|PGRST|unexpected|internal server/i;

export function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  const message = typeof error === "string" ? error : error?.message ?? "";
  if (!message) return fallback;
  if (NETWORK.test(message)) return "Couldn’t reach the Cellar. Check your internet connection and try again.";
  if (SESSION.test(message)) return "Your sign-in has expired. Sign out, sign back in, and try again.";
  if (INTERNAL.test(message)) return fallback;
  return message;
}
