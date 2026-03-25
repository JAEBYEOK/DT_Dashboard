const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 모델 파일 불러오기
const Intersection = require('./models/Intersection');
const TrafficData = require('./models/TrafficData');
const TravelTime = require('./models/TravelTime');
const SimulationComparison = require('./models/SimulationComparison');
const TrajStats = require('./models/TrajStats');
const TrajTimeSeries = require('./models/TrajTimeSeries');
const simulationRoutes = require('./routes/simulations');
const resultRoutes = require('./routes/results');
const systemRoutes = require('./routes/system');

const app = express();
const port = 3001; 

app.use(cors());
app.use(express.json());
app.use('/api', simulationRoutes);
app.use('/api', resultRoutes);
app.use('/api', systemRoutes);

// --- MongoDB 연결 ---
const mongoURI = process.env.MONGO_URI || 'mongodb://cjd06222:cjh76039677%40@ac-abu5muz-shard-00-00.v2qwyt7.mongodb.net:27017,ac-abu5muz-shard-00-01.v2qwyt7.mongodb.net:27017,ac-abu5muz-shard-00-02.v2qwyt7.mongodb.net:27017/Traffic_DB?ssl=true&authSource=admin&replicaSet=atlas-diwe9c-shard-0';

mongoose.connect(mongoURI, {
    dbName: 'Traffic_DB'
  })
  .then(() => console.log('MongoDB Atlas에 성공적으로 연결되었습니다.'))
  .catch(err => console.error('MongoDB 연결 실패:', err));

// --- API 라우트 설정 ---

// 1. 교차로 정보 가져오기 (디버깅 강화)
app.get('/api/intersections', async (req, res) => {
  try {
    const { region } = req.query;
    
    // [디버깅] DB에 있는 모든 region 종류를 먼저 조회해서 로그로 찍어봅니다.
    const distinctRegions = await Intersection.distinct('region');
    console.log('[DEBUG] DB에 저장된 지역 목록:', distinctRegions);
    console.log('[DEBUG] 요청받은 지역:', region);

    let query = {};
    
    // region 파라미터가 있고 'all'이 아니면 해당 지역만 필터링
    if (region && region !== 'all') {
      // trim()으로 앞뒤 공백 제거
      query.region = region.trim();
    }

    const intersections = await Intersection.find(query);
    console.log(`[DEBUG] 검색된 데이터 개수: ${intersections.length}`);
    
    res.json(intersections);
  } catch (err) {
    console.error('[API Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. 모든 교통 데이터 가져오기
app.get('/api/trafficdata', async (req, res) => {
  try {
    const data = await TrafficData.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. 모든 통행시간 데이터 가져오기
app.get('/api/traveltime', async (req, res) => {
  try {
    const data = await TravelTime.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. 시뮬레이션 비교 데이터 가져오기 (intersection_id 필터 지원)
app.get('/api/simulationcomparison', async (req, res) => {
  try {
    const { intersection_id } = req.query;
    const query = intersection_id ? { intersection_id: Number(intersection_id) } : {};
    const data = await SimulationComparison.find(query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. 궤적 집계 통계 (교차로별 실제 시뮬레이션 데이터)
app.get('/api/trajstats', async (req, res) => {
  try {
    const { intersection_id } = req.query;
    const query = intersection_id ? { intersection_id: Number(intersection_id) } : {};
    const data = await TrajStats.find(query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. 궤적 시계열 — 현재 simtime 기준 30초 롤링 윈도우 집계
app.get('/api/trajlive', async (req, res) => {
  try {
    const { intersection_id, simtime } = req.query;
    if (!simtime) return res.json([]);
    const t = parseFloat(simtime);
    const windowSec = 30; // 앞뒤 15초 = 30초 윈도우
    // 해당 윈도우와 겹치는 모든 버킷 조회
    const query = {
      time_start: { $lt: t + windowSec / 2 },
      time_end:   { $gt: t - windowSec / 2 },
    };
    if (intersection_id) query.intersection_id = Number(intersection_id);
    const buckets = await TrajTimeSeries.find(query);

    if (buckets.length === 0) return res.json([]);

    // 여러 버킷을 하나로 합산
    const merged = buckets.reduce((acc, b) => {
      const vehicleSet = new Set([...(acc._ids || [])]);
      acc.vehicle_count   = (acc.vehicle_count   || 0) + b.vehicle_count;
      acc.car_count       = (acc.car_count       || 0) + b.car_count;
      acc.van_count       = (acc.van_count       || 0) + b.van_count;
      const totalObs      = (acc._obs || 0) + (b.vehicle_count > 0 ? 1 : 0);
      acc._obs            = totalObs;
      const prevAvg       = acc.avg_speed_kmh || 0;
      acc.avg_speed_kmh   = totalObs > 1
        ? parseFloat(((prevAvg * (totalObs - 1) + b.avg_speed_kmh) / totalObs).toFixed(1))
        : b.avg_speed_kmh;
      acc.intersection_id = b.intersection_id;
      acc.time_start      = Math.min(acc.time_start ?? Infinity, b.time_start);
      acc.time_end        = Math.max(acc.time_end   ?? 0,        b.time_end);
      return acc;
    }, {});

    res.json([merged]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. simtime 범위 메타데이터 (프론트에서 슬라이더 범위 설정용)
app.get('/api/trajlive/meta', async (req, res) => {
  try {
    const minDoc = await TrajTimeSeries.findOne().sort({ time_start: 1 }).select('time_start');
    const maxDoc = await TrajTimeSeries.findOne().sort({ time_end: -1 }).select('time_end');
    res.json({
      time_min: minDoc?.time_start ?? 1800,
      time_max: maxDoc?.time_end   ?? 1910,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. 사용 가능한 지역 목록 조회 API
app.get('/api/regions', async (req, res) => {
  try {
    const regions = await Intersection.distinct('region');
    const validRegions = regions.filter(r => r);
    res.json(validRegions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`API 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});