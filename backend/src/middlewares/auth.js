import crypto from "node:crypto";

const sessions = new Map();

export function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { ...user, expiresAt: Date.now() + 1000 * 60 * 60 * 24 });
  return token;
}

export function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return response.status(401).json({ error: "Session invalide ou expirée" });
  }
  request.user = session;
  next();
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ error: "Cette action n'est pas disponible pour votre profil" });
    }
    next();
  };
}

export function requireAdmin(request, response, next) {
  return requireRole("admin")(request, response, next);
}

export function removeSession(request) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (token) sessions.delete(token);
}