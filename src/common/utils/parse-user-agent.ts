import { UAParser } from 'ua-parser-js';

export function parseUserAgent(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();

  let osName = os.name ?? 'Unknown OS';
  let osVersion = os.version ?? '';

  // Обработка NT 10.0 для Windows 10 и 11
  if (osName === 'Windows' && osVersion.startsWith('10')) {
    osName = 'Windows 10/11';
  }

  const browserName = browser.name ?? 'Browser';
  const browserVersion = browser.version ?? '';

  return `${osName} ${osVersion} · ${browserName} ${browserVersion}`.trim();
}
