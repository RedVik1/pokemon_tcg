import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { safePrice, formatMoney, formatRarity, getChartDataFromHistory } from '../utils';

interface CardData {
  id?: string | number;
  pokemon_tcg_id?: string;
  name: string;
  set_name: string;
  rarity?: string;
  price?: number | string;
  image_url?: string;
  history?: Record<string, number[]>;
}

interface CollectionItem {
  id: string | number;
  card: CardData;
  quantity?: number;
  instance_ids?: (string | number)[];
}

interface VaultCardProps {
  coll: CollectionItem | CardData;
  onOpenAnalytics: (coll: CollectionItem | CardData) => void;
  onAdd: (card: CardData) => void;
  onDelete: (coll: CollectionItem | CollectionItem) => void;
  isPortfolio: boolean;
  quantity?: number;
  inPortfolio?: boolean;
  isAdding?: boolean;
  isDeleting?: boolean;
}

export default function VaultCard({
  coll,
  onOpenAnalytics,
  onAdd,
  onDelete,
  isPortfolio,
  quantity = 1,
  inPortfolio = false,
  isAdding = false,
  isDeleting = false,
}: VaultCardProps) {
  const card = (coll as CollectionItem).card || (coll as CardData);
  const basePrice = safePrice(card?.price);
  const displayPrice = isPortfolio ? basePrice * quantity : basePrice;
  const chartData = getChartDataFromHistory(card?.history, '1M', 'Raw');
  const setParts = (card?.set_name || '').split(' • ');
  const setName = setParts[0];
  const rarity = formatRarity(card?.rarity || setParts[1]);

  const [justAdded, setJustAdded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const wasAddingRef = useRef(false);

  useEffect(() => {
    if (isAdding) setJustAdded(false);
  }, [isAdding]);

  useEffect(() => {
    if (wasAddingRef.current && !isAdding) {
      setJustAdded(true);
      const t = setTimeout(() => setJustAdded(false), 1500);
      return () => clearTimeout(t);
    }
    wasAddingRef.current = isAdding;
  }, [isAdding]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleAdd = useCallback(() => {
    if (!isAdding && !isDeleting) {
      onAdd(card);
    }
  }, [card, onAdd, isAdding, isDeleting]);

  const handleDelete = useCallback(() => {
    if (!isAdding && !isDeleting) {
      onDelete(coll as CollectionItem);
    }
  }, [coll, onDelete, isAdding, isDeleting]);

  const busy = isAdding || isDeleting;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !busy && onOpenAnalytics(coll)}
        disabled={busy}
      >
        <View style={styles.imageContainer}>
          {card?.image_url ? (
            <Image
              source={{ uri: card.image_url }}
              style={styles.cardImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="box" size={40} color="#475569" />
            </View>
          )}
          {justAdded && (
            <View style={styles.justAddedOverlay}>
              <View style={styles.justAddedBadge}>
                <Feather name="check-circle" size={16} color="#0a0a0a" />
                <Text style={styles.justAddedText}>Added</Text>
              </View>
            </View>
          )}
          {inPortfolio && !isPortfolio && !justAdded && (
            <View style={styles.ownedBadge}>
              <Feather name="check-circle" size={10} color="#0a0a0a" />
              <Text style={styles.ownedText}>OWNED</Text>
            </View>
          )}
          {quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>x{quantity}</Text>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.cardName} numberOfLines={1}>
            {card?.name}
          </Text>
          <Text style={styles.cardSet} numberOfLines={1}>
            {setName} • {rarity}
          </Text>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceText}>${formatMoney(displayPrice)}</Text>
              {isPortfolio && quantity > 1 && (
                <Text style={styles.perEachText}>${formatMoney(basePrice)} / ea</Text>
              )}
            </View>
            <View style={styles.trendContainer}>
              <Feather
                name={chartData.isUp ? 'trending-up' : 'trending-down'}
                size={11}
                color={chartData.isUp ? '#34d399' : '#fb7185'}
              />
              <Text style={[styles.trendText, { color: chartData.isUp ? '#34d399' : '#fb7185' }]}>
                {chartData.isUp ? '+' : '-'}{chartData.percent}%
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          {!isPortfolio ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.addButton]}
              onPress={handleAdd}
              disabled={busy}
              activeOpacity={0.7}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#14b8a6" />
              ) : (
                <Feather name="plus" size={18} color="#14b8a6" />
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton, styles.actionBorderRight]}
                onPress={handleAdd}
                disabled={busy}
                activeOpacity={0.7}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#14b8a6" />
                ) : (
                  <Feather name="plus" size={18} color="#14b8a6" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
                disabled={busy}
                activeOpacity={0.7}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#f43f5e" />
                ) : (
                  <Feather name="trash-2" size={18} color="#f43f5e" />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    maxWidth: 140,
    height: 180,
  },
  placeholderImage: {
    width: 140,
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  justAddedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,184,166,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  justAddedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14b8a6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
  },
  justAddedText: {
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ownedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#14b8a6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ownedText: {
    color: '#0a0a0a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  quantityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#14b8a6',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  quantityText: {
    color: '#0a0a0a',
    fontWeight: '900',
    fontSize: 12,
  },
  infoContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#141414',
  },
  cardName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
  },
  cardSet: {
    color: 'rgba(20,184,166,0.7)',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  perEachText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBorderRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  addButton: {
    backgroundColor: 'transparent',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
});
