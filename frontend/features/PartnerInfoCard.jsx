import { useState, useContext, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Modal, Pressable, FlatList, Dimensions } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "@/utils/authContext";
import { Colors } from "@/constants/Colors";
import { weatherCodeIconMap } from "@/utils/weatherCodes";
import { statusImageMap } from "@/utils/statusImage";

const IMAGE_SIZE = 120;

export function PartnerInfoCard() {
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
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [showActivityImages, setShowActivityImages] = useState(true);
  // Use partner.activityImages (array of {id, url, createdAt})
  const activityImages = partner.activityImages || [];
  const [currentIndex, setCurrentIndex] = useState(0);

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
    intervalId = setInterval(fetchWeather, 15 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [partner.latitude, partner.longitude]);

  const daysTogether = useMemo(() => {
    if (!user.anniversary) return null;
    const start = new Date(user.anniversary);
    if (isNaN(start.getTime())) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return diff >= 0 ? diff : 0;
  }, [user.anniversary]);

  // Fullscreen modal handlers
  const openFullScreen = (index) => {
    setFullScreenIndex(index);
    setFullScreenVisible(true);
  };
  const closeFullScreen = () => {
    setFullScreenVisible(false);
  };

  // Render swipeable activity images
  const renderActivityImages = () => {
    if (!activityImages.length || !showActivityImages) {
      return partner.status && statusImageMap[partner.status] ? (
        <Image
          source={statusImageMap[partner.status]}
          style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 10 }}
          resizeMode="contain"
        />
      ) : (
        <Ionicons
          name="person-circle-outline"
          size={IMAGE_SIZE}
          color="#c9a4f7"
          style={styles.avatar}
        />
      );
    }
    return (
      <View>
        <FlatList
          horizontal
          pagingEnabled
          data={activityImages}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_SIZE);
            setCurrentIndex(Math.min(index, activityImages.length - 1));
          }}
          getItemLayout={(_, index) => ({
            length: IMAGE_SIZE,
            offset: IMAGE_SIZE * index,
            index
          })}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openFullScreen(index)}
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, marginRight: 8 }}
            >
              <Image
                source={{ uri: `${BASE_URL}${item.url}` }}
                style={{ width: "100%", height: "100%", borderRadius: 10 }}
              />
            </TouchableOpacity>
          )}
          style={{ maxWidth: IMAGE_SIZE * 1.2 }}
        />
        <View style={styles.dotsRow}>
          {activityImages.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <AppCard style={styles.card}>
      {/* Top row */}
      <View style={styles.dateRow}>
        <AppText style={styles.day}>{partnerDate}</AppText>
      </View>

      {/* Time + Status + Image */}
      <View style={styles.infoRow}>
        <View style={styles.leftInfo}>
          <View style={{ height: 80, width: "100%", alignItems: "center" }}>
            <AppText style={styles.time}>{partnerTime}</AppText>
          </View>
          <View style={{ height: 40, width: "100%", alignItems: "center" }}>
            <AppText style={styles.status}>{partner.status || "Sleep"}</AppText>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "center", position: "relative" }}>
          {renderActivityImages()}
          {(activityImages.length && statusImageMap[partner.status]) ? (
            <TouchableOpacity
              style={styles.swapImageButton}
              onPress={() => setShowActivityImages(v => !v)}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#c9a4f7" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View style={styles.moreInfo}>
        <View style={styles.metricsRow}>
          <View style={styles.weatherBox}>
            <Ionicons
              name={weatherCodeIconMap[weather?.weathercode] || "help-circle-outline"}
              size={56}
              color="#c9a4f7"
              style={styles.weatherIconBox}
            />
            <AppText style={styles.weatherTempBox}>
              {weather ? `${weather.temperature}°C` : "--"}
            </AppText>
          </View>
          <View style={styles.detailColumn}>
            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#c9a4f7"
                style={{ marginRight: 6 }}
              />
              <AppText style={styles.detailValue} numberOfLines={1}>
                {partner.location || "Not set"}
              </AppText>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="heart-outline"
                size={18}
                color="#c9a4f7"
                style={{ marginRight: 6 }}
              />
              <AppText style={styles.detailValue}>
                {daysTogether !== null
                  ? `${daysTogether} day${daysTogether === 1 ? "" : "s"}`
                  : "--"}
              </AppText>
            </View>
            <View style={[styles.detailRow, styles.lastDetailRow]}>
              <Ionicons
                name="time-outline"
                size={18}
                color="#c9a4f7"
                style={{ marginRight: 6 }}
              />
              <AppText style={styles.detailValue} numberOfLines={1}>
                {partner.timezone || "Not set"}
              </AppText>
            </View>
          </View>
        </View>
      </View>
      {/* Full-screen modal for activity images */}
      <Modal
        visible={fullScreenVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFullScreen}
      >
        <View style={styles.fullOverlay}>
          <Pressable style={styles.fullCloseHit} onPress={closeFullScreen} />
          <View style={styles.fullContent}>
            {activityImages[fullScreenIndex] && (
              <Image
                source={{ uri: `${BASE_URL}${activityImages[fullScreenIndex].url}` }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.fullScreenNav}>
              <TouchableOpacity
                disabled={fullScreenIndex === 0}
                onPress={() => setFullScreenIndex(i => Math.max(i - 1, 0))}
                style={styles.fullScreenArrow}
              >
                <Ionicons name="chevron-back" size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={fullScreenIndex === activityImages.length - 1}
                onPress={() => setFullScreenIndex(i => Math.min(i + 1, activityImages.length - 1))}
                style={styles.fullScreenArrow}
              >
                <Ionicons name="chevron-forward" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeFullScreen}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <Pressable style={styles.fullCloseHit} onPress={closeFullScreen} />
        </View>
      </Modal>
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
  dateRow: { marginBottom: 8, alignItems: "flex-start" },
  day: { fontSize: 16, fontWeight: "600", color: "#aaa" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftInfo: { flexDirection: "column", justifyContent: "center", alignItems: "center", flex: 1 },
  time: { fontSize: 48, fontWeight: "700", color: "#fff", textAlign: "left", marginBottom: 4 },
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
  avatar: { marginLeft: 12 },
  moreInfo: { marginTop: 12, width: "100%" },
  metricsRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "stretch",
  },
  weatherBox: {
    flex: 0.9,
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    marginRight: 12,
    minHeight: 100,
    overflow: "hidden",
  },
  weatherIconBox: { 
    position: "absolute",
    top: 6,
    right: 6,
   },
  weatherTempBox: {
    position: "absolute",
    bottom: 8,
    left: 12,
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  detailColumn: {
    flex: 1.4,
    backgroundColor: "#1b1b1b",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  lastDetailRow: { borderBottomWidth: 0 },
  detailValue: { color: "#fff", fontSize: 14, fontWeight: "600", flexShrink: 1 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#555",
    marginHorizontal: 3
  },
  dotActive: {
    backgroundColor: "#c9a4f7"
  },
  fullOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12
  },
  fullContent: {
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  fullImage: {
    width: "100%",
    height: "100%"
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 24,
    padding: 6
  },
  fullCloseHit: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  fullScreenNav: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    zIndex: 2
  },
  fullScreenArrow: {
    padding: 8,
    opacity: 0.8
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
