"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
      Cargando mapa...
    </div>
  ),
});

interface Station {
  name: string;
  lat: number;
  lng: number;
}

interface GraphEdge {
  from: string;
  to: string;
  cost: number;
}

export default function Page() {
  const [stations, setStations] = useState<Station[]>([]);
  const [route, setRoute] = useState<Station[]>([]);
  const [routeCost, setRouteCost] = useState<number | null>(null);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [showGraph, setShowGraph] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getCoordinates = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const baseLat = -10.0464;
    const baseLng = -73.0228;

    const latOffset = (pseudoRandom(hash) - 0.5) * 0.15;
    const lngOffset = (pseudoRandom(hash + 1) - 0.5) * 0.15;

    return {
      lat: baseLat + latOffset,
      lng: baseLng + lngOffset
    };
  };

  const fetchStats = async () => {
    // Endpoint no implementadooo
    // try {
    //   const res = await fetch("/api/statistics");
    //   if (res.ok) {
    //     const data = await res.json();
    //     setStats(data.statistics);
    //   }
    // } catch (error) {
    //   console.error(error);
    // }
  };

  const loadStations = async () => {
    setLoading(true);
    try {
      // Endpoint /api/init-data no existe, se omite
      // await fetch("/api/init-data", { method: "POST" });
      await fetchStats();

      const res = await fetch("/api/stations");
      if (res.ok) {
        const data = await res.json();
        const stationNames: string[] = data.stations || [];

        // Cargar TODAS las estaciones, no solo 100
        const mappedStations = stationNames.map(name => ({
          name,
          ...getCoordinates(name)
        }));

        setStations(mappedStations);

        // Obtener aristas del grafo
        const edgesRes = await fetch("/api/edges");
        if (edgesRes.ok) {
          const edgesData = await edgesRes.json();
          const allEdges: GraphEdge[] = edgesData.edges || [];
          
          // Filtrar solo las aristas que conectan estaciones visibles
          const visibleStationNames = new Set(mappedStations.map(s => s.name));
          const visibleEdges = allEdges.filter(edge => 
            visibleStationNames.has(edge.from) && visibleStationNames.has(edge.to)
          );
          
          // Eliminar duplicados (ya que las aristas son bidireccionales)
          const edgesMap: Record<string, GraphEdge> = {};
          visibleEdges.forEach(edge => {
            const key = [edge.from, edge.to].sort().join('|');
            if (!edgesMap[key]) {
              edgesMap[key] = edge;
            }
          });
          
          setGraphEdges(Object.values(edgesMap));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async (start: string, end: string) => {
    if (!start || !end || start === end) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/route/dijkstra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start,
          end
        })
      });

      if (!res.ok) {
        if (res.status === 404) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Error 404:", errorData);
          alert(`Error: No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo en http://127.0.0.1:5000\n\nDetalles: ${errorData.message || 'Endpoint no encontrado'}`);
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        console.error("Error del servidor:", errorData);
        alert(`Error: ${errorData.message || 'Error al calcular la ruta'}`);
        return;
      }

      const data = await res.json();
      const pathNames: string[] = data.path || [];
      const cost: number = data.cost || 0;

      if (pathNames.length === 0) {
        alert("No se encontró una ruta entre las estaciones seleccionadas.");
        setRoute([]);
        setRouteCost(null);
        return;
      }

      const routeStations = pathNames.map(name => {
        const coords = getCoordinates(name);
        return { name, ...coords };
      });

      setRoute(routeStations);
      setRouteCost(cost);
    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de conexión. Verifica que el backend esté corriendo en http://127.0.0.1:5000");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      <Sidebar
        stations={stations}
        onLoadStations={loadStations}
        onCalculateRoute={calculateRoute}
        route={route}
        routeCost={routeCost}
        loading={loading}
      />

      <main className="flex-1 relative h-full">
        <Map 
          stations={stations || []} 
          route={route || undefined} 
          graphEdges={showGraph ? (graphEdges || []) : []}
        />
        
        {stations.length > 0 && (
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg z-[1000] flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGraph}
                onChange={(e) => setShowGraph(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Mostrar grafo completo
              </span>
            </label>
            {showGraph && (
              <span className="text-xs text-muted-foreground">
                ({graphEdges.length} conexiones)
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000] flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Procesando...</span>
          </div>
        )}
      </main>
    </div>
  );
}
