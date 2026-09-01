import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

export const ROLE_LEVELS: Record<Role, number> = {
  PATIENT: 1,
  DOCTOR: 2,
  ADMIN: 3,
};

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session;
}

export async function requireRole(allowed: Role | Role[]) {
  const session = await requireAuth();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError("You do not have permission to access this resource");
  }
  return session;
}

export async function requireAtLeastRole(minimum: Role) {
  const session = await requireAuth();
  if (ROLE_LEVELS[session.user.role] < ROLE_LEVELS[minimum]) {
    throw new ForbiddenError("Insufficient role permissions");
  }
  return session;
}
