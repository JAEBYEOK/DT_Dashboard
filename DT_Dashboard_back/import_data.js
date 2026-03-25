const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Intersection = require('./models/Intersection');
const TrafficData = require('./models/TrafficData');
const TravelTime = require('./models/TravelTime');
const SimulationComparison = require('./models/SimulationComparison');

const mongoURI = 'mongodb://cjd06222:cjh76039677%40@ac-abu5muz-shard-00-00.v2qwyt7.mongodb.net:27017,ac-abu5muz-shard-00-01.v2qwyt7.mongodb.net:27017,ac-abu5muz-shard-00-02.v2qwyt7.mongodb.net:27017/Traffic_DB?ssl=true&authSource=admin&replicaSet=atlas-diwe9c-shard-0';
const DATASET_DIR = 'C:\\Users\\kaistys\\Desktop\\Dataset';

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim()).filter(h => h !== '');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      const val = (values[i] || '').trim();
      obj[header] = val;
    });
    return obj;
  }).filter(obj => Object.values(obj).some(v => v !== ''));
}

async function importIntersections() {
  const rows = parseCSV(path.join(DATASET_DIR, 'Intersection.csv'));
  const docs = rows.map(r => ({
    intersection_id: Number(r.intersection_id),
    intersection_name: r.intersection_name,
    latitude: parseFloat(r.latitude),
    longitude: parseFloat(r.longitude),
    phase_count: Number(r.phase_count),
    region: '내포',
  }));
  await Intersection.deleteMany({});
  await Intersection.insertMany(docs);
  console.log(`Intersection: ${docs.length}건 import 완료`);
}

async function importTrafficData() {
  const rows = parseCSV(path.join(DATASET_DIR, 'TrafficData.csv'));
  const docs = rows.map(r => ({
    intersection_id: r.intersection_id,
    date: r.date ? r.date.split(' ')[0] : '',
    time_period: r.time_period,
    direction_eng: r.direction_eng,
    vehs: r.vehs !== '' ? Number(r.vehs) : undefined,
    '소계_대': r['소계_대'] !== '' ? Number(r['소계_대']) : undefined,
    '소형_승용': r['소형_승용'] !== '' ? Number(r['소형_승용']) : undefined,
    '버스_소형': r['버스_소형'] !== '' ? Number(r['버스_소형']) : undefined,
    '버스_대형': r['버스_대형'] !== '' ? Number(r['버스_대형']) : undefined,
    '화물_소형': r['화물_소형'] !== '' ? Number(r['화물_소형']) : undefined,
    '화물_중형': r['화물_중형'] !== '' ? Number(r['화물_중형']) : undefined,
    '화물_대형': r['화물_대형'] !== '' ? Number(r['화물_대형']) : undefined,
  }));
  await TrafficData.deleteMany({});
  await TrafficData.insertMany(docs);
  console.log(`TrafficData: ${docs.length}건 import 완료`);
}

async function importTravelTime() {
  const rows = parseCSV(path.join(DATASET_DIR, 'TravelTime.csv'));
  const docs = rows.map(r => ({
    from_intersection_id: Number(r.from_intersection_id),
    to_intersection_id: Number(r.to_intersection_id),
    time_period: Number(r.time_period),
    travel_time: Number(r.travel_time),
    distance: Number(r.distance),
  }));
  await TravelTime.deleteMany({});
  await TravelTime.insertMany(docs);
  console.log(`TravelTime: ${docs.length}건 import 완료`);
}

async function importSimulationComparison() {
  const rows = parseCSV(path.join(DATASET_DIR, 'SimulationComparison.csv'));
  const docs = rows.map(r => ({
    intersection_id: r.intersection_id ? Number(r.intersection_id) : undefined,
    scenario_name: r.scenario_name,
    total_volume: Number(r.total_volume),
    unserved_vehicles: Number(r.unserved_vehicles),
    avg_speed: Number(r.avg_speed),
    avg_delay: Number(r.avg_delay),
    avg_travel_time: Number(r.avg_travel_time),
    total_distance: Number(r.total_distance),
  }));
  await SimulationComparison.deleteMany({});
  await SimulationComparison.insertMany(docs);
  console.log(`SimulationComparison: ${docs.length}건 import 완료`);
}

async function main() {
  console.log('MongoDB Atlas 연결 중...');
  await mongoose.connect(mongoURI, { dbName: 'Traffic_DB' });
  console.log('연결 성공!\n');

  await importIntersections();
  await importTrafficData();
  await importTravelTime();
  await importSimulationComparison();

  console.log('\n모든 데이터 import 완료!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('오류 발생:', err.message);
  process.exit(1);
});
