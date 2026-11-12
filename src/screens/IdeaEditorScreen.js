import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
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
  createIdea,
  getContentSeries,
  getIdeaById,
  getIdeaCategories,
  parseIdeaTags,
  updateIdea,
} from '../database/repositories/ideaRepository';
import { getAllChannels } from '../database/repositories/channelRepository';
import { useTheme } from '../theme/ThemeContext';

const EDITABLE_STATUSES = ['New', 'Selected', 'Planned'];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SelectionModal({ visible, title, items, selectedId, onSelect, onClose, colors, emptyLabel, emptyMessage, emptyAction }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color={colors.textSecondary} /></Pressable>
          </View>
          <ScrollView style={styles.selectionList}>
            <Pressable onPress={() => onSelect(null)} style={[styles.selectionRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.selectionText, { color: colors.text }]}>{emptyLabel}</Text>
              {selectedId === null ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : null}
            </Pressable>
            {items.map((item) => (
              <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.selectionRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.selectionText, { color: colors.text }]}>{item.name}</Text>
                {selectedId === item.id ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : null}
              </Pressable>
            ))}
            {items.length === 0 ? (
              <View style={styles.emptySelectionWrap}>
                <Text style={[styles.emptySelection, { color: colors.textMuted }]}>{emptyMessage || 'Create one from the Idea Vault.'}</Text>
                {emptyAction ? <Pressable onPress={emptyAction.onPress} style={styles.emptyAction}><Text style={[styles.emptyActionText, { color: colors.primary }]}>{emptyAction.label}</Text></Pressable> : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function IdeaEditorScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const ideaId = route?.params?.ideaId;
  const isEditing = Boolean(ideaId);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [channels, setChannels] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    notes: '',
    tagsText: '',
    category_id: null,
    series_id: null,
    channel_id: null,
    status: 'New',
    converted_video_id: null,
    created_at: null,
    updated_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorySelectorVisible, setCategorySelectorVisible] = useState(false);
  const [seriesSelectorVisible, setSeriesSelectorVisible] = useState(false);
  const [channelSelectorVisible, setChannelSelectorVisible] = useState(false);

  useEffect(() => {
    let active = true;
    const loadEditor = async () => {
      try {
        const [categoryRows, seriesRows, channelRows, idea] = await Promise.all([
          getIdeaCategories(),
          getContentSeries(),
          getAllChannels(),
          isEditing ? getIdeaById(ideaId) : Promise.resolve(null),
        ]);
        if (!active) return;
        setCategories(categoryRows);
        setSeries(seriesRows);
        setChannels(channelRows);
        if (isEditing) {
          if (!idea) {
            Alert.alert('Idea not found', 'This idea may have been deleted.');
            navigation.goBack();
            return;
          }
          setForm({
            ...idea,
            tagsText: parseIdeaTags(idea.tags).join(', '),
          });
        }
      } catch (error) {
        console.error('Idea editor loading error:', error);
        Alert.alert('Could not load idea', 'Please return to the Idea Vault and try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEditor();
    return () => { active = false; };
  }, [ideaId, isEditing, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getAllChannels().then((rows) => {
        if (!active) return;
        setChannels(rows);
        setForm((current) => rows.some((channel) => channel.id === current.channel_id) || current.channel_id === null
          ? current
          : { ...current, channel_id: null });
      }).catch((error) => {
        console.error('Idea editor channel loading error:', error);
      });
      return () => { active = false; };
    }, [])
  );

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === form.category_id),
    [categories, form.category_id]
  );
  const selectedSeries = useMemo(
    () => series.find((item) => item.id === form.series_id),
    [series, form.series_id]
  );
  const selectedChannel = useMemo(
    () => channels.find((item) => item.id === form.channel_id),
    [channels, form.channel_id]
  );
  const linkedToVideo = Boolean(form.converted_video_id);
  const isLockedConverted = form.status === 'Converted' && linkedToVideo;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Add a title for this idea before saving.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: form.title,
        description: form.description,
        notes: form.notes,
        tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        category_id: form.category_id,
        series_id: form.series_id,
        channel_id: form.channel_id,
        status: form.status,
      };
      if (isEditing) await updateIdea(ideaId, data);
      else await createIdea(data);

      Alert.alert('Idea saved', 'Your idea is stored locally.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Could not save idea', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{isEditing ? 'REFINE YOUR CONCEPT' : 'SAVE A NEW CONCEPT'}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{isEditing ? 'Edit Idea' : 'New Idea'}</Text>
          </View>
        </View>

        {isLockedConverted ? (
          <View style={[styles.convertedNotice, { backgroundColor: `${colors.success}16`, borderColor: `${colors.success}55` }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.convertedNoticeText, { color: colors.textSecondary }]}>This idea has been converted. Its status is linked to the saved video.</Text>
          </View>
        ) : null}

        <GlassCard padding={17} style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Idea details</Text>
          <Text style={[styles.label, { color: colors.text }]}>TITLE *</Text>
          <TextInput
            accessibilityLabel="Idea title"
            value={form.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="What is the video about?"
            placeholderTextColor={colors.textMuted}
            maxLength={120}
            returnKeyType="next"
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />
          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>DESCRIPTION</Text>
          <TextInput
            accessibilityLabel="Idea description"
            value={form.description || ''}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Add a short summary"
            placeholderTextColor={colors.textMuted}
            maxLength={800}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.descriptionInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />
          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>NOTES</Text>
          <TextInput
            accessibilityLabel="Idea notes"
            value={form.notes || ''}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Research, hooks, or details to remember"
            placeholderTextColor={colors.textMuted}
            maxLength={4000}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.notesInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />
          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>TAGS</Text>
          <TextInput
            accessibilityLabel="Idea tags"
            value={form.tagsText}
            onChangeText={(value) => updateField('tagsText', value)}
            placeholder="Separate tags with commas"
            placeholderTextColor={colors.textMuted}
            maxLength={300}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />
          <Text style={[styles.helperText, { color: colors.textMuted }]}>Example: lighting, beginner, gear</Text>
        </GlassCard>

        <GlassCard padding={17} style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Organization</Text>
          <Text style={[styles.label, { color: colors.text }]}>CATEGORY</Text>
          <Pressable onPress={() => setCategorySelectorVisible(true)} style={[styles.selectButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="albums-outline" size={18} color={colors.primary} />
            <Text style={[styles.selectText, { color: selectedCategory ? colors.text : colors.textMuted }]}>{selectedCategory?.name || 'Choose a category'}</Text>
            <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
          </Pressable>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>CONTENT SERIES</Text>
          <Pressable onPress={() => setSeriesSelectorVisible(true)} style={[styles.selectButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={[styles.selectText, { color: selectedSeries ? colors.text : colors.textMuted }]}>{selectedSeries?.name || 'No series'}</Text>
            <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
          </Pressable>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>CHANNEL (OPTIONAL)</Text>
          <Pressable accessibilityRole="button" onPress={() => setChannelSelectorVisible(true)} style={[styles.selectButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="logo-youtube" size={18} color={colors.primary} />
            <Text style={[styles.selectText, { color: selectedChannel ? colors.text : colors.textMuted }]}>{selectedChannel?.name || 'No channel selected'}</Text>
            <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
          </Pressable>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>STATUS</Text>
          <View style={styles.statusOptions}>
            {(isLockedConverted ? ['Converted'] : EDITABLE_STATUSES).map((status) => {
              const active = form.status === status;
              return (
                <Pressable key={status} accessibilityRole="radio" accessibilityState={{ checked: active, disabled: isLockedConverted }} disabled={isLockedConverted} onPress={() => updateField('status', status)} style={[styles.statusOption, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryLight : colors.surface }]}>
                  <Text style={[styles.statusOptionText, { color: active ? colors.primary : colors.textSecondary }]}>{status}</Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {isEditing ? (
          <GlassCard padding={15} style={styles.datesCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={[styles.dateLabel, { color: colors.textMuted }]}>CREATED</Text>
                <Text style={[styles.dateValue, { color: colors.textSecondary }]}>{formatDate(form.created_at)}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={[styles.dateLabel, { color: colors.textMuted }]}>LAST UPDATED</Text>
                <Text style={[styles.dateValue, { color: colors.textSecondary }]}>{formatDate(form.updated_at)}</Text>
              </View>
            </View>
          </GlassCard>
        ) : null}

        <Pressable accessibilityRole="button" disabled={saving} onPress={save} style={({ pressed }) => [styles.saveButton, { backgroundColor: pressed ? colors.secondary : colors.primary, opacity: saving ? 0.7 : 1 }]}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />}
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : isEditing ? 'Save changes' : 'Save idea'}</Text>
        </Pressable>
      </ScrollView>

      <SelectionModal
        visible={categorySelectorVisible}
        title="Choose a category"
        items={categories}
        selectedId={form.category_id}
        emptyLabel="Uncategorized"
        colors={colors}
        onClose={() => setCategorySelectorVisible(false)}
        onSelect={(id) => { updateField('category_id', id); setCategorySelectorVisible(false); }}
      />
      <SelectionModal
        visible={seriesSelectorVisible}
        title="Assign to a series"
        items={series}
        selectedId={form.series_id}
        emptyLabel="No series"
        colors={colors}
        onClose={() => setSeriesSelectorVisible(false)}
        onSelect={(id) => { updateField('series_id', id); setSeriesSelectorVisible(false); }}
      />
      <SelectionModal
        visible={channelSelectorVisible}
        title="Choose a channel"
        items={channels}
        selectedId={form.channel_id}
        emptyLabel="No channel"
        emptyMessage="No channels available"
        emptyAction={{
          label: 'Open channel management',
          onPress: () => {
            setChannelSelectorVisible(false);
            navigation.navigate('MainTabs', { screen: 'Channels' });
          },
        }}
        colors={colors}
        onClose={() => setChannelSelectorVisible(false)}
        onSelect={(id) => { updateField('channel_id', id); setChannelSelectorVisible(false); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 45 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 21 },
  backButton: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 25, fontWeight: '800', marginTop: 4 },
  card: { marginBottom: 15, borderRadius: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12 },
  descriptionInput: { minHeight: 85, maxHeight: 135 },
  notesInput: { minHeight: 110, maxHeight: 220 },
  helperText: { fontSize: 9, marginTop: 5 },
  selectButton: { minHeight: 47, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectText: { flex: 1, fontSize: 12, fontWeight: '600' },
  statusOptions: { flexDirection: 'row', gap: 7 },
  statusOption: { flex: 1, minHeight: 39, paddingHorizontal: 5, borderWidth: 1, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  statusOptionText: { fontSize: 9, fontWeight: '800' },
  datesCard: { marginBottom: 16, borderRadius: 18 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 8, letterSpacing: 0.9, fontWeight: '800' },
  dateValue: { fontSize: 10, marginTop: 5 },
  convertedNotice: { flexDirection: 'row', gap: 8, borderRadius: 13, borderWidth: 1, padding: 12, marginBottom: 15, alignItems: 'center' },
  convertedNoticeText: { flex: 1, fontSize: 10, lineHeight: 15 },
  saveButton: { height: 49, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '72%', minHeight: '40%', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  selectionList: { flexGrow: 0 },
  selectionRow: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  selectionText: { flex: 1, fontSize: 12, fontWeight: '600' },
  emptySelection: { textAlign: 'center', fontSize: 11, paddingVertical: 20 },
  emptySelectionWrap: { alignItems: 'center', paddingBottom: 10 },
  emptyAction: { paddingHorizontal: 12, paddingVertical: 9 },
  emptyActionText: { fontSize: 11, fontWeight: '800' },
});
