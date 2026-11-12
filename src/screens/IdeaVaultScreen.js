import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import {
  createContentSeries,
  createIdeaCategory,
  deleteContentSeries,
  deleteIdea,
  deleteIdeaCategory,
  getAllIdeas,
  getContentSeries,
  getIdeaCategories,
  parseIdeaTags,
  updateIdeaStatus,
} from '../database/repositories/ideaRepository';
import { useTheme } from '../theme/ThemeContext';

const STATUS_FILTERS = ['All', 'New', 'Selected', 'Planned', 'Converted'];

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function IdeaVaultScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [ideas, setIdeas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [seriesFilter, setSeriesFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [seriesModalVisible, setSeriesModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesDescription, setNewSeriesDescription] = useState('');

  const loadVault = useCallback(async () => {
    try {
      const [ideaRows, categoryRows, seriesRows] = await Promise.all([
        getAllIdeas(), getIdeaCategories(), getContentSeries(),
      ]);
      setIdeas(ideaRows);
      setCategories(categoryRows);
      setSeries(seriesRows);
    } catch (error) {
      console.error('Idea Vault loading error:', error);
      Alert.alert('Idea Vault unavailable', 'Could not load your saved ideas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadVault(); }, [loadVault]));

  const filteredIdeas = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return ideas.filter((idea) => {
      const matchesSearch = !query ||
        (idea.title || '').toLocaleLowerCase().includes(query) ||
        (idea.description || '').toLocaleLowerCase().includes(query) ||
        parseIdeaTags(idea.tags).some((tag) => tag.toLocaleLowerCase().includes(query));
      const matchesStatus = statusFilter === 'All' || idea.status === statusFilter;
      const matchesSeries = seriesFilter === null || idea.series_id === Number(seriesFilter);
      return matchesSearch && matchesStatus && matchesSeries;
    });
  }, [ideas, search, statusFilter, seriesFilter]);

  const confirmDeleteIdea = (idea) => {
    Alert.alert(
      'Delete this idea?',
      `“${idea.title}” will be removed from your Idea Vault. Any video already created from it will remain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIdea(idea.id);
              await loadVault();
            } catch (error) {
              Alert.alert('Could not delete idea', error.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const selectStatus = (idea) => {
    if (idea.converted_video_id) {
      Alert.alert('Converted idea', 'This status is set when the idea is successfully saved as a video.');
      return;
    }
    Alert.alert('Update idea status', `Choose a status for “${idea.title}”.`, [
      ...['New', 'Selected', 'Planned'].map((status) => ({
        text: `${status}${status === idea.status ? ' ✓' : ''}`,
        onPress: async () => {
          try {
            await updateIdeaStatus(idea.id, status);
            await loadVault();
          } catch (error) {
            Alert.alert('Could not update status', error.message || 'Please try again.');
          }
        },
      })),
    ]);
  };

  const startConversion = (idea) => {
    if (idea.converted_video_id) {
      Alert.alert('Already converted', 'This idea has already been converted to a video.');
      return;
    }
    if (idea.status === 'Converted') {
      Alert.alert('Choose a new status first', 'This idea was previously converted but its video is no longer available. Update its status before converting it again.');
      return;
    }
    navigation.navigate('MainTabs', {
      screen: 'Create',
      params: {
        ideaId: idea.id,
        initialTitle: idea.title,
        initialDescription: idea.description || '',
      },
    });
  };

  const addCategory = async () => {
    try {
      await createIdeaCategory(newCategoryName);
      setNewCategoryName('');
      setCategories(await getIdeaCategories());
    } catch (error) {
      Alert.alert('Could not add category', error.message || 'A category with that name may already exist.');
    }
  };

  const removeCategory = (category) => {
    Alert.alert('Delete category?', `Ideas in “${category.name}” will remain and become uncategorized.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIdeaCategory(category.id);
            setCategories(await getIdeaCategories());
            await loadVault();
          } catch (error) {
            Alert.alert('Could not delete category', error.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  const addSeries = async () => {
    try {
      await createContentSeries(newSeriesName, newSeriesDescription);
      setNewSeriesName('');
      setNewSeriesDescription('');
      setSeries(await getContentSeries());
    } catch (error) {
      Alert.alert('Could not add series', error.message || 'Please try again.');
    }
  };

  const removeSeries = (item) => {
    Alert.alert('Delete series?', `Ideas in “${item.name}” will remain and become unassigned.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContentSeries(item.id);
            if (seriesFilter === item.id) setSeriesFilter(null);
            setSeries(await getContentSeries());
            await loadVault();
          } catch (error) {
            Alert.alert('Could not delete series', error.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  const statusColor = (status) => {
    if (status === 'Selected') return colors.secondary;
    if (status === 'Planned') return colors.primary;
    if (status === 'Converted') return colors.success;
    return colors.textSecondary;
  };

  const renderIdea = ({ item }) => {
    const tags = parseIdeaTags(item.tags);
    const hasConvertedVideo = Boolean(item.converted_video_id);
    return (
      <GlassCard padding={15} style={styles.ideaCard}>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('IdeaEditor', { ideaId: item.id })}>
          <View style={styles.ideaHeader}>
            <View style={styles.ideaTitleGroup}>
              <Text numberOfLines={2} style={[styles.ideaTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.ideaMeta, { color: colors.textSecondary }]}>
                {item.category_name || 'Uncategorized'}{item.series_name ? `  ·  ${item.series_name}` : ''}
              </Text>
            </View>
            <Ionicons name="create-outline" size={18} color={colors.textMuted} />
          </View>
          {item.description ? <Text numberOfLines={3} style={[styles.ideaDescription, { color: colors.textSecondary }]}>{item.description}</Text> : null}
          {tags.length > 0 ? (
            <View style={styles.tagRow}>
              {tags.slice(0, 5).map((tag) => (
                <Text key={`${item.id}-${tag}`} style={[styles.tag, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{tag}</Text>
              ))}
            </View>
          ) : null}
          <Text style={[styles.dateText, { color: colors.textMuted }]}>Updated {formatDate(item.updated_at)}</Text>
        </Pressable>

        <View style={[styles.ideaActions, { borderTopColor: colors.border }]}>
          <Pressable accessibilityRole="button" onPress={() => selectStatus(item)} style={[styles.statusChip, { backgroundColor: `${statusColor(item.status)}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
            {!hasConvertedVideo ? <Ionicons name="chevron-down" size={13} color={statusColor(item.status)} /> : null}
          </Pressable>
          {item.status === 'Converted' && hasConvertedVideo ? (
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('VideoDetails', { videoId: item.converted_video_id })} style={styles.convertedLabel}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={[styles.convertedText, { color: colors.success }]}>View video</Text>
            </Pressable>
          ) : item.status === 'Converted' ? (
            <View style={styles.convertedLabel}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
              <Text style={[styles.convertedText, { color: colors.warning }]}>Video removed</Text>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => startConversion(item)} style={[styles.convertButton, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="videocam-outline" size={16} color={colors.primary} />
              <Text style={[styles.convertText, { color: colors.primary }]}>Convert to Video</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.title}`} onPress={() => confirmDeleteIdea(item)} hitSlop={8} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
          </Pressable>
        </View>
      </GlassCard>
    );
  };

  const listHeader = (
    <View>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR CREATIVE LIBRARY</Text>
          <Text style={[styles.title, { color: colors.text }]}>Idea Vault</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Keep promising concepts organized and ready to grow.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Create idea" onPress={() => navigation.navigate('IdeaEditor')} style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={19} color={colors.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search titles, descriptions or tags..." placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} />
        {search ? <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></Pressable> : null}
      </View>

      <View style={styles.manageRow}>
        <Pressable onPress={() => setCategoryModalVisible(true)} style={[styles.manageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="albums-outline" size={16} color={colors.primary} />
          <Text style={[styles.manageText, { color: colors.text }]}>Categories</Text>
        </Pressable>
        <Pressable onPress={() => setSeriesModalVisible(true)} style={[styles.manageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="layers-outline" size={16} color={colors.primary} />
          <Text style={[styles.manageText, { color: colors.text }]}>Series</Text>
        </Pressable>
      </View>

      <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>SERIES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
        {[{ id: null, name: 'All ideas' }, ...series].map((item) => {
          const selected = seriesFilter === item.id;
          return (
            <Pressable key={item.id === null ? 'all-series' : `series-${item.id}`} onPress={() => setSeriesFilter(item.id)} style={[styles.filterChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primaryLight : colors.surface }]}>
              <Text style={[styles.filterChipText, { color: selected ? colors.primary : colors.textSecondary }]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.filterLabel, { color: colors.textSecondary, marginTop: 16 }]}>STATUS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
        {STATUS_FILTERS.map((status) => {
          const selected = statusFilter === status;
          return (
            <Pressable key={status} onPress={() => setStatusFilter(status)} style={[styles.filterChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primaryLight : colors.surface }]}>
              <Text style={[styles.filterChipText, { color: selected ? colors.primary : colors.textSecondary }]}>{status}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>{seriesFilter ? series.find((item) => item.id === Number(seriesFilter))?.name || 'Series' : 'Your ideas'}</Text>
        <Text style={[styles.resultsCount, { color: colors.textMuted }]}>{filteredIdeas.length} {filteredIdeas.length === 1 ? 'idea' : 'ideas'}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FlatList
        data={filteredIdeas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderIdea}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!loading ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name="bulb-outline" size={27} color={colors.primary} /></View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{ideas.length ? 'No matching ideas' : 'Your Idea Vault is ready'}</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>{ideas.length ? 'Try another search or filter.' : 'Save a video concept here, then turn it into a project whenever you are ready.'}</Text>
          </View>
        ) : null}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={categoryModalVisible} transparent animationType="slide" onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View><Text style={[styles.modalTitle, { color: colors.text }]}>Idea categories</Text><Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Built-in and custom categories</Text></View>
              <Pressable onPress={() => setCategoryModalVisible(false)} hitSlop={10}><Ionicons name="close" size={22} color={colors.textSecondary} /></Pressable>
            </View>
            <View style={styles.createRow}>
              <TextInput value={newCategoryName} onChangeText={setNewCategoryName} placeholder="New category name" placeholderTextColor={colors.textMuted} maxLength={40} style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} />
              <Pressable onPress={addCategory} style={[styles.smallAddButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={21} color="#FFFFFF" /></Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {categories.map((category) => (
                <View key={category.id} style={[styles.modalListRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{category.name}</Text>
                  {category.is_default ? <Text style={[styles.defaultLabel, { color: colors.textMuted }]}>DEFAULT</Text> : (
                    <Pressable onPress={() => removeCategory(category)} hitSlop={10}><Ionicons name="trash-outline" size={17} color={colors.danger} /></Pressable>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={seriesModalVisible} transparent animationType="slide" onRequestClose={() => setSeriesModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View><Text style={[styles.modalTitle, { color: colors.text }]}>Content series</Text><Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Select a series to view its ideas</Text></View>
              <Pressable onPress={() => setSeriesModalVisible(false)} hitSlop={10}><Ionicons name="close" size={22} color={colors.textSecondary} /></Pressable>
            </View>
            <TextInput value={newSeriesName} onChangeText={setNewSeriesName} placeholder="Series name" placeholderTextColor={colors.textMuted} maxLength={80} style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} />
            <TextInput value={newSeriesDescription} onChangeText={setNewSeriesDescription} placeholder="Description (optional)" placeholderTextColor={colors.textMuted} maxLength={180} style={[styles.modalInput, styles.seriesDescriptionInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} />
            <Pressable onPress={addSeries} style={[styles.createSeriesButton, { backgroundColor: colors.primary }]}><Ionicons name="add-circle-outline" size={18} color="#FFFFFF" /><Text style={styles.createSeriesText}>Create series</Text></Pressable>
            <ScrollView style={styles.modalList}>
              <Pressable onPress={() => { setSeriesFilter(null); setSeriesModalVisible(false); }} style={[styles.modalListRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalItemText, { color: colors.text }]}>All ideas</Text>
                {seriesFilter === null ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : null}
              </Pressable>
              {series.map((item) => (
                <View key={item.id} style={[styles.modalListRow, { borderBottomColor: colors.border }]}>
                  <Pressable style={styles.seriesSelect} onPress={() => { setSeriesFilter(item.id); setSeriesModalVisible(false); }}>
                    <Text numberOfLines={1} style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                    {seriesFilter === item.id ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : null}
                  </Pressable>
                  <Pressable onPress={() => removeSeries(item)} hitSlop={10} style={styles.seriesDelete}><Ionicons name="trash-outline" size={17} color={colors.danger} /></Pressable>
                </View>
              ))}
              {series.length === 0 ? <Text style={[styles.emptySeries, { color: colors.textMuted }]}>No series yet. Your ideas can also stay unassigned.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 120, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 17 },
  backButton: { width: 41, height: 41, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  headerText: { flex: 1, marginRight: 12 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  title: { fontSize: 29, fontWeight: '800', letterSpacing: -0.7, marginTop: 4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  addButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  search: { height: 49, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 13 },
  manageRow: { flexDirection: 'row', gap: 10, marginBottom: 19 },
  manageButton: { flex: 1, height: 42, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  manageText: { fontSize: 11, fontWeight: '700' },
  filterLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 9 },
  chipList: { gap: 8, paddingRight: 20 },
  filterChip: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 8 },
  filterChipText: { fontSize: 10, fontWeight: '700' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 12 },
  resultsTitle: { fontSize: 17, fontWeight: '800' },
  resultsCount: { fontSize: 10, fontWeight: '600' },
  ideaCard: { marginBottom: 12, borderRadius: 19 },
  ideaHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  ideaTitleGroup: { flex: 1, marginRight: 8 },
  ideaTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  ideaMeta: { fontSize: 10, marginTop: 5 },
  ideaDescription: { fontSize: 11, lineHeight: 17, marginTop: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { fontSize: 9, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, overflow: 'hidden' },
  dateText: { fontSize: 9, marginTop: 10 },
  ideaActions: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 9 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
  convertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, marginLeft: 'auto' },
  convertText: { fontSize: 9, fontWeight: '800' },
  convertedLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  convertedText: { fontSize: 9, fontWeight: '700' },
  deleteButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emptyState: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 3 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptyDescription: { fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7, maxWidth: 270 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '82%', minHeight: '55%', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 11, marginTop: 4 },
  createRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modalInput: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 12 },
  smallAddButton: { width: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalList: { flexGrow: 0 },
  modalListRow: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  modalItemText: { flex: 1, fontSize: 12, fontWeight: '600' },
  defaultLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  seriesDescriptionInput: { marginTop: 8 },
  createSeriesButton: { height: 43, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 10, marginBottom: 12 },
  createSeriesText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  seriesSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 38 },
  seriesDelete: { width: 38, minHeight: 38, justifyContent: 'center', alignItems: 'flex-end' },
  emptySeries: { fontSize: 11, textAlign: 'center', paddingVertical: 20 },
});
