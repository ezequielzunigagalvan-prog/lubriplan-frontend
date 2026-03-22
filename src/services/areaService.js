// src/services/areaService.js

let areas = [
  { id: 1, name: "Producción" },
  { id: 2, name: "Empaque" },
  { id: 3, name: "Mantenimiento" },
];

export function getAreas() {
  return areas;
}

export function addArea(name) {
  const newArea = {
    id: Date.now(),
    name,
  };

  areas = [...areas, newArea];
  return newArea;
}