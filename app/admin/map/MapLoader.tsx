"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
export const MapLoader = dynamic(() => import("./OpsMap"), { ssr: false, loading: () => <Skeleton className="h-[70vh]" /> });
