import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Plus, Calendar, MapPin, Clock } from 'lucide-react-native';

export default function EventsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sự kiện</Text>
        <TouchableOpacity style={styles.createButton}>
          <Plus size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sự kiện sắp diễn ra</Text>

          <TouchableOpacity style={styles.eventCard}>
            <View style={styles.eventDate}>
              <Text style={styles.eventDay}>15</Text>
              <Text style={styles.eventMonth}>Thg 10</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>React Native Workshop 2024</Text>
              <View style={styles.eventDetail}>
                <Clock size={14} color={COLORS.gray} />
                <Text style={styles.eventDetailText}>14:00 - 17:00</Text>
              </View>
              <View style={styles.eventDetail}>
                <MapPin size={14} color={COLORS.gray} />
                <Text style={styles.eventDetailText}>Hà Nội, Việt Nam</Text>
              </View>
              <View style={styles.eventActions}>
                <TouchableOpacity style={styles.interestedButton}>
                  <Text style={styles.interestedButtonText}>Quan tâm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.joinEventButton}>
                  <Text style={styles.joinEventButtonText}>Tham gia</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.eventCard}>
            <View style={styles.eventDate}>
              <Text style={styles.eventDay}>20</Text>
              <Text style={styles.eventMonth}>Thg 10</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>Meetup Developers</Text>
              <View style={styles.eventDetail}>
                <Clock size={14} color={COLORS.gray} />
                <Text style={styles.eventDetailText}>18:00 - 21:00</Text>
              </View>
              <View style={styles.eventDetail}>
                <MapPin size={14} color={COLORS.gray} />
                <Text style={styles.eventDetailText}>Tp. Hồ Chí Minh</Text>
              </View>
              <View style={styles.eventActions}>
                <TouchableOpacity style={styles.interestedButton}>
                  <Text style={styles.interestedButtonText}>Quan tâm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.joinEventButton}>
                  <Text style={styles.joinEventButtonText}>Tham gia</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sự kiện bạn đã tham gia</Text>

          <TouchableOpacity style={styles.eventCard}>
            <View style={[styles.eventDate, styles.pastEventDate]}>
              <Text style={[styles.eventDay, styles.pastEventText]}>05</Text>
              <Text style={[styles.eventMonth, styles.pastEventText]}>Thg 10</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>Tech Conference 2024</Text>
              <View style={styles.eventDetail}>
                <Calendar size={14} color={COLORS.gray} />
                <Text style={styles.eventDetailText}>Đã tham gia</Text>
              </View>
              <View style={styles.eventDetail}>
                <MapPin size={14} color={COLORS.gray} />
                <Text style={styles.eventDetailText}>Đà Nẵng, Việt Nam</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    paddingVertical: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  eventCard: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  eventDate: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.sm,
  },
  eventDay: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  eventMonth: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '500',
  },
  pastEventDate: {
    backgroundColor: COLORS.lightGray,
  },
  pastEventText: {
    color: COLORS.darkGray,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  eventActions: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.sm,
    marginTop: RESPONSIVE_SPACING.xs,
  },
  interestedButton: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  interestedButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  joinEventButton: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  joinEventButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
});
