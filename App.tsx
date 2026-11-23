import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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
import {
  BannerAd,
  BannerAdSize,
  MobileAds,
  useRewardedAd,
} from 'react-native-google-mobile-ads';

const BANNER_UNIT_ID = 'ca-app-pub-1377554172810719/6529794377';
const REWARDED_UNIT_ID = 'ca-app-pub-1377554172810719/1558211281';

type TabName = 'Stream' | 'AI Studio' | 'Settings';

const tracks = [
  { title: 'Midnight Echo', artist: 'Nova Lane', duration: '3:42', accent: '#8B5CF6' },
  { title: 'Neon Horizon', artist: 'Ari Vale', duration: '4:08', accent: '#EC4899' },
  { title: 'Solar Drift', artist: 'Moon Pilot', duration: '2:56', accent: '#F59E0B' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Stream');
  const [credits, setCredits] = useState(12);
  const [prompt, setPrompt] = useState('');
  const [generation, setGeneration] = useState('');

  const rewardedAd = useRewardedAd({
    adUnitId: REWARDED_UNIT_ID,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      MobileAds()
        .initialize()
        .catch((error: unknown) => console.warn('Google Mobile Ads initialization failed:', error));
    }
  }, []);

  useEffect(() => {
    if (rewardedAd.earnedReward) {
      setCredits((current) => current + 5);
      Alert.alert('Reward earned', '5 Sonic credits were added to your account.');
    }
  }, [rewardedAd.earnedReward]);

  useEffect(() => {
    if (rewardedAd.status === 'closed') {
      rewardedAd.load();
    }
  }, [rewardedAd.status, rewardedAd.load]);

  const generateTrack = () => {
    const idea = prompt.trim();
    if (!idea) {
      Alert.alert('Add a prompt', 'Describe the track you want to create.');
      return;
    }
    if (credits < 1) {
      Alert.alert('No credits', 'Watch a rewarded ad to add 5 Sonic credits.');
      return;
    }
    setCredits((current) => current - 1);
    setGeneration(`Created a new sonic concept for "${idea}" with airy synths, pulsing drums, and a cinematic finish.`);
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      'Delete account',
      'This permanently removes your SonicAI account and local studio data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCredits(0);
            setPrompt('');
            setGeneration('');
            Alert.alert('Account deleted', 'Your local account data has been removed.');
          },
        },
      ],
    );
  };

  const restorePurchases = () => {
    Alert.alert(
      'Restore purchases',
      'Purchase restoration needs a configured in-app purchase provider and product catalog.',
    );
  };

  const adStatusLabel =
    rewardedAd.status === 'loaded'
      ? 'Watch rewarded ad'
      : rewardedAd.status === 'loading'
        ? 'Loading rewarded ad...'
        : rewardedAd.status === 'error'
          ? 'Retry rewarded ad'
          : 'Watch rewarded ad';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <View>
          <Text style={styles.appName}>SonicAI</Text>
          <Text style={styles.appSubtitle}>Studio & Stream</Text>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'Stream' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Discover</Text>
            <Text style={styles.sectionSubtitle}>Fresh sounds from the SonicAI community</Text>
            {tracks.map((track, index) => (
              <Pressable key={track.title} style={({ pressed }) => [styles.trackCard, pressed && styles.pressed]}>
                <View style={[styles.trackArt, { backgroundColor: track.accent }]}>
                  <Text style={styles.trackArtText}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackArtist}>{track.artist}</Text>
                </View>
                <Text style={styles.duration}>{track.duration}</Text>
                <Text style={styles.playButton}>▶</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {activeTab === 'AI Studio' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>AI Studio</Text>
            <Text style={styles.sectionSubtitle}>Turn an idea into your next sound</Text>
            <View style={styles.creditRow}>
              <Text style={styles.creditText}>{credits} Sonic credits</Text>
              <Pressable
                style={styles.rewardButton}
                onPress={() => {
                  if (rewardedAd.status === 'error' || rewardedAd.status === 'no-fill') {
                    rewardedAd.retry();
                    return;
                  }
                  if (rewardedAd.status === 'loaded') {
                    rewardedAd.show();
                  } else {
                    rewardedAd.load();
                  }
                }}
              >
                <Text style={styles.rewardButtonText}>{adStatusLabel}</Text>
              </Pressable>
            </View>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe a mood, genre, instruments..."
              placeholderTextColor="#77768A"
              multiline
              style={styles.promptInput}
            />
            <Pressable style={styles.generateButton} onPress={generateTrack}>
              <Text style={styles.generateButtonText}>Generate track · 1 credit</Text>
            </Pressable>
            {generation ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Sonic concept</Text>
                <Text style={styles.resultText}>{generation}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}

        {activeTab === 'Settings' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Text style={styles.sectionSubtitle}>Account and preferences</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingLabel}>Account</Text>
              <Text style={styles.settingValue}>Local creator account</Text>
            </View>
            <Pressable style={styles.settingsButton} onPress={restorePurchases}>
              <Text style={styles.settingsButtonText}>Restore purchases</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={confirmAccountDeletion}>
              <Text style={styles.deleteButtonText}>Delete account</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {Platform.OS !== 'web' ? (
        <View style={styles.banner}>
          <BannerAd
            unitId={BANNER_UNIT_ID}
            size={BannerAdSize.BANNER}
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
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeText]}>
                {tab === 'Stream' ? '♪' : tab === 'AI Studio' ? '✦' : '⚙'}
              </Text>
              <Text style={[styles.tabText, isActive && styles.activeText]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#09090F' },
  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#25242F',
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#7C3AED',
  },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  appName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  appSubtitle: { color: '#A5A3B5', fontSize: 12, marginTop: 2 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 28 },
  sectionTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  sectionSubtitle: { color: '#A5A3B5', fontSize: 14, marginTop: 6, marginBottom: 18 },
  trackCard: {
    height: 82,
    borderRadius: 18,
    backgroundColor: '#171620',
    borderWidth: 1,
    borderColor: '#292736',
    marginBottom: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: { opacity: 0.75 },
  trackArt: {
    width: 62,
    height: 62,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackArtText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  trackInfo: { flex: 1, marginLeft: 12 },
  trackTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  trackArtist: { color: '#A5A3B5', fontSize: 13, marginTop: 4 },
  duration: { color: '#77768A', fontSize: 12, marginRight: 10 },
  playButton: { color: '#C4B5FD', fontSize: 18 },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  creditText: { color: '#C4B5FD', fontSize: 14, fontWeight: '700' },
  rewardButton: {
    backgroundColor: '#312E81',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rewardButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  promptInput: {
    minHeight: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#302D40',
    backgroundColor: '#171620',
    color: '#FFFFFF',
    padding: 16,
    textAlignVertical: 'top',
  },
  generateButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  generateButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  resultCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#171620',
    borderWidth: 1,
    borderColor: '#292736',
  },
  resultLabel: { color: '#C4B5FD', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  resultText: { color: '#FFFFFF', fontSize: 14, lineHeight: 21 },
  settingsCard: {
    borderRadius: 16,
    backgroundColor: '#171620',
    borderWidth: 1,
    borderColor: '#292736',
    padding: 16,
    marginBottom: 12,
  },
  settingLabel: { color: '#77768A', fontSize: 12 },
  settingValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 6 },
  settingsButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#242231',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  settingsButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#2A1417',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { color: '#FCA5A5', fontSize: 15, fontWeight: '800' },
  banner: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090F',
  },
  tabBar: {
    height: 68,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#25242F',
    backgroundColor: '#111019',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeTab: { borderTopWidth: 2, borderTopColor: '#8B5CF6' },
  tabIcon: { color: '#77768A', fontSize: 18, marginBottom: 3 },
  tabText: { color: '#77768A', fontSize: 11, fontWeight: '700' },
  activeText: { color: '#C4B5FD' },
});
