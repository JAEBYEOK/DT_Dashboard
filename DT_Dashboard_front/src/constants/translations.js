export const translations = {
  ko: {
    // Sidebar
    trafficData: "교통 데이터",
    dashboard: "시각화 대시보드",
    analytics: "분석",
    mainDashboard: "교차로 성능 평가",
    routePlanning: "경로 분석",
    simComparison: "시뮬레이션 비교",
    researchScope: "연구 범위",
    dataFilter: "데이터 필터",
    theme: "테마 설정",
    language: "언어 설정",
    
    // Comparison Page
    compTitle: "시뮬레이션 비교 분석",
    compDesc: "Before 모델과 After 모델의 성능 비교",
    majorComp: "주요 지표 비교",
    radarTitle: "종합 성능 분석",
    improvement: "개선",
    decrease: "감소",
    compMapTitle: "연구영역",

    // Metrics
    vht: "VHT (총 통행시간)",
    vkt: "VKT (총 통행거리)",
    volume: "도착 차량 수",
    tcur: "평균 차량 통행시간",
    vcur: "평균 차량 속도",
    delay: "평균 차량 지체시간",

    // Route Planning
    routeTitle: "경로 분석",
    routeDesc: "두 교차로를 선택하여 시나리오별 통행시간을 비교하세요",
    resetSelection: "선택 초기화",
    calculating: "도로 경로 계산 중...",
    routeMapTitle: "경로 선택 맵 (실제 도로 기반)",
    selectedInt: "선택된 교차로",
    selectPrompt: "지도에서 교차로를 선택해주세요",
    routeInfo: "경로 정보 및 시나리오 비교",
    totalDist: "총 거리",
    avgTime: "평균 소요",
    baseScenario: "Before 시나리오",
    optionScenario: "After 시나리오",
    speed: "속도",
    compareAnalysis: "통행 시간 비교 분석",
    timeGap: "시간 차이",
    vehicleCount: "도착 차량 수",
    diff: "차이",

    // Dashboard (Main)
    dashTitle: "교통 데이터 대시보드",
    kpiTotalInt: "총 교차로",
    kpiSelectedId: "선택 ID",
    kpiDataTemp: "데이터(임시)",
    kpiFilterTemp: "필터링(임시)",
    dashMapTitle: "연구 범위 맵",
    intersectionDataTitle: "교차로별 교통 데이터",
    
    // Common Terms
    base: "Before",
    option: "After",
    los: "서비스 수준(LOS)",
    grade: "등급",

    // TrafficVolumeDisplay
    trafficVolumeDirectional: "방향별 교통 데이터 (진입 기준)",
    approach: "진입",
    queue: "대기행렬",
    delaySimple: "지체시간",

    //Selectors (추가됨)
    selectDate: "날짜 선택",
    allDates: "전체 날짜",
    selectIntersectionFirst: "교차로 선택 필요",
    selectTime: "시간대 선택",
    allTime: "전체 시간대",
    daysCount: "일",
    periodsCount: "개",

    // Simulation Nav
    simulation: "시뮬레이션",
    simRun: "시뮬레이션 실행",
    simHistory: "실행 히스토리",
    intersEval: "교차로 성능 평가",

    // SimulationRun
    simRunTitle: "시뮬레이션 실행",
    simRunDesc: "VISSIM 모델과 시나리오를 선택하여 시뮬레이션을 대기열에 등록합니다",
    runnerStatus: "실행기 상태",
    simConfig: "시뮬레이션 설정",
    simModel: "VISSIM 모델",
    simScenario: "시나리오",
    selectModel: "모델 선택",
    selectModelFirst: "먼저 모델을 선택하세요",
    selectScenario: "시나리오 선택",
    noModels: "등록된 모델 없음",
    noScenarios: "해당 모델의 시나리오 없음",
    runSimulation: "시뮬레이션 실행",
    submitting: "등록 중...",
    simCreated: "시뮬레이션이 대기열에 등록되었습니다",
    simCreateFailed: "시뮬레이션 생성 실패",
    viewHistory: "히스토리 보기",

    // SimulationHistory
    simHistoryTitle: "시뮬레이션 히스토리",
    simHistoryDesc: "실행 요청된 시뮬레이션 작업 목록 (5초마다 자동 갱신)",
    noJobs: "등록된 시뮬레이션 작업이 없습니다",
    jobDetail: "작업 상세",
    selectJobPrompt: "왼쪽 목록에서 작업을 선택하세요",

    // IntersectionEvaluation
    evalTitle: "교차로 성능 평가",
    evalDesc: "시뮬레이션 결과 기반 교차로별 KPI 분석",
    selectJob: "작업 선택",
    allJobs: "전체 작업",
    noKpiData: "KPI 데이터가 없습니다",
    noKpiDesc: "완료된 시뮬레이션 작업을 선택하거나 시뮬레이션을 먼저 실행하세요",
    evalIntersections: "교차로 수",
    evalAvgDelay: "평균 지체시간",
    evalAvgSpeed: "평균 속도",
    evalWorstLos: "최저 LOS",
    evalDelayChart: "교차로별 평균 지체시간",
    evalKpiTable: "교차로 KPI 상세",
    intersection: "교차로",
  },
  en: {
    // Sidebar
    trafficData: "Traffic Data",
    dashboard: "Visualization Dashboard",
    analytics: "Analytics",
    mainDashboard: "Intersection Performance Evaluation",
    routePlanning: "Route Planning",
    simComparison: "Simulation Comparison",
    researchScope: "Research Scope",
    dataFilter: "Data Filter",
    theme: "Theme Setting",
    language: "Language",

    // Comparison Page
    compTitle: "Simulation Comparison",
    compDesc: "Performance comparison between Before and After models",
    majorComp: "Key Metrics Comparison",
    radarTitle: "Comprehensive Analysis",
    improvement: "Improvement",
    decrease: "Decrease",
    compMapTitle: "Study Area",

    // Metrics
    vht: "VHT (Total Travel Time)",
    vkt: "VKT (Total Distance)",
    volume: "Number of Veh Arrived",
    tcur: "Avg Vehicle Travel Time",
    vcur: "Avg Vehicle Speed",
    delay: "Avg Vehicle Delay",

    // Route Planning
    routeTitle: "Route Analysis",
    routeDesc: "Select two intersections to compare travel times by scenario",
    resetSelection: "Reset Selection",
    calculating: "Calculating route...",
    routeMapTitle: "Route Selection Map",
    selectedInt: "Selected Intersections",
    selectPrompt: "Please select intersections on the map",
    routeInfo: "Route Info & Comparison",
    totalDist: "Total Distance",
    avgTime: "Avg Duration",
    baseScenario: "Before Scenario",
    optionScenario: "After Scenario",
    speed: "Speed",
    compareAnalysis: "Travel Time Analysis",
    timeGap: "Time Difference",
    vehicleCount: "Vehicles Arrived",
    diff: "Difference",

    // Dashboard (Main)
    dashTitle: "Traffic Data Dashboard",
    kpiTotalInt: "Total Intersections",
    kpiSelectedId: "Selected ID",
    kpiDataTemp: "Data (Temp)",
    kpiFilterTemp: "Filtering (Temp)",
    dashMapTitle: "Research Scope Map",
    intersectionDataTitle: "Intersection Traffic Data",

    // Common Terms
    base: "Before",
    option: "After",
    los: "Level of Service (LOS)",
    grade: "Grade",

    // TrafficVolumeDisplay
    trafficVolumeDirectional: "Directional Traffic Data (Approach)",
    approach: "Approach",
    queue: "Queue",
    delaySimple: "Delay",

    //Selectors (추가됨)
    selectDate: "Select Date",
    allDates: "All Dates",
    selectIntersectionFirst: "Select Intersection First",
    selectTime: "Select Time",
    allTime: "All Time Periods",
    daysCount: "days",
    periodsCount: "periods",

    // Simulation Nav
    simulation: "Simulation",
    simRun: "Run Simulation",
    simHistory: "History",
    intersEval: "Intersection Evaluation",

    // SimulationRun
    simRunTitle: "Run Simulation",
    simRunDesc: "Select a VISSIM model and scenario to queue a simulation job",
    runnerStatus: "Runner Status",
    simConfig: "Simulation Config",
    simModel: "VISSIM Model",
    simScenario: "Scenario",
    selectModel: "Select model",
    selectModelFirst: "Select a model first",
    selectScenario: "Select scenario",
    noModels: "No models registered",
    noScenarios: "No scenarios for this model",
    runSimulation: "Run Simulation",
    submitting: "Submitting...",
    simCreated: "Simulation queued successfully",
    simCreateFailed: "Failed to create simulation",
    viewHistory: "View History",

    // SimulationHistory
    simHistoryTitle: "Simulation History",
    simHistoryDesc: "List of simulation jobs (auto-refreshes every 5s)",
    noJobs: "No simulation jobs found",
    jobDetail: "Job Detail",
    selectJobPrompt: "Select a job from the list",

    // IntersectionEvaluation
    evalTitle: "Intersection Evaluation",
    evalDesc: "KPI analysis per intersection based on simulation results",
    selectJob: "Select Job",
    allJobs: "All Jobs",
    noKpiData: "No KPI data available",
    noKpiDesc: "Select a completed simulation job or run a simulation first",
    evalIntersections: "Intersections",
    evalAvgDelay: "Avg Delay",
    evalAvgSpeed: "Avg Speed",
    evalWorstLos: "Worst LOS",
    evalDelayChart: "Avg Delay by Intersection",
    evalKpiTable: "Intersection KPI Details",
    intersection: "Intersection",
  }
};