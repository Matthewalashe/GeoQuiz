import fs from 'fs';

const content = fs.readFileSync('src/data/listings.jsx', 'utf8');
const regex = /L\s*\(\s*['"]([^'"]+)['"]/g;
const codeIds = [];
let match;
while ((match = regex.exec(content)) !== null) {
  codeIds.push(match[1]);
}

console.log("Listing IDs in code (src/data/listings.jsx):");
console.log(codeIds);
console.log("Total in code:", codeIds.length);

const dbUrl = 'https://xyfqpnveymkpizltwsdo.supabase.co/rest/v1/cms_listings?select=id';
const headers = {
  'apikey': 'sb_publishable_ZUVjfpO9kPvpzjng_XUwYw_Ov6lcoSA',
  'Authorization': 'Bearer sb_publishable_ZUVjfpO9kPvpzjng_XUwYw_Ov6lcoSA'
};

fetch(dbUrl, { headers })
  .then(res => res.json())
  .then(data => {
    const dbIds = data.map(row => row.id);
    console.log("\nListing IDs in database (cms_listings):");
    console.log(dbIds);
    console.log("Total in database:", dbIds.length);

    const onlyInCode = codeIds.filter(id => !dbIds.includes(id));
    console.log("\nListings ONLY in code:");
    console.log(onlyInCode);

    const onlyInDb = dbIds.filter(id => !codeIds.includes(id));
    console.log("\nListings ONLY in DB:");
    console.log(onlyInDb);
  })
  .catch(err => console.error(err));
