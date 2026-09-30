import { LaneStats, VehicleType } from '../types/traffic';

export function exportTrafficCSV(lanes: LaneStats[], activeRule: string): void {
  const now = new Date().toISOString();
  const headers = [
    'Timestamp',
    'Lane ID',
    'Lane Name',
    'Signal State',
    'Allocated Green (s)',
    'Queue Length (veh)',
    'Total PCU Demand',
    'Avg Wait (s)',
    'Car',
    'Bus',
    'Van',
    'Auto',
    'Lorry',
    'Motorcycle',
    'Ambulance',
    'VIP',
    'Active Rule'
  ];

  const rows = lanes.map((lane) => {
    const c = lane.vehicleCounts;
    return [
      `"${now}"`,
      `"${lane.id}"`,
      `"${lane.name}"`,
      `"${lane.signal}"`,
      lane.allocatedGreen,
      lane.queueLength,
      lane.totalPCU.toFixed(1),
      lane.avgWaitSeconds.toFixed(1),
      c.car || 0,
      c.bus || 0,
      c.van || 0,
      c.auto || 0,
      c.lorry || 0,
      c.motorcycle || 0,
      c.ambulance || 0,
      c.vip || 0,
      `"${activeRule}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `signal_vision_traffic_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
