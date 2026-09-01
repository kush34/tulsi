export function getMissingFields(
  requiredFields: string[],
  presentFields: Set<string>
): string[] {
  return requiredFields.filter((field) => !presentFields.has(field));
}