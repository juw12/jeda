// Central configuration. Edit this file to rename the app, change links, or prepare for launch.

export const CONFIG = {
  appName: 'Jeda',
  tagline: 'Ambil jeda. Ruang hening untuk setiap iman di Nusantara.',
  version: '0.4.0',

  developer: {
    name: 'juw12',
    github: 'https://github.com/juw12',
  },
  repo: 'https://github.com/juw12/jeda',

  // Content visibility.
  // true  = show draft entries with a clear "Draf, belum ditinjau" banner (development / preview).
  // false = only entries with status "approved" are shown. MUST be false at public launch.
  showDrafts: true,

  // Optional AI endpoint for Tanya Jeda (see worker/tanya-worker.js).
  // Empty string = free mode: answers are citation search over the Pustaka only.
  tanyaEndpoint: '',

  // Support the developer. Set active: true after creating the account and checking the URL.
  // Recommended: Saweria (easiest: QRIS, GoPay, OVO, DANA, ShopeePay, no setup fee).
  support: [
    {
      id: 'saweria',
      name: 'Saweria',
      url: 'https://saweria.co/juw12',
      note: 'QRIS, GoPay, OVO, DANA, ShopeePay',
      active: false,
    },
    {
      id: 'trakteer',
      name: 'Trakteer',
      url: 'https://trakteer.id/juw12',
      note: 'QRIS, e-wallet, transfer bank',
      active: false,
    },
    {
      id: 'github',
      name: 'GitHub Sponsors',
      url: 'https://github.com/sponsors/juw12',
      note: 'Kartu kredit / PayPal (internasional)',
      active: false,
    },
  ],

  // Shown by Tanya Jeda when a message suggests a crisis.
  helpLines: [
    { name: 'Layanan kesehatan jiwa SEJIWA', contact: '119 ext. 8' },
    { name: 'Nomor darurat', contact: '112' },
  ],

  // Corrections and place submissions go to GitHub issues (free, transparent).
  issueUrl(template, title) {
    const params = new URLSearchParams({ template, title });
    return `${this.repo}/issues/new?${params.toString()}`;
  },
};
