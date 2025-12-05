"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Fuel } from "lucide-react";

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

interface MapProps {
    stations?: Station[];
    route?: Station[];
    graphEdges?: GraphEdge[];
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

// Componente para líneas animadas del grafo con efecto de flujo
function AnimatedPolyline({ positions, edgeIndex }: { positions: [number, number][]; edgeIndex: number }) {
    const polylineRef = useRef<any>(null);
    const glowRef = useRef<any>(null);

    useEffect(() => {
        if (polylineRef.current && glowRef.current) {
            const element = polylineRef.current.getElement();
            const glowElement = glowRef.current.getElement();
            
            if (element && glowElement) {
                const path = element.querySelector('path') as SVGPathElement;
                const glowPath = glowElement.querySelector('path') as SVGPathElement;
                
                if (path && glowPath) {
                    // Línea base con animación de flujo verde fosforescente
                    path.style.strokeDasharray = '25 8';
                    path.style.strokeDashoffset = '0';
                    const duration = 1.2 + (edgeIndex % 5) * 0.2;
                    path.style.animation = `flow ${duration}s linear infinite`;
                    path.style.animationDelay = `${(edgeIndex % 8) * 0.12}s`;
                    path.style.filter = 'drop-shadow(0 0 4px rgba(0, 255, 0, 0.9)) drop-shadow(0 0 8px rgba(57, 255, 20, 0.7))';
                    
                    // Línea de brillo que fluye más rápido (efecto de pulso)
                    glowPath.style.strokeDasharray = '12 6';
                    glowPath.style.strokeDashoffset = '0';
                    glowPath.style.animation = `flow ${duration * 0.5}s linear infinite`;
                    glowPath.style.animationDelay = `${(edgeIndex % 8) * 0.12}s`;
                    glowPath.style.filter = 'drop-shadow(0 0 6px rgba(0, 255, 0, 1)) drop-shadow(0 0 12px rgba(57, 255, 20, 0.9)) drop-shadow(0 0 18px rgba(127, 255, 0, 0.6))';
                }
            }
        }
    }, [edgeIndex]);

    return (
        <>
            {/* Línea base verde fosforescente */}
            <Polyline
                ref={polylineRef}
                positions={positions}
                pathOptions={{
                    color: '#39ff14',
                    weight: 4,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />
            {/* Línea de brillo verde más intensa que fluye más rápido */}
            <Polyline
                ref={glowRef}
                positions={positions}
                pathOptions={{
                    color: '#00ff00',
                    weight: 2.5,
                    opacity: 1,
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />
        </>
    );
}

const createStationIcon = () => {
    const html = renderToStaticMarkup(
        <div className="relative flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg border-2 border-blue-600 hover:scale-110 transition-transform duration-200">
            <Fuel className="w-4 h-4 text-blue-600" />
            <div className="absolute -bottom-1 w-2 h-2 bg-blue-600 rotate-45"></div>
        </div>
    );
    return L.divIcon({
        className: "bg-transparent",
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36],
    });
};

const createRouteIcon = (index: number, total: number) => {
    const isStart = index === 0;
    const isEnd = index === total - 1;
    const color = isStart ? "text-green-600 border-green-600" : isEnd ? "text-red-600 border-red-600" : "text-indigo-600 border-indigo-600";
    const bgColor = isStart ? "bg-green-600" : isEnd ? "bg-red-600" : "bg-indigo-600";

    const html = renderToStaticMarkup(
        <div className={`relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-xl border-2 ${color.split(' ')[1]} hover:scale-110 transition-transform duration-200`}>
            <span className={`font-bold text-sm ${color.split(' ')[0]}`}>{index + 1}</span>
            <div className={`absolute -bottom-1 w-2 h-2 ${bgColor} rotate-45`}></div>
        </div>
    );
    return L.divIcon({
        className: "bg-transparent",
        html: html,
        iconSize: [40, 40],
        iconAnchor: [20, 44],
        popupAnchor: [0, -44],
    });
};

export default function Map(props: MapProps = {}) {
    const { stations = [], route, graphEdges = [] } = props || {};
    const [center, setCenter] = useState<[number, number]>([-12.0464, -77.0428]);
    const [zoom, setZoom] = useState(12);

    // Crear mapa de estaciones por nombre para búsqueda rápida
    const stationMapData: Record<string, Station> = {};
    if (stations && Array.isArray(stations)) {
        stations.forEach(station => {
            stationMapData[station.name] = station;
        });
    }

    useEffect(() => {
        if (stations && Array.isArray(stations) && stations.length > 0) {
            setCenter([stations[0].lat, stations[0].lng]);
        }
    }, [stations]);

    return (
        <div className="w-full h-full relative bg-zinc-100 dark:bg-zinc-900">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                zoomControl={false}
                className="z-0"
            >
                <ChangeView center={center} zoom={zoom} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Renderizar aristas del grafo completo con animación de flujo */}
                {graphEdges && graphEdges.length > 0 && graphEdges.map((edge, idx) => {
                    const fromStation = stationMapData[edge.from];
                    const toStation = stationMapData[edge.to];
                    
                    if (!fromStation || !toStation) {
                        return null;
                    }
                    
                    return (
                        <AnimatedPolyline
                            key={`graph-edge-${idx}`}
                            positions={[[fromStation.lat, fromStation.lng], [toStation.lat, toStation.lng]]}
                            edgeIndex={idx}
                        />
                    );
                })}

                {stations && stations.length > 0 && stations.map((station, idx) => (
                    <Marker
                        key={`station-${idx}`}
                        position={[station.lat, station.lng]}
                        icon={createStationIcon()}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-sm mb-1">{station.name}</h3>
                                <p className="text-xs text-gray-500">Estación de Servicio</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {route && route.length > 1 && (
                    <Polyline
                        positions={route.map((s) => [s.lat, s.lng])}
                        pathOptions={{
                            color: '#4f46e5',
                            weight: 6,
                            opacity: 0.8,
                            lineCap: 'round',
                            lineJoin: 'round',
                            dashArray: '10, 10',
                            dashOffset: '0'
                        }}
                    />
                )}

                {route && route.map((station, idx) => (
                    <Marker
                        key={`route-${idx}`}
                        position={[station.lat, station.lng]}
                        icon={createRouteIcon(idx, route.length)}
                        zIndexOffset={1000}
                    >
                        <Popup>
                            <div className="p-2">
                                <span className="text-xs font-bold uppercase text-indigo-600 mb-1 block">Parada {idx + 1}</span>
                                <h3 className="font-bold text-sm">{station.name}</h3>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
