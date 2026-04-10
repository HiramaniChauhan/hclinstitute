/**
 * Masks an email address for display, showing only the first 2 and last 2 characters
 * of the local part, and first 2 and last 2 characters of the domain name.
 * 
 * Example: hiramanichauhan2399@gmail.com → hi****99@gm**il.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "****@****.com";

  const [local, domain] = email.split("@");
  const domainParts = domain.split(".");
  const domainName = domainParts[0];
  const domainExt = domainParts.slice(1).join(".");

  // Mask local part: first 2 + **** + last 2
  let maskedLocal: string;
  if (local.length <= 4) {
    maskedLocal = local[0] + "****" + local[local.length - 1];
  } else {
    maskedLocal = local.slice(0, 2) + "****" + local.slice(-2);
  }

  // Mask domain name: first 2 + ** + last 2
  let maskedDomain: string;
  if (domainName.length <= 4) {
    maskedDomain = domainName[0] + "**" + domainName[domainName.length - 1];
  } else {
    maskedDomain = domainName.slice(0, 2) + "**" + domainName.slice(-2);
  }

  return `${maskedLocal}@${maskedDomain}.${domainExt}`;
}
