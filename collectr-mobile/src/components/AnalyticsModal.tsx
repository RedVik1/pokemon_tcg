import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { safePrice, formatMoney, formatRarity, getChartDataFromHistory } from '../utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HORIZONTAL_PADDING = 32;

interface CardData {
  id?: string | number;
  pokemon_tcg_id?: string;
  name: string;
  set_name: string;
  rarity?: string;
  price?: number | string;
  image_url?: string;
  history?: Record<string, number[]>;
  user_id?: string;
}

interface CollectionItem {
  id: string | number;
  card: CardData;
  quantity?: number;
  instance_ids?: (string | number)[];
}

interface AnalyticsModalProps {
  coll: CollectionItem | CardData;
  onClose: () => void;
  onAdd: (card: CardData) => void;
  onDelete: (coll: CollectionItem) => void;
  isPortfolio: boolean;
}

const TIMEFRAMES = ['1W', '1M', '1Y'];
const GRADES = ['Raw', 'PSA 9', 'PSA 10'];

export default function AnalyticsModal({ coll, onClose, onAdd, onDelete, isPortfolio }: AnalyticsModalProps) {
  const insets = useSafeAreaInsets();
  const card = (coll as CollectionItem).card || (coll as CardData);
  const basePrice = safePrice(card.price);
  const [timeframe, setTimeframe] = useState('1M');
  const [grade, setGrade] = useState('Raw');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setTimeframe('1M');
    setGrade('Raw');
    setAdding(false);
  }, [coll]);

  const chartData = getChartDataFromHistory(card?.history, timeframe, grade);
  const currentPrice = chartData.data.length > 0 ? chartData.data[chartData.data.length - 1].price : basePrice * (grade === 'PSA 10' ? 4.2 : grade === 'PSA 9' ? 1.8 : 1.0);
  const setParts = (card?.set_name || '').split(' • ');
  const setName = setParts[0];
  const rarity = formatRarity(card?.rarity || setParts[1]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd(card);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = () => {
    onDelete(coll as CollectionItem);
    onClose();
  };

  const openTCGPlayer = () => {
    Linking.openURL(`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`);
  };

  const openPSA = () => {
    Linking.openURL(`https://www.psacard.com/search#q=${encodeURIComponent(card.name)}`);
  };

  const chartHeight = 160;
  const chartWidth = SCREEN_WIDTH - 80 - CHART_HORIZONTAL_PADDING;
  const maxPrice = Math.max(...chartData.data.map((d) => d.price), 1);
  const minPrice = Math.min(...chartData.data.map((d) => d.price), 0);
  const priceRange = maxPrice - minPrice || 1;

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={[styles.mobileHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color="#2dd4bf" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {card.name}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleSection}>
            <Text style={styles.setTitle}>{setName} • {rarity}</Text>
            <Text style={styles.cardName}>{card.name}</Text>
          </View>

          <View style={styles.contentGrid}>
            <View style={styles.imageSection}>
              {card.image_url ? (
                <Image source={{ uri: card.image_url }} style={styles.cardImage} resizeMode="contain" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="box" size={48} color="#334155" />
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
              {!isPortfolio ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.fullAddButton]}
                  onPress={handleAdd}
                  disabled={adding}
                  activeOpacity={0.8}
                >
                  {adding ? (
                    <ActivityIndicator size="small" color="#0a0a0a" />
                  ) : (
                    <Text style={styles.fullAddText}>Add to Portfolio</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.portfolioActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addCopyButton]}
                    onPress={handleAdd}
                    disabled={adding}
                    activeOpacity={0.8}
                  >
                    {adding ? (
                      <ActivityIndicator size="small" color="#14b8a6" />
                    ) : (
                      <>
                        <Feather name="plus" size={18} color="#14b8a6" />
                        <Text style={styles.addCopyText}>Add Copy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                  >
                    <Feather name="trash-2" size={18} color="#f43f5e" />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.chartSection}>
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartTitleRow}>
                    <Feather name="trending-up" size={16} color="#14b8a6" />
                    <Text style={styles.chartTitle}>Market History</Text>
                    {chartData.isEstimated && (
                      <View style={styles.estimatedBadge}>
                        <Text style={styles.estimatedText}>Estimated</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.gradeSelector}>
                  <View style={styles.selectorGroup}>
                    {GRADES.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.selectorButton, grade === g && styles.selectorButtonActive]}
                        onPress={() => setGrade(g)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.selectorButtonText,
                            grade === g && styles.selectorButtonTextActive,
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.selectorGroup}>
                    {TIMEFRAMES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.selectorButton, timeframe === t && styles.selectorTimeframeActive]}
                        onPress={() => setTimeframe(t)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.selectorButtonText,
                            timeframe === t && styles.selectorTimeframeTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>${formatMoney(currentPrice)}</Text>
                  <Text
                    style={[
                      styles.changePercent,
                      { color: chartData.isUp ? '#34d399' : '#fb7185' },
                    ]}
                  >
                    {chartData.isUp ? '▲' : '▼'} {chartData.percent}%
                  </Text>
                </View>

                <View style={styles.chartContainer}>
                  {chartData.data.length > 0 ? (
                    <View style={styles.chartArea}>
                      {chartData.data.map((point, idx) => {
                        const x = CHART_HORIZONTAL_PADDING + (idx / Math.max(chartData.data.length - 1, 1)) * chartWidth;
                        const y =
                          chartHeight -
                          ((point.price - minPrice) / priceRange) * (chartHeight - 20) -
                          10;
                        const prevIdx = idx > 0 ? idx - 1 : 0;
                        const prevPoint = chartData.data[prevIdx];
                        const prevX = CHART_HORIZONTAL_PADDING + (prevIdx / Math.max(chartData.data.length - 1, 1)) * chartWidth;
                        const prevY =
                          chartHeight -
                          ((prevPoint.price - minPrice) / priceRange) * (chartHeight - 20) -
                          10;

                        return (
                          <View key={idx} style={StyleSheet.absoluteFill}>
                            {idx > 0 && (
                              <View
                                style={[
                                  styles.chartLine,
                                  {
                                    left: prevX,
                                    top: prevY,
                                    width: Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2)),
                                    transform: [
                                      {
                                        rotate: `${Math.atan2(y - prevY, x - prevX)}rad`,
                                      },
                                    ],
                                  },
                                ]}
                              />
                            )}
                            {idx === chartData.data.length - 1 && (
                              <View
                                style={[
                                  styles.chartDot,
                                  { left: x - 4, top: y - 4 },
                                ]}
                              />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.noChartContainer}>
                      <Text style={styles.noChartText}>No price history available</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Condition</Text>
                  <Text style={styles.infoValue}>{grade}</Text>
                </View>
                <TouchableOpacity style={[styles.infoCard, styles.tcgCard]} onPress={openTCGPlayer} activeOpacity={0.7}>
                  <Feather name="shopping-bag" size={18} color="#2dd4bf" style={{ marginBottom: 4 }} />
                  <Text style={styles.tcgText}>TCGPlayer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.infoCard, styles.psaCard]} onPress={openPSA} activeOpacity={0.7}>
                  <Feather name="external-link" size={18} color="#fb7185" style={{ marginBottom: 4 }} />
                  <Text style={styles.psaText}>PSA Grade</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(15,15,15,0.95)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginLeft: -8,
    minHeight: 44,
  },
  backText: {
    color: '#2dd4bf',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    maxWidth: '45%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
  },
  setTitle: {
    color: '#14b8a6',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 6,
  },
  cardName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
  },
  contentGrid: {
    gap: 16,
  },
  imageSection: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    maxWidth: 200,
    height: 260,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    maxWidth: 200,
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 16,
    gap: 12,
  },
  noImageText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  fullAddButton: {
    width: '100%',
    backgroundColor: '#14b8a6',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  fullAddText: {
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  portfolioActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  addCopyButton: {
    flex: 1,
    backgroundColor: 'rgba(20,184,166,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
  },
  addCopyText: {
    color: '#14b8a6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  removeButton: {
    flex: 1,
    backgroundColor: 'rgba(244,63,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)',
  },
  removeText: {
    color: '#f43f5e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chartSection: {
    gap: 16,
  },
  chartCard: {
    backgroundColor: '#161616',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  estimatedBadge: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  estimatedText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gradeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  selectorGroup: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectorButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 36,
  },
  selectorButtonActive: {
    backgroundColor: '#14b8a6',
  },
  selectorTimeframeActive: {
    backgroundColor: '#333',
  },
  selectorButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  selectorButtonTextActive: {
    color: '#0a0a0a',
  },
  selectorTimeframeTextActive: {
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 12,
  },
  currentPrice: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  changePercent: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartContainer: {
    height: 160,
    position: 'relative',
    paddingHorizontal: 8,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  chartLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#14b8a6',
    borderRadius: 1.5,
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14b8a6',
  },
  noChartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noChartText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoValue: {
    color: '#2dd4bf',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tcgCard: {
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderColor: 'rgba(20,184,166,0.2)',
  },
  tcgText: {
    color: '#2dd4bf',
    fontWeight: 'bold',
    fontSize: 12,
  },
  psaCard: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderColor: 'rgba(244,63,94,0.2)',
  },
  psaText: {
    color: '#fb7185',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
