// Stops data for all routes
export const stopsData: Record<string, Array<{ sequence_number: number; name: string; pickup_time: string; latitude?: number; longitude?: number }>> = {
  "KALEWADI": [
    { sequence_number: 1, name: "Kalewadi Phata", pickup_time: "9:00 AM", latitude: 18.5910, longitude: 73.7610 },
    { sequence_number: 2, name: "Rahatani Phata", pickup_time: "9:03 AM", latitude: 18.5920, longitude: 73.7620 },
    { sequence_number: 3, name: "Kalewadi D-Mart", pickup_time: "9:07 AM", latitude: 18.5930, longitude: 73.7630 },
    { sequence_number: 4, name: "Pimpri (Location)", pickup_time: "9:10 AM", latitude: 18.5940, longitude: 73.7640 },
    { sequence_number: 5, name: "Chinchwad Gaon", pickup_time: "9:17 AM", latitude: 18.5950, longitude: 73.7650 },
    { sequence_number: 6, name: "Wakdekar Wadi", pickup_time: "9:23 AM", latitude: 18.5960, longitude: 73.7660 },
    { sequence_number: 7, name: "Ravet Bridge", pickup_time: "9:28 AM", latitude: 18.5970, longitude: 73.7670 },
    { sequence_number: 8, name: "Punaewale", pickup_time: "9:30 AM", latitude: 18.5980, longitude: 73.7680 },
    { sequence_number: 9, name: "JSPM Chowk", pickup_time: "9:40 AM", latitude: 18.5990, longitude: 73.7690 },
    { sequence_number: 10, name: "SBUP Campus", pickup_time: "9:45 AM", latitude: 18.6100, longitude: 73.7500 }
  ],
  "AUNDH": [
    { sequence_number: 1, name: "Aundh Gaon", pickup_time: "9:10 AM", latitude: 18.5610, longitude: 73.8010 },
    { sequence_number: 2, name: "Sangavi Phata", pickup_time: "9:15 AM", latitude: 18.5620, longitude: 73.8020 },
    { sequence_number: 3, name: "Wakad Phata", pickup_time: "9:20 AM", latitude: 18.5630, longitude: 73.8030 },
    { sequence_number: 4, name: "Vishal Nagar", pickup_time: "9:25 AM", latitude: 18.5640, longitude: 73.8040 },
    { sequence_number: 5, name: "Datt Mandir Road", pickup_time: "9:30 AM", latitude: 18.5650, longitude: 73.8050 },
    { sequence_number: 6, name: "Dange Chowk", pickup_time: "9:35 AM", latitude: 18.5660, longitude: 73.8060 },
    { sequence_number: 7, name: "Tathawade Chowk", pickup_time: "9:40 AM", latitude: 18.5670, longitude: 73.8070 },
    { sequence_number: 8, name: "SBUP Campus", pickup_time: "9:45 AM", latitude: 18.6100, longitude: 73.7500 }
  ],
  "TALEGAON": [
    { sequence_number: 1, name: "Talegaon", pickup_time: "9:00 AM", latitude: 18.7310, longitude: 73.6710 },
    { sequence_number: 2, name: "Somatane Phata", pickup_time: "9:15 AM", latitude: 18.7320, longitude: 73.6720 },
    { sequence_number: 3, name: "Dehu Road Chowk", pickup_time: "9:25 AM", latitude: 18.7330, longitude: 73.6730 },
    { sequence_number: 4, name: "Vikas Nagar", pickup_time: "9:30 AM", latitude: 18.7340, longitude: 73.6740 },
    { sequence_number: 5, name: "Zudio Punaewale", pickup_time: "9:40 AM", latitude: 18.7350, longitude: 73.6750 },
    { sequence_number: 6, name: "SBUP Campus", pickup_time: "9:45 AM", latitude: 18.6100, longitude: 73.7500 }
  ],
  "KATRAJ CHOWK": [
    { sequence_number: 1, name: "Katraj Chowk", pickup_time: "9:00 AM", latitude: 18.4510, longitude: 73.8510 },
    { sequence_number: 2, name: "Ambegaon D-Mart", pickup_time: "9:03 AM", latitude: 18.4520, longitude: 73.8520 },
    { sequence_number: 3, name: "Navale Bridge", pickup_time: "9:08 AM", latitude: 18.4530, longitude: 73.8530 },
    { sequence_number: 4, name: "Warje Bridge", pickup_time: "9:14 AM", latitude: 18.4540, longitude: 73.8540 },
    { sequence_number: 5, name: "Chandani Chowk", pickup_time: "9:20 AM", latitude: 18.4550, longitude: 73.8550 },
    { sequence_number: 6, name: "Crystal Honda Bavdhan", pickup_time: "9:23 AM", latitude: 18.4560, longitude: 73.8560 },
    { sequence_number: 7, name: "Pashan Sun Bridge", pickup_time: "9:28 AM", latitude: 18.4570, longitude: 73.8570 },
    { sequence_number: 8, name: "Radha Chowk", pickup_time: "9:33 AM", latitude: 18.4580, longitude: 73.8580 },
    { sequence_number: 9, name: "Wakad Chowk", pickup_time: "9:38 AM", latitude: 18.4590, longitude: 73.8590 },
    { sequence_number: 10, name: "SBUP Campus", pickup_time: "9:45 AM", latitude: 18.6100, longitude: 73.7500 }
  ],
  "HINJAWADI": [
    { sequence_number: 1, name: "Hinjawadi PH-3", pickup_time: "9:00 AM", latitude: 18.5810, longitude: 73.7410 },
    { sequence_number: 2, name: "Maan Gaon", pickup_time: "9:05 AM", latitude: 18.5820, longitude: 73.7420 },
    { sequence_number: 3, name: "Hinjawadi PH-1 Circle", pickup_time: "9:10 AM", latitude: 18.5830, longitude: 73.7430 },
    { sequence_number: 4, name: "Padmabhushan Chowk", pickup_time: "9:15 AM", latitude: 18.5840, longitude: 73.7440 },
    { sequence_number: 5, name: "Laxmi Chowk", pickup_time: "9:20 AM", latitude: 18.5850, longitude: 73.7450 },
    { sequence_number: 6, name: "Hinjawadi Chowk", pickup_time: "9:25 AM", latitude: 18.5860, longitude: 73.7460 },
    { sequence_number: 7, name: "Hinjawadi Gaothan", pickup_time: "9:30 AM", latitude: 18.5870, longitude: 73.7470 },
    { sequence_number: 8, name: "Vinode Wasti Chowk", pickup_time: "9:35 AM", latitude: 18.5880, longitude: 73.7480 },
    { sequence_number: 9, name: "SBUP Campus", pickup_time: "9:45 AM", latitude: 18.6100, longitude: 73.7500 }
  ]
};

// Shift-specific timing adjustments
export const shiftTimings: Record<number, Record<string, string>> = {
  // Shift 1 (8:00 AM) - Already covered in the main stopsData
  1: {},
  
  // Shift 2 (10:00 AM) - Same stops but different timing
  2: {},
  
  // Shift 3 (12:15 PM) - Different timing for afternoon
  3: {
    "KATRAJ CHOWK": "11:10 AM",
    "HINJAWADI": "11:10 AM",
    "TALEGAON": "11:10 AM",
    "KALEWADI": "11:10 AM",
    "AUNDH": "11:20 AM",
    "SBUP Campus": "11:55 AM"
  }
}; 