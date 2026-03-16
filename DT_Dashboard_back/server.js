const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 모델 파일 불러오기
const Intersection = require('./models/Intersection');
const TrafficData = require('./models/TrafficData');
const TravelTime = require('./models/TravelTime');
const SimulationComparison = require('./models/SimulationComparison');

const app = express();
const port = 3001; 

app.use(cors());
app.use(express.json());

// --- MongoDB 연결 ---
const mongoURI = 'mongodb+srv://ckalstn0522:ckalstn!773@cluster0.tnuim5y.mongodb.net/?appName=Cluster0'; 

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

// 4. 모든 시뮬레이션 비교 데이터 가져오기
app.get('/api/simulationcomparison', async (req, res) => {
  try {
    const data = await SimulationComparison.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. 사용 가능한 지역 목록 조회 API
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