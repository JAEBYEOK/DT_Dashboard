import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, BarChart3 } from 'lucide-react';

// ê¸°ì¡´ ì°¨íŠ¸ ì»´í¬?ŒíŠ¸ ?¬ì‚¬??(ê²½ë¡œ ?•ì¸ ?„ìˆ˜)
import VehicleTypeChart from "../../components/dashboard/VehicleTypeChart";
import GEHAnalysis from "../../components/dashboard/GEHAnalysis";

// API ?œë²„ ì£¼ì†Œ
const API_URL = 'https://df-dashboard-back.onrender.com/api';

export default function RightCharts() {
  // Unityê°€ ? íƒ?´ì? êµì°¨ë¡?ID
  const [selectedId, setSelectedId] = useState(null);

  // ?°ì´??ë¯¸ë¦¬ ë¡œë”©
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

  // [?µì‹¬] Unityê°€ ?¸ì¶œ?????ˆëŠ” ?„ì—­ ?¨ìˆ˜ ?±ë¡
  useEffect(() => {
    window.updateCharts = (id) => {
      console.log(`Unity requested chart update for ID: ${id}`);
      setSelectedId(id); // ID ë³€ê²?-> ì°¨íŠ¸ ë¦¬ë Œ?”ë§
    };

    return () => {
      delete window.updateCharts;
    };
  }, []);

  // ? íƒ??ID??ë§ëŠ” ?°ì´???„í„°ë§?
  const filteredTrafficData = useMemo(() => {
    if (!selectedId) return [];
    return allTrafficData.filter(data => 
      String(data.intersection_id) === String(selectedId)
    );
  }, [selectedId, allTrafficData]);

  const selectedIntersection = useMemo(() => {
    if (!selectedId) return null;
    return intersections.find(i => 
      String(i.intersection_id) === String(selectedId)
    );
  }, [selectedId, intersections]);

  if (isLoadingIntersections || isLoadingTraffic) {
    return <Skeleton className="w-full h-screen bg-white/50" />;
  }

  return (
    // ë°°ê²½ ?¬ëª… (Unity ?¬ì´ ?¤ì— ë³´ì´?„ë¡)
    <div className="w-full h-screen bg-transparent p-4 space-y-4 overflow-y-auto">
      
      {/* 1. ? íƒ??êµì°¨ë¡??•ë³´ */}
      <Card className="bg-white/90 backdrop-blur-sm border-cyan-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-cyan-600" />
            {selectedIntersection ? selectedIntersection.intersection_name : "êµì°¨ë¡?ë¯¸ì„ ??}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedIntersection ? (
            <div className="text-sm text-slate-600">
              ID: {selectedIntersection.intersection_id} / 
              ?„ë„: {parseFloat(selectedIntersection.latitude).toFixed(4)}, 
              ê²½ë„: {parseFloat(selectedIntersection.longitude).toFixed(4)}
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              ?¼ìª½ ì§€?„ì—??êµì°¨ë¡œë? ?´ë¦­?˜ì„¸??
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. ì°¨ì¢… ë¶„í¬ ì°¨íŠ¸ (?°ì´?°ê? ?ˆì„ ?Œë§Œ ?œì‹œ) */}
      {selectedId && (
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 text-base">ì°¨ì¢… ë¶„í¬</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleTypeChart trafficData={filteredTrafficData} />
          </CardContent>
        </Card>
      )}

      {/* 3. GEH ë¶„ì„ ì°¨íŠ¸ (?°ì´?°ê? ?ˆì„ ?Œë§Œ ?œì‹œ) */}
      {selectedId && (
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 text-base">GEH ë¶„ì„</CardTitle>
          </CardHeader>
          <CardContent>
            <GEHAnalysis trafficData={filteredTrafficData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
