# DT Dashboard — 교통 디지털트윈 대시보드

교통 시뮬레이션 데이터를 시각화하고, Unity 디지털트윈 환경과 연동하는 웹 기반 대시보드입니다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [로컬 실행 방법](#3-로컬-실행-방법)
4. [페이지 구성](#4-페이지-구성)
   - [공통 기능](#41-공통-기능)
   - [시뮬레이션 비교](#42-시뮬레이션-비교)
   - [경로 분석](#43-경로-분석)
   - [교차로 성능 평가](#44-교차로-성능-평가)
   - [유니티 연동 페이지 (HUD)](#45-유니티-연동-페이지-hud)
5. [Unity 연동 설정](#5-unity-연동-설정)
   - [Unity Web Browser 설치](#51-unity-web-browser-설치)
   - [Unity Web Browser 셋팅](#52-unity-web-browser-셋팅)
   - [연동 카메라 셋팅](#53-연동-카메라-셋팅)
6. [배포](#6-배포)

---

## 1. 프로젝트 개요

본 대시보드는 연구 지역의 **전체 및 교차로별 교통 데이터**를 시인성 있게 표현하기 위해 제작되었습니다.

- 현재 대부분의 데이터는 **더미 데이터**로 구성되어 있으며, 실데이터 확보 시 교체 작업이 필요합니다.
- 실측 도착 차량 수 데이터는 **하루치**만 존재합니다.
- 대기행렬, 지체시간 등 일부 항목은 더미 데이터입니다.

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React, Vite, Tailwind CSS |
| 백엔드 | Node.js, Express |
| 데이터베이스 | MongoDB Atlas |
| 배포 (프론트) | Vercel |
| 배포 (백엔드) | Render |
| 지도 | Leaflet, React-Leaflet, OpenStreetMap |

---

## 3. 로컬 실행 방법

### 사전 요구사항

- Node.js 설치
- MongoDB Atlas 접속 가능 환경

### 백엔드 실행

```bash
cd DT_Dashboard_back
npm install
node server.js
# → http://localhost:3001
```

### 프론트엔드 실행

```bash
cd DT_Dashboard_front
npm install
npm run dev
# → http://localhost:5173
```

---

## 4. 페이지 구성

### 4.1. 공통 기능

모든 페이지에서 공통적으로 사용 가능한 기능입니다.

| 기능 | 설명 |
|------|------|
| **연구범위** | 지도에 사각형으로 표시되는 연구 영역. NW(좌측 상단), SE(우측 하단)의 위·경도 값 |
| **날짜** | 특정 날짜의 데이터 필터링 (현재는 1일치 데이터만 존재) |
| **시간대** | 07:00~08:00, 15분 간격으로 설정 가능 |
| **언어** | 한국어 / 영어 전환 |
| **테마** | Dark / Light 테마 전환 |

> 웹사이트 주소: [https://dt-dashboard-front.vercel.app/routeplanning](https://dt-dashboard-front.vercel.app/routeplanning)
>
> ※ 장시간 미접속 후 첫 접속 시 데이터 로드에 약 30~40초 소요됩니다.

---

### 4.2. 시뮬레이션 비교

Visum, Vissim 등 교통 시뮬레이션의 시나리오 **적용 전·후(Before/After)** 데이터를 연구 범위 전체 단위로 비교합니다.

| 지표 | 설명 |
|------|------|
| **VHT** (Vehicle Hours Traveled) | 분석 영역 내 모든 차량의 통행 시간 합산. 교통 체증이 심할수록 증가 |
| **VKT** (Vehicle Kilometers Traveled) | 모든 차량의 총 주행 거리 합산. 전체 교통 부하량을 나타냄 |
| **도착 차량 수** | 분석 시간 내 목적지에 도착하거나 특정 단면을 통과한 총 차량 수 |
| **평균 차량 통행시간** | 차량 한 대가 분석 구간을 통과하는 데 걸린 평균 시간 |
| **평균 차량 속도** | 네트워크 내 주행 중인 차량들의 평균 속도 |
| **평균 차량 지체시간** | 혼잡·신호 대기 등으로 발생한 대기 시간의 평균값 |

---

### 4.3. 경로 분석

두 교차로를 선택하여 시나리오별 도착 차량 수, 평균 통행 시간, 속도 등을 비교합니다.

- **경로 선택 맵**: 교차로 마커 클릭 시 해당 위경도를 출발지/목적지로 설정
- 출발지·목적지 선택 완료 시 **최적 경로가 지도에 굵은 선**으로 표시됨
- OpenStreetMap(OSM) 기반으로 구현
- **시나리오 비교**: 두 지점 간 총 거리, 도착 차량 수, 평균 통행시간, 속도를 Before/After로 표기

---

### 4.4. 교차로 성능 평가

연구 영역 내 교차로를 선택하여 **교차로별 시나리오 적용 전·후** 데이터를 확인합니다.

| 항목 | 설명 |
|------|------|
| **연구영역 지도** | 교차로 위치 마커 표시. 마커 클릭 시 해당 교차로 데이터 표시 |
| **잠금 기능** | 지도의 마우스 휠 확대/축소 활성화·비활성화 |
| **연구영역 정보** | 총 교차로 수, 선택된 교차로 ID 등 표시 |
| **방향별 교통 데이터** | 선택 교차로의 방향별 도착 차량 수, 대기행렬, 지체시간 |
| **교차로별 교통 데이터** | 도착 차량 수, 평균 지체시간, 서비스 수준(LOS) |

> LOS(Level of Service)는 평균 차량 지체시간을 기준으로 등급이 결정됩니다.

---

### 4.5. 유니티 연동 페이지 (HUD)

> 접속 주소: [https://dt-dashboard-front.vercel.app/hud](https://dt-dashboard-front.vercel.app/hud)

Unity 디지털트윈 환경과 연동하기 위해 별도로 제작된 페이지입니다. Unity 게임 뷰에 **오버레이 형식**으로 표시됩니다.

| 구성 요소 | 설명 |
|-----------|------|
| **연구영역 지도** | 교차로 마커 표시. 클릭 시 우측 패널에 해당 교차로 데이터 표시 |
| **유니티 화면 공간** | 중앙의 빈 공간 — Unity 디지털트윈 화면과 동시에 표시되는 영역 |
| **데이터 패널 (우측)** | 교차로 정보(ID, 위·경도), 차량 분포(Car/Bus/Truck), 방향별 교통량 |

---

## 5. Unity 연동 설정

### 5.1. Unity Web Browser 설치

Unity와 대시보드를 연동하려면 **Unity Web Browser (UWB)** 를 설치해야 합니다.

**① VoltUPR 레지스트리 등록**

`Edit > Project Settings > Package Manager` 에서 아래 값을 입력합니다.

| 항목 | 값 |
|------|----|
| Name | `VoltUPR` |
| URL | `https://upr.voltstro.dev` |
| Scope(s) | `dev.voltstro` / `org.nuget` / `com.cysharp.unitask` |

**② UWB 패키지 설치**

`Window > Package Management > Package Manager` 에서 **My Registries** 탭을 선택 후 아래 패키지를 설치합니다.

- `Unity Web Browser`
- `Unity Web Browser CEF Engine`
- `Unity Web Browser CEF Engine (Win x64)`

---

### 5.2. Unity Web Browser 셋팅

**① Canvas 생성**

오브젝트창 우클릭 → `UI > Canvas` 로 빈 Canvas 오브젝트 생성

**② Raw Image 생성 및 컴포넌트 추가**

1. Canvas 하위에 `UI > Raw Image` 오브젝트 생성
2. `Add Component` → `Web Browser Full` 컴포넌트 추가
3. Raw Image 이름을 `HUDView` 로 변경

**③ 설정값 변경**

- `Rect Transform`: 전체 화면을 덮도록 설정
- `Web Browser Full`: 파일 할당 및 URL 설정

---

### 5.3. 연동 카메라 셋팅

**① Camera Mover 오브젝트 생성**

1. 빈 오브젝트 생성 → 이름을 `HUD 연동 카메라` 로 변경
2. `Add Component` → `CameraMover` 스크립트 추가
3. `Map Browser UI` 에 `HUDView` 할당
4. `Main Camera` 에 Main Camera 오브젝트 할당

**② 교차로별 카메라 배치**

1. `HUD 연동 카메라` 의 자식으로 교차로 수만큼 Camera 오브젝트 생성
2. 각 카메라 이름을 `Intersection_1`, `Intersection_2` 등으로 변경
3. 각 카메라를 해당 교차로의 원하는 구도에 배치
4. `CameraMover` 컴포넌트의 `Intersection Targets` 리스트에 카메라 할당
   - `Element 0` → 교차로 ID 1에 해당하는 카메라 (인덱스 = ID - 1)

> 모든 설정 완료 후 Unity 상단의 **재생 버튼**을 클릭하면 대시보드가 게임 뷰에 오버레이로 표시됩니다.

---

## 6. 배포

| 구분 | 플랫폼 | 주소 |
|------|--------|------|
| 프론트엔드 | Vercel | [https://dt-dashboard-front.vercel.app](https://dt-dashboard-front.vercel.app) |
| 백엔드 | Render | — |
| 데이터베이스 | MongoDB Atlas | Traffic_DB |

---

## 레포지토리

- 프론트엔드: [https://github.com/ckalstn0522/DT_Dashboard_front](https://github.com/ckalstn0522/DT_Dashboard_front)
- 백엔드: [https://github.com/ckalstn0522/DT_Dashboard_back](https://github.com/ckalstn0522/DT_Dashboard_back)
