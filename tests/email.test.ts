import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendRdvNotificationEmail } from '../lib/email';
import { getListingById } from '../lib/listings';
import type { Rdv } from '../lib/rdv';

const appt5 = getListingById('appt5')!;
const raismesT3 = getListingById('raismes-t3')!;

// Hoisted spies pour le mock de nodemailer — accessibles depuis beforeEach + tests
const emailMocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: emailMocks.createTransport },
}));

function makeRdv(overrides: Partial<Rdv> = {}): Rdv {
  return {
    id: 'rdv-test',
    listingId: 'appt5',
    start: '2026-08-10T17:00:00.000Z',
    end: '2026-08-10T17:15:00.000Z',
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0600000000',
    email: 'jean@example.com',
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  delete process.env.EMAIL_TO;
  emailMocks.createTransport.mockReset();
  emailMocks.sendMail.mockReset();
  emailMocks.sendMail.mockResolvedValue({});
  emailMocks.createTransport.mockReturnValue({ sendMail: emailMocks.sendMail });
});

// ============ sendRdvNotificationEmail — destinataires ============

describe('sendRdvNotificationEmail — destinataires de la notification', () => {
  it('notifie à la fois EMAIL_TO et l email du rdvHost quand listing.rdvHost.email est défini', async () => {
    await sendRdvNotificationEmail(makeRdv(), appt5);

    expect(emailMocks.sendMail).toHaveBeenCalledTimes(1);
    const [mailOptions] = emailMocks.sendMail.mock.calls[0];
    expect(mailOptions.to).toContain('lydstyl@gmail.com');
    expect(mailOptions.to).toContain('janot59590@gmail.com');
  });

  it('notifie uniquement EMAIL_TO quand le listing n a pas de rdvHost', async () => {
    await sendRdvNotificationEmail(makeRdv(), raismesT3);

    expect(emailMocks.sendMail).toHaveBeenCalledTimes(1);
    const [mailOptions] = emailMocks.sendMail.mock.calls[0];
    expect(mailOptions.to).toContain('lydstyl@gmail.com');
    expect(mailOptions.to).not.toContain('janot59590@gmail.com');
  });

  it('déduplique les destinataires quand EMAIL_TO et rdvHost.email sont identiques', async () => {
    process.env.EMAIL_TO = 'janot59590@gmail.com';
    await sendRdvNotificationEmail(makeRdv(), appt5);

    const [mailOptions] = emailMocks.sendMail.mock.calls[0];
    expect(mailOptions.to).toEqual(['janot59590@gmail.com']);
  });
});
