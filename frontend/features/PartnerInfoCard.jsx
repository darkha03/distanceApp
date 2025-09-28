import { useState, useContext, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "@/utils/authContext";
import { Colors } from "@/constants/Colors";
import { weatherCodeIconMap } from "@/utils/weatherCodes";
import { statusImageMap } from "@/utils/statusImage";

export function PartnerInfoCard() {
  const [expanded, setExpanded] = useState(false);
  const authContext = useContext(AuthContext);
  if (!authContext?.user || !authContext.user.partner) {
    return null;
  }
  const user = authContext.user;
  const partner = user.partner;
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const partnerTz = partner.timezone || "UTC";

  const [partnerTime, setPartnerTime] = useState("");
  const [partnerDate, setPartnerDate] = useState("");
  const [weather, setWeather] = useState(null);
  const [showActivityImage, setShowActivityImage] = useState(true);

  useEffect(() => {
    const update = () => {
      try {
        const now = new Date();
        const time = new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: partnerTz,
        }).format(now);

        const date = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: partnerTz,
        }).format(now);
        setPartnerTime(time);
        setPartnerDate(date);
      } catch (e) {
        const now = new Date();
        setPartnerTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setPartnerDate(now.toDateString());
      }
    };
     update();
    // Align refresh to the next minute boundary for smoother ticks
    const firstDelay = 60000 - (Date.now() % 60000);
    let intervalId;
    const timeout = setTimeout(() => {
      update();
      intervalId = setInterval(update, 60000);
    }, firstDelay);

    return () => {
      clearTimeout(timeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [partnerTz]);
  useEffect(() => {
    let intervalId;
    const fetchWeather = async () => {
      if (partner.latitude && partner.longitude) {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${partner.latitude}&longitude=${partner.longitude}&current_weather=true`
          );
          const data = await res.json();
          setWeather(data.current_weather);
        } catch (e) {
          setWeather(null);
        }
      }
    };
    fetchWeather();
    intervalId = setInterval(fetchWeather, 15 * 60 * 1000); // every 15 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, [partner.latitude, partner.longitude]);
 
  // Dummy forecast for mockup (replace with real API if needed)
  const forecast = [
    { code: weather?.weathercode, temp: weather?.temperature },
    { code: weather?.weathercode, temp: weather?.temperature },
  ];

  return (
    <AppCard style={styles.card}>
      {/* Top row: Date only */}
      <View style={styles.dateRow}>
        <AppText style={styles.day}>{partnerDate}</AppText>
      </View>
      {/* Second row: Time, Status (left) + Avatar (right) */}
      <View style={styles.infoRow}>

        <View style={styles.leftInfo}>
          <View style={{ height: 80, width:"100%", alignItems: "center" }} >
          <AppText style={styles.time}>{partnerTime}</AppText>
          </View>
          <View style={{ height: 40, width:"100%", alignItems: "center" }}>
          <AppText style={styles.status}>{partner.status || "Sleep"}</AppText>
          </View>
        </View>

        <View style={{ flex: 1, alignItems: "center", position: "relative" }}>
          {/* Avatar or Status Image */}
          {partner.activityImageUrl && showActivityImage ? (
            <Image
              source={{ uri: `${BASE_URL}${partner.activityImageUrl}` }}
              style={{ width: 120, height: 120, borderRadius: 10 }}
            />
          ) : statusImageMap[partner.status] ? (
            <Image
              source={statusImageMap[partner.status]}
              style={{ width: 120, height: 120, borderRadius: 10 }}
              resizeMode="contain"
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={120}
              color="#c9a4f7"
              style={styles.avatar}
            />
          )}
          {/* Swap button */}
          {(partner.activityImageUrl && statusImageMap[partner.status]) && (
            <TouchableOpacity
              style={styles.swapImageButton}
              onPress={() => setShowActivityImage((prev) => !prev)}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#c9a4f7" />
            </TouchableOpacity>
          )}
        </View>

      </View>
      
      {/* Expandable Section */}
      {expanded && (
        
        <View style={styles.moreInfo}>
          {/* Third row: Weather box (left), Forecast (right) */}
      <View style={styles.weatherRow}>
        <View style={styles.weatherBox}>
          <Ionicons
            name={weatherCodeIconMap[weather?.weathercode] || "help-circle-outline"}
            size={82}
            color="#c9a4f7"
            style={styles.weatherIconBox}
          />
          <AppText style={styles.weatherTempBox}>
            {weather ? `${weather.temperature}°C` : "--"}
          </AppText>
        </View>
        <View style={styles.forecastRow}>
          {forecast.map((f, i) => (
            <View key={i} style={styles.forecastBox}>
              <Ionicons
                name={weatherCodeIconMap[f.code] || "help-circle-outline"}
                size={24}
                color="#c9a4f7"
              />
              <AppText style={styles.forecastTemp}>
                {f.temp ? `${f.temp}°` : "--"}
              </AppText>
            </View>
          ))}
        </View>
      </View>
          <AppText style={styles.label}>Timezone: {partner.timezone}</AppText>
        </View>
      )}
      {/* Expand/Collapse Arrow */}
      <TouchableOpacity
        style={styles.arrowContainer}
        onPress={() => setExpanded(!expanded)}
      >
        <AppText style={styles.arrow}>{expanded ? "▲" : "▼"}</AppText>
      </TouchableOpacity>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderWidth: 5,
    borderColor: "#c9a4f7",
    borderRadius: 18,
    backgroundColor: "#111",
    padding: 18,
    shadowColor: "#c9a4f7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dateRow: {
    marginBottom: 8,
    alignItems: "flex-start",
  },
  day: {
    fontSize: 16,
    fontWeight: "600",
    color: "#aaa",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftInfo: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center", // <-- add this
    flex: 1,
  },
  time: {
    fontSize: 48,
    fontWeight: "700",
    color: "#fff",
    textAlign: "left",
    marginBottom: 4,
  },
  status: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.light.text,
    backgroundColor: Colors.light.primary,
    paddingVertical: 4,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 8,
    textTransform: "capitalize",
    alignSelf: "center",
  },
  avatar: {
    marginLeft: 12,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 8,
  },
  weatherBox: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    minHeight: 120,
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginRight: 12,
    position: "relative",
  },
  weatherIconBox: {
    position: "absolute",
    top: 0,
    right: 8,
  },
  weatherTempBox: {
    position: "absolute",
    bottom: 8,
    left: 12,
    fontSize: 22,
    color: "#fff",
    fontWeight: "600",
  },
  forecastRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 8,
    marginLeft: 12,
    flex: 1,
  },
  forecastBox: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    minWidth: 48,
    marginHorizontal: 2,
  },
  forecastTemp: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginTop: 2,
  },
  moreInfo: {
    marginTop: 16,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 6,
  },
  arrowContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  arrow: {
    fontSize: 20,
    color: "#a78bfa",
    fontWeight: "600",
  },
  swapImageButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    elevation: 2,
  },

});
