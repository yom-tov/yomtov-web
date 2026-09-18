export interface EmailProvider {
  sendVerificationEmail(
    to: string,
    token: string,
    name: string,
  ): Promise<void>;
  sendPasswordResetEmail(
    to: string,
    token: string,
    name: string,
  ): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3001";
}

class ConsoleEmailProvider implements EmailProvider {
  async sendVerificationEmail(
    to: string,
    token: string,
    name: string,
  ): Promise<void> {
    const url = `${getBaseUrl()}/verify-email?token=${token}`;
    console.log(
      `[EMAIL] Verification email to ${to} (${name}):\n  ${url}`,
    );
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    name: string,
  ): Promise<void> {
    const url = `${getBaseUrl()}/reset-password?token=${token}`;
    console.log(
      `[EMAIL] Password reset email to ${to} (${name}):\n  ${url}`,
    );
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    console.log(`[EMAIL] Welcome email to ${to} (${name})`);
  }
}

let _provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!_provider) {
    _provider = new ConsoleEmailProvider();
  }
  return _provider;
}
