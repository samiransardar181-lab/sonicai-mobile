import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import mobileAds, {
  AdEventType,
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1377554172810719/3261334704';
const REWARDED_UNIT_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-1377554172810719/2365001171';

const tracks = [
  { id: '1', title: 'Midnight Echo', artist: 'Nova Lane', duration: '2:48', accent: '#00E5FF' },
  { id: '2', title: 'Neon Horizon', artist: 'Kairo', duration: '3:14', accent: '#7C4DFF' },
  { id: '3', title: 'Velvet Pulse', artist: 'Nyxia', duration: '2:36', accent: '#FF4081' },
];

type TabName = 'Stream' | 'AI Studio' | 'Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Stream');
  const [credits, setCredits] = useState<number>(3);
  const [prompt, setPrompt] = useState<string>('');
  const [generated, setGenerated] = useState<string | null>(null);
  const [rewardedStatus, setRewardedStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [adsReady, setAdsReady] = useState<boolean>(false);
  const rewardedRef = useRef<RewardedAd | null>(null);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      mobileAds()
        .initialize()
        .then(() => {
          if (mounted) setAdsReady(true);
        })
        .catch(() => {
          if (mounted) setAdsReady(false);
        });
    }, 800);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!adsReady) return;

    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });
      rewardedRef.current = ad;

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setRewardedStatus('loaded');
      });

      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        setCredits((current) => current + 5);
        Alert.alert('Reward earned', '5 Sonic credits were added to your account.');
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setRewardedStatus('loading');
        ad.load();
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
        setRewardedStatus('error');
      });

      ad.load();

      return () => {
        unsubLoaded();
        unsubEarned();
        unsubClosed();
        unsubError();
      };
    } catch {
      setRewardedStatus('error');
    }
  }, [adsReady]);

  const generateTrack = () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      Alert.alert('Add a prompt', 'Describe the track you want to create.');
      return;
    }

    if (credits < 1) {
      Alert.alert('No credits', 'Watch a rewarded ad to add 5 Sonic credits.');
      return;
    }

    setCredits((current) => current - 1);
    setGenerated(`Created a new sonic concept for "${trimmed}" with airy synths, pulsing drums, and a cinematic finish.`);
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      'Delete account',
      'This permanently removes your Sonicai account and local studio data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCredits(0);
            setGenerated(null);
            setPrompt('');
            Alert.alert('Account deleted', 'Your local account data has been removed.');
          },
        },
      ]
    );
  };

  const restorePurchases = () => {
    Alert.alert(
      'Restore purchases',
      'Purchase restoration needs a configured in-app purchase provider and product catalog.'
    );
  };

  const adStatusLabel =
    rewardedStatus === 'loaded'
      ? 'Watch rewarded ad (+5)'
      : rewardedStatus === 'loading'
      ? 'Loading rewarded ad...'
      : 'Retry rewarded ad';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>S</Text>
        </View>
        <View>
          <Text style={styles.appName}>Sonicai</Text>
          <Text style={styles.appSub}>AI Music Studio & Stream</Text>
        </View>
      </View>

      {activeTab === 'Stream' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Discover</Text>
          <Text style={styles.sectionBody}>Curated fresh sounds from the Sonicai community.</Text>
          {tracks.map((track) => (
            <Pressable key={track.id} style={({ pressed }) => [styles.trackCard, pressed && styles.pressed]}>
              <View style={[styles.trackOrb, { backgroundColor: track.accent }]} />
              <View style={styles.trackMeta}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackArtist}>{track.artist}</Text>
              </View>
              <Text style={styles.duration}>{track.duration}</Text>
              <Text style={styles.playButton}>Play</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {activeTab === 'AI Studio' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>AI Studio</Text>
          <Text style={styles.sectionBody}>Turn an idea into your next sound.</Text>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Available credits</Text>
            <Text style={styles.creditValue}>{credits} Sonic credits</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.rewardButton, pressed && styles.pressed]}
            onPress={() => {
              if (rewardedStatus === 'error') {
                setRewardedStatus('loading');
                rewardedRef.current?.load();
                return;
              }
              if (rewardedStatus === 'loaded') {
                rewardedRef.current?.show();
              }
            }}
          >
            <Text style={styles.rewardButtonText}>{adStatusLabel}</Text>
          </Pressable>

          <TextInput
            style={styles.promptInput}
            placeholder="Describe a mood, genre, instruments..."
            placeholderTextColor="#667085"
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />

          <Pressable style={({ pressed }) => [styles.generateButton, pressed && styles.pressed]} onPress={generateTrack}>
            <Text style={styles.generateButtonText}>Generate track (1 credit)</Text>
          </Pressable>

          {generated && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Sonic concept</Text>
              <Text style={styles.resultText}>{generated}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'Settings' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Text style={styles.sectionBody}>Manage your account and preferences.</Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Creator plan</Text>
            <Text style={styles.settingValue}>Local creator account</Text>
          </View>

          <Pressable style={({ pressed }) => [styles.settingCard, pressed && styles.pressed]} onPress={restorePurchases}>
            <Text style={styles.settingLabel}>Purchases</Text>
            <Text style={styles.settingValue}>Restore purchases</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.dangerCard, pressed && styles.pressed]} onPress={confirmAccountDeletion}>
            <Text style={styles.dangerButtonText}>Delete account</Text>
          </Pressable>
        </ScrollView>
      )}

      {Platform.OS !== 'web' && adsReady ? (
        <View style={styles.banner}>
          <BannerAd
            unitId={BANNER_UNIT_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: false }}
          />
        </View>
      ) : null}

      <View style={styles.tabBar}>
        {(['Stream', 'AI Studio', 'Settings'] as TabName[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050507' },
  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#151821',
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#7C4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoMarkText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  appName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  appSub: { color: '#98A2B3', fontSize: 12, marginTop: 2 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 28 },
  sectionTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  sectionBody: { color: '#98A2B3', fontSize: 14, marginTop: 4, marginBottom: 18 },
  trackCard: {
    backgroundColor: '#11131A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D2230',
  },
  pressed: { opacity: 0.75 },
  trackOrb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  trackMeta: { flex: 1 },
  trackTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  trackArtist: { color: '#98A2B3', fontSize: 13, marginTop: 2 },
  duration: { color: '#98A2B3', fontSize: 12, marginRight: 12 },
  playButton: { color: '#00E5FF', fontSize: 13, fontWeight: '700' },
  creditRow: {
    backgroundColor: '#11131A',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  creditLabel: { color: '#98A2B3', fontSize: 14 },
  creditValue: { color: '#00E5FF', fontSize: 14, fontWeight: '700' },
  rewardButton: {
    backgroundColor: '#171C28',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2B3347',
  },
  rewardButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  promptInput: {
    minHeight: 110,
    backgroundColor: '#11131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1D2230',
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  generateButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  resultCard: {
    backgroundColor: '#11131A',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  resultLabel: { color: '#00E5FF', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  resultText: { color: '#E4E7EC', fontSize: 14, lineHeight: 21 },
  settingCard: {
    backgroundColor: '#11131A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1D2230',
  },
  settingLabel: { color: '#98A2B3', fontSize: 12 },
  settingValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 4 },
  dangerCard: {
    backgroundColor: '#241217',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#5B1F2B',
    alignItems: 'center',
  },
  dangerButtonText: { color: '#FF6B81', fontSize: 14, fontWeight: '700' },
  banner: {
    alignItems: 'center',
    backgroundColor: '#050507',
    paddingVertical: 4,
  },
  tabBar: {
    height: 68,
    flexDirection: 'row',
    backgroundColor: '#0B0D12',
    borderTopWidth: 1,
    borderTopColor: '#151821',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabItem: { backgroundColor: '#171C28' },
  tabText: { color: '#98A2B3', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#FFFFFF', fontWeight: '800' },
});
