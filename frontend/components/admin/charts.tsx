"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export function TrafficChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [
          { label: "Médical", data: [820, 760, 900, 840, 950, 1100, 880], borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,.08)", tension: 0.4, pointRadius: 3, fill: true },
          { label: "Voyage", data: [500, 480, 520, 560, 490, 610, 580], borderColor: "#c9a84c", backgroundColor: "rgba(201,168,76,.06)", tension: 0.4, pointRadius: 3, fill: true, borderDash: [4, 4] },
          { label: "Tech", data: [380, 420, 390, 450, 470, 410, 440], borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,.05)", tension: 0.4, pointRadius: 3, fill: true, borderDash: [2, 2] },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { font: { size: 10 } }, grid: { display: false } }, y: { ticks: { font: { size: 10 } }, grid: { color: "rgba(0,0,0,.05)" } } },
      },
    });

    return () => chart.destroy();
  }, []);

  return <canvas ref={canvasRef} />;
}

export function CategoryChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Médical", "Voyage", "Tech", "Autres"],
        datasets: [{ data: [38, 24, 22, 16], backgroundColor: ["#ef4444", "#f59e0b", "#8b5cf6", "#10b981"], borderWidth: 0, hoverOffset: 4 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: { legend: { display: false } },
      },
    });

    return () => chart.destroy();
  }, []);

  return <canvas ref={canvasRef} />;
}

export function MonthlyChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Déc", "Jan", "Fév", "Mar", "Avr", "Mai"],
        datasets: [
          { label: "Vues", data: [180000, 210000, 195000, 240000, 265000, 284000], backgroundColor: "#3b82f6", borderRadius: 4 },
          { label: "Visiteurs", data: [8200, 9400, 8800, 10200, 11400, 12480], backgroundColor: "#c9a84c", borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { font: { size: 10 }, autoSkip: false }, grid: { display: false } }, y: { ticks: { font: { size: 10 }, callback: (v) => (Number(v) >= 1000 ? Math.round(Number(v) / 1000) + "k" : v) }, grid: { color: "rgba(0,0,0,.05)" } } },
      },
    });

    return () => chart.destroy();
  }, []);

  return <canvas ref={canvasRef} />;
}