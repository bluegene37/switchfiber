import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../public/data/philippines');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
        return;
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// NIR (Negros Island Region) RA 12000 definition
const NIR_REGION_CODE = '180000000';
const NIR_PROVINCE_CODES = ['064500000', '074600000', '076100000']; // Negros Occ, Negros Or, Siquijor

async function run() {
  console.log('Downloading and updating PSGC Philippines geographic data (including NIR)...');

  try {
    // 1. Fetch Regions
    console.log('Fetching regions...');
    const rawRegions = await fetchJson('https://psgc.gitlab.io/api/regions.json');
    const regions = rawRegions.map(r => ({
      code: r.code,
      name: r.name,
      regionName: r.regionName
    }));

    // Check if NIR (Region XVIII) exists, if not add it
    if (!regions.some(r => r.code === NIR_REGION_CODE)) {
      regions.push({
        code: NIR_REGION_CODE,
        name: 'NIR (Negros Island Region)',
        regionName: 'Region XVIII'
      });
    }

    regions.sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'regions.json'),
      JSON.stringify(regions, null, 2)
    );
    console.log(`Saved ${regions.length} regions (including NIR).`);

    // 2. Fetch Provinces & Map NIR
    console.log('Fetching provinces...');
    const rawProvinces = await fetchJson('https://psgc.gitlab.io/api/provinces.json');
    const provinces = rawProvinces.map(p => ({
      code: p.code,
      name: p.name,
      regionCode: NIR_PROVINCE_CODES.includes(p.code) ? NIR_REGION_CODE : p.regionCode
    })).sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'provinces.json'),
      JSON.stringify(provinces, null, 2)
    );
    console.log(`Saved ${provinces.length} provinces.`);

    // 3. Fetch Cities & Municipalities & Map NIR
    console.log('Fetching cities and municipalities...');
    const rawCities = await fetchJson('https://psgc.gitlab.io/api/cities-municipalities.json');
    const cities = rawCities.map(c => {
      const isNir = c.provinceCode && NIR_PROVINCE_CODES.includes(c.provinceCode);
      return {
        code: c.code,
        name: c.name,
        isCity: c.isCity,
        isMunicipality: c.isMunicipality,
        provinceCode: c.provinceCode || null,
        regionCode: isNir ? NIR_REGION_CODE : c.regionCode
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'cities.json'),
      JSON.stringify(cities, null, 2)
    );
    console.log(`Saved ${cities.length} cities/municipalities.`);

    // 4. Fetch Barangays and group by city/municipality code
    console.log('Fetching barangays...');
    const rawBarangays = await fetchJson('https://psgc.gitlab.io/api/barangays.json');
    
    const barangaysByCity = {};
    rawBarangays.forEach(b => {
      const cityKey = b.cityCode || b.municipalityCode || b.subMunicipalityCode;
      if (!cityKey) return;
      if (!barangaysByCity[cityKey]) {
        barangaysByCity[cityKey] = [];
      }
      barangaysByCity[cityKey].push({
        code: b.code,
        name: b.name
      });
    });

    Object.keys(barangaysByCity).forEach(cityCode => {
      barangaysByCity[cityCode].sort((a, b) => a.name.localeCompare(b.name));
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'barangays.json'),
      JSON.stringify(barangaysByCity)
    );
    console.log(`Saved ${rawBarangays.length} barangays grouped into ${Object.keys(barangaysByCity).length} cities/municipalities.`);

    console.log('🎉 Successfully generated Philippines address JSON datasets with NIR in public/data/philippines/');
  } catch (error) {
    console.error('Error downloading PSGC data:', error);
    process.exit(1);
  }
}

run();
