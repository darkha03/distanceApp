import { useState, useContext, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "@/utils/authContext";
import { Colors } from "@/constants/Colors";
import { weatherCodeIconMap } from "@/utils/weatherCodes";

export function PartnerInfoCard() {
  const [expanded, setExpanded] = useState(false);
  const authContext = useContext(AuthContext);
  if (!authContext?.user || !authContext.user.partner) {
    return null;
  }
  const user = authContext.user;
  const partner = user.partner;
  
  const partnerTz = partner.timezone || "UTC";

  const [partnerTime, setPartnerTime] = useState("");
  const [partnerDate, setPartnerDate] = useState("");
    const [weather, setWeather] = useState(null);

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
    // Only fetch if coordinates exist
    if (partner.latitude && partner.longitude) {
      const fetchWeather = async () => {
        try {
          // Replace with your weather API endpoint and key
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${partner.latitude}&longitude=${partner.longitude}&current_weather=true`
          );
          const data = await res.json();
          setWeather(data.current_weather); // adjust based on API response shape
        } catch (e) {
          setWeather(null);
        }
      };
      fetchWeather();
    }
  }, [partner.latitude, partner.longitude]);
 
  return (
    <AppCard style={styles.card}>
      {/* Date + Time */}
      <View style={styles.centered}>
        <AppText style={styles.day}>{partnerDate}</AppText>
        <View style={styles.timeRow}>
            <View>
                <AppText style={styles.time}>{partnerTime}</AppText>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
                <Ionicons 
                name="person-circle-outline"
                size={72}
                color="#888" // placeholder gray        
                />
                {/* Display partner status */}
                <AppText style={styles.status}>{partner.status || "Sleep"}</AppText>
            </View>
        </View>
      </View>

      {/* Expandable Section */}
      {expanded && (
        <View style={styles.moreInfo}>
          <AppText style={styles.label}>Weather: 
            <Ionicons
              name={weatherCodeIconMap[weather?.weathercode] || "help-circle-outline"}
              size={24}
              color="#f4f8fbff"
              style={{ verticalAlign: "middle",  paddingRight: 4 , paddingLeft: 8}}
            />
             {weather 
            ? `${weather.temperature}°C` || "Unknown"
             : "Loading..."}</AppText>
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
  },
  centered: {
   width: "100%",
  },
  day: {
    fontSize: 16,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  time: {
    fontSize: 64,
    fontWeight: "700",
    color: "#fff",
    textAlign: "left",
  },
  activityImage: {
    width: 48,
    height: 48,
    marginLeft: 12,
  },
  status: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.light.secondary,
    backgroundColor: Colors.light.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
    textTransform: "capitalize",
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
    color: "#a78bfa", // purple accent
    fontWeight: "600",
  },
});
