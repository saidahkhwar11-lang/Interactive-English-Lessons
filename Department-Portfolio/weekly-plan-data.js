// Official weekly totals copied from the Monday compliance report.
// Each week contains its Monday 12:00 PM UAE deadline and teacher submissions.
// Example:
// '4': {
//   deadline: '2026-09-21T12:00:00+04:00',
//   teachers: { 'Teacher Name': { submissions: ['2026-09-20T09:10:00+04:00'] } }
// }
// Submissions after the deadline are counted and labelled Late automatically.
// A missing teacher entry is shown as "Awaiting weekly update", never as 0/5.
window.WEEKLY_LESSON_PLAN_DATA = {
  updatedAt: '',
  weeks: {
    '4': {
      startDate: '2026-09-21',
      endDate: '2026-09-25',
      deadline: '2026-09-21T12:00:00+04:00',
      teachers: {}
    }
  }
};
