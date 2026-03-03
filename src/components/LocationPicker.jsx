import { useState, useEffect } from "react";
import { MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import COLORS from "../theme/colors";

const LocationPicker = ({ onLocationSelect, onClose, currentLocation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        await fetchNearbyPlaces(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              "Location access denied. Please enable location permissions.",
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("An error occurred while getting your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // Fetch nearby places using Nominatim (OpenStreetMap)
  const fetchNearbyPlaces = async (lat, lng) => {
    try {
      // Reverse geocode to get the location name
      const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const reverseResponse = await fetch(reverseUrl, {
        headers: {
          "User-Agent": "SocialApp/1.0", // Required by Nominatim
        },
      });
      const reverseData = await reverseResponse.json();

      // Search for nearby POIs
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&lat=${lat}&lon=${lng}&addressdetails=1&limit=10`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "SocialApp/1.0",
        },
      });
      const searchData = await searchResponse.json();

      const places = [];

      // Add the exact current location
      if (reverseData && reverseData.display_name) {
        places.push({
          name: formatLocationName(reverseData),
          displayName: reverseData.display_name,
          lat: parseFloat(reverseData.lat),
          lng: parseFloat(reverseData.lon),
          type: "current",
        });
      }

      // Add nearby places
      searchData.forEach((place) => {
        if (
          place.display_name &&
          !places.some((p) => p.displayName === place.display_name)
        ) {
          places.push({
            name: formatLocationName(place),
            displayName: place.display_name,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
            type: place.type || "place",
          });
        }
      });

      setNearbyPlaces(places.slice(0, 10));
    } catch (err) {
      console.error("Error fetching nearby places:", err);
      setError("Failed to load nearby places");
    }
  };

  // Search for locations by name
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=10`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SocialApp/1.0",
        },
      });
      const data = await response.json();

      const results = data.map((place) => ({
        name: formatLocationName(place),
        displayName: place.display_name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        type: place.type || "place",
      }));

      setSearchResults(results);
    } catch (err) {
      console.error("Error searching locations:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Format location name for better display
  const formatLocationName = (place) => {
    const address = place.address;
    if (!address) return place.display_name;

    // Prioritize specific location types
    const parts = [];

    if (address.shop || address.amenity || address.building) {
      parts.push(address.shop || address.amenity || address.building);
    }

    if (address.road || address.street) {
      parts.push(address.road || address.street);
    } else if (address.neighbourhood || address.suburb) {
      parts.push(address.neighbourhood || address.suburb);
    }

    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }

    if (address.state) {
      parts.push(address.state);
    }

    return parts.length > 0 ? parts.join(", ") : place.display_name;
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (location) => {
    onLocationSelect({
      name: location.name,
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Location
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
          >
            <MapPinIcon className="h-5 w-5" />
            {loading ? "Getting location..." : "Use Current Location"}
          </button>

          {/* Search Bar */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Search Results
              </h3>
              {searchLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLocation(location)}
                      className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {location.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {location.displayName}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No locations found
                </p>
              )}
            </div>
          )}

          {/* Nearby Places */}
          {!searchQuery && nearbyPlaces.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nearby Places
              </h3>
              <div className="space-y-2">
                {nearbyPlaces.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(location)}
                    className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-start gap-3">
                      <MapPinIcon
                        className={`h-5 w-5 mt-0.5 ${
                          location.type === "current"
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {location.name}
                          {location.type === "current" && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                              (Current Location)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {location.displayName}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && !searchQuery && nearbyPlaces.length === 0 && !error && (
            <div className="text-center py-8">
              <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Click "Use Current Location" to find nearby places
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
