// club-icons.js

export const SPORT_ICONS = {
  "Bóng đá": L.icon({
    iconUrl: "/customer/img/icons/football.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  }),
  "Cầu lông": L.icon({
    iconUrl: "/customer/img/icons/badminton.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  }),
  "Bóng rổ": L.icon({
    iconUrl: "/customer/img/icons/basketball.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  }),
    "Pickleball": L.icon({
    iconUrl: "/customer/img/icons/pickleball.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  }),
     "Tennis": L.icon({
    iconUrl: "/customer/img/icons/tennis.jpg",
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  }),
  "DEFAULT": L.icon({
    iconUrl: "/icons/multi.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  })
};

// Hàm chọn icon cho 1 club
export function getClubIcon(club) {
  if (!club.sportTypes || club.sportTypes.length === 0) {
    return SPORT_ICONS.DEFAULT;
  }

  // Ưu tiên môn đầu tiên
  const mainSport = club.sportTypes[0].sport_name;
  return SPORT_ICONS[mainSport] || SPORT_ICONS.DEFAULT;
}
