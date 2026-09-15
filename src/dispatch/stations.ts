import { ResponseStation, StationType } from '../types';

export const RESPONSE_STATIONS: ResponseStation[] = [
  {
    id: 'fire-shivajinagar',
    name: 'Shivajinagar Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5308, lng: 73.8472 },
  },
  {
    id: 'fire-kothrud',
    name: 'Kothrud Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5074, lng: 73.8077 },
  },
  {
    id: 'fire-hadapsar',
    name: 'Hadapsar Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5089, lng: 73.9260 },
  },
  {
    id: 'fire-wakad',
    name: 'Wakad Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5975, lng: 73.7635 },
  },
  {
    id: 'fire-vishrantwadi',
    name: 'Vishrantwadi Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5687, lng: 73.8786 },
  },
  {
    id: 'fire-katraj',
    name: 'Katraj Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.4529, lng: 73.8652 },
  },
  {
    id: 'fire-baner',
    name: 'Baner Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5590, lng: 73.7868 },
  },
  {
    id: 'fire-pimpri',
    name: 'Pimpri Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.6298, lng: 73.7997 },
  },
  {
    id: 'fire-kharadi',
    name: 'Kharadi Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5510, lng: 73.9476 },
  },
  {
    id: 'fire-warje',
    name: 'Warje Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.4847, lng: 73.8028 },
  },
  {
    id: 'fire-aundh',
    name: 'Aundh Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5590, lng: 73.8070 },
  },
  {
    id: 'fire-deccan',
    name: 'Deccan Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5174, lng: 73.8400 },
  },
  {
    id: 'fire-camp',
    name: 'Camp Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5090, lng: 73.8890 },
  },
  {
    id: 'fire-swargate',
    name: 'Swargate Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5018, lng: 73.8635 },
  },
  {
    id: 'fire-yerawada',
    name: 'Yerawada Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5530, lng: 73.8790 },
  },
  {
    id: 'fire-magarpatta',
    name: 'Magarpatta Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5145, lng: 73.9270 },
  },
  {
    id: 'fire-pashan',
    name: 'Pashan Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.5400, lng: 73.7925 },
  },
  {
    id: 'fire-sinhagad',
    name: 'Sinhagad Road Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.4630, lng: 73.8230 },
  },
  {
    id: 'fire-chinchwad',
    name: 'Chinchwad Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.6270, lng: 73.7810 },
  },
  {
    id: 'fire-bhosari',
    name: 'Bhosari Fire Brigade',
    type: 'fire',
    coordinates: { lat: 18.6290, lng: 73.8470 },
  },
  {
    id: 'police-shivajinagar',
    name: 'Shivajinagar Police Station',
    type: 'police',
    coordinates: { lat: 18.5301, lng: 73.8478 },
  },
  {
    id: 'police-koregaon',
    name: 'Koregaon Park Police Station',
    type: 'police',
    coordinates: { lat: 18.5362, lng: 73.8938 },
  },
  {
    id: 'police-hadapsar',
    name: 'Hadapsar Police Station',
    type: 'police',
    coordinates: { lat: 18.5084, lng: 73.9260 },
  },
  {
    id: 'police-kondhwa',
    name: 'Kondhwa Police Station',
    type: 'police',
    coordinates: { lat: 18.4676, lng: 73.8918 },
  },
  {
    id: 'police-wakad',
    name: 'Wakad Police Station',
    type: 'police',
    coordinates: { lat: 18.5970, lng: 73.7638 },
  },
  {
    id: 'police-vishrantwadi',
    name: 'Vishrantwadi Police Station',
    type: 'police',
    coordinates: { lat: 18.5685, lng: 73.8782 },
  },
  {
    id: 'police-katraj',
    name: 'Katraj Police Station',
    type: 'police',
    coordinates: { lat: 18.4524, lng: 73.8656 },
  },
  {
    id: 'police-baner',
    name: 'Baner Police Station',
    type: 'police',
    coordinates: { lat: 18.5594, lng: 73.7862 },
  },
  {
    id: 'police-pimpri',
    name: 'Pimpri Police Station',
    type: 'police',
    coordinates: { lat: 18.6293, lng: 73.7993 },
  },
  {
    id: 'police-kharadi',
    name: 'Kharadi Police Station',
    type: 'police',
    coordinates: { lat: 18.5515, lng: 73.9471 },
  },
  {
    id: 'police-aundh',
    name: 'Aundh Police Station',
    type: 'police',
    coordinates: { lat: 18.5595, lng: 73.8075 },
  },
  {
    id: 'police-deccan',
    name: 'Deccan Police Station',
    type: 'police',
    coordinates: { lat: 18.5170, lng: 73.8405 },
  },
  {
    id: 'police-camp',
    name: 'Camp Police Station',
    type: 'police',
    coordinates: { lat: 18.5095, lng: 73.8895 },
  },
  {
    id: 'police-swargate',
    name: 'Swargate Police Station',
    type: 'police',
    coordinates: { lat: 18.5022, lng: 73.8640 },
  },
  {
    id: 'police-yerawada',
    name: 'Yerawada Police Station',
    type: 'police',
    coordinates: { lat: 18.5535, lng: 73.8795 },
  },
  {
    id: 'police-magarpatta',
    name: 'Magarpatta Police Station',
    type: 'police',
    coordinates: { lat: 18.5150, lng: 73.9275 },
  },
  {
    id: 'police-pashan',
    name: 'Pashan Police Station',
    type: 'police',
    coordinates: { lat: 18.5405, lng: 73.7930 },
  },
  {
    id: 'police-sinhagad',
    name: 'Sinhagad Road Police Station',
    type: 'police',
    coordinates: { lat: 18.4635, lng: 73.8235 },
  },
  {
    id: 'police-chinchwad',
    name: 'Chinchwad Police Station',
    type: 'police',
    coordinates: { lat: 18.6275, lng: 73.7815 },
  },
  {
    id: 'police-bhosari',
    name: 'Bhosari Police Station',
    type: 'police',
    coordinates: { lat: 18.6295, lng: 73.8475 },
  },
];

export const HOSPITAL_LOCATIONS = [
  {
    id: 'hospital-sassoon',
    name: 'Sassoon General Hospital',
    coordinates: { lat: 18.5236, lng: 73.8545 },
  },
  {
    id: 'hospital-ruby',
    name: 'Ruby Hall Clinic',
    coordinates: { lat: 18.5362, lng: 73.8958 },
  },
  {
    id: 'hospital-deenanath',
    name: 'Deenanath Mangeshkar Hospital',
    coordinates: { lat: 18.4902, lng: 73.8077 },
  },
  {
    id: 'hospital-noble',
    name: 'Noble Hospital',
    coordinates: { lat: 18.5018, lng: 73.9260 },
  },
] as const;

export function stationTypeForAsset(assetType: 'drone' | 'rover'): StationType {
  return assetType === 'drone' ? 'fire' : 'police';
}

export function distanceBetween(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const latitudeDelta = from.lat - to.lat;
  const longitudeDelta = from.lng - to.lng;
  return Math.sqrt(latitudeDelta * latitudeDelta + longitudeDelta * longitudeDelta);
}

export function nearestStation(
  target: { lat: number; lng: number },
  type: StationType
): ResponseStation {
  return RESPONSE_STATIONS
    .filter((station) => station.type === type)
    .sort((a, b) => distanceBetween(a.coordinates, target) - distanceBetween(b.coordinates, target))[0];
}
