export type SubdomainContext = 'marketplace' | 'superadmin' | 'b2b';

export function getSubdomain(): SubdomainContext {
  // Allow overriding the domain for local development via environment variable or localStorage
  const envOverride = import.meta.env.VITE_DEV_SUBDOMAIN as SubdomainContext | undefined;
  if (envOverride) return envOverride;
  
  const localOverride = localStorage.getItem('DEV_SUBDOMAIN') as SubdomainContext | null;
  if (localOverride) return localOverride;

  const hostname = window.location.hostname;
  
  // If it's a known top-level domain without a subdomain, default to marketplace
  if (hostname === 'insureiq.com' || hostname === 'www.insureiq.com') {
    return 'marketplace';
  }

  // Check for local dev environments without a subdomain
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'marketplace'; // Default for local dev without hosts modification
  }

  const parts = hostname.split('.');
  
  // E.g., superadmin.insureiq.com -> parts = ['superadmin', 'insureiq', 'com']
  // E.g., marketplace.insureiq.com -> parts = ['marketplace', 'insureiq', 'com']
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();
    if (subdomain === 'superadmin') {
      return 'superadmin';
    }
    if (subdomain === 'marketplace') {
      return 'marketplace';
    }
    // Any other subdomain is considered a B2B tenant
    return 'b2b';
  }

  return 'marketplace'; // fallback
}
