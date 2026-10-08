export const GRADE_WEIGHTS = {
  assignment: 7.5,
  attendance: 20,
  exam: 50,
} as const;

export function calculateGradeBreakdown(input: {
  assignmentScores: Array<{ grade: number | null; maxScore: number }>;
  attendancePercentage: number;
  examScore: number | null;
}) {
  const assignmentPoints = input.assignmentScores
    .slice(0, 4)
    .reduce(
      (total, assignment) =>
        total + (assignment.grade === null ? 0 : (assignment.grade / assignment.maxScore) * GRADE_WEIGHTS.assignment),
      0
    );
  const attendancePoints = (input.attendancePercentage / 100) * GRADE_WEIGHTS.attendance;
  const examPoints = input.examScore === null ? 0 : (input.examScore / 100) * GRADE_WEIGHTS.exam;
  const round = (score: number) => Math.round(score * 10) / 10;

  return {
    assignmentPoints: round(assignmentPoints),
    attendancePoints: round(attendancePoints),
    examPoints: round(examPoints),
    total: round(assignmentPoints + attendancePoints + examPoints),
  };
}
