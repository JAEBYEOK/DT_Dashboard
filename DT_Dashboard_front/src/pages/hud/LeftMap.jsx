import React from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import IntersectionMap from "../../components/dashboard/IntersectionMap"; 

const API_URL = 'https://df-dashboard-back.onrender.com/api';

export default function LeftMap() {
  const { data: intersections, isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const handleMarkerClick = (intersection) => {
    // [?µì‹¬] UnityWebBrowser ?µì‹ ???„í•œ Title Hack
    // 1. ?œëª©??"CLICKED:êµì°¨ë¡œID"ë¡?ë³€ê²?
    const message = `CLICKED:${intersection.intersection_id}`;
    document.title = message;
    console.log("Signal sent to Unity:", message);

    // 2. (ì¤‘ìš”) ? ì‹œ ???œëª©???ìƒë³µêµ¬ (ê·¸ëž˜??ê°™ì? ê±????´ë¦­?ˆì„ ??ê°ì???
    setTimeout(() => {
      document.title = "LeftHUD"; 
    }, 200);
  };

  return (
    <div className="w-full h-screen bg-transparent">
      {isLoading ? (
        <Skeleton className="w-full h-full" />
      ) : (
        <Card className="w-full h-full bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="h-screen">
              <IntersectionMap
                intersections={intersections}
                onSelectIntersection={handleMarkerClick}
                selectedIntersectionId={null}
                
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
