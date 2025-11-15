import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BADGE_MAP from '../../src/data/badges';

const BadgeDetailPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const badge = BADGE_MAP[id] || { 
    id: id, 
    title: id, 
    description: 'No description available.',
    color: '#374151',
    icon: '🏅'
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badge Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Badge Summary */}
        <View style={styles.summaryPanel}>
          <View style={styles.badgeIconContainer}>
            <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeIconText}>{badge.icon}</Text>
            </View>
          </View>
          
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeTitle}>{badge.title}</Text>
            <Text style={styles.badgeSubtitle}>Badge · {badge.id}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </View>

          <TouchableOpacity 
            style={styles.leaderboardButton}
            onPress={() => router.push('/leaderboard')}
          >
            <Text style={styles.leaderboardButtonText}>View Leaderboards</Text>
          </TouchableOpacity>
        </View>

        {/* Rules Panel */}
        <View style={styles.rulesPanel}>
          <Text style={styles.rulesTitle}>How the monthly tier is calculated</Text>
          <Text style={styles.rulesDescription}>
            Each calendar month we compute two metrics for every contributing user: their review count for the month and the community agreement percentage on those reviews. We select a contribution level from I (highest) to IV, then select a medal (Diamond, Gold, Silver, Bronze) based on agreement.
          </Text>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.levelColumn]}>Level</Text>
              <Text style={[styles.tableHeaderCell, styles.reviewsColumn]}>Reviews</Text>
              <Text style={[styles.tableHeaderCell, styles.medalColumn]}>Diamond</Text>
              <Text style={[styles.tableHeaderCell, styles.medalColumn]}>Gold</Text>
              <Text style={[styles.tableHeaderCell, styles.medalColumn]}>Silver</Text>
              <Text style={[styles.tableHeaderCell, styles.medalColumn]}>Bronze</Text>
            </View>

            {[
              { level: 'Level I', reviews: '> 15', diamond: '> 85%', gold: '75% – 85%', silver: '65% – 75%', bronze: '< 65%' },
              { level: 'Level II', reviews: '> 12', diamond: '> 85%', gold: '75% – 85%', silver: '65% – 75%', bronze: '< 65%' },
              { level: 'Level III', reviews: '> 10', diamond: '> 85%', gold: '75% – 85%', silver: '65% – 75%', bronze: '< 65%' },
              { level: 'Level IV', reviews: '≤ 10', diamond: '> 85%', gold: '75% – 85%', silver: '65% – 75%', bronze: '< 65%' },
            ].map((row, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.levelColumn]}>{row.level}</Text>
                <Text style={[styles.tableCell, styles.reviewsColumn]}>{row.reviews}</Text>
                <Text style={[styles.tableCell, styles.medalColumn]}>{row.diamond}</Text>
                <Text style={[styles.tableCell, styles.medalColumn]}>{row.gold}</Text>
                <Text style={[styles.tableCell, styles.medalColumn]}>{row.silver}</Text>
                <Text style={[styles.tableCell, styles.medalColumn]}>{row.bronze}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.notes}>
            <Text style={styles.notesTitle}>Notes: </Text>
            Agreement is the average of agreement vote values on a user's reviews for the month (values 0.0–1.0, converted to percent). The system first determines the level from review count, then selects the medal using agreement. Monthly-tier badges replace previous monthly-tier badges so users keep only the most recent monthly badge.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryPanel: {
    backgroundColor: '#1f2937',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  badgeIconContainer: {
    marginBottom: 16,
  },
  badgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconText: {
    fontSize: 32,
    textAlign: 'center',
  },
  badgeInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 20,
  },
  leaderboardButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  leaderboardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  rulesPanel: {
    backgroundColor: '#1f2937',
    padding: 24,
    borderRadius: 12,
  },
  rulesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  rulesDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 20,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 12,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  tableHeaderCell: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tableCell: {
    fontSize: 12,
    color: '#d1d5db',
  },
  levelColumn: {
    width: '15%',
  },
  reviewsColumn: {
    width: '15%',
  },
  medalColumn: {
    width: '17.5%',
  },
  notes: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  notesTitle: {
    fontWeight: 'bold',
  },
});

export default BadgeDetailPage;