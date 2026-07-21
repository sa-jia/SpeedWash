export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径，单位是公里
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 距离，单位是公里
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// export function formatDistance(distance) {
//   if (distance === null) return "计算中...";
//   if (distance < 1) {
//     return `${(distance * 1000).toFixed(0)} 米`;
//   } else if (distance < 10) {
//     return `${distance.toFixed(2)} 公里`;
//   } else {
//     return `${distance.toFixed(1)} 公里`;
//   }
// }
