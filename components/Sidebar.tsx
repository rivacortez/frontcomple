"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Route, Truck, Search, RefreshCw, MapPin, Navigation, CheckCircle2, ArrowRight } from "lucide-react";

interface Station {
    name: string;
    lat: number;
    lng: number;
}

interface SidebarProps {
    stations: Station[];
    onLoadStations: () => void;
    onCalculateRoute: (start: string, end: string) => void;
    route?: Station[];
    routeCost?: number | null;
    loading: boolean;
}

export default function Sidebar({ stations, onLoadStations, onCalculateRoute, route = [], routeCost, loading }: SidebarProps) {
    const [startStation, setStartStation] = useState<string>("");
    const [endStation, setEndStation] = useState<string>("");
    const [searchTermStart, setSearchTermStart] = useState("");
    const [searchTermEnd, setSearchTermEnd] = useState("");

    const filteredStationsStart = useMemo(() => {
        return stations.filter(s => 
            s.name.toLowerCase().includes(searchTermStart.toLowerCase())
        );
    }, [stations, searchTermStart]);

    const filteredStationsEnd = useMemo(() => {
        return stations.filter(s => 
            s.name.toLowerCase().includes(searchTermEnd.toLowerCase())
        );
    }, [stations, searchTermEnd]);

    const handleCalculate = () => {
        if (startStation && endStation && startStation !== endStation) {
            onCalculateRoute(startStation, endStation);
        }
    };

    return (
        <div className="w-96 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-border flex flex-col h-full shadow-2xl z-20 relative transition-all duration-300">
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
                        <Truck className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Grupo 5</h1>
                        <p className="text-xs text-muted-foreground font-medium">TF Complejidad</p>
                    </div>
                </div>
            </div>

            <Separator className="opacity-50" />

            <div className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                    <div className="p-6 pb-0 space-y-4">
                    <div className="grid gap-3">
                        <Button
                            onClick={onLoadStations}
                            disabled={loading}
                            variant="outline"
                            className="h-12 justify-start px-4 text-sm font-medium border-muted-foreground/20 hover:bg-muted/50 hover:border-primary/50 transition-all group"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
                                    Recargar Estaciones
                                </>
                            )}
                        </Button>
                    </div>

                    {stations.length > 0 && (
                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <MapPin className="w-3 h-3 text-green-600" />
                                    Punto de Inicio
                                </label>
                                <Select value={startStation} onValueChange={setStartStation}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecciona el punto de inicio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2 sticky top-0 bg-popover border-b z-10">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Buscar estación..."
                                                    value={searchTermStart}
                                                    onChange={(e) => setSearchTermStart(e.target.value)}
                                                    className="pl-8 h-9 text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {filteredStationsStart.map((station) => (
                                                <SelectItem 
                                                    key={`start-${station.name}`} 
                                                    value={station.name}
                                                    disabled={station.name === endStation}
                                                >
                                                    {station.name}
                                                </SelectItem>
                                            ))}
                                            {filteredStationsStart.length === 0 && (
                                                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                                    No se encontraron estaciones
                                                </div>
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Navigation className="w-3 h-3 text-red-600" />
                                    Punto Final
                                </label>
                                <Select value={endStation} onValueChange={setEndStation}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecciona el punto final" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2 sticky top-0 bg-popover border-b z-10">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Buscar estación..."
                                                    value={searchTermEnd}
                                                    onChange={(e) => setSearchTermEnd(e.target.value)}
                                                    className="pl-8 h-9 text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {filteredStationsEnd.map((station) => (
                                                <SelectItem 
                                                    key={`end-${station.name}`} 
                                                    value={station.name}
                                                    disabled={station.name === startStation}
                                                >
                                                    {station.name}
                                                </SelectItem>
                                            ))}
                                            {filteredStationsEnd.length === 0 && (
                                                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                                    No se encontraron estaciones
                                                </div>
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {stations.length === 0 && (
                        <div className="pt-4 text-center">
                            <p className="text-sm text-muted-foreground">Carga las estaciones para comenzar a planificar rutas.</p>
                        </div>
                    )}

                    {/* Sección de recorrido calculado */}
                    {route.length > 0 && (
                        <div className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    Recorrido Calculado
                                </h3>
                                {routeCost != null && (
                                    <Badge variant="secondary" className="text-[10px]">
                                        Costo: {routeCost.toFixed(2)}
                                    </Badge>
                                )}
                            </div>
                            <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                                <ScrollArea className="max-h-[200px]">
                                    <div className="space-y-2">
                                        {route.map((station, index) => (
                                            <div 
                                                key={`route-step-${index}`}
                                                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {index === 0 ? (
                                                        <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">S</span>
                                                        </div>
                                                    ) : index === route.length - 1 ? (
                                                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">F</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">{index}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {station.name}
                                                    </p>
                                                    {index < route.length - 1 && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground">Siguiente parada</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="mt-3 pt-3 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground">
                                        <span className="font-semibold">{route.length}</span> {route.length === 1 ? 'parada' : 'paradas'} en total
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </ScrollArea>

                <div className="p-6 pt-4 border-t border-border bg-background/50 backdrop-blur-sm flex-none">
                    <Button
                        onClick={handleCalculate}
                        disabled={loading || !startStation || !endStation || startStation === endStation}
                        className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0 transition-all"
                    >
                        <Route className="w-5 h-5 mr-2" />
                        Calcular Ruta Óptima
                    </Button>
                    {startStation && endStation && startStation === endStation && (
                        <p className="text-xs text-destructive mt-2 text-center">
                            El punto de inicio y final deben ser diferentes
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
