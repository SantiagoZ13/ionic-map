import { useEffect, useRef } from "react";
import L, { bounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Geolocation } from "@capacitor/geolocation";

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const pointsRef = useRef<L.LatLng[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
        });

        const { latitude, longitude } = position.coords;
        const startPoint = L.latLng(latitude, longitude);

        const map = L.map("map", {
          maxBoundsViscosity: 1.0,
          minZoom: 3,
        }).setView(startPoint, 10);
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          noWrap: true,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        pointsRef.current.push(startPoint);
        L.marker(startPoint).addTo(map);

        polylineRef.current = L.polyline(pointsRef.current, {
          color: "blue",
          weight: 4,
        }).addTo(map);

        setTimeout(() => map.invalidateSize(), 200);

        intervalRef.current = setInterval(async () => {
          if (pointsRef.current.length >= 15) {
            console.log("15 puntos maximos.");
            clearInterval(intervalRef.current!);
            return;
          }

          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
          });

          const newPoint = L.latLng(pos.coords.latitude, pos.coords.longitude);
          pointsRef.current.push(newPoint);

          L.marker(newPoint).addTo(map);
          polylineRef.current!.setLatLngs(pointsRef.current);

          map.panTo(newPoint);

          console.log(`Punto ${pointsRef.current.length} agregado:`, newPoint);
        }, 5 * 60 * 1000); // 5 minutos
      } catch (error) {
        console.error("Error al obtener la ubicación:", error);
      }
    };

    initMap();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  return (
    <div
      id="map"
      style={{
        height: "100vh",
        width: "100%",
      }}
    ></div>
  );
}
