import React, { useState, useMemo, useEffect, useRef } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Car, Activity, Zap, Gauge, Users } from 'lucide-react';

// 컴포넌트 임포트
import IntersectionMap from "../../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../../components/dashboard/VehicleTypeChart";
import TrafficVolumeDisplay from "../../components/dashboard/TrafficVolumeDisplay";

// 다국어 지원 Context 임포트
import { useLanguage } from "../../context/LanguageContext";

const API_URL = 'http://localhost:3001/api';

const hudCardStyle = "bg-slate-950/90 backdrop-blur-md border-slate-800/80 shadow-2xl";

export default function CombinedHUD() {
  const [selectedId, setSelectedId] = useState(null);
  const [simTime, setSimTime] = useState(null);       // Unity 시뮬레이션 시간
  const [liveStats, setLiveStats] = useState(null);   // 현재 시간 기준 통계
  const simTimePollRef = useRef(null);

  const { language } = useLanguage();
  const isKo = language === 'ko';

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {};
  }, []);

  // simtime 관리 — Unity 브로드캐스트 우선, 없으면 자체 타이머로 1800~1920 순환
  const SIM_START = 1800, SIM_END = 1920;
  const selfTimerRef = useRef(null);
  const selfTimeRef  = useRef(SIM_START);

  useEffect(() => {
    // 자체 타이머: 1초마다 SIM_START→SIM_END 순환
    selfTimerRef.current = setInterval(() => {
      const unityTime = window.__UNITY_SIM_TIME__;
      const isUnityValid = unityTime && unityTime >= SIM_START && unityTime <= SIM_END + 30;

      if (isUnityValid) {
        setSimTime(parseFloat(unityTime.toFixed(1)));
      } else {
        // 자체 순환 타이머
        selfTimeRef.current += 1;
        if (selfTimeRef.current > SIM_END) selfTimeRef.current = SIM_START;
        setSimTime(parseFloat(selfTimeRef.current.toFixed(1)));
      }
    }, 1000);
    return () => clearInterval(selfTimerRef.current);
  }, []);

  // simtime 또는 selectedId 변경 시 라이브 통계 fetch
  useEffect(() => {
    if (!simTime || !selectedId) { setLiveStats(null); return; }
    axios.get(`${API_URL}/trajlive`, {
      params: { intersection_id: selectedId, simtime: simTime }
    }).then(res => {
      setLiveStats(res.data.length > 0 ? res.data[0] : null);
    }).catch(() => setLiveStats(null));
  }, [simTime, selectedId]);

  const { data: intersections, isLoading: isLoadingIntersections } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const { data: allTrafficData, isLoading: isLoadingTraffic } = useQuery({
    queryKey: ['trafficData'],
    queryFn: () => axios.get(`${API_URL}/trafficdata`).then(res => res.data),
    initialData: [],
  });

  const { data: allTrajStats } = useQuery({
    queryKey: ['trajstats'],
    queryFn: () => axios.get(`${API_URL}/trajstats`).then(res => res.data),
    initialData: [],
  });

  const handleMarkerClick = (intersection) => {
    setSelectedId(intersection.intersection_id);
    const id = intersection.intersection_id;

    // Unity 폴링용 전역변수에 ID 저장
    window.__UNITY_MOVE_REQUEST__ = id;
    console.log(`[HUD] 교차로 클릭: ID ${id}`);

    // Title Hack (보조)
    document.title = `CLICKED:${id}`;
    setTimeout(() => { document.title = "HUD"; }, 200);

    // UWB JS Bridge (보조)
    if (window.uwb) {
      window.uwb.ExecuteJsMethod("MoveToIntersection", Number(id));
    }
  };

  // 선택된 교차로의 전체 궤적 집계 통계
  const trajStat = useMemo(() => {
    if (!selectedId) return null;
    return allTrajStats.find(s => String(s.intersection_id) === String(selectedId)) || null;
  }, [selectedId, allTrajStats]);

  const filteredTrafficData = useMemo(() => {
    if (!selectedId) return [];
    return allTrafficData.filter(data => String(data.intersection_id) === String(selectedId));
  }, [selectedId, allTrafficData]);

  const selectedIntersection = useMemo(() => {
    if (!selectedId) return null;
    return intersections.find(i => String(i.intersection_id) === String(selectedId));
  }, [selectedId, intersections]);

  // 개선 후(After) 데이터 생성용
  const optionTrafficData = useMemo(() => {
    return filteredTrafficData.map(data => {
      const multiplier = 1.0 + Math.random() * 2.0; 
      return { ...data, 소계_대: Math.floor((data.소계_대 || 0) * multiplier) };
    });
  }, [filteredTrafficData]);

  if (isLoadingIntersections || isLoadingTraffic) {
    return <Skeleton className="w-full h-screen bg-transparent" />;
  }

  return (
    <div className="flex w-full h-screen overflow-hidden" style={{ backgroundColor: 'transparent' }}>
      
      {/* [왼쪽 패널] 지도 100% */}
      <div className="w-[25%] h-full p-3 pointer-events-auto flex flex-col gap-3">
        <Card className={`h-full w-full overflow-hidden ${hudCardStyle}`}>
          <CardContent className="p-0 h-full relative">
            <div className="h-full w-full absolute inset-0">
              <IntersectionMap
                intersections={intersections}
                onSelectIntersection={handleMarkerClick}
                selectedIntersectionId={selectedId}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* [중앙 패널] 카메라 뷰 프레임 */}
      <div className="w-[50%] h-full pointer-events-none flex flex-col items-center justify-between py-3 px-2" style={{ backgroundColor: 'transparent' }}>
        {/* 상단 교차로 이름 표시 */}
        <div className="w-full flex justify-center">
          <div className="px-4 py-1.5 rounded-full border border-cyan-500/50 bg-slate-950/60 backdrop-blur-sm text-cyan-300 text-xs font-semibold tracking-widest uppercase">
            {selectedIntersection ? selectedIntersection.intersection_name : '교차로를 선택하세요'}
          </div>
        </div>

        {/* 카메라 뷰 테두리 프레임 (내부 투명 → Unity 3D 씬이 보임) */}
        <div
          className="w-full flex-1 my-2 relative"
          style={{ backgroundColor: 'transparent' }}
        >
          {/* 모서리 장식 */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/70" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/70" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/70" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/70" />

          {/* 선택 전 안내 텍스트 */}
          {!selectedIntersection && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-slate-500/70 text-sm tracking-wide">CAMERA VIEW</span>
            </div>
          )}
        </div>

        {/* 하단 상태 표시 */}
        <div className="w-full flex justify-center">
          <div className="px-3 py-1 rounded border border-slate-700/50 bg-slate-950/50 backdrop-blur-sm text-slate-500 text-[10px] tracking-widest">
            {selectedIntersection
              ? `ID ${selectedIntersection.intersection_id} · ${parseFloat(selectedIntersection.latitude).toFixed(4)}, ${parseFloat(selectedIntersection.longitude).toFixed(4)}`
              : 'LIVE · 내포신도시 디지털 트윈'}
          </div>
        </div>
      </div>

      {/* [오른쪽 패널] 정보 카드 + 차트 영역 */}
      <div 
        className="w-[25%] h-full p-3 pointer-events-auto flex flex-col gap-3"
        style={{ 
          overflowY: 'auto',
          maxHeight: '100vh',
          scrollBehavior: 'smooth'
        }}
      >
        {/* 0. 실시간 시뮬레이션 라이브 통계 */}
        <Card className="w-full shrink-0 overflow-hidden border-emerald-700/50 bg-slate-950/90 backdrop-blur-md shadow-2xl">
          <CardHeader className="py-2 px-4 border-b border-emerald-800/40">
            <CardTitle className="text-emerald-300 flex items-center gap-2 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              {isKo ? '시뮬레이션 교통 통계' : 'Simulation Traffic'}
              <span className="ml-auto text-emerald-500 font-mono text-[10px]">
                T={simTime ? Math.floor(simTime) : '---'}s
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 py-2 space-y-2">
            {!selectedId ? (
              <p className="text-[10px] text-slate-500 text-center py-1">교차로를 선택하세요</p>
            ) : (
              <>
                {/* 전체 집계 (항상 표시) */}
                {trajStat ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center bg-emerald-900/30 rounded-lg p-2 border border-emerald-800/30">
                      <Users className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                      <span className="text-xl font-black text-emerald-300 leading-none">{trajStat.vehicle_count}</span>
                      <span className="text-[9px] text-emerald-500 mt-0.5">총 통과 차량</span>
                    </div>
                    <div className="flex flex-col items-center bg-blue-900/30 rounded-lg p-2 border border-blue-800/30">
                      <Gauge className="w-3.5 h-3.5 text-blue-400 mb-0.5" />
                      <span className="text-xl font-black text-blue-300 leading-none">{trajStat.avg_speed_kmh}</span>
                      <span className="text-[9px] text-blue-500 mt-0.5">평균 km/h</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 text-center">궤적 데이터 없음</p>
                )}

                {/* 현재 5초 구간 차량 수 */}
                <div className="flex items-center justify-between px-1 py-1 bg-slate-900/50 rounded-lg border border-slate-800/50">
                  <span className="text-[10px] text-slate-400">현재 구간 ({simTime ? Math.floor(simTime) : '-'}~{simTime ? Math.floor(simTime)+5 : '-'}s)</span>
                  <span className={`text-sm font-black ${liveStats && liveStats.vehicle_count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {liveStats ? liveStats.vehicle_count : 0}대
                  </span>
                </div>

                {/* 차종 비율 */}
                {trajStat && trajStat.vehicle_count > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] text-slate-500 w-6">승용</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                      <div className="bg-violet-500 h-1.5 rounded-full"
                        style={{ width: `${Math.round(trajStat.car_count / trajStat.vehicle_count * 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-violet-400 w-7">
                      {Math.round(trajStat.car_count / trajStat.vehicle_count * 100)}%
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 1. 교차로 정보 카드 */}
        <Card className={`w-full shrink-0 flex flex-col justify-center overflow-hidden py-2 ${hudCardStyle}`}>
          <CardHeader className="py-2 px-4 min-h-0 shrink-0 border-b border-slate-700/50"> 
            <CardTitle className="text-slate-100 flex items-center gap-2 text-sm font-semibold">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="truncate">
                {selectedIntersection ? selectedIntersection.intersection_name : (isKo ? "교차로 선택" : "Select Intersection")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2 pt-3 flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
            {selectedIntersection ? (
              <div className="text-[11px] text-slate-300 space-y-1.5 w-full">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-1">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono font-bold text-cyan-200">{selectedIntersection.intersection_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isKo ? '위도' : 'Lat'}</span>
                  <span className="font-mono truncate ml-2">{parseFloat(selectedIntersection.latitude).toFixed(5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isKo ? '경도' : 'Lng'}</span>
                  <span className="font-mono truncate ml-2">{parseFloat(selectedIntersection.longitude).toFixed(5)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center w-full py-2">
                {isKo ? "지도에서 마커를 클릭하세요." : "Click a marker on the map."}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedId && (
          <>
            {/* 2. 차종 분포 카드 */}
            <Card className={`min-h-[220px] w-full shrink-0 flex flex-col overflow-hidden py-2 ${hudCardStyle}`}>
              <CardHeader className="py-2 px-4 min-h-0 shrink-0 border-b border-slate-700/50">
                <CardTitle className="text-slate-100 flex items-center gap-2 text-sm font-semibold">
                  <Car className="w-4 h-4 text-cyan-400" />
                  {isKo ? '차종 분포' : 'Vehicle Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                  <VehicleTypeChart trafficData={filteredTrafficData} compact={true} />
              </CardContent>
            </Card>

            {/* 3. 개선 후 (After) 방향별 교통량 카드 */}
            <Card className={`flex-1 min-h-[250px] w-full shrink-0 flex flex-col overflow-hidden py-2 ${hudCardStyle}`}>
              <CardHeader className="py-2 px-4 min-h-0 shrink-0 border-b border-slate-700/50">
                <CardTitle className="text-slate-100 flex items-center gap-2 text-sm font-semibold">
                  <Activity className="w-4 h-4 text-violet-400" />
                  {isKo ? '개선 후 (After) 방향별 교통량' : 'Directional Traffic (After)'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 flex-1 min-h-0 flex flex-col relative">
                {/* HUD 전용 모드이므로 compact={true}를 주어 중복 제목 발생을 차단 */}
                <TrafficVolumeDisplay trafficData={optionTrafficData} compact={true} />
              </CardContent>
            </Card>

            <div className="h-5 shrink-0"></div>
          </>
        )}
      </div>

    </div>
  );
}