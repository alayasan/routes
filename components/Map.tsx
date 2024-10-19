import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

interface LocationType {
  coords: {
    latitude: number;
    longitude: number;
  };
}

const LeafletMap = () => {
  const [location, setLocation] = useState<LocationType | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  if (Platform.OS === "web") {
    return <WebMapComponent location={location} />;
  }

  const mapTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
      </body>
    </html>
  `;

  const initializeMap = `
    (function() {
      const map = L.map('map');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      function updateMap(lat, lng) {
        map.setView([lat, lng], 13);
        L.marker([lat, lng]).addTo(map);
      }

      updateMap(${location?.coords.latitude || 0}, ${
    location?.coords.longitude || 0
  });

      window.addEventListener('message', function(event) {
        const { latitude, longitude } = event.data;
        updateMap(latitude, longitude);
      });
    })();
  `;

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    const { latitude, longitude } = JSON.parse(event.nativeEvent.data);
    console.log("Received coordinates:", latitude, longitude);
  };

  useEffect(() => {
    if (location && webViewRef.current) {
      const script = `
        window.postMessage(${JSON.stringify(location.coords)}, '*');
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [location]);

  const webViewRef = useRef<WebView>(null);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapTemplate }}
        style={styles.map}
        injectedJavaScript={initializeMap}
        onMessage={onMessage}
      />
    </View>
  );
};

const WebMapComponent = ({ location }: { location: LocationType | null }) => {
  useEffect(() => {
    if (typeof window !== "undefined" && location) {
      import("leaflet").then((L) => {
        const map = L.map("map").setView(
          [location.coords.latitude, location.coords.longitude],
          13
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        L.marker([location.coords.latitude, location.coords.longitude]).addTo(
          map
        );
      });
    }
  }, [location]);

  return <div id="map" style={{ height: "100%", width: "100%" }} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default LeafletMap;
