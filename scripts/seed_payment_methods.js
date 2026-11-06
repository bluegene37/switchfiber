// Gene - Nov 6, 2026: Seeder script for standard Payment Methods and Transaction Payment Types in SwitchFiber
import https from 'https';

const API_BASE = 'https://admin.switchfiber.ph/api';

export const paymentMethodsSeedData = [
  {
    name: 'Cash',
    description: 'Direct cash payment received over the counter or collected by field technician/agent',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'GCash',
    description: 'GCash e-wallet payment via QR code, payment link, or direct mobile number transfer',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Maya',
    description: 'Maya (formerly PayMaya) e-wallet, Maya app, and national QR Ph standard payment',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Bank Transfer',
    description: 'Online or over-the-counter bank deposit (BDO, BPI, UnionBank, Metrobank, RCBC)',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Credit / Debit Card',
    description: 'Visa / Mastercard / JCB credit or debit card payment via POS terminal or online gateway',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Check',
    description: 'Corporate check or manager\'s check payment for business and enterprise accounts',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Bayad Center / OTC',
    description: 'Authorized over-the-counter payment partners (7-Eleven, Bayad Center, Cebuana Lhuillier, M Lhuillier)',
    createdBy: 1,
    modifiedBy: 1
  }
];

export const paymentTypesSeedData = [
  {
    name: 'Monthly Subscription',
    description: 'Recurring monthly internet fiber plan subscription fee',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Installation Fee',
    description: 'One-time fiber optical installation, modem setup, and activation fee',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Reconnection Fee',
    description: 'Line reconnection fee for temporarily suspended accounts',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Device / Router Fee',
    description: 'Payment for additional mesh Wi-Fi nodes, routers, or optical network terminals',
    createdBy: 1,
    modifiedBy: 1
  },
  {
    name: 'Advance Payment',
    description: 'Advance billing credit or security deposit applied to subscriber account',
    createdBy: 1,
    modifiedBy: 1
  }
];

function makeRequest(url, method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyStr = payload ? JSON.stringify(payload) : null;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        ...(bodyStr ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

export async function seedPaymentMethods() {
  console.log('--- Seeding Payment Methods ---');
  try {
    const getRes = await makeRequest(`${API_BASE}/PaymentMethods`);
    const existing = Array.isArray(getRes.data) ? getRes.data : [];
    console.log(`Existing PaymentMethods count: ${existing.length}`);

    let createdCount = 0;
    for (const item of paymentMethodsSeedData) {
      const match = existing.find(e =>
        String(e.name || '').trim().toLowerCase() === item.name.trim().toLowerCase()
      );
      if (match) {
        console.log(`  [SKIP] "${item.name}" already exists (ID: ${match.id})`);
      } else {
        const postRes = await makeRequest(`${API_BASE}/PaymentMethods`, 'POST', item);
        if (postRes.status === 200 || postRes.status === 201) {
          createdCount++;
          console.log(`  [CREATED] "${item.name}" (ID: ${postRes.data?.id})`);
        } else {
          console.error(`  [FAILED] "${item.name}" - Status ${postRes.status}:`, postRes.raw);
        }
      }
    }
    console.log(`Payment Methods seeding completed. ${createdCount} created.`);
  } catch (err) {
    console.error('Error seeding payment methods:', err);
  }
}

export async function seedPaymentTypes() {
  console.log('\n--- Seeding Payment Types ---');
  try {
    const getRes = await makeRequest(`${API_BASE}/PaymentTypes`);
    const existing = Array.isArray(getRes.data) ? getRes.data : [];
    console.log(`Existing PaymentTypes count: ${existing.length}`);

    let createdCount = 0;
    for (const item of paymentTypesSeedData) {
      const match = existing.find(e =>
        String(e.name || '').trim().toLowerCase() === item.name.trim().toLowerCase()
      );
      if (match) {
        console.log(`  [SKIP] "${item.name}" already exists (ID: ${match.id})`);
      } else {
        const postRes = await makeRequest(`${API_BASE}/PaymentTypes`, 'POST', item);
        if (postRes.status === 200 || postRes.status === 201) {
          createdCount++;
          console.log(`  [CREATED] "${item.name}" (ID: ${postRes.data?.id})`);
        } else {
          console.error(`  [FAILED] "${item.name}" - Status ${postRes.status}:`, postRes.raw);
        }
      }
    }
    console.log(`Payment Types seeding completed. ${createdCount} created.`);
  } catch (err) {
    console.error('Error seeding payment types:', err);
  }
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await seedPaymentMethods();
    await seedPaymentTypes();
  })();
}
