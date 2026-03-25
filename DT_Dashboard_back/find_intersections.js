const https = require('https');

const clusters = [
  {id:1, lat:36.647572, lon:126.683938},
  {id:2, lat:36.667305, lon:126.674174},
  {id:3, lat:36.645740, lon:126.671808},
  {id:4, lat:36.643822, lon:126.680472},
  {id:5, lat:36.659884, lon:126.686687},
  {id:6, lat:36.674396, lon:126.672277},
  {id:7, lat:36.672263, lon:126.687141},
  {id:8, lat:36.639300, lon:126.675834},
  {id:9, lat:36.665072, lon:126.668483},
  {id:10, lat:36.667147, lon:126.683372},
  {id:11, lat:36.664806, lon:126.684736},
  {id:12, lat:36.672026, lon:126.680534},
  {id:13, lat:36.651250, lon:126.685956},
  {id:14, lat:36.656543, lon:126.687020},
  {id:15, lat:36.672092, lon:126.686304},
  {id:16, lat:36.666424, lon:126.671960},
  {id:17, lat:36.668434, lon:126.677008},
  {id:18, lat:36.670249, lon:126.681568},
  {id:19, lat:36.671311, lon:126.684236},
  {id:20, lat:36.647130, lon:126.669740},
  {id:21, lat:36.644141, lon:126.674188},
  {id:22, lat:36.641511, lon:126.678101},
  {id:23, lat:36.646297, lon:126.682909}
];

function fetchRoads(lat, lon) {
  return new Promise((resolve) => {
    const query = `[out:json][timeout:10];way["highway"]["name"](around:60,${lat},${lon});out tags;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
    const req = https.get(url, { headers: { 'User-Agent': 'DT-Dashboard/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(12000, () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  for (const c of clusters) {
    const r = await fetchRoads(c.lat, c.lon);
    const roads = r ? [...new Set(r.elements.map(e => e.tags && e.tags.name).filter(Boolean))] : [];
    console.log(`${c.id}|${c.lat}|${c.lon}|${roads.join(' / ')}`);
    await new Promise(res => setTimeout(res, 600));
  }
}

main();
