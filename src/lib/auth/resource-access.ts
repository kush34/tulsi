import { Role } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export type ResourceOwner = {
  id: string;
  ownerUserId: string | null;
  type?: "patient" | "doctor" | "admin";
};

export function canAccessResource(
  session: { user: { id: string; role: Role } },
  resource: ResourceOwner
): boolean {
  const role = session.user.role;
  if (role === Role.ADMIN) return true;
  if (role === Role.DOCTOR && resource.type === "patient") return true;
  return resource.ownerUserId === session.user.id;
}

export function assertResourceAccess(
  session: { user: { id: string; role: Role } },
  resource: ResourceOwner
): void {
  if (!canAccessResource(session, resource)) {
    throw new ForbiddenError("You do not have access to this resource");
  }
}

export async function findOwnedResource<T>(
  findFn: () => Promise<T | null>,
  session: { user: { id: string; role: Role } },
  toOwner: (resource: T) => ResourceOwner
): Promise<T> {
  const resource = await findFn();
  if (!resource) throw new NotFoundError("Resource");
  assertResourceAccess(session, toOwner(resource));
  return resource;
}
