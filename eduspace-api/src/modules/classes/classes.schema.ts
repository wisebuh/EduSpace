import { z } from "zod";

const youtubeUrl = z.string().url().refine((value) => {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com",
      ].includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}, "Enter a YouTube video or live stream URL");

const classFields = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
 schedule: z.string().trim().max(200).nullable().optional(),
 meetingUrl: youtubeUrl.nullable().optional(),
 startsAt: z.coerce.date().nullable().optional(),
 cohortStartDate: z.coerce.date().nullable().optional(),
 cohortEndDate: z.coerce.date().nullable().optional(),
});

const validateCohortDates = (value: {
 cohortStartDate?: Date | null;
 cohortEndDate?: Date | null;
}) =>
 !value.cohortStartDate ||
 !value.cohortEndDate ||
 value.cohortStartDate <= value.cohortEndDate;

export const classSchema = classFields.refine(validateCohortDates, {
 message: "Cohort end date must be on or after its start date",
 path: ["cohortEndDate"],
});

export const classUpdateSchema = classFields.partial().refine(validateCohortDates, {
 message: "Cohort end date must be on or after its start date",
 path: ["cohortEndDate"],
});